/**
 * Generates a secure, randomized 4-digit PIN for team captain access.
 * Returns a 4-digit string from '1000' to '9999'.
 */
export function generateRandomPin(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const pinNum = 1000 + (array[0] % 9000);
    return pinNum.toString();
  }
  return Math.floor(1000 + Math.random() * 9000).toString();
}
