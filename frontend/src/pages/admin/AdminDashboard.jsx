import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  ArrowRight,
  BellRing,
  CheckCircle2,
  FileCheck2,
  HeartHandshake,
  Loader2,
  Radio,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi, unwrap } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { applySupportRoomOverrides, isSupportRoomStopped } from "../../lib/supportRoomState";

const REFRESH_INTERVAL = 12000;

const toneClass = {
  amber: "border-archive-amber/20 bg-archive-amber/[0.08] text-archive-amber",
  rose: "border-archive-rose/20 bg-archive-rose/[0.08] text-archive-rose",
  teal: "border-archive-teal/20 bg-archive-teal/[0.08] text-archive-teal",
};

const asArray = (payload, keys = []) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

const normalize = (value) => String(value || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
const isPending = (value) => {
  const status = normalize(value);
  return !status || ["pending", "pending_review", "under_review", "open", "new"].includes(status);
};
const needsInformation = (value) => normalize(value).includes("information") || normalize(value).includes("action_required");
const isPublished = (value) => ["published", "approved", "verified", "live", "public"].includes(normalize(value));
const getId = (item) => item?._id || item?.id || item?.reportNumber || item?.submissionId || "";
const getTimeValue = (item) => item?.updatedAt || item?.reviewedAt || item?.submittedAt || item?.createdAt || item?.lastMessageAt || "";
const formatTime = (value) => {
  if (!value) return "";
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) :
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
  }
  const str = String(value).trim();
  // Pre-formatted string (has letters, not ISO) → return as-is
  if (/[A-Za-z]/.test(str) && !/^\d{4}-\d{2}-\d{2}/.test(str)) return str;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return str;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const queueMeta = [
  { key: "submissions", title: "Evidence review", titleBn: "তথ্য পর্যালোচনা", to: "/admin-panel/submissions", icon: FileCheck2, tone: "amber" },
  { key: "support", title: "Active support rooms", titleBn: "সক্রিয় সহায়তা কক্ষ", to: "/admin-panel/support-cases", icon: HeartHandshake, tone: "rose" },
  { key: "missing", title: "Missing-person reports", titleBn: "নিখোঁজ ব্যক্তির রিপোর্ট", to: "/admin-panel/missing-reports", icon: Search, tone: "rose" },
  { key: "archive", title: "Archive publication", titleBn: "আর্কাইভ প্রকাশ", to: "/admin-panel/archive-manager", icon: Archive, tone: "teal" },
];

