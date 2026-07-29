const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const storage = {
  get(key, fallback = null) {
    if (typeof window === "undefined") return fallback;
    return safeParse(window.localStorage.getItem(key), fallback);
  },
  set(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export const STORAGE_KEYS = {
  token: "julySmritiToken",
  user: "julySmritiUser",
  drafts: "julySmritiDrafts",
  submissions: "julySmritiSubmissions",
  supportRooms: "julySmritiSupportRooms",
  roomMessages: "julySmritiRoomMessages",
  missingReports: "julySmritiMissingReports",
  sightings: "julySmritiSightings",
};
