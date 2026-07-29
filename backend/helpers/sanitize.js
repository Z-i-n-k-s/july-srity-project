function asPlainObject(value) {
  if (!value) return value;
  return typeof value.toObject === "function" ? value.toObject() : structuredClone(value);
}

function removeEncryptedFields(value) {
  if (!value || typeof value !== "object") return value;
  const source = asPlainObject(value);
  const clean = Array.isArray(source) ? [] : {};
  for (const [key, nested] of Object.entries(source)) {
    if (key.endsWith("Encrypted") || key === "passwordHash" || key === "refreshTokenHash") continue;
    clean[key] = nested && typeof nested === "object" ? removeEncryptedFields(nested) : nested;
  }
  return clean;
}

module.exports = { asPlainObject, removeEncryptedFields };
