const mongoose = require("mongoose");

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  }
  return fallback;
}

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function mediaUrl(media) {
  if (!media) return "";
  if (typeof media === "string") return media;
  return media.secureUrl || media.url || "";
}

function mediaToFrontend(media, statusOverride) {
  if (!media) return null;
  return {
    id: String(media._id || media.id || ""),
    name: media.originalName || media.name || "Attachment",
    type: media.mimeType || media.type || "application/octet-stream",
    mime: media.mimeType || media.type || "application/octet-stream",
    url: mediaUrl(media),
    secureUrl: mediaUrl(media),
    size: media.fileSize || media.size || 0,
    status:
      statusOverride ||
      ({ APPROVED: "Verified", REJECTED: "Rejected", PENDING: "Pending review" }[
        media.moderationStatus
      ] || "Pending review"),
  };
}

function submissionStatus(status, reviewLabel) {
  if (reviewLabel) return reviewLabel;
  return (
    {
      DRAFT: "Draft",
      SUBMITTED: "Pending review",
      UNDER_REVIEW: "Under review",
      NEEDS_INFORMATION: "Information required",
      VERIFIED: "Approved",
      REJECTED: "Rejected",
      PUBLISHED: "Published",
      ARCHIVED: "Archived",
    }[status] || status || "Pending review"
  );
}

function supportStatus(status) {
  return (
    {
      NEW: "Under review",
      UNDER_REVIEW: "Under review",
      ACTION_REQUIRED: "Information required",
      VERIFICATION_PENDING: "Verification pending",
      VERIFIED: "Verified",
      SUPPORT_IN_PROGRESS: "In progress",
      RESOLVED: "Completed",
      REJECTED: "Rejected",
      CLOSED: "Closed",
    }[status] || status || "Submitted"
  );
}

function supportPriority(priority, injuryLevel) {
  return (
    {
      CRITICAL: "Critical",
      URGENT: "Urgent",
      HIGH: "High",
      NORMAL: "Normal",
      LOW: "Low",
    }[priority] ||
    {
      CRITICAL: "Critical",
      URGENT: "Urgent",
      NEEDS_ATTENTION: "Normal",
      STABLE: "Normal",
    }[injuryLevel] ||
    "Normal"
  );
}

function supportCategory(types = []) {
  const value = Array.isArray(types) ? types[0] : types;
  return (
    {
      MEDICAL_TREATMENT: "Medical Treatment",
      MEDICINE: "Medicine",
      REHABILITATION: "Rehabilitation",
      LEGAL_SUPPORT: "Legal Support",
      FINANCIAL: "Financial",
      TRANSPORT: "Transport",
      OTHER: "Other",
    }[value] || value || "Support"
  );
}

function missingStatus(status) {
  return (
    {
      DRAFT: "Draft",
      PENDING_REVIEW: "Pending review",
      NEEDS_INFORMATION: "Information required",
      VERIFIED_MISSING: "Verified for publication",
      FOUND_ALIVE: "Found alive",
      FOUND_DECEASED: "Found deceased",
      FALSE_REPORT: "Rejected",
      CLOSED: "Closed",
    }[status] || status || "Pending review"
  );
}

function verificationLabel(status) {
  return (
    {
      UNVERIFIED: "Unverified",
      SOURCE_CHECKED: "Source Checked",
      PARTIALLY_VERIFIED: "Partially Verified",
      CORROBORATED: "Corroborated",
      DISPUTED: "Disputed",
      MISLEADING_CONTEXT: "Misleading Context",
    }[status] || status || "Reviewed"
  );
}

function archiveType(type) {
  // These labels intentionally match the existing frontend filter options exactly.
  return (
    {
      STORY: "Story",
      TESTIMONY: "Testimony",
      IMAGE_GALLERY: "Photograph",
      VIDEO: "Video",
      AUDIO: "Audio",
      DOCUMENT: "Document",
    }[type] || type || "Document"
  );
}

function isObjectId(value) {
  return mongoose.isValidObjectId(value);
}

function normalizeSourceType(value = "") {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("direct") || normalized.includes("first")) return "FIRST_HAND";
  if (normalized.includes("witness")) return "WITNESS";
  if (normalized.includes("family")) return "FAMILY_MEMBER";
  if (normalized.includes("news")) return "NEWS_SOURCE";
  if (normalized.includes("social")) return "SOCIAL_MEDIA";
  return "UNKNOWN";
}

function normalizeSubmissionType(type, contentTypes = []) {
  const joined = [type, ...contentTypes].join(" ").toLowerCase();
  if (joined.includes("correction")) return "CORRECTION";
  if (joined.includes("testimony") || joined.includes("story")) return "TESTIMONY";
  if (joined.includes("video")) return "VIDEO";
  if (joined.includes("audio")) return "AUDIO";
  if (joined.includes("photo") || joined.includes("image")) return "IMAGE";
  return "DOCUMENT";
}

function normalizeAnonymity(value = "") {
  const normalized = String(value).toLowerCase();
  if (normalized.includes("pseudonym")) return "SHOW_PSEUDONYM";
  if (normalized.includes("anonymous") || normalized.includes("hide")) return "HIDE_NAME";
  return "SHOW_NAME";
}

function normalizeSupportRelationship(value = "") {
  const normalized = String(value).toLowerCase();
  if (normalized === "self") return "SELF";
  if (normalized.includes("parent")) return "PARENT";
  if (normalized.includes("sibling")) return "SIBLING";
  if (normalized.includes("spouse")) return "SPOUSE";
  if (normalized.includes("friend")) return "FRIEND";
  if (normalized.includes("family") || normalized.includes("relative")) return "RELATIVE";
  return "REPRESENTATIVE";
}

function normalizeSupportType(value = "") {
  const normalized = String(value).toLowerCase();
  if (normalized.includes("medicine")) return "MEDICINE";
  if (normalized.includes("rehabilitation")) return "REHABILITATION";
  if (normalized.includes("legal")) return "LEGAL_SUPPORT";
  if (normalized.includes("financial")) return "FINANCIAL";
  if (normalized.includes("transport")) return "TRANSPORT";
  if (normalized.includes("medical") || normalized.includes("treatment")) return "MEDICAL_TREATMENT";
  return "OTHER";
}

function normalizeInjuryLevel(value = "") {
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, "_");
  return ["STABLE", "NEEDS_ATTENTION", "URGENT", "CRITICAL"].includes(normalized)
    ? normalized
    : "NEEDS_ATTENTION";
}

function priorityFromInjury(level) {
  return { STABLE: "NORMAL", NEEDS_ATTENTION: "NORMAL", URGENT: "URGENT", CRITICAL: "CRITICAL" }[
    level
  ] || "NORMAL";
}

function combineDateAndTime(date, time) {
  if (!date) return null;
  const candidate = new Date(`${date}T${time || "12:00"}`);
  return Number.isNaN(candidate.getTime()) ? new Date(date) : candidate;
}

module.exports = {
  asBoolean,
  parseJson,
  formatDate,
  formatTime,
  mediaUrl,
  mediaToFrontend,
  submissionStatus,
  supportStatus,
  supportPriority,
  supportCategory,
  missingStatus,
  verificationLabel,
  archiveType,
  isObjectId,
  normalizeSourceType,
  normalizeSubmissionType,
  normalizeAnonymity,
  normalizeSupportRelationship,
  normalizeSupportType,
  normalizeInjuryLevel,
  priorityFromInjury,
  combineDateAndTime,
};
