const crypto = require("crypto");

function generatePublicNumber(prefix) {
  const date = new Date();
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

function slugify(value = "") {
  const normalized = String(value)
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return normalized || crypto.randomBytes(5).toString("hex");
}

module.exports = { generatePublicNumber, slugify };
