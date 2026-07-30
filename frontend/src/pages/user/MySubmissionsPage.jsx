import { useEffect, useMemo, useState } from "react";
import { EyeOff, Files, LockKeyhole, Plus, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { demoSubmissions } from "../../data/demoData";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { userApi, unwrap } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function MySubmissionsPage() {
  const localRecords = [...storage.get(STORAGE_KEYS.submissions, []), ...demoSubmissions].filter((item, index, list) => list.findIndex((record) => record.id === item.id) === index);
  const [records, setRecords] = useState(localRecords);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    userApi.getMySubmissions(localRecords).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setRecords([...storage.get(STORAGE_KEYS.submissions, []), ...data].filter((item, index, list) => list.findIndex((record) => (record.id || record._id) === (item.id || item._id)) === index));
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => records.filter((item) => {
    const searchable = `${item.title} ${item.type} ${item.id || item._id} ${(item.contentTypes || []).join(" ")} ${item.identity || item.publicAttribution || ""}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (status === "All statuses" || item.status === status);
  }), [records, query, status]);

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{pick("Private account", "ব্যক্তিগত অ্যাকাউন্ট")}</p><h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">{pick("My Submissions", "আমার জমা")}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-archive-muted">{pick("Track administrator review, information requests, identity protection and publication outcomes. Submitted originals remain private unless an approved public version is created.", "অ্যাডমিন পর্যালোচনা, তথ্যের অনুরোধ, পরিচয় সুরক্ষা ও প্রকাশের ফলাফল দেখুন। অনুমোদিত প্রকাশ্য সংস্করণ তৈরি না হওয়া পর্যন্ত মূল জমা ব্যক্তিগত থাকে।")}</p></div><Button to="/submit"><Plus className="h-4 w-4" /> {pick("New Submission", "নতুন জমা")}</Button></div>
      <div className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_240px]"><label className="relative"><span className="sr-only">Search submissions</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input className="field-control pl-12" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={pick("Search title, type or submission ID", "শিরোনাম, ধরন বা জমার আইডি খুঁজুন")} /></label><select className="field-control" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter status"><option>All statuses</option><option>Pending admin review</option><option>Under review</option><option>Information required</option><option>Published</option><option>Rejected</option></select></div>
      {filtered.length ? <div className="mt-6 space-y-4">{filtered.map((item) => { const contentTypes = item.contentTypes?.length ? item.contentTypes : [item.type]; return <article key={item.id || item._id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-archive-amber/20 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex min-w-0 gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-archive-amber/20 bg-archive-amber/10 text-archive-amber"><Files className="h-5 w-5" /></span><div className="min-w-0"><h2 className="font-semibold text-white">{item.title}</h2><p className="mt-1 text-xs text-archive-muted">{item.id || item._id} • {pick("Updated", "হালনাগাদ")} {item.updatedAt || item.createdAt || "—"}</p><div className="mt-3 flex flex-wrap gap-2">{contentTypes.filter(Boolean).map((type) => <span key={type} className="badge border-white/10 bg-white/[0.04] text-[#CFC9C1]">{type}</span>)}</div></div></div><div className="flex flex-wrap gap-2"><StatusBadge status={item.status} /><span className="badge border-archive-teal/25 bg-archive-teal/10 text-[#BCE4DC]"><LockKeyhole className="h-3.5 w-3.5" />{item.visibility || (item.status === "Published" ? "Public version" : "Private")}</span></div></div><div className="mt-5 grid gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-xl border border-white/[0.07] bg-black/10 p-3"><p className="text-[11px] uppercase tracking-[.12em] text-archive-muted">{pick("Submission type", "জমার ধরন")}</p><p className="mt-2 text-sm text-[#DDD7CE]">{item.type}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/10 p-3"><p className="text-[11px] uppercase tracking-[.12em] text-archive-muted">{pick("Attachments", "সংযুক্তি")}</p><p className="mt-2 text-sm text-[#DDD7CE]">{item.attachmentCount ?? item.attachments?.length ?? "—"}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/10 p-3"><p className="text-[11px] uppercase tracking-[.12em] text-archive-muted">{pick("Public identity", "প্রকাশ্য পরিচয়")}</p><p className="mt-2 flex items-center gap-2 text-sm text-[#DDD7CE]"><EyeOff className="h-4 w-4 text-archive-teal" />{item.identity || item.publicAttribution || pick("Identity setting recorded", "পরিচয় পছন্দ সংরক্ষিত")}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/10 p-3"><p className="text-[11px] uppercase tracking-[.12em] text-archive-muted">{pick("Publication permission", "প্রকাশের অনুমতি")}</p><p className="mt-2 text-sm leading-5 text-[#DDD7CE]">{item.publicationPermission || pick("Admin approval required", "অ্যাডমিন অনুমোদন প্রয়োজন")}</p></div></div></article>; })}</div> : <div className="mt-8"><EmptyState title={pick("No submissions found", "কোনো জমা পাওয়া যায়নি")} description={pick("Try another filter or create a new protected submission.", "অন্য ফিল্টার ব্যবহার করুন বা নতুন সুরক্ষিত জমা তৈরি করুন।")} actionLabel={pick("Submit Any Record", "যেকোনো রেকর্ড জমা দিন")} actionTo="/submit" /></div>}
    </div>
  );
}
