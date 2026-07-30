import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, EyeOff, Files, LockKeyhole, Plus, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { userApi, unwrap } from "../../lib/api";
import { filterOwnedRecords, getRecordId, mergeUniqueRecords } from "../../lib/ownership";
import { extractLatestReview, formatReviewDate, normalizeSubmission } from "../../lib/submissionReview";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const extractRecords = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.submissions)) return data.submissions;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export default function MySubmissionsPage() {
  const { user } = useAuth();
  const { pick, language } = useLanguage();
  const storedRecords = useMemo(() => storage.get(STORAGE_KEYS.submissions, []), []);
  const localRecords = useMemo(() => filterOwnedRecords(storedRecords, user), [storedRecords, user]);
  const localIds = useMemo(() => localRecords.map(getRecordId).filter(Boolean), [localRecords]);
  const [records, setRecords] = useState(() => localRecords.map(normalizeSubmission));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [loading, setLoading] = useState(true);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    let active = true;

    userApi.getMySubmissions().then((payload) => {
      if (!active) return;
      const remote = extractRecords(payload);
      const ownedRemote = filterOwnedRecords(remote, user, localIds);
      setBlockedCount(Math.max(0, remote.length - ownedRemote.length));
      setRecords(mergeUniqueRecords(localRecords, ownedRemote).map(normalizeSubmission));
    }).catch((error) => {
      console.error("Unable to load private submissions:", error);
      if (active) setRecords(localRecords.map(normalizeSubmission));
    }).finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [localIds, localRecords, user]);

  const filtered = useMemo(() => records.filter((item) => {
    const searchable = `${item.title || ""} ${item.type || ""} ${getRecordId(item)} ${(item.contentTypes || []).join(" ")} ${item.identity || item.publicAttribution || ""}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (status === "All statuses" || item.status === status);
  }), [records, query, status]);

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">{pick("Private account", "ব্যক্তিগত অ্যাকাউন্ট")}</p><h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">{pick("My Submissions", "আমার জমা")}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-archive-muted">{pick("Only records linked to your signed-in account are shown. Administrator notes and publication outcomes remain attached to the record.", "শুধু আপনার সাইন-ইন করা অ্যাকাউন্টের সঙ্গে যুক্ত রেকর্ড দেখানো হয়। অ্যাডমিন নোট ও প্রকাশের ফলাফল রেকর্ডের সঙ্গে থাকে।")}</p></div>
        <Button to="/submit"><Plus className="h-4 w-4" />{pick("New Submission", "নতুন জমা")}</Button>
      </div>

      {blockedCount > 0 && <div className="mt-5 flex gap-3 rounded-2xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4 text-sm text-[#DAB8BE]"><AlertTriangle className="h-5 w-5 shrink-0 text-archive-rose" /><p>{pick(`${blockedCount} record(s) returned by the server were hidden because they were not linked to your account.`, `সার্ভার থেকে পাওয়া ${blockedCount}টি রেকর্ড আপনার অ্যাকাউন্টের সঙ্গে যুক্ত না থাকায় লুকানো হয়েছে।`)}</p></div>}

      <div className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_240px]">
        <label className="relative"><span className="sr-only">Search submissions</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input className="field-control pl-12" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={pick("Search title, type or submission ID", "শিরোনাম, ধরন বা জমার আইডি খুঁজুন")} /></label>
        <select className="field-control" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Pending admin review</option><option>Under review</option><option>Source checked</option><option>Information required</option><option>Approved</option><option>Published</option><option>Rejected</option></select>
      </div>

      {loading && !records.length ? <div className="mt-8 rounded-2xl border border-white/10 p-10 text-center text-sm text-archive-muted">{pick("Loading your submissions…", "আপনার জমাগুলো লোড হচ্ছে…")}</div> : filtered.length ? (
        <div className="mt-6 space-y-4">{filtered.map((item) => {
          const review = extractLatestReview(item);
          const contentTypes = item.contentTypes?.length ? item.contentTypes : [item.type];
          return <article key={getRecordId(item)} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex min-w-0 gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-archive-amber/20 bg-archive-amber/10 text-archive-amber"><Files className="h-5 w-5" /></span><div><h2 className="font-semibold text-white">{item.title}</h2><p className="mt-1 text-xs text-archive-muted">{getRecordId(item)} • {pick("Updated", "হালনাগাদ")} {item.updatedAt || item.createdAt || "—"}</p><div className="mt-3 flex flex-wrap gap-2">{contentTypes.filter(Boolean).map((type) => <span key={type} className="badge border-white/10 bg-white/[0.04] text-[#CFC9C1]">{type}</span>)}</div></div></div><div className="flex flex-wrap gap-2"><StatusBadge status={item.status} /><span className="badge border-archive-teal/25 bg-archive-teal/10 text-[#BCE4DC]"><LockKeyhole className="h-3.5 w-3.5" />{item.visibility || "Private"}</span></div></div>
            {review && <div className={`mt-5 rounded-2xl border p-4 ${review.status === "Rejected" ? "border-archive-rose/20 bg-archive-rose/[0.06]" : review.status === "Information required" ? "border-archive-amber/20 bg-archive-amber/[0.06]" : "border-archive-teal/20 bg-archive-teal/[0.05]"}`}><p className="text-xs font-semibold uppercase tracking-[.13em] text-archive-muted">{pick("Latest administrator update", "সর্বশেষ অ্যাডমিন হালনাগাদ")}</p><p className="mt-2 text-sm leading-7 text-[#DDD7CE]">{review.note || pick("The review status was updated.", "রিভিউয়ের অবস্থা হালনাগাদ করা হয়েছে।")}</p><p className="mt-2 text-xs text-archive-muted">{review.reviewer || pick("Authorised reviewer", "অনুমোদিত রিভিউয়ার")} {review.reviewedAt ? `• ${formatReviewDate(review.reviewedAt, language)}` : ""}</p></div>}
            <div className="mt-5 grid gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-xl border border-white/[0.07] bg-black/10 p-3"><p className="text-[11px] uppercase tracking-[.12em] text-archive-muted">{pick("Submission type", "জমার ধরন")}</p><p className="mt-2 text-sm text-[#DDD7CE]">{item.type || "—"}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/10 p-3"><p className="text-[11px] uppercase tracking-[.12em] text-archive-muted">{pick("Attachments", "সংযুক্তি")}</p><p className="mt-2 text-sm text-[#DDD7CE]">{item.attachmentCount ?? item.attachments?.length ?? "—"}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/10 p-3"><p className="text-[11px] uppercase tracking-[.12em] text-archive-muted">{pick("Public identity", "প্রকাশ্য পরিচয়")}</p><p className="mt-2 flex items-center gap-2 text-sm text-[#DDD7CE]"><EyeOff className="h-4 w-4 text-archive-teal" />{item.identity || item.publicAttribution || pick("Protected", "সুরক্ষিত")}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/10 p-3"><p className="text-[11px] uppercase tracking-[.12em] text-archive-muted">{pick("Publication permission", "প্রকাশের অনুমতি")}</p><p className="mt-2 text-sm leading-5 text-[#DDD7CE]">{item.publicationPermission || pick("Admin approval required", "অ্যাডমিন অনুমোদন প্রয়োজন")}</p></div></div>
          </article>;
        })}</div>
      ) : <div className="mt-8"><EmptyState title={pick("No submissions found", "কোনো জমা পাওয়া যায়নি")} description={pick("Create a protected submission or try another filter.", "একটি সুরক্ষিত জমা তৈরি করুন অথবা অন্য ফিল্টার ব্যবহার করুন।")} actionLabel={pick("Submit Any Record", "যেকোনো রেকর্ড জমা দিন")} actionTo="/submit" /></div>}
    </div>
  );
}
