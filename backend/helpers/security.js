const crypto = require("crypto");
const AppError = require("./AppError");

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function createRandomToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString("hex");
}

function getEncryptionKey() {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw).digest();
}

function encryptField(value) {
  if (value === undefined || value === null || value === "") return null;
  const key = getEncryptionKey();
  if (!key) {
    throw new AppError(
      "FIELD_ENCRYPTION_KEY is required before sensitive data can be stored.",
      503,
      "ENCRYPTION_NOT_CONFIGURED"
    );
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

function decryptField(payload) {
  if (!payload) return null;
  const key = getEncryptionKey();
  if (!key) throw new AppError("FIELD_ENCRYPTION_KEY is required to read encrypted data.", 503, "ENCRYPTION_NOT_CONFIGURED");
  const [ivValue, tagValue, encryptedValue] = String(payload).split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new AppError("Encrypted field format is invalid.", 500, "INVALID_ENCRYPTED_FIELD");
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch (_error) {
    throw new AppError("Encrypted data could not be decrypted with the configured key.", 500, "DECRYPTION_FAILED");
  }
}

function redactObject(value) {
  if (!value || typeof value !== "object") return value;
  const blocked = new Set([
    "password",
    "passwordHash",
    "refreshToken",
    "refreshTokenHash",
    "passwordResetTokenHash",
    "nationalIdNumberEncrypted",
    "reporterPhoneEncrypted",
  ]);

  const copy = Array.isArray(value) ? [] : {};
  for (const [key, nested] of Object.entries(value)) {
    copy[key] = blocked.has(key)
      ? "[REDACTED]"
      : nested && typeof nested === "object"
        ? redactObject(nested)
        : nested;
  }
  return copy;
}

module.exports = { hashToken, createRandomToken, encryptField, decryptField, redactObject };
