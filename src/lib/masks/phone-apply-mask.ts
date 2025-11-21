/**
 * phoneApplyMask
 * pt-BR: Aplica máscara em telefone brasileiro, suportando 10 e 11 dígitos.
 * en-US: Applies mask to Brazilian phone numbers, supporting 10 and 11 digits.
 */
export function phoneApplyMask(value: string): string {
  const digits = value.replace(/\D/g, "");
  const len = digits.length;

  if (len <= 2) return digits;
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (len <= 10) {
    // Formato fixo: (00) 0000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Formato celular: (00) 00000-0000
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * phoneRemoveMask
 * pt-BR: Remove máscara do telefone, retornando apenas dígitos.
 * en-US: Removes phone mask, returning only digits.
 */
export function phoneRemoveMask(value: string): string {
  return value.replace(/\D/g, "");
}