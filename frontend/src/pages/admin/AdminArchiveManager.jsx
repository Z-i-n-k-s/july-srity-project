import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Eye, Search, ShieldCheck, UploadCloud } from "lucide-react";
import { adminApi, unwrap } from "../../lib/api";
import { adminArchiveFallback } from "../../data/adminData";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminArchiveManager() {
  const [items, setItems] = useState(adminArchiveFallback);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [publishNote, setPublishNote] = useState("");
  const toast = useToast();
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    adminApi.archive(adminArchiveFallback).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setItems(data);
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => items.filter((item) => `${item.id} ${item.title} ${item.type} ${item.source} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  const publish = async (item, nextStatus = "Published") => {
    try {
      await adminApi.publishArchive(item.id, { status: nextStatus, note: publishNote, publishOriginal: false, privacyProcessedCopyOnly: true });
      setItems((current) => current.map((record) => record.id === item.id ? { ...record, status: nextStatus, updatedAt: "Just now" } : record));
      setSelected((current) => current ? { ...current, status: nextStatus } : current);
      setPublishNote("");
      toast.success(pick(`Archive record marked ${nextStatus}.`, `আর্কাইভ রেকর্ডটি ${nextStatus} হিসেবে চিহ্নিত হয়েছে।`));
    } catch (error) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6">
      <section className="admin-card"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="eyebrow">{pick("Public record control", "প্রকাশ্য রেকর্ড নিয়ন্ত্রণ")}</p><h2 className="mt-2 font-display text-4xl font-semibold">{pick("Archive publication and corrections", "আর্কাইভ প্রকাশ ও সংশোধন")}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">{pick("Manage only approved public derivatives. Keep original uploads, source contacts and sensitive metadata outside the public archive.", "কেবল অনুমোদিত প্রকাশ্য সংস্করণ পরিচালনা করুন। মূল আপলোড, উৎসের যোগাযোগ ও সংবেদনশীল মেটাডাটা প্রকাশ্য আর্কাইভের বাইরে রাখুন।")}</p></div><div className="rounded-xl border border-archive-teal/20 bg-archive-teal/[0.07] p-4 text-xs leading-5 text-[#B9CFCB]"><ShieldCheck className="mr-2 inline h-4 w-4" />{pick("Publication audit trail enabled", "প্রকাশ অডিট ট্রেইল সক্রিয়")}</div></div></section>
      <section className="admin-card"><label className="relative block max-w-xl"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="field-control pl-12" placeholder={pick("Search record ID, title, type, source or status", "রেকর্ড আইডি, শিরোনাম, ধরন, উৎস বা অবস্থা খুঁজুন")} /></label><div className="mt-6 grid gap-4 xl:grid-cols-3">{filtered.map((item) => <article key={item.id} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition hover:border-archive-amber/25"><ImageWithFallback src={item.image} alt={item.title} className="aspect-[16/10]" imageClassName="transition duration-500 group-hover:scale-[1.025]" /><div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.13em] text-archive-amber">{item.id}</p><h3 className="mt-2 font-display text-2xl font-semibold text-white">{item.title}</h3></div><StatusBadge status={item.status} /></div><div className="mt-4 space-y-2 text-xs text-archive-muted"><p>{item.type} • {item.verification}</p><p>{pick("Source", "উৎস")}: {item.source}</p><p>{pick("Updated", "হালনাগাদ")}: {item.updatedAt}</p></div><div className="mt-5 flex gap-2"><button onClick={() => setSelected(item)} className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-[#D8D3CA] hover:bg-white/5"><Eye className="h-4 w-4" />{pick("Review public record", "প্রকাশ্য রেকর্ড দেখুন")}</button>{item.status !== "Published" && <button onClick={() => publish(item)} className="focus-ring grid h-10 w-10 place-items-center rounded-xl bg-archive-amber text-ink-950" aria-label="Publish"><UploadCloud className="h-4 w-4" /></button>}</div></div></article>)}</div></section>

      {selected && <div className="fixed inset-0 z-[120] flex items-center justify-center p-4"><button className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)} aria-label="Close" /><div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-ink-800 p-5 shadow-2xl sm:p-7"><div className="grid gap-7 lg:grid-cols-[1.05fr_.95fr]"><ImageWithFallback src={selected.image} alt={selected.title} className="aspect-[16/11] rounded-2xl border border-white/10" /><div><p className="eyebrow">{selected.id}</p><h2 className="mt-2 font-display text-4xl font-semibold">{selected.title}</h2><div className="mt-4 flex flex-wrap gap-2"><StatusBadge status={selected.status} /><span className="rounded-full border border-archive-teal/20 bg-archive-teal/10 px-2.5 py-1 text-xs text-archive-teal">{selected.verification}</span></div><p className="mt-5 text-sm leading-7 text-[#C6C2BC]">{pick("This preview represents the redacted public derivative. Confirm the title, date, location, source label, consent-safe attribution and correction history before publishing.", "এই প্রিভিউ সম্পাদিত প্রকাশ্য সংস্করণ। প্রকাশের আগে শিরোনাম, তারিখ, স্থান, উৎসের লেবেল, সম্মতিপূর্ণ পরিচয় এবং সংশোধনের ইতিহাস নিশ্চিত করুন।")}</p><label className="mt-5 block"><span className="field-label">{pick("Publication or correction note", "প্রকাশ বা সংশোধন নোট")}</span><textarea value={publishNote} onChange={(e) => setPublishNote(e.target.value)} rows={5} className="field-control resize-none" placeholder={pick("Record what was redacted, corrected or approved…", "কী সম্পাদিত, সংশোধিত বা অনুমোদিত হয়েছে লিখুন…")} /></label><div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={() => publish(selected, "Published")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-3 text-sm font-semibold text-ink-950"><CheckCircle2 className="h-4 w-4" />{pick("Publish approved version", "অনুমোদিত সংস্করণ প্রকাশ")}</button><button onClick={() => publish(selected, "Unpublished")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-rose/25 bg-archive-rose/10 px-4 py-3 text-sm font-semibold text-archive-rose"><Archive className="h-4 w-4" />{pick("Unpublish for review", "পর্যালোচনার জন্য সরান")}</button></div></div></div></div></div>}
    </div>
  );
}
