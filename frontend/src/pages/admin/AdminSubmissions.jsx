import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, FileCheck2, Filter, LockKeyhole, Search, Send, ShieldCheck, X, XCircle } from "lucide-react";
import { adminApi, unwrap } from "../../lib/api";
import { adminSubmissionsFallback } from "../../data/adminData";
import AdminFilePreview from "../../components/admin/AdminFilePreview";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

const statuses = ["All", "Pending review", "Information required", "Source checked", "Approved", "Rejected"];

export default function AdminSubmissions() {
  const [items, setItems] = useState(adminSubmissionsFallback);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    adminApi.submissions(adminSubmissionsFallback).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setItems(data);
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item.id} ${item.title} ${item.submittedBy} ${(item.contentTypes || []).join(" ")}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (status === "All" || item.status === status);
  }), [items, query, status]);

  const decide = async (action) => {
    if ((action === "reject" || action === "request_information") && decisionNote.trim().length < 8) {
      toast.warning(pick("Add a clear review note before this action.", "এই কাজের আগে একটি পরিষ্কার রিভিউ নোট দিন।"));
      return;
    }
    setSaving(true);
    try {
      await adminApi.reviewSubmission(selected.id, {
        action,
        note: decisionNote,
        privacyConfirmed: true,
        sourceChecked: action === "approve" || action === "source_checked",
      });
      const nextStatus = action === "approve" ? "Approved" : action === "reject" ? "Rejected" : action === "source_checked" ? "Source checked" : "Information required";
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: nextStatus } : item));
      setSelected((current) => ({ ...current, status: nextStatus }));
      setDecisionNote("");
      toast.success(pick(`Submission marked ${nextStatus}.`, `জমাটি ${nextStatus} হিসেবে চিহ্নিত হয়েছে।`));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div><p className="eyebrow">{pick("Protected review queue", "সুরক্ষিত পর্যালোচনা কিউ")}</p><h2 className="mt-2 font-display text-4xl font-semibold">{pick("Evidence, stories and documentary records", "তথ্য, গল্প ও ডকুমেন্টারি রেকর্ড")}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">{pick("Review original private uploads, confirm source context and apply identity protection before approval. Approval does not publish the original file.", "মূল ব্যক্তিগত আপলোড পর্যালোচনা করুন, উৎস যাচাই করুন এবং অনুমোদনের আগে পরিচয় সুরক্ষা প্রয়োগ করুন। অনুমোদন মূল ফাইল প্রকাশ করে না।")}</p></div>
          <div className="rounded-xl border border-archive-rose/20 bg-archive-rose/[0.07] px-4 py-3 text-xs leading-5 text-[#E2BEC5]"><LockKeyhole className="mr-2 inline h-4 w-4" />{pick("Private reviewer access only", "কেবল ব্যক্তিগত রিভিউয়ার প্রবেশাধিকার")}</div>
        </div>
      </section>

      <section className="admin-card">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative"><span className="sr-only">Search</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="field-control pl-12" placeholder={pick("Search ID, title, contributor or type", "আইডি, শিরোনাম, অবদানকারী বা ধরন খুঁজুন")} /></label>
          <label className="relative"><span className="sr-only">Status</span><Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-muted" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="field-control pl-11">{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="admin-table">
            <thead><tr><th>{pick("Submission", "জমা")}</th><th>{pick("Content", "বিষয়বস্তু")}</th><th>{pick("Privacy", "গোপনীয়তা")}</th><th>{pick("Status", "অবস্থা")}</th><th>{pick("Submitted", "জমার সময়")}</th><th>{pick("Action", "কাজ")}</th></tr></thead>
            <tbody>
              {filtered.map((item) => <tr key={item.id} className="transition hover:bg-white/[0.025]"><td><p className="font-semibold text-white">{item.title}</p><p className="mt-1 text-xs text-archive-muted">{item.id} • {item.submittedBy}</p></td><td><div className="flex max-w-xs flex-wrap gap-1.5">{(item.contentTypes || []).map((type) => <span key={type} className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-[#C6C2BC]">{type}</span>)}</div></td><td><p className="text-xs text-[#D8D3CA]">{item.identityPreference}</p><p className="mt-1 text-[11px] text-archive-muted">{item.risk}</p></td><td><StatusBadge status={item.status} /></td><td className="whitespace-nowrap text-xs text-archive-muted">{item.submittedAt}</td><td><button onClick={() => { setSelected(item); setDecisionNote(""); }} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-archive-amber/25 bg-archive-amber/10 px-3 py-2 text-xs font-semibold text-archive-amber"><Eye className="h-4 w-4" />{pick("Review", "পর্যালোচনা")}</button></td></tr>)}
            </tbody>
          </table>
          {!loading && !filtered.length && <div className="p-10 text-center text-sm text-archive-muted">{pick("No submissions match these filters.", "এই ফিল্টারে কোনো জমা পাওয়া যায়নি।")}</div>}
          {loading && <div className="p-10 text-center text-sm text-archive-muted">{pick("Loading submissions…", "জমাগুলো লোড হচ্ছে…")}</div>}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="submission-review-title">
          <button className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)} aria-label="Close review" />
          <div className="relative max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7"><div><p className="eyebrow">{selected.id}</p><h2 id="submission-review-title" className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{selected.title}</h2><div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={selected.status} /><span className="rounded-full border border-archive-rose/20 bg-archive-rose/[0.08] px-2.5 py-1 text-xs text-[#E2BEC5]">{selected.risk}</span></div></div><button type="button" onClick={() => setSelected(null)} className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-archive-muted transition hover:text-white" aria-label="Close review"><X className="h-5 w-5" /></button></div>
            <div className="max-h-[calc(94vh-104px)] overflow-y-auto">
              <div className="grid gap-7 p-5 sm:p-7 xl:grid-cols-[1fr_390px]">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><h3 className="font-display text-2xl font-semibold">{pick("Record context", "রেকর্ডের প্রেক্ষাপট")}</h3><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Event date", "ঘটনার তারিখ")}</dt><dd className="mt-1 text-white">{selected.eventDate}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Location", "স্থান")}</dt><dd className="mt-1 text-white">{selected.location}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Contributor", "জমাদানকারী")}</dt><dd className="mt-1 text-white">{selected.submittedBy}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Contact", "যোগাযোগ")}</dt><dd className="mt-1 text-white">{selected.contact}</dd></div></dl><p className="mt-5 text-sm leading-7 text-[#C6C2BC]">{selected.summary}</p>{selected.storyText && <div className="mt-5 rounded-xl border border-archive-rose/15 bg-archive-rose/[0.05] p-4"><p className="text-xs font-semibold uppercase tracking-[.13em] text-archive-rose">{pick("Written testimony", "লিখিত সাক্ষ্য")}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#DED8D0]">{selected.storyText}</p></div>}</section>

                  <section><div className="flex items-center justify-between"><h3 className="font-display text-2xl font-semibold">{pick("Private attachments", "ব্যক্তিগত সংযুক্তি")}</h3><span className="text-xs text-archive-muted">{selected.attachments?.length || 0} {pick("files", "ফাইল")}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{(selected.attachments || []).map((file) => <AdminFilePreview key={file.id} file={file} />)}</div></section>

                  <section className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.055] p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-archive-teal" /><div><h3 className="font-semibold text-white">{pick("Required privacy processing", "প্রয়োজনীয় গোপনীয়তা প্রক্রিয়া")}</h3><div className="mt-4 grid gap-3 text-sm text-[#B9CFCB] sm:grid-cols-2">{Object.entries(selected.privacy || {}).map(([key, value]) => <p key={key} className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${value ? "bg-archive-teal" : "bg-white/20"}`} />{key.replace(/([A-Z])/g, " $1")} — {value ? pick("Required", "প্রয়োজন") : pick("Not requested", "চাওয়া হয়নি")}</p>)}</div></div></div></section>
                </div>

                <aside className="space-y-5 xl:sticky xl:top-0 xl:h-fit">
                  <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><p className="eyebrow">{pick("Publication control", "প্রকাশ নিয়ন্ত্রণ")}</p><h3 className="mt-2 font-display text-2xl font-semibold">{pick("Contributor permission", "জমাদানকারীর অনুমতি")}</h3><p className="mt-4 text-sm leading-6 text-[#C6C2BC]">{selected.publicationPermission}</p><p className="mt-3 text-sm text-archive-amber">{selected.identityPreference}</p></section>
                  <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><label className="field-label">{pick("Review note and decision reason", "রিভিউ নোট ও সিদ্ধান্তের কারণ")}</label><textarea value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} rows={6} className="field-control resize-none" placeholder={pick("Record source checks, privacy actions, missing information or rejection reason…", "উৎস যাচাই, গোপনীয়তা পদক্ষেপ, অনুপস্থিত তথ্য বা প্রত্যাখ্যানের কারণ লিখুন…")} /><p className="mt-2 text-xs leading-5 text-archive-muted">{pick("This note should be stored with reviewer identity and timestamp.", "এই নোট রিভিউয়ারের পরিচয় ও সময়সহ সংরক্ষণ করা উচিত।")}</p></section>
                  <div className="grid gap-2">
                    <button disabled={saving} onClick={() => decide("approve")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-3 text-sm font-semibold text-ink-950 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />{pick("Approve protected record", "সুরক্ষিত রেকর্ড অনুমোদন")}</button>
                    <button disabled={saving} onClick={() => decide("source_checked")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-teal/25 bg-archive-teal/[0.08] px-4 py-3 text-sm font-semibold text-archive-teal disabled:opacity-50"><FileCheck2 className="h-4 w-4" />{pick("Mark source checked", "উৎস যাচাই হয়েছে")}</button>
                    <button disabled={saving} onClick={() => decide("request_information")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-amber/25 bg-archive-amber/[0.08] px-4 py-3 text-sm font-semibold text-archive-amber disabled:opacity-50"><Send className="h-4 w-4" />{pick("Request information", "তথ্য চাইুন")}</button>
                    <button disabled={saving} onClick={() => decide("reject")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-rose/25 bg-archive-rose/[0.08] px-4 py-3 text-sm font-semibold text-archive-rose disabled:opacity-50"><XCircle className="h-4 w-4" />{pick("Reject with reason", "কারণসহ প্রত্যাখ্যান")}</button>
                  </div>
                  <div className="rounded-xl border border-archive-rose/20 bg-archive-rose/[0.055] p-4 text-xs leading-5 text-[#E2BEC5]"><AlertTriangle className="mr-2 inline h-4 w-4" />{pick("Never expose contact details, unprocessed faces, private names or original metadata in a public record.", "প্রকাশ্য রেকর্ডে কখনো যোগাযোগের তথ্য, অপরিবর্তিত মুখ, ব্যক্তিগত নাম বা মূল মেটাডাটা প্রকাশ করবেন না।")}</div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
