export type GenerateRandomInviteCodeParams = {
  length?: number;
};

/**
 * Generates an unguessable, URL-safe random invite code using unconfusable alphanumeric characters.
 * Excludes ambiguous characters (0, O, o, 1, l, I).
 */
export function generateRandomInviteCode({
  length = 10,
}: GenerateRandomInviteCodeParams = {}): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}
