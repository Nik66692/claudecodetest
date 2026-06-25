/**
 * ID generation isolated behind a single function so tests can stub it and so
 * the rest of the domain never reaches for a global directly.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for environments without WebCrypto randomUUID.
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
