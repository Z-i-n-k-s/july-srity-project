import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, MessageSquareText, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { userApi, unwrap } from "../../lib/api";
import { filterOwnedRecords, getRecordId, mergeUniqueRecords } from "../../lib/ownership";
import { applySupportRoomOverrides, SUPPORT_ROOM_EVENT } from "../../lib/supportRoomState";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const ROOM_REFRESH_INTERVAL = 5000;
const extractRooms = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rooms)) return data.rooms;
  if (Array.isArray(data?.supportRooms)) return data.supportRooms;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};
const formatUpdatedAt = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function SupportRoomsPage() {
  const { user } = useAuth();
  const { pick } = useLanguage();
  const storedRooms = useMemo(() => storage.get(STORAGE_KEYS.supportRooms, []), []);
  const localRooms = useMemo(() => filterOwnedRecords(storedRooms, user), [storedRooms, user]);
  const localIds = useMemo(() => localRooms.map(getRecordId).filter(Boolean), [localRooms]);
  const [rooms, setRooms] = useState(() => applySupportRoomOverrides(localRooms));
  const [refreshing, setRefreshing] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);
  const requestInProgressRef = useRef(false);

  useEffect(() => {
    let active = true;
    const loadRooms = async ({ showLoader = false } = {}) => {
      if (requestInProgressRef.current) return;
      requestInProgressRef.current = true;
      if (showLoader && active) setRefreshing(true);
      try {
        const payload = await userApi.getSupportRooms();
        if (!active) return;
        const remote = extractRooms(payload);
        const owned = filterOwnedRecords(remote, user, localIds);
        setBlockedCount(Math.max(0, remote.length - owned.length));
        const next = applySupportRoomOverrides(mergeUniqueRecords(localRooms, owned));
        setRooms(next);
        storage.set(STORAGE_KEYS.supportRooms, next.filter((room) => localIds.includes(getRecordId(room))));
      } catch (error) {
        console.error("Unable to refresh support rooms:", error);
      } finally {
        requestInProgressRef.current = false;
        if (active) setRefreshing(false);
      }
    };
    const refreshOverrides = () => setRooms((current) => applySupportRoomOverrides(current));
    void loadRooms({ showLoader: true });
    const intervalId = window.setInterval(() => document.visibilityState === "visible" && void loadRooms(), ROOM_REFRESH_INTERVAL);
    const refreshWhenVisible = () => document.visibilityState === "visible" && void loadRooms();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener(SUPPORT_ROOM_EVENT, refreshOverrides);
    window.addEventListener("storage", refreshOverrides);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener(SUPPORT_ROOM_EVENT, refreshOverrides);
      window.removeEventListener("storage", refreshOverrides);
    };
  }, [localIds, localRooms, user]);

  return <div>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">{pick("Private account", "ব্যক্তিগত অ্যাকাউন্ট")}</p><span className="inline-flex items-center gap-1.5 rounded-full border border-archive-teal/15 bg-archive-teal/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-archive-teal">{refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-archive-teal" />}{refreshing ? pick("Checking updates", "হালনাগাদ দেখা হচ্ছে") : pick("Private live updates", "ব্যক্তিগত লাইভ হালনাগাদ")}</span></div><h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">{pick("My Support Rooms", "আমার সহায়তা কক্ষ")}</h1><p className="mt-3 text-sm leading-6 text-archive-muted">{pick("Only rooms belonging to your account are visible.", "শুধু আপনার অ্যাকাউন্টের সহায়তা কক্ষগুলো দৃশ্যমান।")}</p></div><Button to="/support/new"><Plus className="h-4 w-4" />{pick("New Request", "নতুন অনুরোধ")}</Button></div>
    {blockedCount > 0 && <div className="mt-5 flex gap-3 rounded-2xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4 text-sm text-[#DAB8BE]"><AlertTriangle className="h-5 w-5 shrink-0 text-archive-rose" /><p>{pick(`${blockedCount} room(s) not owned by your account were hidden.`, `আপনার অ্যাকাউন্টের নয় এমন ${blockedCount}টি কক্ষ লুকানো হয়েছে।`)}</p></div>}
    {rooms.length ? <div className="mt-8 space-y-4">{rooms.map((room) => { const roomId = getRecordId(room); return <Link key={roomId} to={`/account/support-rooms/${roomId}`} className="focus-ring group flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-archive-teal/30 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-archive-teal/20 bg-archive-teal/10 text-archive-teal"><MessageSquareText className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-3"><h2 className="font-display text-2xl font-semibold">{room.title || pick("Support request", "সহায়তা অনুরোধ")}</h2>{Number(room.unread) > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-archive-rose px-1.5 text-xs font-bold text-white">{room.unread}</span>}</div><p className="mt-1 text-sm text-archive-muted">{roomId} • {pick("Assigned", "দায়িত্বপ্রাপ্ত")}: {room.assignedAdmin || pick("Awaiting assignment", "দায়িত্ব দেওয়ার অপেক্ষায়")}</p>{room.stoppedReason && <p className="mt-2 max-w-xl text-xs leading-5 text-[#DAB8BE]">{room.stoppedReason}</p>}</div></div><div className="flex items-center gap-3 sm:flex-col sm:items-end"><StatusBadge status={room.status || "Under review"} /><p className="text-xs text-archive-muted">{pick("Updated", "হালনাগাদ")} {formatUpdatedAt(room.updatedAt)}</p></div></Link>; })}</div> : <div className="mt-8"><EmptyState title={pick("No support rooms yet", "এখনও কোনো সহায়তা কক্ষ নেই")} description={pick("Create a private support request to begin a room.", "একটি ব্যক্তিগত সহায়তা অনুরোধ করে কক্ষ শুরু করুন।")} actionLabel={pick("Open Support Request", "সহায়তা অনুরোধ খুলুন")} actionTo="/support/new" /></div>}
  </div>;
}
