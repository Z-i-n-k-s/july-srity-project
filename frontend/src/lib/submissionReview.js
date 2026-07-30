const STATUS_ALIASES = {
  PENDING: "Pending review",
  PENDING_REVIEW: "Pending review",
  PENDING_ADMIN_REVIEW: "Pending review",
  UNDER_REVIEW: "Under review",
  SOURCE_CHECKED: "Source checked",
  INFORMATION_REQUIRED: "Information required",
  INFORMATION_REQUESTED: "Information required",
  INFO_REQUIRED: "Information required",
  NEED_INFORMATION: "Information required",
  NEEDS_INFORMATION: "Information required",
  REQUEST_INFORMATION: "Information required",
  REQUESTED_INFORMATION: "Information required",
  ACTION_REQUIRED: "Information required",
  APPROVED: "Approved",
  VERIFIED: "Approved",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

const SUBMISSION_ACTIONS = {
  approve: {
    status: "Approved",
    backendStatus: "APPROVED",
    title: "Approve protected record",
    titleBn: "সুরক্ষিত রেকর্ড অনুমোদন",
  },

  source_checked: {
    status: "Source checked",
    backendStatus: "SOURCE_CHECKED",
    title: "Mark source checked",
    titleBn: "উৎস যাচাই হয়েছে",
  },

  request_information: {
    status: "Information required",
    backendStatus: "INFORMATION_REQUIRED",
    title: "Request information",
    titleBn: "তথ্য চাইুন",
  },

  reject: {
    status: "Rejected",
    backendStatus: "REJECTED",
    title: "Reject with reason",
    titleBn: "কারণসহ প্রত্যাখ্যান",
  },
};

function getSubmissionId(item) {
  if (!item) {
    return "";
  }

  return String(
    item._id ||
      item.id ||
      item.submissionId ||
      item.submission?._id ||
      item.submission?.id ||
      "",
  );
}

function getSubmissionDisplayId(item) {
  if (!item) {
    return "";
  }

  return String(
    item.id ||
      item.submissionNumber ||
      item.referenceNumber ||
      item._id ||
      item.submission?.id ||
      item.submission?._id ||
      "",
  );
}

function getSubmissionKeys(item) {
  if (!item) {
    return [];
  }

  return [
    item._id,
    item.id,
    item.submissionId,
    item.submissionNumber,
    item.referenceNumber,
    item.submission?._id,
    item.submission?.id,
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        String(value).trim().length > 0,
    )
    .map((value) => String(value).trim());
}

function normalizeSubmissionStatus(status = "") {
  const original = String(status || "").trim();

  if (!original) {
    return "Pending review";
  }

  const key = original
    .toUpperCase()
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_");

  return STATUS_ALIASES[key] || original;
}

function latestFromArray(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return value[value.length - 1];
}

function reviewerLabel(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value.name ||
    value.fullName ||
    value.displayName ||
    value.email ||
    value.username ||
    ""
  );
}

function extractLatestReview(item) {
  if (!item) {
    return null;
  }

  const review =
    item.latestReview ||
    item.reviewDecision ||
    item.review ||
    latestFromArray(item.reviewHistory) ||
    latestFromArray(item.reviews) ||
    latestFromArray(item.auditTrail) ||
    null;

  const source = review || item;

  const status = normalizeSubmissionStatus(
    source.status || source.decision || item.status,
  );

  const note =
    source.note ||
    source.reviewNote ||
    source.publicNote ||
    source.message ||
    source.reason ||
    source.rejectionReason ||
    source.informationRequest ||
    item.reviewNote ||
    item.decisionNote ||
    item.adminNote ||
    item.rejectionReason ||
    item.informationRequest ||
    "";

  const reviewer = reviewerLabel(
    source.reviewer ||
      source.reviewedBy ||
      source.admin ||
      item.reviewer ||
      item.reviewedBy,
  );

  const meaningfulStatus = ![
    "Pending review",
    "Under review",
  ].includes(status);

  const reviewedAt =
    source.reviewedAt ||
    source.decidedAt ||
    source.createdAt ||
    source.timestamp ||
    item.reviewedAt ||
    item.decisionAt ||
    (meaningfulStatus ? item.updatedAt : "") ||
    "";

  const action =
    source.action ||
    source.decision ||
    item.reviewAction ||
    "";

  const hasReviewSignal = Boolean(
    review ||
      note ||
      reviewer ||
      item.reviewedAt ||
      item.decisionAt ||
      item.reviewAction ||
      meaningfulStatus,
  );

  if (!hasReviewSignal) {
    return null;
  }

  return {
    id:
      source._id ||
      source.id ||
      `${getSubmissionId(item)}:${status}:${reviewedAt}:${note}`,

    status,
    action,
    note,
    reviewedAt,
    reviewer,
  };
}

