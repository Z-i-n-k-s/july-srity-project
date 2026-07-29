import { useEffect, useState } from "react";
import { MessageSquareText, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { demoSupportRooms } from "../../data/demoData";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { userApi, unwrap } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function SupportRoomsPage() {
  const fallback = [...storage.get(STORAGE_KEYS.supportRooms, []), ...demoSupportRooms].filter((room, index, list) => list.findIndex((item) => item.id === room.id) === index);
  const [rooms, setRooms] = useState(fallback);
  const { pick } = useLanguage();
  useEffect(() => {
    let active = true;
    userApi.getSupportRooms(fallback).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setRooms([...storage.get(STORAGE_KEYS.supportRooms, []), ...data].filter((room, index, list) => list.findIndex((item) => (item.id || item._id) === (room.id || room._id)) === index));
    });
    return () => { active = false; };
  }, []);
  return <div><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{pick("Private account", "ব্যক্তিগত অ্যাকাউন্ট")}</p><h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">{pick("My Support Rooms", "আমার সহায়তা কক্ষ")}</h1><p className="mt-3 text-sm leading-6 text-archive-muted">{pick("View messages, requested documents and case progress.", "বার্তা, চাওয়া নথি ও কেসের অগ্রগতি দেখুন।")}</p></div><Button to="/support/new"><Plus className="h-4 w-4" /> {pick("New Request", "নতুন অনুরোধ")}</Button></div>{rooms.length ? <div className="mt-8 space-y-4">{rooms.map((room) => <Link key={room.id || room._id} to={`/account/support-rooms/${room.id || room._id}`} className="focus-ring group flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-archive-teal/30 hover:bg-white/[0.045] sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-archive-teal/20 bg-archive-teal/10 text-archive-teal"><MessageSquareText className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-3"><h2 className="font-display text-2xl font-semibold">{room.title}</h2>{room.unread > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-archive-rose px-1 text-xs font-bold text-white">{room.unread}</span>}</div><p className="mt-1 text-sm text-archive-muted">{room.id || room._id} • {pick("Assigned", "দায়িত্বপ্রাপ্ত")}: {room.assignedAdmin}</p></div></div><div className="flex items-center gap-3 sm:flex-col sm:items-end"><StatusBadge status={room.status} /><p className="text-xs text-archive-muted">{pick("Updated", "হালনাগাদ")} {room.updatedAt}</p></div></Link>)}</div> : <div className="mt-8"><EmptyState title={pick("No support rooms yet", "এখনও কোনো সহায়তা কক্ষ নেই")} description={pick("Create a private support request to begin a room.", "একটি ব্যক্তিগত সহায়তা অনুরোধ করে কক্ষ শুরু করুন।")} actionLabel={pick("Open Support Request", "সহায়তা অনুরোধ খুলুন")} actionTo="/support/new" /></div>}</div>;
}