export default function AdminDashboard() {
  const [snapshot, setSnapshot] = useState({
    dashboard: {}, submissions: [], supportCases: [], missingReports: [], archive: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");
  const { pick } = useLanguage();

  const loadOverview = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    const results = await Promise.allSettled([
      adminApi.dashboard(),
      adminApi.submissions(),
      adminApi.supportCases(),
      adminApi.missingReports(),
      adminApi.archive(),
    ]);

    const failed = results.filter((result) => result.status === "rejected");
    const dashboard = results[0].status === "fulfilled" ? unwrap(results[0].value) || {} : {};
    const submissions = results[1].status === "fulfilled" ? asArray(results[1].value, ["submissions", "items", "records"]) : [];
    const supportCases = results[2].status === "fulfilled" ? applySupportRoomOverrides(asArray(results[2].value, ["supportCases", "cases", "rooms", "items"])) : [];
    const missingReports = results[3].status === "fulfilled" ? asArray(results[3].value, ["reports", "missingReports", "items"]) : [];
    const archive = results[4].status === "fulfilled" ? asArray(results[4].value, ["archive", "records", "items"]) : [];

    setSnapshot({ dashboard, submissions, supportCases, missingReports, archive });
    setLastUpdated(new Date());
    setError(failed.length ? String(failed.length) : "");
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let active = true;
    if (active) void loadOverview();
    const intervalId = window.setInterval(() => {
      if (active && document.visibilityState === "visible") void loadOverview({ silent: true });
    }, REFRESH_INTERVAL);
    const refreshVisible = () => document.visibilityState === "visible" && void loadOverview({ silent: true });
    document.addEventListener("visibilitychange", refreshVisible);
    window.addEventListener("focus", refreshVisible);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshVisible);
      window.removeEventListener("focus", refreshVisible);
    };
  }, [loadOverview]);

  const derived = useMemo(() => {
    const pendingSubmissions = snapshot.submissions.filter((item) => isPending(item.status) || needsInformation(item.status));
    const activeSupport = snapshot.supportCases.filter((item) => !isSupportRoomStopped(item) && !["resolved", "completed"].includes(normalize(item.status)));
    const pendingMissing = snapshot.missingReports.filter((item) => isPending(item.status) || needsInformation(item.status));
    const unpublishedArchive = snapshot.archive.filter((item) => !isPublished(item.publicationStatus || item.status) || item.enabled === false || item.isEnabled === false);

    const notifications = [
      ...pendingSubmissions.map((item) => ({
        id: `submission-${getId(item)}`,
        type: "Submission",
        typeBn: "জমা",
        title: item.title || "Evidence submission needs review",
        titleBn: item.titleBn || "একটি তথ্য জমা পর্যালোচনা প্রয়োজন",
        meta: `${getId(item)}${item.submittedBy ? ` • ${item.submittedBy}` : ""}`,
        time: getTimeValue(item),
        to: "/admin-panel/submissions",
        tone: needsInformation(item.status) ? "rose" : "amber",
      })),
      ...activeSupport.map((item) => ({
        id: `support-${getId(item)}`,
        type: "Support",
        typeBn: "সহায়তা",
        title: item.title || "Active support room",
        titleBn: item.titleBn || "সক্রিয় সহায়তা কক্ষ",
        meta: `${item.requester || "Requester"}${item.priority ? ` • ${item.priority}` : ""}`,
        time: getTimeValue(item),
        to: "/admin-panel/support-cases",
        tone: normalize(item.priority) === "urgent" ? "rose" : "teal",
      })),
      ...pendingMissing.map((item) => ({
        id: `missing-${getId(item)}`,
        type: "Missing report",
        typeBn: "নিখোঁজ রিপোর্ট",
        title: item.name || item.person?.fullName || "Missing-person report needs action",
        titleBn: item.nameBn || item.name || "নিখোঁজ ব্যক্তির রিপোর্টে পদক্ষেপ প্রয়োজন",
        meta: `${item.reportNumber || item.id || ""}${item.lastSeenLocation ? ` • ${item.lastSeenLocation}` : ""}`,
        time: getTimeValue(item),
        to: "/admin-panel/missing-reports",
        tone: "rose",
      })),
      ...unpublishedArchive.slice(0, 8).map((item) => ({
        id: `archive-${getId(item)}`,
        type: "Archive",
        typeBn: "আর্কাইভ",
        title: item.title || "Archive record awaits publication control",
        titleBn: item.titleBn || item.title || "আর্কাইভ রেকর্ড প্রকাশ নিয়ন্ত্রণের অপেক্ষায়",
        meta: item.status || item.publicationStatus || "Not public",
        time: getTimeValue(item),
        to: "/admin-panel/archive-manager",
        tone: "amber",
      })),
    ].sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

    return {
      counts: {
        submissions: pendingSubmissions.length,
        support: activeSupport.length,
        missing: pendingMissing.length,
        archive: unpublishedArchive.length,
      },
      notifications: notifications.slice(0, 12),
      activeTotal: pendingSubmissions.length + activeSupport.length + pendingMissing.length + unpublishedArchive.length,
    };
  }, [snapshot]);

  const backendStats = Array.isArray(snapshot.dashboard?.stats) ? snapshot.dashboard.stats : [];
  const totalUsers = backendStats.find((item) => /user/i.test(item.key || item.label || ""))?.value;
  const stats = [
    { key: "attention", value: derived.activeTotal, label: "Actions requiring attention", labelBn: "যে কাজে পদক্ষেপ প্রয়োজন", icon: BellRing, tone: "rose" },
    { key: "support", value: derived.counts.support, label: "Active support rooms", labelBn: "সক্রিয় সহায়তা কক্ষ", icon: HeartHandshake, tone: "teal" },
    { key: "archive", value: snapshot.archive.filter((item) => isPublished(item.publicationStatus || item.status) && item.enabled !== false).length, label: "Public archive records", labelBn: "প্রকাশ্য আর্কাইভ রেকর্ড", icon: Archive, tone: "amber" },
    { key: "users", value: totalUsers ?? snapshot.dashboard?.totalUsers ?? 0, label: "Registered users", labelBn: "নিবন্ধিত ব্যবহারকারী", icon: Users, tone: "teal" },
  ];

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-archive-amber/[0.09] via-white/[0.025] to-archive-rose/[0.07] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow">{pick("Administrator overview", "অ্যাডমিন ওভারভিউ")}</p>
              <span className="inline-flex items-center gap-2 rounded-full border border-archive-teal/25 bg-archive-teal/[0.08] px-3 py-1 text-xs font-semibold text-archive-teal">
                {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
                {pick("Live queue monitoring", "লাইভ কিউ পর্যবেক্ষণ")}
              </span>
            </div>
            <h2 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[1.03] sm:text-5xl">
              {pick("See what changed, what is active and what needs action now.", "কী পরিবর্তিত হয়েছে, কী সক্রিয় এবং এখন কোন কাজে পদক্ষেপ দরকার—এক জায়গায় দেখুন।")}
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#C6C2BC] sm:text-base">
              {pick("The overview refreshes submissions, support rooms, missing reports and publication controls every 12 seconds while this tab is active.", "এই ট্যাব সক্রিয় থাকলে ওভারভিউ প্রতি ১২ সেকেন্ডে জমা, সহায়তা কক্ষ, নিখোঁজ রিপোর্ট এবং প্রকাশ নিয়ন্ত্রণ হালনাগাদ করে।")}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-archive-muted">
            <p className="font-semibold text-white">{pick("Last synchronized", "সর্বশেষ সমন্বয়")}</p>
            <p className="mt-1">{lastUpdated ? lastUpdated.toLocaleString() : pick("Waiting for data…", "ডেটার অপেক্ষায়…")}</p>
            {error && <p className="mt-2 text-archive-rose">{pick(`${error} overview source(s) could not be refreshed.`, `${error}টি ওভারভিউ উৎস হালনাগাদ করা যায়নি।`)}</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ key, value, label, labelBn, icon: Icon, tone }) => (
          <article key={key} className="admin-card">
            <span className={`grid h-11 w-11 place-items-center rounded-xl border ${toneClass[tone]}`}><Icon className="h-5 w-5" /></span>
            <p className="mt-5 text-3xl font-bold text-white">{loading ? "—" : Number(value || 0).toLocaleString()}</p>
            <p className="mt-2 text-sm leading-6 text-archive-muted">{pick(label, labelBn)}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="admin-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="eyebrow">{pick("Live notifications", "লাইভ নোটিফিকেশন")}</p><h2 className="mt-2 font-display text-3xl font-semibold">{pick("Latest actionable updates", "সর্বশেষ করণীয় হালনাগাদ")}</h2></div>
            <span className="rounded-full border border-archive-rose/25 bg-archive-rose/[0.08] px-3 py-1 text-xs font-semibold text-archive-rose">{derived.notifications.length} {pick("visible", "দৃশ্যমান")}</span>
          </div>
          <div className="mt-5 max-h-[570px] space-y-3 overflow-y-auto pr-1">
            {derived.notifications.map((item) => (
              <Link key={item.id} to={item.to} className="focus-ring group flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-archive-amber/25 hover:bg-white/[0.04]">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone === "rose" ? "bg-archive-rose" : item.tone === "teal" ? "bg-archive-teal" : "bg-archive-amber"}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] font-semibold uppercase tracking-[.14em] text-archive-muted">{pick(item.type, item.typeBn)}</span><span className="text-[11px] text-archive-muted">{formatTime(item.time)}</span></span>
                  <span className="mt-1 block font-semibold text-white">{pick(item.title, item.titleBn)}</span>
                  <span className="mt-1 block truncate text-xs text-archive-muted">{item.meta}</span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-archive-amber transition group-hover:translate-x-1" />
              </Link>
            ))}
            {!loading && !derived.notifications.length && (
              <div className="rounded-xl border border-dashed border-white/10 p-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-archive-teal" /><p className="mt-3 text-sm text-archive-muted">{pick("No active notification requires action right now.", "এই মুহূর্তে কোনো সক্রিয় নোটিফিকেশনে পদক্ষেপ প্রয়োজন নেই।")}</p></div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <section className="admin-card">
            <p className="eyebrow">{pick("Active work queues", "সক্রিয় কাজের কিউ")}</p>
            <div className="mt-4 space-y-3">
              {queueMeta.map(({ key, title, titleBn, to, icon: Icon, tone }) => (
                <Link key={key} to={to} className="focus-ring group flex items-center gap-3 rounded-xl border border-white/[0.08] p-4 transition hover:border-archive-amber/25">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl border ${toneClass[tone]}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold text-white">{pick(title, titleBn)}</span><span className="mt-1 block text-xs text-archive-muted">{derived.counts[key]} {pick("currently active", "বর্তমানে সক্রিয়")}</span></span>
                  <span className="text-2xl font-bold text-white">{derived.counts[key]}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="admin-card">
            <div className="flex items-center gap-3"><Activity className="h-5 w-5 text-archive-teal" /><h3 className="font-display text-2xl font-semibold">{pick("Operational checks", "কার্যক্রম যাচাই")}</h3></div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[#C6C2BC]">
              {[pick("Open urgent support rooms before lower-priority queues.", "কম অগ্রাধিকারের কিউয়ের আগে জরুরি সহায়তা কক্ষ খুলুন।"), pick("Review reporter consent and private contact details before publishing a missing report.", "নিখোঁজ রিপোর্ট প্রকাশের আগে রিপোর্টারের সম্মতি ও ব্যক্তিগত যোগাযোগ যাচাই করুন।"), pick("Only enabled, approved records may appear in the public archive.", "কেবল সক্রিয় ও অনুমোদিত রেকর্ড প্রকাশ্য আর্কাইভে দেখা যাবে।")].map((text) => <p key={text} className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-archive-teal" />{text}</p>)}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
