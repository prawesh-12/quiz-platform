import { randomBytes } from "node:crypto";

const TOKEN_BYTE_LENGTH = 8;

// Generate a random hex token used as a quiz's shareable access token.
export function generateAccessToken() {
  return randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
}
