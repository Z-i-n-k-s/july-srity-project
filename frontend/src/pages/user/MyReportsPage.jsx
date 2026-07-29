import { useEffect, useState } from "react";
import { Eye, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { userApi, unwrap } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function MyReportsPage() {
  const localReports = storage.get(STORAGE_KEYS.missingReports, []);
  const sightings = storage.get(STORAGE_KEYS.sightings, []);
  const fallback = [...localReports.map((item) => ({ ...item, kind: "Missing-person report", title: item.name })), ...sightings.map((item) => ({ ...item, kind: "Possible sighting", title: `Sighting for ${item.personId}` }))];
  const [items, setItems] = useState(fallback);
  const { pick } = useLanguage();
  useEffect(() => {
    let active = true;
    userApi.getMyMissingReports(fallback).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setItems([...fallback, ...data].filter((item, index, list) => list.findIndex((record) => (record.id || record._id) === (item.id || item._id)) === index));
    });
    return () => { active = false; };
  }, []);
  return <div><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{pick("Private account", "ব্যক্তিগত অ্যাকাউন্ট")}</p><h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">{pick("My Reports", "আমার রিপোর্ট")}</h1><p className="mt-3 text-sm leading-6 text-archive-muted">{pick("Track private missing-person reports and possible sightings sent for verification.", "যাচাইয়ের জন্য পাঠানো ব্যক্তিগত নিখোঁজ রিপোর্ট ও সম্ভাব্য দেখা-তথ্য দেখুন।")}</p></div><Button to="/missing-persons/report" variant="rose"><Search className="h-4 w-4" /> {pick("New Report", "নতুন রিপোর্ট")}</Button></div>{items.length ? <div className="mt-8 space-y-4">{items.map((item) => <article key={item.id || item._id} className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-archive-rose/20 bg-archive-rose/10 text-archive-rose">{item.kind === "Possible sighting" ? <Eye className="h-5 w-5" /> : <Search className="h-5 w-5" />}</span><div><h2 className="font-semibold text-white">{item.title || item.name}</h2><p className="mt-1 text-xs text-archive-muted">{item.id || item._id} • {item.kind || "Missing-person report"}</p></div></div><StatusBadge status={item.status || "Pending verification"} /></article>)}</div> : <div className="mt-8"><EmptyState title={pick("No private reports yet", "এখনও কোনো ব্যক্তিগত রিপোর্ট নেই")} description={pick("Reports and sightings you submit will appear here after they are saved or sent.", "জমা বা পাঠানোর পর রিপোর্ট ও দেখা-তথ্য এখানে দেখাবে।")} actionLabel={pick("Report a Missing Person", "নিখোঁজ ব্যক্তির রিপোর্ট করুন")} actionTo="/missing-persons/report" /></div>}</div>;
}
