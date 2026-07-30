const PUBLIC_STATUSES = new Set([
  "published",
  "approved",
  "verified",
  "public",
  "live",
  "verified_missing",
  "verified_for_publication",
]);

const BLOCKED_STATUSES = new Set([
  "draft",
  "pending",
  "pending_review",
  "under_review",
  "information_required",
  "needs_information",
  "rejected",
  "unpublished",
  "disabled",
  "private",
  "archived",
]);

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

export const isPublicArchiveRecord = (record) => {
  if (!record || typeof record !== "object") return false;

  const visibility = normalize(record.visibility || record.access || "");

  if (
    record.enabled === false ||
    record.isEnabled === false ||
    record.active === false ||
    record.isActive === false ||
    record.disabled === true ||
    record.isDisabled === true ||
    record.unpublished === true ||
    record.publiclyVisible === false ||
    visibility === "private" ||
    visibility === "admin_only"
  ) {
    return false;
  }

  const rawStatus =
    record.publicationStatus ||
    record.status ||
    record.reviewStatus ||
    "";

  const status = normalize(rawStatus);

  /*
   * An explicit workflow status is authoritative. This prevents an old
   * `verified: true` flag from keeping an item public after an admin marks
   * it Unpublished, Rejected, Disabled or Pending review.
   */
  if (status) {
    if (BLOCKED_STATUSES.has(status)) return false;
    return PUBLIC_STATUSES.has(status);
  }

  /* Static editorial records have no backend workflow status. */
  return (
    record.verified === true ||
    record.adminApproved === true ||
    record.isApproved === true
  );
};

export const filterPublicArchiveRecords = (records) =>
  (Array.isArray(records) ? records : []).filter(isPublicArchiveRecord);
