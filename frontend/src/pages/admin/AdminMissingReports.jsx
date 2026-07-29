import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, MapPin, Search, ShieldAlert, UserRoundCheck, XCircle } from "lucide-react";
import { adminApi, unwrap } from "../../lib/api";
import { adminMissingFallback } from "../../data/adminData";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminMissingReports() {
  const [items, setItems] = useState(adminMissingFallback);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    adminApi.missingReports(adminMissingFallback).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setItems(data);
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => items.filter((item) => `${item.id} ${item.name} ${item.lastSeenLocation} ${item.reporter}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  const review = async (action) => {
    if (action !== "approve" && note.trim().length < 8) return toast.warning(pick("Add a clear review note.", "একটি পরিষ্কার রিভিউ নোট দিন।"));
    setSaving(true);
    try {
      await adminApi.reviewMissingReport(selected.id, { action, note, publicFieldsConfirmed: action === "approve" });
      const nextStatus = action === "approve" ? "Verified for publication" : action === "request_information" ? "Information required" : "Rejected";
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: nextStatus } : item));
      setSelected((current) => ({ ...current, status: nextStatus }));
      setNote("");
      toast.success(pick(`Report marked ${nextStatus}.`, `রিপোর্টটি ${nextStatus} হিসেবে চিহ্নিত হয়েছে।`));
    } catch (error) { toast.error(error.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <section className="admin-card"><p className="eyebrow">{pick("Safety-first verification", "নিরাপত্তা-প্রথম যাচাই")}</p><h2 className="mt-2 font-display text-4xl font-semibold">{pick("Missing-person reports and private sightings", "নিখোঁজ ব্যক্তির রিপোর্ট ও ব্যক্তিগত দেখা-সংক্রান্ত তথ্য")}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">{pick("Confirm reporter relationship, contact consent, image suitability and public fields. Possible sightings must remain private until separately verified.", "রিপোর্টারের সম্পর্ক, যোগাযোগের সম্মতি, ছবির উপযোগিতা এবং প্রকাশ্য তথ্য যাচাই করুন। সম্ভাব্য দেখার তথ্য আলাদাভাবে যাচাই না হওয়া পর্যন্ত ব্যক্তিগত থাকবে।")}</p></section>
      <section className="admin-card">
        <label className="relative block max-w-xl"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="field-control pl-12" placeholder={pick("Search report ID, name, reporter or location", "রিপোর্ট আইডি, নাম, রিপোর্টার বা স্থান খুঁজুন")} /></label>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">{filtered.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]"><div className="grid sm:grid-cols-[150px_1fr]"><ImageWithFallback src={item.image} alt={item.name} className="min-h-44" imageClassName="object-cover" /><div className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.13em] text-archive-rose">{item.id}</p><h3 className="mt-2 font-display text-2xl font-semibold text-white">{item.name}</h3></div><StatusBadge status={item.status} /></div><p className="mt-3 flex items-center gap-2 text-sm text-archive-muted"><MapPin className="h-4 w-4 text-archive-rose" />{item.lastSeenLocation} • {item.lastSeenDate}</p><p className="mt-3 line-clamp-2 text-sm leading-6 text-[#C6C2BC]">{item.description}</p><div className="mt-4 flex items-center justify-between"><span className={`rounded-full border px-2.5 py-1 text-xs ${item.priority === "High" ? "border-archive-rose/25 bg-archive-rose/10 text-archive-rose" : "border-white/10 text-archive-muted"}`}>{item.priority}</span><button onClick={() => { setSelected(item); setNote(""); }} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-archive-amber/25 bg-archive-amber/10 px-3 py-2 text-xs font-semibold text-archive-amber"><Eye className="h-4 w-4" />{pick("Review", "পর্যালোচনা")}</button></div></div></div></article>)}</div>
      </section>

      {selected && <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true"><button className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)} aria-label="Close" /><div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-ink-800 p-5 shadow-2xl sm:p-7"><div className="grid gap-7 lg:grid-cols-[.8fr_1.2fr]"><div><ImageWithFallback src={selected.image} alt={selected.name} className="aspect-[4/5] rounded-2xl border border-white/10" /><div className="mt-4 rounded-xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4 text-xs leading-5 text-[#E2BEC5]"><ShieldAlert className="mr-2 inline h-4 w-4" />{pick("Do not display private phone numbers, exact addresses or unverified sightings publicly.", "ব্যক্তিগত ফোন নম্বর, সঠিক ঠিকানা বা যাচাই না হওয়া দেখা-সংক্রান্ত তথ্য প্রকাশ করবেন না।")}</div></div><div><p className="eyebrow">{selected.id}</p><h2 className="mt-2 font-display text-4xl font-semibold">{selected.name}</h2><div className="mt-3"><StatusBadge status={selected.status} /></div><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Age", "বয়স")}</dt><dd className="mt-1 text-white">{selected.age}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Reporter", "রিপোর্টার")}</dt><dd className="mt-1 text-white">{selected.reporter}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Relationship", "সম্পর্ক")}</dt><dd className="mt-1 text-white">{selected.relationship}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Private sightings", "ব্যক্তিগত দেখা-তথ্য")}</dt><dd className="mt-1 text-white">{selected.sightings}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Last seen", "শেষ দেখা")}</dt><dd className="mt-1 text-white">{selected.lastSeenDate}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Location", "স্থান")}</dt><dd className="mt-1 text-white">{selected.lastSeenLocation}</dd></div></dl><p className="mt-6 text-sm leading-7 text-[#C6C2BC]">{selected.description}</p><label className="mt-6 block"><span className="field-label">{pick("Verification note", "যাচাই নোট")}</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} className="field-control resize-none" placeholder={pick("Record relationship checks, consent, image review and any information request…", "সম্পর্ক যাচাই, সম্মতি, ছবি পর্যালোচনা এবং প্রয়োজনীয় তথ্য লিখুন…")} /></label><div className="mt-5 grid gap-2 sm:grid-cols-3"><button disabled={saving} onClick={() => review("approve")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-3 text-sm font-semibold text-ink-950 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />{pick("Approve public listing", "প্রকাশ্য তালিকা অনুমোদন")}</button><button disabled={saving} onClick={() => review("request_information")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-teal/25 bg-archive-teal/10 px-4 py-3 text-sm font-semibold text-archive-teal"><UserRoundCheck className="h-4 w-4" />{pick("Request information", "তথ্য চাইুন")}</button><button disabled={saving} onClick={() => review("reject")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-rose/25 bg-archive-rose/10 px-4 py-3 text-sm font-semibold text-archive-rose"><XCircle className="h-4 w-4" />{pick("Reject", "প্রত্যাখ্যান")}</button></div></div></div></div></div>}
    </div>
  );
}