function normalizeSubmission(item) {
  if (!item || typeof item !== "object") {
    return item;
  }

  const latestReview = extractLatestReview(item);

  return {
    ...item,

    status: normalizeSubmissionStatus(
      item.status || latestReview?.status,
    ),

    ...(latestReview
      ? {
          latestReview,
        }
      : {}),
  };
}

function mergeSubmissionRecords(
  localRecords = [],
  remoteRecords = [],
) {
  const merged = new Map();
  const aliases = new Map();

  const upsert = (item, authoritative = false) => {
    const normalized = normalizeSubmission(item);
    const keys = getSubmissionKeys(normalized);

    if (keys.length === 0) {
      return;
    }

    const existingKey = keys
      .map((key) => aliases.get(key))
      .find(Boolean);

    const canonicalKey = existingKey || keys[0];
    const existing = merged.get(canonicalKey) || {};

    merged.set(
      canonicalKey,
      authoritative
        ? {
            ...existing,
            ...normalized,
          }
        : {
            ...normalized,
            ...existing,
          },
    );

    getSubmissionKeys(merged.get(canonicalKey)).forEach(
      (key) => {
        aliases.set(key, canonicalKey);
      },
    );

    keys.forEach((key) => {
      aliases.set(key, canonicalKey);
    });
  };

  localRecords
    .filter(Boolean)
    .forEach((item) => upsert(item, false));

  remoteRecords
    .filter(Boolean)
    .forEach((item) => upsert(item, true));

  return Array.from(merged.values()).sort((a, b) => {
    const left = new Date(
      a.updatedAt ||
        a.reviewedAt ||
        a.createdAt ||
        0,
    ).getTime();

    const right = new Date(
      b.updatedAt ||
        b.reviewedAt ||
        b.createdAt ||
        0,
    ).getTime();

    return (
      (Number.isNaN(right) ? 0 : right) -
      (Number.isNaN(left) ? 0 : left)
    );
  });
}

function mergeReviewResponse(
  current,
  payload,
  fallbackReview = null,
) {
  const data =
    payload?.data ??
    payload?.results ??
    payload ??
    {};

  const returnedSubmission =
    data.submission ||
    data.item ||
    data.record ||
    data.updatedSubmission ||
    data;

  const hasSubmissionShape =
    returnedSubmission &&
    typeof returnedSubmission === "object" &&
    (
      getSubmissionId(returnedSubmission) ||
      returnedSubmission.status
    );

  const merged = {
    ...current,

    ...(hasSubmissionShape
      ? returnedSubmission
      : {}),
  };

  const returnedReview =
    data.review ||
    data.latestReview ||
    data.reviewDecision ||
    null;

  const latestReview =
    returnedReview ||
    fallbackReview ||
    extractLatestReview(merged);

  return normalizeSubmission({
    ...merged,

    ...(latestReview
      ? {
          latestReview,
        }
      : {}),
  });
}

function getReviewFingerprint(item) {
  const review = extractLatestReview(item);

  if (!review) {
    return "";
  }

  return [
    getSubmissionId(item),
    review.id,
    review.status,
    review.reviewedAt,
    review.note,
  ].join("|");
}

function formatReviewDate(value, locale = "en") {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    locale === "bn" ? "bn-BD" : "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(parsed);
}

export {
  SUBMISSION_ACTIONS,
  extractLatestReview,
  formatReviewDate,
  getReviewFingerprint,
  getSubmissionDisplayId,
  getSubmissionId,
  mergeReviewResponse,
  mergeSubmissionRecords,
  normalizeSubmission,
  normalizeSubmissionStatus,
};

export default {
  SUBMISSION_ACTIONS,
  extractLatestReview,
  formatReviewDate,
  getReviewFingerprint,
  getSubmissionDisplayId,
  getSubmissionId,
  mergeReviewResponse,
  mergeSubmissionRecords,
  normalizeSubmission,
  normalizeSubmissionStatus,
};