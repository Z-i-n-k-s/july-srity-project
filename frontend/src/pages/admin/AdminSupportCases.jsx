import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Filter, MessageSquareText, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi, unwrap } from "../../lib/api";
import { adminSupportFallback } from "../../data/adminData";
import StatusBadge from "../../components/ui/StatusBadge";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminSupportCases() {
  const [items, setItems] = useState(adminSupportFallback);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All");
  const [loading, setLoading] = useState(true);
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    adminApi.supportCases(adminSupportFallback).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setItems(data);
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item.id} ${item.title} ${item.requester} ${item.category} ${item.location}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (priority === "All" || item.priority === priority);
  }), [items, query, priority]);

  return (
    <div className="space-y-6">
      <section className="admin-card"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="eyebrow">{pick("Private support administration", "ব্যক্তিগত সহায়তা প্রশাসন")}</p><h2 className="mt-2 font-display text-4xl font-semibold">{pick("Support rooms and medical-document review", "সহায়তা কক্ষ ও চিকিৎসা নথি পর্যালোচনা")}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">{pick("Communicate only through the protected room, request the minimum information needed and record every document decision.", "কেবল সুরক্ষিত কক্ষের মাধ্যমে যোগাযোগ করুন, প্রয়োজনীয় সর্বনিম্ন তথ্য চাইুন এবং প্রতিটি নথি-সিদ্ধান্ত সংরক্ষণ করুন।")}</p></div><div className="rounded-xl border border-archive-rose/20 bg-archive-rose/[0.07] p-4 text-xs leading-5 text-[#E2BEC5]"><AlertTriangle className="mr-2 inline h-4 w-4" />{pick("This workflow is not an emergency medical service.", "এই ব্যবস্থা জরুরি চিকিৎসা সেবা নয়।")}</div></div></section>

      <section className="admin-card">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]"><label className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="field-control pl-12" placeholder={pick("Search case, requester, category or location", "কেস, অনুরোধকারী, ধরন বা স্থান খুঁজুন")} /></label><label className="relative"><Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-muted" /><select value={priority} onChange={(e) => setPriority(e.target.value)} className="field-control pl-11"><option>All</option><option>Urgent</option><option>Normal</option></select></label></div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {filtered.map((item) => <Link key={item.id} to={`/admin-panel/support-cases/${item.id}`} className="focus-ring group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-archive-teal/25"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-archive-teal/20 bg-archive-teal/10 text-archive-teal"><MessageSquareText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-2xl font-semibold text-white">{item.title}</h3><p className="mt-1 text-xs text-archive-muted">{item.id} • {item.requester}</p></div><StatusBadge status={item.status} /></div><p className="mt-4 line-clamp-2 text-sm leading-6 text-[#C6C2BC]">{item.summary}</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className={`rounded-full border px-2.5 py-1 ${item.priority === "Urgent" ? "border-archive-rose/25 bg-archive-rose/10 text-archive-rose" : "border-white/10 text-archive-muted"}`}>{item.priority}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-archive-muted">{item.category}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-archive-muted">{item.location}</span></div><div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4"><span className="inline-flex items-center gap-2 text-xs text-archive-muted"><ShieldCheck className="h-4 w-4 text-archive-teal" />{item.documents?.length || 0} {pick("protected documents", "সুরক্ষিত নথি")}</span><span className="text-xs font-semibold text-archive-amber">{pick("Open case →", "কেস খুলুন →")}</span></div></div></div></Link>)}
        </div>
        {!loading && !filtered.length && <div className="p-10 text-center text-sm text-archive-muted">{pick("No support cases match these filters.", "এই ফিল্টারে কোনো সহায়তা কেস পাওয়া যায়নি।")}</div>}
      </section>
    </div>
  );
}
