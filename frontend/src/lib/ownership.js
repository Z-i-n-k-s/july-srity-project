const text = (value) => String(value ?? "").trim().toLowerCase();

const addIdentity = (set, value) => {
  if (!value) return;

  if (typeof value === "string" || typeof value === "number") {
    const normalized = text(value);
    if (normalized) set.add(normalized);
    return;
  }

  if (typeof value === "object") {
    [
      value._id,
      value.id,
      value.userId,
      value.ownerId,
      value.email,
      value.contactEmail,
      value.username,
    ].forEach((entry) => addIdentity(set, entry));
  }
};

export const getUserIdentitySet = (user) => {
  const identities = new Set();
  addIdentity(identities, user);
  return identities;
};

export const getRecordOwnerIdentitySet = (record) => {
  const identities = new Set();

  if (!record || typeof record !== "object") return identities;

  [
    record.ownerId,
    record.userId,
    record.accountId,
    record.createdById,
    record.submittedById,
    record.requesterId,
    record.reporterId,
    record.authorId,
    record.ownerEmail,
    record.contactEmail,
    record.requesterEmail,
    record.reporterEmail,
    record.submittedByEmail,
    record.email,
    record.owner,
    record.user,
    record.account,
    record.createdBy,
    record.submittedBy,
    record.requester,
    record.reporter,
    record.author,
    record.report?.owner,
    record.report?.reporter,
    record.submission?.owner,
    record.submission?.submittedBy,
    record.room?.owner,
    record.room?.requester,
  ].forEach((entry) => addIdentity(identities, entry));

  return identities;
};

export const getRecordId = (record) =>
  String(
    record?._id ||
      record?.id ||
      record?.submissionId ||
      record?.reportId ||
      record?.roomId ||
      "",
  ).trim();

export const stampOwner = (record, user) => ({
  ...record,
  ownerId: user?._id || user?.id || record?.ownerId || "",
  ownerEmail: user?.email || record?.ownerEmail || "",
  ownerName: user?.name || record?.ownerName || "",
});

export const isOwnedByUser = (record, user, locallyOwnedIds = []) => {
  if (!record || !user) return false;
  if (record.isMine === true || record.mine === true) return true;

  const recordId = getRecordId(record);
  if (recordId && locallyOwnedIds.map(String).includes(recordId)) return true;

  const userIdentities = getUserIdentitySet(user);
  const ownerIdentities = getRecordOwnerIdentitySet(record);

  if (!ownerIdentities.size) return false;

  for (const identity of ownerIdentities) {
    if (userIdentities.has(identity)) return true;
  }

  return false;
};

export const filterOwnedRecords = (records, user, locallyOwnedIds = []) =>
  (Array.isArray(records) ? records : []).filter((record) =>
    isOwnedByUser(record, user, locallyOwnedIds),
  );

export const mergeUniqueRecords = (...lists) => {
  const map = new Map();

  lists.flat().filter(Boolean).forEach((record) => {
    const id = getRecordId(record);
    if (!id) return;
    map.set(id, { ...(map.get(id) || {}), ...record });
  });

  return Array.from(map.values());
};
