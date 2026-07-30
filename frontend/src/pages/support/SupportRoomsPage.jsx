import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { userApi, unwrap } from "../../lib/api";
import {
  filterOwnedRecords,
  getRecordId,
  getRecordOwnerIdentitySet,
  isOwnedByUser,
  mergeUniqueRecords,
} from "../../lib/ownership";
import {
  applySupportRoomOverrides,
  SUPPORT_ROOM_EVENT,
} from "../../lib/supportRoomState";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const ROOM_REFRESH_INTERVAL = 5000;

const extractRooms = (payload) => {
  const data = unwrap(payload);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rooms)) return data.rooms;
  if (Array.isArray(data?.supportRooms)) return data.supportRooms;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const formatUpdatedAt = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getRoomTimestamp = (room) => {
  const value = room?.updatedAt || room?.lastMessageAt || room?.createdAt || 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const sortRooms = (rooms) =>
  [...rooms].sort((left, right) => getRoomTimestamp(right) - getRoomTimestamp(left));

const requesterNameMatches = (room, user) => {
  const userName = String(user?.name || "").trim().toLowerCase();

  if (!userName) return false;

  const candidate =
    typeof room?.requester === "string"
      ? room.requester
      : room?.requesterName || room?.ownerName || "";

  return String(candidate).trim().toLowerCase() === userName;
};

/*
 * The endpoint is the authenticated user's "my support rooms" endpoint.
 * Records with explicit ownership are still checked strictly. Older backend
 * responses that do not include owner fields are accepted from this endpoint,
 * preventing genuine rooms from disappearing from the user's list.
 */
const filterRoomsFromMyEndpoint = (records, user, locallyOwnedIds) =>
  (Array.isArray(records) ? records : []).filter((room) => {
    if (isOwnedByUser(room, user, locallyOwnedIds)) return true;
    if (requesterNameMatches(room, user)) return true;

    const owners = getRecordOwnerIdentitySet(room);
    return owners.size === 0;
  });

export default function SupportRoomsPage() {
  const { user } = useAuth();
  const { pick } = useLanguage();

  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);
  const [loadError, setLoadError] = useState("");

  const requestInProgressRef = useRef(false);

  const readLocalRooms = useCallback(() => {
    const stored = storage.get(STORAGE_KEYS.supportRooms, []);
    return filterOwnedRecords(stored, user);
  }, [user]);

  const loadRooms = useCallback(
    async ({ showLoader = false } = {}) => {
      if (requestInProgressRef.current) return;

      requestInProgressRef.current = true;

      if (showLoader) {
        setRefreshing(true);
      }

      const localRooms = readLocalRooms();
      const localIds = localRooms.map(getRecordId).filter(Boolean);

      try {
        const payload = await userApi.getSupportRooms();
        const remoteRooms = extractRooms(payload);
        const ownedRemoteRooms = filterRoomsFromMyEndpoint(remoteRooms, user, localIds);

        setBlockedCount(Math.max(0, remoteRooms.length - ownedRemoteRooms.length));

        const nextRooms = sortRooms(
          applySupportRoomOverrides(
            mergeUniqueRecords(localRooms, ownedRemoteRooms),
          ).filter((room) => !room.hiddenFromUser),
        );

        setRooms(nextRooms);
        setLoadError("");
      } catch (error) {
        console.error("Unable to refresh support rooms:", error);

        setRooms(
          sortRooms(
            applySupportRoomOverrides(localRooms).filter(
              (room) => !room.hiddenFromUser,
            ),
          ),
        );

        setLoadError(
          error?.message ||
            pick(
              "Live rooms could not be refreshed. Showing rooms saved on this device.",
              "লাইভ কক্ষ হালনাগাদ করা যায়নি। এই ডিভাইসে সংরক্ষিত কক্ষ দেখানো হচ্ছে।",
            ),
        );
      } finally {
        requestInProgressRef.current = false;
        setRefreshing(false);
      }
    },
    [pick, readLocalRooms, user],
  );

  useEffect(() => {
    let active = true;

    const safeLoad = async (options) => {
      if (!active) return;
      await loadRooms(options);
    };

    void safeLoad({ showLoader: true });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void safeLoad();
      }
    }, ROOM_REFRESH_INTERVAL);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void safeLoad();
      }
    };

    const refreshFromStorage = () => {
      if (active) {
        void safeLoad();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener(SUPPORT_ROOM_EVENT, refreshFromStorage);
    window.addEventListener("storage", refreshFromStorage);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener(SUPPORT_ROOM_EVENT, refreshFromStorage);
      window.removeEventListener("storage", refreshFromStorage);
    };
  }, [loadRooms]);

  const filteredRooms = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return rooms;

    return rooms.filter((room) => {
      const text = [
        getRecordId(room),
        room.title,
        room.status,
        room.priority,
        room.assignedAdmin,
        room.lastMessage,
        room.summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(needle);
    });
  }, [query, rooms]);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B0E16] shadow-2xl">
      <div className="grid h-[calc(100dvh-14rem)] min-h-[540px] lg:h-[calc(100dvh-9rem)] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-white/[0.08] bg-[#0E111A]">
          <div className="shrink-0 border-b border-white/[0.08] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="eyebrow">{pick("Private messages", "ব্যক্তিগত বার্তা")}</p>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-archive-teal/15 bg-archive-teal/[0.05] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-archive-teal">
                    {refreshing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-archive-teal" />
                    )}
                    {refreshing
                      ? pick("Syncing", "হালনাগাদ")
                      : pick("Private", "ব্যক্তিগত")}
                  </span>
                </div>

                <h1 className="mt-2 font-display text-3xl font-semibold">
                  {pick("Support Rooms", "সহায়তা কক্ষ")}
                </h1>
              </div>

              <Button
                to="/support/new"
                size="sm"
                className="h-10 w-10 shrink-0 !px-0"
                aria-label={pick("New support request", "নতুন সহায়তা অনুরোধ")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <label className="relative mt-4 block">
              <span className="sr-only">{pick("Search rooms", "কক্ষ খুঁজুন")}</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field-control h-11 pl-10"
                placeholder={pick("Search your conversations", "আপনার কথোপকথন খুঁজুন")}
              />
            </label>
          </div>

          {loadError && (
            <div className="mx-3 mt-3 flex gap-2 rounded-xl border border-archive-amber/20 bg-archive-amber/[0.06] p-3 text-xs leading-5 text-[#E6C79F]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{loadError}</p>
            </div>
          )}

          {blockedCount > 0 && (
            <div className="mx-3 mt-3 flex gap-2 rounded-xl border border-archive-rose/20 bg-archive-rose/[0.06] p-3 text-xs leading-5 text-[#DAB8BE]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-archive-rose" />
              <p>
                {pick(
                  `${blockedCount} room(s) with conflicting ownership were hidden.`,
                  `মালিকানা না মেলায় ${blockedCount}টি কক্ষ লুকানো হয়েছে।`,
                )}
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
            {filteredRooms.length ? (
              <div className="space-y-1.5">
                {filteredRooms.map((room) => {
                  const roomId = getRecordId(room);

                  return (
                    <Link
                      key={roomId}
                      to={`/account/support-rooms/${encodeURIComponent(roomId)}`}
                      className="focus-ring group block rounded-2xl border border-transparent p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.045]"
                    >
                      <div className="flex gap-3">
                        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-archive-teal/20 bg-archive-teal/10 text-archive-teal">
                          <MessageSquareText className="h-5 w-5" />
                          {Number(room.unread) > 0 && (
                            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-archive-rose px-1 text-[10px] font-bold text-white">
                              {room.unread}
                            </span>
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-semibold text-white">
                              {room.title || pick("Support request", "সহায়তা অনুরোধ")}
                            </p>

                            <span className="shrink-0 text-[10px] text-archive-muted">
                              {formatUpdatedAt(room.updatedAt || room.lastMessageAt)}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-archive-muted">
                            {room.lastMessage ||
                              room.summary ||
                              pick("Open the private conversation", "ব্যক্তিগত কথোপকথন খুলুন")}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="truncate text-[10px] text-archive-muted">
                              {room.assignedAdmin || pick("Awaiting assignment", "দায়িত্ব দেওয়ার অপেক্ষায়")}
                            </span>
                            <StatusBadge status={room.status || "Under review"} className="shrink-0" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : rooms.length ? (
              <div className="grid h-full place-items-center px-6 text-center text-sm text-archive-muted">
                {pick("No conversations match your search.", "আপনার খোঁজের সঙ্গে কোনো কথোপকথন মেলেনি।")}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  title={pick("No support rooms yet", "এখনও কোনো সহায়তা কক্ষ নেই")}
                  description={pick(
                    "Create a private support request to begin a protected conversation with an administrator.",
                    "অ্যাডমিনের সঙ্গে সুরক্ষিত কথোপকথন শুরু করতে একটি ব্যক্তিগত সহায়তা অনুরোধ তৈরি করুন।",
                  )}
                  actionLabel={pick("Open Support Request", "সহায়তা অনুরোধ খুলুন")}
                  actionTo="/support/new"
                />
              </div>
            )}
          </div>
        </aside>

        <section className="hidden min-h-0 place-items-center bg-[radial-gradient(circle_at_center,rgba(75,155,141,.08),transparent_42%)] p-8 text-center lg:grid">
          <div className="max-w-md">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-archive-teal/20 bg-archive-teal/10 text-archive-teal shadow-xl">
              <MessageSquareText className="h-9 w-9" />
            </span>

            <h2 className="mt-6 font-display text-4xl font-semibold">
              {pick("Choose a support room", "একটি সহায়তা কক্ষ বেছে নিন")}
            </h2>

            <p className="mt-3 text-sm leading-7 text-archive-muted">
              {pick(
                "Select a conversation from the left. Messages, inline attachments and the fixed composer will appear here like a private messenger.",
                "বাম পাশ থেকে একটি কথোপকথন বেছে নিন। বার্তা, সংযুক্তির প্রিভিউ এবং নিচে স্থির লেখার ঘর এখানে মেসেঞ্জারের মতো দেখা যাবে।",
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}