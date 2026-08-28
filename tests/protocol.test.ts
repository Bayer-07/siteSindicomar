import { describe, expect, it } from "vitest";
import { createProtocol } from "@/lib/protocol";
describe("protocolo", () => { it("gera identificador com data e prefixo", () => { expect(createProtocol(new Date("2026-08-28T12:00:00Z"))).toMatch(/^SIN-20260828-[A-F0-9]{6}$/); }); });
