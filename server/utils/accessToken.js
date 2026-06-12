import { randomBytes } from "node:crypto";

// Generate a random hex token used as a quiz's shareable access token.
export function generateAccessToken() {
  return randomBytes(8).toString("hex");
}
