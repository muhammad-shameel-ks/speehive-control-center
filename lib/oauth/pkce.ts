import { createHash, randomBytes } from "node:crypto";

export function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function makePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64UrlEncode(randomBytes(32));
  const challenge = base64UrlEncode(
    createHash("sha256").update(verifier).digest(),
  );
  return { verifier, challenge };
}

export function randomState(): string {
  return base64UrlEncode(randomBytes(16));
}
