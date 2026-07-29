import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Images, MapPin, Search } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { timelineEvents as fallbackEvents } from "../data/landingData";
import { publicApi, unwrap } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

export default function TimelinePage() {
  const [records, setRecords] = useState(fallbackEvents);
  const [query, setQuery] = useState("");
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    publicApi.timeline(fallbackEvents).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setRecords(data);
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => records.filter((event) => `${event.title || ""} ${event.location || ""} ${event.summary || ""}`.toLowerCase().includes(query.toLowerCase())), [records, query]);
  return (
    <>
      <PageHeader label={pick("Verified chronology", "যাচাইকৃত কালপঞ্জি")} title={pick("The July Timeline", "জুলাই টাইমলাইন")} description={pick("Browse selected events in order and connect each entry to reviewed documentary material.", "নির্বাচিত ঘটনাগুলো ধারাবাহিকভাবে দেখুন এবং প্রতিটি এন্ট্রির সাথে পর্যালোচিত নথির সংযোগ দেখুন।")} />
      <section className="section-pad"><div className="page-shell">
        <label className="relative block max-w-xl"><span className="sr-only">Search timeline</span><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="field-control pl-12" placeholder={pick("Search events or locations", "ঘটনা বা স্থান খুঁজুন")} /></label>
        <div className="relative mt-10 max-w-4xl"><div className="absolute bottom-0 left-[17px] top-0 w-px bg-gradient-to-b from-archive-amber via-white/15 to-transparent" />
          <div className="space-y-6">{filtered.map((event) => <article key={event.id || event._id} className="relative pl-12"><span className="absolute left-0 top-6 grid h-9 w-9 place-items-center rounded-full border border-archive-amber/30 bg-ink-950 text-archive-amber"><CalendarDays className="h-4 w-4" /></span><div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-archive-amber">{event.date} {event.year}</p><h2 className="mt-2 font-display text-3xl font-semibold">{event.title}</h2></div><span className="badge border-archive-teal/30 bg-archive-teal/10 text-[#BCE4DC]"><CheckCircle2 className="h-3.5 w-3.5" />{pick("Verified", "যাচাইকৃত")}</span></div><p className="mt-4 leading-7 text-[#C6C2BC]">{event.summary}</p><div className="mt-5 flex flex-wrap gap-4 text-sm text-archive-muted"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{event.location}</span><span className="inline-flex items-center gap-2"><Images className="h-4 w-4" />{event.mediaCount || event.recordCount || 0} {pick("records", "রেকর্ড")}</span></div></div></article>)}</div>
        </div>
      </div></section>
    </>
  );
}
