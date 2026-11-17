import "server-only";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const encoded = process.env.HIREUO_SESSION_ENCRYPTION_KEY;

  if (!encoded) {
    throw new Error("HIREUO_SESSION_ENCRYPTION_KEY is not configured.");
  }

  const key = Buffer.from(encoded, "base64");

  if (key.length !== 32) {
    throw new Error("Session encryption key must be exactly 32 bytes.");
  }

  return key;
}

export function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptToken(payload: string): string {
  const [ivEncoded, authTagEncoded, encryptedEncoded] = payload.split(".");

  if (!ivEncoded || !authTagEncoded || !encryptedEncoded) {
    throw new Error("Invalid encrypted token format.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivEncoded, "base64"),
  );

  decipher.setAuthTag(Buffer.from(authTagEncoded, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function deriveSessionCookieToken(idempotencyKey: string): string {
  const key = Buffer.from(hkdfSync(
    "sha256",
    getEncryptionKey(),
    Buffer.from("HIREUO session cookie derivation"),
    Buffer.from("v1"),
    32,
  ));

  return createHmac("sha256", key)
    .update("hireuo-session-cookie:v1\0", "utf8")
    .update(idempotencyKey, "utf8")
    .digest("base64url");
}
