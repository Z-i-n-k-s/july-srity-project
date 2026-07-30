import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Eye, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { userApi, unwrap } from "../../lib/api";
import { filterOwnedRecords, getRecordId, mergeUniqueRecords } from "../../lib/ownership";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const extractItems = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export default function MyReportsPage() {
  const { user } = useAuth();
  const { pick } = useLanguage();
  const storedReports = useMemo(() => storage.get(STORAGE_KEYS.missingReports, []).map((item) => ({ ...item, kind: "Missing-person report", title: item.title || item.name })), []);
  const storedSightings = useMemo(() => storage.get(STORAGE_KEYS.sightings, []).map((item) => ({ ...item, kind: "Possible sighting", title: item.title || `Sighting for ${item.personId}` })), []);
  const localItems = useMemo(() => filterOwnedRecords([...storedReports, ...storedSightings], user), [storedReports, storedSightings, user]);
  const localIds = useMemo(() => localItems.map(getRecordId).filter(Boolean), [localItems]);
  const [items, setItems] = useState(() => localItems);
  const [blockedCount, setBlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    userApi.getMyMissingReports().then((payload) => {
      if (!active) return;
      const remote = extractItems(payload);
      const owned = filterOwnedRecords(remote, user, localIds);
      setBlockedCount(Math.max(0, remote.length - owned.length));
      setItems(mergeUniqueRecords(localItems, owned));
    }).catch((error) => console.error("Unable to load private reports:", error)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [localIds, localItems, user]);

  return <div>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{pick("Private account", "ব্যক্তিগত অ্যাকাউন্ট")}</p><h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">{pick("My Reports", "আমার রিপোর্ট")}</h1><p className="mt-3 text-sm leading-6 text-archive-muted">{pick("Only missing-person reports and sightings linked to your account are shown.", "শুধু আপনার অ্যাকাউন্টের সঙ্গে যুক্ত নিখোঁজ রিপোর্ট ও দেখা-সংক্রান্ত তথ্য দেখানো হয়।")}</p></div><Button to="/missing-persons/report" variant="rose"><Search className="h-4 w-4" />{pick("New Report", "নতুন রিপোর্ট")}</Button></div>
    {blockedCount > 0 && <div className="mt-5 flex gap-3 rounded-2xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4 text-sm text-[#DAB8BE]"><AlertTriangle className="h-5 w-5 shrink-0 text-archive-rose" /><p>{pick(`${blockedCount} unrelated record(s) were blocked from this private page.`, `এই ব্যক্তিগত পাতা থেকে সম্পর্কহীন ${blockedCount}টি রেকর্ড আটকানো হয়েছে।`)}</p></div>}
    {loading && !items.length ? <div className="mt-8 rounded-2xl border border-white/10 p-10 text-center text-sm text-archive-muted">{pick("Loading your reports…", "আপনার রিপোর্ট লোড হচ্ছে…")}</div> : items.length ? <div className="mt-8 space-y-4">{items.map((item) => <article key={getRecordId(item)} className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-archive-rose/20 bg-archive-rose/10 text-archive-rose">{item.kind === "Possible sighting" ? <Eye className="h-5 w-5" /> : <Search className="h-5 w-5" />}</span><div><h2 className="font-semibold text-white">{item.title || item.name}</h2><p className="mt-1 text-xs text-archive-muted">{getRecordId(item)} • {item.kind || "Missing-person report"}</p>{(item.reviewNote || item.adminNote || item.statusReason) && <p className="mt-2 max-w-xl text-xs leading-5 text-[#D8D3CA]">{item.reviewNote || item.adminNote || item.statusReason}</p>}</div></div><StatusBadge status={item.status || "Pending verification"} /></article>)}</div> : <div className="mt-8"><EmptyState title={pick("No private reports yet", "এখনও কোনো ব্যক্তিগত রিপোর্ট নেই")} description={pick("Reports and sightings you submit will appear here.", "আপনার জমা দেওয়া রিপোর্ট ও দেখা-তথ্য এখানে দেখাবে।")} actionLabel={pick("Report a Missing Person", "নিখোঁজ ব্যক্তির রিপোর্ট করুন")} actionTo="/missing-persons/report" /></div>}
  </div>;
}
