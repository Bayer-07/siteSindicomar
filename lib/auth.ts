import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { generate, generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { getDatabase } from "@/lib/db";
import { adminRecoveryCodes, adminSessions, adminUsers, rateLimitBuckets } from "@/lib/db/schema";

export const ADMIN_SESSION_COOKIE = "sindicomar_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não configurada.`);
  return value;
}

function encryptionKey() {
  const raw = requiredEnv("AUTH_ENCRYPTION_KEY");
  const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64url");
  if (key.length !== 32) throw new Error("AUTH_ENCRYPTION_KEY deve ter 32 bytes em hexadecimal ou base64url.");
  return key;
}

export function isAuthConfigured() {
  try {
    requiredEnv("AUTH_SESSION_SECRET");
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

function encode(value: Buffer) { return value.toString("base64url"); }
function decode(value: string) { return Buffer.from(value, "base64url"); }

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1.${encode(iv)}.${encode(cipher.getAuthTag())}.${encode(encrypted)}`;
}

export function decryptSecret(value: string) {
  const [, ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Segredo autenticador inválido.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), decode(ivValue));
  decipher.setAuthTag(decode(tagValue));
  return Buffer.concat([decipher.update(decode(encryptedValue)), decipher.final()]).toString("utf8");
}

export function hashToken(value: string) { return createHmac("sha256", requiredEnv("AUTH_SESSION_SECRET")).update(value).digest("hex"); }

export async function consumeLoginRateLimit(identifier: string) {
  const db = getDatabase();
  if (!db) return false;
  const bucketKey = hashToken(`login-rate:${identifier}`);
  const now = new Date();
  const windowMs = 15 * 60 * 1000;
  const maxHits = 20;
  const rows = await db.select().from(rateLimitBuckets).where(eq(rateLimitBuckets.bucketKey, bucketKey)).limit(1);
  const bucket = rows[0];
  if (!bucket || now.getTime() - bucket.windowStartedAt.getTime() >= windowMs) {
    if (bucket) await db.update(rateLimitBuckets).set({ windowStartedAt: now, hits: 1, updatedAt: now }).where(eq(rateLimitBuckets.id, bucket.id));
    else await db.insert(rateLimitBuckets).values({ id: randomUUID(), bucketKey, windowStartedAt: now, hits: 1, updatedAt: now });
    return true;
  }
  if (bucket.hits >= maxHits) return false;
  await db.update(rateLimitBuckets).set({ hits: bucket.hits + 1, updatedAt: now }).where(eq(rateLimitBuckets.id, bucket.id));
  return true;
}

async function currentAdminUser() {
  const db = getDatabase();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!db || !email) return null;
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function authenticateAdmin(password: string) {
  const user = await currentAdminUser();
  if (!user) return { ok: false as const, reason: "not_configured" as const };
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) return { ok: false as const, reason: "locked" as const };
  const valid = await compare(password, user.passwordHash);
  const db = getDatabase();
  if (!db) return { ok: false as const, reason: "not_configured" as const };
  if (!valid) {
    const failed = user.failedLoginCount + 1;
    await db.update(adminUsers).set({ failedLoginCount: failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null }).where(eq(adminUsers.id, user.id));
    return { ok: false as const, reason: "invalid" as const };
  }
  await db.update(adminUsers).set({ failedLoginCount: 0, lockedUntil: null }).where(eq(adminUsers.id, user.id));
  return { ok: true as const, user };
}

export async function createAdminSession(userId: string, mfaVerified = false) {
  const db = getDatabase();
  if (!db) throw new Error("Banco de dados não configurado.");
  const rawToken = randomBytes(32).toString("base64url");
  const now = new Date();
  await db.insert(adminSessions).values({ id: randomUUID(), adminUserId: userId, tokenHash: hashToken(rawToken), mfaVerifiedAt: mfaVerified ? now : null, expiresAt: new Date(now.getTime() + SESSION_TTL_MS), lastSeenAt: now });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, rawToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_MS / 1000 });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const db = getDatabase();
  if (db && rawToken && isAuthConfigured()) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(rawToken)));
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const db = getDatabase();
  if (!db || !rawToken || !isAuthConfigured()) return null;
  const sessionRows = await db.select().from(adminSessions).where(and(eq(adminSessions.tokenHash, hashToken(rawToken)), gt(adminSessions.expiresAt, new Date()))).limit(1);
  const session = sessionRows[0];
  if (!session) return null;
  const userRows = await db.select().from(adminUsers).where(eq(adminUsers.id, session.adminUserId)).limit(1);
  const user = userRows[0];
  if (!user) return null;
  await db.update(adminSessions).set({ lastSeenAt: new Date() }).where(eq(adminSessions.id, session.id));
  return { session, user, rawToken };
}

export async function getVerifiedAdmin() {
  const session = await getAdminSession();
  if (!session || !session.session.mfaVerifiedAt || session.user.email.toLowerCase() !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) return null;
  return session.user;
}

export async function setupTotp() {
  const session = await getAdminSession();
  if (!session) return null;
  const secret = generateSecret();
  const uri = generateURI({ issuer: "Sindicomar", label: session.user.email, secret });
  const db = getDatabase();
  if (!db) return null;
  await db.update(adminUsers).set({ totpSecretEncrypted: encryptSecret(secret), totpEnabled: false }).where(eq(adminUsers.id, session.user.id));
  return { qrCode: await QRCode.toDataURL(uri, { margin: 1, width: 220 }), secret };
}

function makeRecoveryCode() { return `${randomBytes(4).toString("hex")}-${randomBytes(4).toString("hex")}`.toUpperCase(); }

export async function verifyTotp(token: string) {
  const session = await getAdminSession();
  if (!session || !session.user.totpSecretEncrypted) return { ok: false as const, reason: "not_configured" as const };
  let secret: string;
  try { secret = decryptSecret(session.user.totpSecretEncrypted); } catch { return { ok: false as const, reason: "invalid_secret" as const }; }
  const result = await verify({ secret, token: token.replace(/\D/g, "") });
  if (!result.valid) return { ok: false as const, reason: "invalid" as const };
  const db = getDatabase();
  if (!db) return { ok: false as const, reason: "not_configured" as const };
  const firstVerification = !session.user.totpEnabled;
  await db.update(adminUsers).set({ totpEnabled: true }).where(eq(adminUsers.id, session.user.id));
  await db.update(adminSessions).set({ mfaVerifiedAt: new Date(), lastSeenAt: new Date() }).where(eq(adminSessions.id, session.session.id));
  let recoveryCodes: string[] = [];
  if (firstVerification) {
    recoveryCodes = Array.from({ length: 8 }, makeRecoveryCode);
    await db.delete(adminRecoveryCodes).where(eq(adminRecoveryCodes.adminUserId, session.user.id));
    await db.insert(adminRecoveryCodes).values(recoveryCodes.map((code) => ({ id: randomUUID(), adminUserId: session.user.id, codeHash: hashToken(code), createdAt: new Date() })));
  }
  return { ok: true as const, recoveryCodes };
}

export async function verifyRecoveryCode(value: string) {
  const session = await getAdminSession();
  const db = getDatabase();
  if (!session || !db) return { ok: false as const };
  const code = value.trim().toUpperCase();
  const rows = await db.select().from(adminRecoveryCodes).where(and(eq(adminRecoveryCodes.adminUserId, session.user.id), eq(adminRecoveryCodes.codeHash, hashToken(code)))).limit(1);
  const stored = rows[0];
  if (!stored || stored.usedAt) return { ok: false as const };
  await db.update(adminRecoveryCodes).set({ usedAt: new Date() }).where(eq(adminRecoveryCodes.id, stored.id));
  await db.update(adminSessions).set({ mfaVerifiedAt: new Date(), lastSeenAt: new Date() }).where(eq(adminSessions.id, session.session.id));
  return { ok: true as const, recoveryCodes: [] as string[] };
}

export async function getMfaSetupState() {
  const session = await getAdminSession();
  if (!session) return null;
  return { enabled: session.user.totpEnabled, hasSecret: Boolean(session.user.totpSecretEncrypted) };
}

export async function hashPassword(password: string) { return hash(password, 12); }

export async function generateTotpTokenForTests(secret: string) { return generate({ secret }); }
