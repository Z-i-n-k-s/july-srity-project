import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clock3, FileText, MessageSquareText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/ui/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { dashboardQuickActions } from "../../data/landingData";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { userApi, unwrap } from "../../lib/api";
import { filterOwnedRecords, getRecordId, mergeUniqueRecords } from "../../lib/ownership";
import { applySupportRoomOverrides } from "../../lib/supportRoomState";
import { normalizeSubmission } from "../../lib/submissionReview";

const extract = (payload, keys) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return [];
};

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { pick } = useLanguage();
  const storedSubmissions = useMemo(() => storage.get(STORAGE_KEYS.submissions, []), []);
  const storedRooms = useMemo(() => storage.get(STORAGE_KEYS.supportRooms, []), []);
  const localSubmissions = useMemo(() => filterOwnedRecords(storedSubmissions, user), [storedSubmissions, user]);
  const localRooms = useMemo(() => filterOwnedRecords(storedRooms, user), [storedRooms, user]);
  const submissionIds = useMemo(() => localSubmissions.map(getRecordId).filter(Boolean), [localSubmissions]);
  const roomIds = useMemo(() => localRooms.map(getRecordId).filter(Boolean), [localRooms]);
  const [submissions, setSubmissions] = useState(() => localSubmissions.map(normalizeSubmission));
  const [rooms, setRooms] = useState(() => applySupportRoomOverrides(localRooms));
  const drafts = filterOwnedRecords(storage.get(STORAGE_KEYS.drafts, []), user);

  useEffect(() => {
    let active = true;
    Promise.all([userApi.getMySubmissions(), userApi.getSupportRooms()]).then(([subPayload, roomPayload]) => {
      if (!active) return;
      const remoteSubmissions = filterOwnedRecords(extract(subPayload, ["submissions", "items"]), user, submissionIds);
      const remoteRooms = filterOwnedRecords(extract(roomPayload, ["rooms", "supportRooms", "items"]), user, roomIds);
      setSubmissions(mergeUniqueRecords(localSubmissions, remoteSubmissions).map(normalizeSubmission));
      setRooms(applySupportRoomOverrides(mergeUniqueRecords(localRooms, remoteRooms)));
    }).catch((error) => console.error("Unable to refresh private dashboard:", error));
    return () => { active = false; };
  }, [localRooms, localSubmissions, roomIds, submissionIds, user]);

  const recentSubmissions = submissions.slice(0, 3);
  const recentRooms = rooms.slice(0, 2);
  const activeRooms = rooms.filter((room) => !["stopped", "closed", "completed", "resolved"].includes(String(room.status || "").toLowerCase()));

  return <div>
    <p className="eyebrow">{pick("User dashboard", "ইউজার ড্যাশবোর্ড")}</p>
    <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">{pick(`Welcome, ${user?.name?.split(" ")[0] || "User"}.`, `স্বাগতম, ${user?.name?.split(" ")[0] || "ব্যবহারকারী"}।`)}</h1>
    <p className="mt-3 text-sm leading-6 text-archive-muted">{pick("Your dashboard is filtered to the signed-in account before anything is rendered.", "কোনো তথ্য দেখানোর আগে ড্যাশবোর্ডটি সাইন-ইন করা অ্যাকাউন্ট অনুযায়ী ফিল্টার করা হয়।")}</p>

    <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[{label:pick("Total submissions", "মোট জমা"),value:submissions.length,icon:FileText},{label:pick("Open support rooms", "চলমান সহায়তা কক্ষ"),value:activeRooms.length,icon:MessageSquareText},{label:pick("Saved drafts", "সংরক্ষিত খসড়া"),value:drafts.length,icon:Clock3},{label:pick("Private account", "ব্যক্তিগত অ্যাকাউন্ট"),value:pick("Protected", "সুরক্ষিত"),icon:ShieldCheck}].map(({label,value,icon:Icon}) => <div key={label} className="surface-card rounded-2xl p-5"><Icon className="h-5 w-5 text-archive-amber"/><p className="mt-5 font-display text-3xl font-semibold">{value}</p><p className="mt-2 text-xs uppercase tracking-[.12em] text-archive-muted">{label}</p></div>)}
    </div>

    <section className="mt-10"><div><p className="eyebrow">{pick("Quick actions", "দ্রুত কাজ")}</p><h2 className="mt-2 font-display text-3xl font-semibold">{pick("What do you need to do?", "আপনি কী করতে চান?")}</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{dashboardQuickActions.map(({title,description,to,icon:Icon}) => <Link key={title} to={to} className="focus-ring group flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-archive-amber/30"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-archive-amber/20 bg-archive-amber/10 text-archive-amber"><Icon className="h-5 w-5"/></span><div><h3 className="font-semibold text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-archive-muted">{description}</p></div><ArrowUpRight className="ml-auto h-5 w-5 text-archive-muted transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-archive-amber"/></Link>)}</div></section>

    <div className="mt-10 grid gap-6 xl:grid-cols-2">
      <section className="surface-card rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-display text-3xl font-semibold">{pick("Recent submissions", "সাম্প্রতিক জমা")}</h2><Link to="/account/submissions" className="text-sm font-semibold text-archive-amber">{pick("View all", "সব দেখুন")}</Link></div><div className="mt-5 space-y-4">{recentSubmissions.length ? recentSubmissions.map((item) => <div key={getRecordId(item)} className="flex flex-col gap-3 rounded-xl border border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{item.title}</p><p className="mt-1 text-xs text-archive-muted">{getRecordId(item)} • {item.type}</p></div><StatusBadge status={item.status}/></div>) : <p className="text-sm text-archive-muted">{pick("No submissions yet.", "এখনও কোনো জমা নেই।")}</p>}</div></section>
      <section className="surface-card rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-display text-3xl font-semibold">{pick("Support rooms", "সহায়তা কক্ষ")}</h2><Link to="/account/support-rooms" className="text-sm font-semibold text-archive-amber">{pick("View all", "সব দেখুন")}</Link></div><div className="mt-5 space-y-4">{recentRooms.length ? recentRooms.map((room) => <Link key={getRecordId(room)} to={`/account/support-rooms/${getRecordId(room)}`} className="focus-ring flex flex-col gap-3 rounded-xl border border-white/[0.07] p-4 hover:border-archive-teal/25 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{room.title}</p><p className="mt-1 text-xs text-archive-muted">{getRecordId(room)} • {room.updatedAt}</p></div><StatusBadge status={room.status}/></Link>) : <p className="text-sm text-archive-muted">{pick("No support rooms yet.", "এখনও কোনো সহায়তা কক্ষ নেই।")}</p>}</div></section>
    </div>
  </div>;
}
