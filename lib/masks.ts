export function digitsOnly(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
}

export function formatCnpj(value: string) {
  return digitsOnly(value, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatPhone(value: string) {
  const digits = digitsOnly(value, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  const firstPartLength = digits.length === 11 ? 5 : 4;
  const firstPart = number.slice(0, firstPartLength);
  const secondPart = number.slice(firstPartLength);

  return `(${areaCode}) ${firstPart}${secondPart ? `-${secondPart}` : ""}`;
}

/**
 * Aplica a máscara do protocolo mesmo quando o valor é colado com ou sem
 * separadores. O identificador tem 17 caracteres alfanuméricos e dois hífens:
 * SIN-AAAAMMDD-XXXXXX.
 */
export function formatProtocol(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17);
  if (normalized.length <= 3) return normalized;

  const prefix = normalized.slice(0, 3);
  const date = normalized.slice(3, 11);
  const suffix = normalized.slice(11);

  return `${prefix}-${date}${suffix ? `-${suffix}` : ""}`;
}
