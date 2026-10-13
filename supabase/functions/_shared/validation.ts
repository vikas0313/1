export function sanitizeString(val: unknown, minLen = 0, maxLen = 100): string {
  if (typeof val !== "string") return "";
  // Strip control chars, trim
  const clean = val.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  return clean.slice(0, maxLen);
}

export function validateCustomerName(name: unknown): { valid: boolean; value: string; error?: string } {
  if (typeof name !== "string") {
    return { valid: false, value: "", error: "Customer name must be text" };
  }
  const trimmed = name.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  if (trimmed.length < 2) {
    return { valid: false, value: trimmed, error: "Name must be at least 2 characters." };
  }
  if (trimmed.length > 40) {
    return { valid: false, value: trimmed.slice(0, 40), error: "Name must not exceed 40 characters." };
  }
  return { valid: true, value: trimmed };
}
