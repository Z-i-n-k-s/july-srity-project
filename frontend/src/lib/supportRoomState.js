import { STORAGE_KEYS, storage } from "./storage";

export const SUPPORT_ROOM_EVENT = "july-smriti-support-room-updated";

export const STOPPED_ROOM_STATUSES = [
  "stopped",
  "closed",
  "completed",
  "resolved",
  "ended",
];

export const getSupportRoomId = (room) => String(room?._id || room?.id || room?.roomId || "");

export const isSupportRoomStopped = (room) =>
  STOPPED_ROOM_STATUSES.includes(String(room?.status || "").trim().toLowerCase());

export const readSupportRoomOverrides = () =>
  storage.get(STORAGE_KEYS.supportRoomAdminOverrides, {});

export const applySupportRoomOverride = (room) => {
  const id = getSupportRoomId(room);
  if (!id) return room;
  const override = readSupportRoomOverrides()[id];
  return override ? { ...room, ...override } : room;
};

export const applySupportRoomOverrides = (rooms) =>
  (Array.isArray(rooms) ? rooms : []).map(applySupportRoomOverride);

export const saveSupportRoomOverride = (roomId, values) => {
  const id = String(roomId || "");
  if (!id) return;

  const current = readSupportRoomOverrides();
  const next = {
    ...current,
    [id]: {
      ...(current[id] || {}),
      ...values,
      updatedAt: values.updatedAt || new Date().toISOString(),
    },
  };

  storage.set(STORAGE_KEYS.supportRoomAdminOverrides, next);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SUPPORT_ROOM_EVENT, {
        detail: { roomId: id, values: next[id] },
      }),
    );
  }
};

export const hideSupportRoomForAdmin = (roomId) => {
  saveSupportRoomOverride(roomId, { hiddenFromAdmin: true });
};
