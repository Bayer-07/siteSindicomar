interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Turnstile is enabled only when both sides of the integration are present.
 * This matters during homologation: Vercel can have the secret saved while
 * the public key is still missing from the client bundle (or vice versa).
 */
export function isTurnstileConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

export async function validateTurnstile(token: string, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Keep the form usable while the integration is being configured. Once
  // both keys exist, production requests are always verified below.
  if (!secret || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    cache: "no-store",
  });
  if (!response.ok) return false;
  const result = (await response.json()) as TurnstileResponse;
  return result.success;
}
