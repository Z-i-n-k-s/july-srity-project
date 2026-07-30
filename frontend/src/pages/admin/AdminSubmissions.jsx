import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Filter,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  UserRoundCheck,
  X,
  XCircle,
} from "lucide-react";
import { adminApi, unwrap } from "../../lib/api";
import AdminFilePreview from "../../components/admin/AdminFilePreview";
import SubmissionDecisionModal from "../../components/admin/SubmissionDecisionModal";
import SubmissionReviewResultModal from "../../components/admin/SubmissionReviewResultModal";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import {
  extractLatestReview,
  formatReviewDate,
  getSubmissionDisplayId,
  getSubmissionId,
  mergeReviewResponse,
  normalizeSubmission,
  SUBMISSION_ACTIONS,
} from "../../lib/submissionReview";

const statuses = [
  "All",
  "Pending review",
  "Under review",
  "Information required",
  "Source checked",
  "Approved",
  "Rejected",
];

function reviewerName(user) {
  return (
    user?.name ||
    user?.fullName ||
    user?.email ||
    user?.username ||
    "Authenticated reviewer"
  );
}

export default function AdminSubmissions() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionAction, setDecisionAction] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { pick } = useLanguage();
  const { user } = useAuth();

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await adminApi.submissions();
      const data = unwrap(payload);
      if (Array.isArray(data)) setItems(data.map(normalizeSubmission));
      else setItems([]);
    } catch (error) {
      setItems([]);
      console.error("Unable to load submissions:", error);
      toast.error(
        error.message ||
          pick(
            "Unable to load the submission review queue.",
            "জমা পর্যালোচনার তালিকা লোড করা যায়নি।",
          ),
      );
    } finally {
      setLoading(false);
    }
  }, [pick, toast]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const text = `${getSubmissionId(item)} ${item.title || ""} ${item.submittedBy || ""} ${(
          item.contentTypes || []
        ).join(" ")}`.toLowerCase();
        return (
          text.includes(query.toLowerCase()) &&
          (status === "All" || item.status === status)
        );
      }),
    [items, query, status],
  );

  const decide = async (action, noteOverride = decisionNote) => {
    const config = SUBMISSION_ACTIONS[action];
    const submissionId = getSubmissionId(selected);
    const cleanNote = String(noteOverride || "").trim();

    if (!config || !submissionId) {
      toast.error(
        pick(
          "The submission or review action is invalid.",
          "জমা বা রিভিউ কার্যক্রমটি সঠিক নয়।",
        ),
      );
      return;
    }

    if (
      (action === "reject" || action === "request_information") &&
      cleanNote.length < 8
    ) {
      toast.warning(
        pick(
          "Add a clear review note of at least 8 characters.",
          "কমপক্ষে ৮ অক্ষরের একটি পরিষ্কার রিভিউ নোট দিন।",
        ),
      );
      return;
    }

    setSaving(true);

    try {
      const reviewedAt = new Date().toISOString();
      const reviewer = reviewerName(user);
      const response = await adminApi.reviewSubmission(submissionId, {
        action,
        note: cleanNote || undefined,
        privacyConfirmed: true,
        sourceChecked: action === "approve" || action === "source_checked",
      });

      const fallbackReview = {
        id: `${submissionId}:${config.backendStatus}:${reviewedAt}`,
        action,
        status: config.status,
        note: cleanNote,
        reviewer,
        reviewedAt,
      };

      const updated = mergeReviewResponse(
        {
          ...selected,
          status: config.status,
          updatedAt: reviewedAt,
        },
        response,
        fallbackReview,
      );

      const latestReview = extractLatestReview(updated) || fallbackReview;
      const finalUpdated = {
        ...updated,
        status: config.status,
        latestReview: {
          ...latestReview,
          status: config.status,
          note: latestReview.note || cleanNote,
          reviewer: latestReview.reviewer || reviewer,
          reviewedAt: latestReview.reviewedAt || reviewedAt,
        },
      };

      setItems((current) =>
        current.map((item) =>
          getSubmissionId(item) === submissionId ? finalUpdated : item,
        ),
      );
      setSelected(finalUpdated);
      setDecisionAction(null);
      setDecisionNote("");

      const result = {
        id: submissionId,
        title: finalUpdated.title,
        status: config.status,
        note: finalUpdated.latestReview.note,
        reviewer: finalUpdated.latestReview.reviewer,
        reviewedAt: finalUpdated.latestReview.reviewedAt,
      };
      setReviewResult(result);

      window.dispatchEvent(
        new CustomEvent("july-smriti:submission-review-updated", {
          detail: {
            submission: finalUpdated,
            review: finalUpdated.latestReview,
          },
        }),
      );
    } catch (error) {
      toast.error(
        error.message ||
          pick(
            "Unable to save the review decision.",
            "রিভিউ সিদ্ধান্ত সংরক্ষণ করা যায়নি।",
          ),
      );
    } finally {
      setSaving(false);
    }
  };

  const openReview = (item) => {
    setSelected(normalizeSubmission(item));
    setDecisionNote("");
    setDecisionAction(null);
  };

  const closeReview = () => {
    if (saving) return;
    setSelected(null);
    setDecisionNote("");
    setDecisionAction(null);
  };

  const openNoteDecision = (action) => {
    setDecisionAction(action);
  };

  const latestSelectedReview = extractLatestReview(selected);

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow">
              {pick("Protected review queue", "সুরক্ষিত পর্যালোচনা কিউ")}
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold">
              {pick(
                "Evidence, stories and documentary records",
                "তথ্য, গল্প ও ডকুমেন্টারি রেকর্ড",
              )}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">
              {pick(
                "Review original private uploads, confirm source context and apply identity protection before approval. Approval does not publish the original file.",
                "মূল ব্যক্তিগত আপলোড পর্যালোচনা করুন, উৎস যাচাই করুন এবং অনুমোদনের আগে পরিচয় সুরক্ষা প্রয়োগ করুন। অনুমোদন মূল ফাইল প্রকাশ করে না।",
              )}
            </p>
          </div>
          <div className="rounded-xl border border-archive-rose/20 bg-archive-rose/[0.07] px-4 py-3 text-xs leading-5 text-[#E2BEC5]">
            <LockKeyhole className="mr-2 inline h-4 w-4" />
            {pick(
              "Private reviewer access only",
              "কেবল ব্যক্তিগত রিভিউয়ার প্রবেশাধিকার",
            )}
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <span className="sr-only">Search</span>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field-control pl-12"
              placeholder={pick(
                "Search ID, title, contributor or type",
                "আইডি, শিরোনাম, অবদানকারী বা ধরন খুঁজুন",
              )}
            />
          </label>
          <label className="relative">
            <span className="sr-only">Status</span>
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-muted" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="field-control pl-11"
            >
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{pick("Submission", "জমা")}</th>
                <th>{pick("Content", "বিষয়বস্তু")}</th>
                <th>{pick("Privacy", "গোপনীয়তা")}</th>
                <th>{pick("Status", "অবস্থা")}</th>
                <th>{pick("Submitted", "জমার সময়")}</th>
                <th>{pick("Action", "কাজ")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={getSubmissionId(item)}
                  className="transition hover:bg-white/[0.025]"
                >
                  <td>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-archive-muted">
                      {getSubmissionDisplayId(item)} • {item.submittedBy}
                    </p>
                  </td>
                  <td>
                    <div className="flex max-w-xs flex-wrap gap-1.5">
                      {(item.contentTypes || []).map((type) => (
                        <span
                          key={type}
                          className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-[#C6C2BC]"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <p className="text-xs text-[#D8D3CA]">
                      {item.identityPreference}
                    </p>
                    <p className="mt-1 text-[11px] text-archive-muted">
                      {item.risk}
                    </p>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="whitespace-nowrap text-xs text-archive-muted">
                    {item.submittedAt}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => openReview(item)}
                      className="focus-ring inline-flex items-center gap-2 rounded-xl border border-archive-amber/25 bg-archive-amber/10 px-3 py-2 text-xs font-semibold text-archive-amber"
                    >
                      <Eye className="h-4 w-4" />
                      {pick("Review", "পর্যালোচনা")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && !filtered.length && (
            <div className="p-10 text-center text-sm text-archive-muted">
              {pick(
                "No submissions match these filters.",
                "এই ফিল্টারে কোনো জমা পাওয়া যায়নি।",
              )}
            </div>
          )}
          {loading && (
            <div className="p-10 text-center text-sm text-archive-muted">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              {pick("Loading submissions…", "জমাগুলো লোড হচ্ছে…")}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submission-review-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeReview}
            aria-label="Close review"
          />
          <div className="relative max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
              <div>
                <p className="eyebrow">{getSubmissionDisplayId(selected)}</p>
                <h2
                  id="submission-review-title"
                  className="mt-2 font-display text-3xl font-semibold sm:text-4xl"
                >
                  {selected.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="rounded-full border border-archive-rose/20 bg-archive-rose/[0.08] px-2.5 py-1 text-xs text-[#E2BEC5]">
                    {selected.risk}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeReview}
                disabled={saving}
                className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-archive-muted transition hover:text-white disabled:opacity-50"
                aria-label="Close review"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(94vh-104px)] overflow-y-auto">
              <div className="grid gap-7 p-5 sm:p-7 xl:grid-cols-[1fr_390px]">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <h3 className="font-display text-2xl font-semibold">
                      {pick("Record context", "রেকর্ডের প্রেক্ষাপট")}
                    </h3>
                    <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                          {pick("Event date", "ঘটনার তারিখ")}
                        </dt>
                        <dd className="mt-1 text-white">{selected.eventDate}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                          {pick("Location", "স্থান")}
                        </dt>
                        <dd className="mt-1 text-white">{selected.location}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                          {pick("Contributor", "জমাদানকারী")}
                        </dt>
                        <dd className="mt-1 text-white">{selected.submittedBy}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                          {pick("Contact", "যোগাযোগ")}
                        </dt>
                        <dd className="mt-1 text-white">{selected.contact}</dd>
                      </div>
                    </dl>
                    <p className="mt-5 text-sm leading-7 text-[#C6C2BC]">
                      {selected.summary}
                    </p>
                    {selected.storyText && (
                      <div className="mt-5 rounded-xl border border-archive-rose/15 bg-archive-rose/[0.05] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[.13em] text-archive-rose">
                          {pick("Written testimony", "লিখিত সাক্ষ্য")}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#DED8D0]">
                          {selected.storyText}
                        </p>
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-2xl font-semibold">
                        {pick("Private attachments", "ব্যক্তিগত সংযুক্তি")}
                      </h3>
                      <span className="text-xs text-archive-muted">
                        {selected.attachments?.length || 0} {pick("files", "ফাইল")}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {(selected.attachments || []).map((file) => (
                        <AdminFilePreview key={file.id || file._id || file.url} file={file} />
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.055] p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-archive-teal" />
                      <div>
                        <h3 className="font-semibold text-white">
                          {pick(
                            "Required privacy processing",
                            "প্রয়োজনীয় গোপনীয়তা প্রক্রিয়া",
                          )}
                        </h3>
                        <div className="mt-4 grid gap-3 text-sm text-[#B9CFCB] sm:grid-cols-2">
                          {Object.entries(selected.privacy || {}).map(([key, value]) => (
                            <p key={key} className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  value ? "bg-archive-teal" : "bg-white/20"
                                }`}
                              />
                              {key.replace(/([A-Z])/g, " $1")} —{" "}
                              {value
                                ? pick("Required", "প্রয়োজন")
                                : pick("Not requested", "চাওয়া হয়নি")}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="space-y-5 xl:sticky xl:top-0 xl:h-fit">
                  <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <p className="eyebrow">
                      {pick("Publication control", "প্রকাশ নিয়ন্ত্রণ")}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold">
                      {pick("Contributor permission", "জমাদানকারীর অনুমতি")}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-[#C6C2BC]">
                      {selected.publicationPermission}
                    </p>
                    <p className="mt-3 text-sm text-archive-amber">
                      {selected.identityPreference}
                    </p>
                  </section>

                  {latestSelectedReview && (
                    <section className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.055] p-5">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-archive-teal">
                        <UserRoundCheck className="h-4 w-4" />
                        {pick("Latest saved review", "সর্বশেষ সংরক্ষিত রিভিউ")}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <StatusBadge status={latestSelectedReview.status} />
                      </div>
                      {latestSelectedReview.note && (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#D6E4E1]">
                          {latestSelectedReview.note}
                        </p>
                      )}
                      <div className="mt-4 space-y-2 border-t border-white/[0.07] pt-4 text-xs text-archive-muted">
                        <p className="flex items-center gap-2">
                          <UserRoundCheck className="h-3.5 w-3.5" />
                          {latestSelectedReview.reviewer ||
                            pick("Authenticated reviewer", "লগইন করা রিভিউয়ার")}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatReviewDate(latestSelectedReview.reviewedAt, "en") || "—"}
                        </p>
                      </div>
                    </section>
                  )}

                  <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <label className="field-label">
                      {pick(
                        "Review note and decision reason",
                        "রিভিউ নোট ও সিদ্ধান্তের কারণ",
                      )}
                    </label>
                    <textarea
                      value={decisionNote}
                      onChange={(event) =>
                        setDecisionNote(event.target.value.slice(0, 1000))
                      }
                      rows={6}
                      className="field-control resize-none"
                      placeholder={pick(
                        "Record source checks, privacy actions, missing information or rejection reason…",
                        "উৎস যাচাই, গোপনীয়তা পদক্ষেপ, অনুপস্থিত তথ্য বা প্রত্যাখ্যানের কারণ লিখুন…",
                      )}
                    />
                    <div className="mt-2 flex items-start justify-between gap-3 text-xs leading-5 text-archive-muted">
                      <p>
                        {pick(
                          "The backend stores this note with the authenticated reviewer and server timestamp.",
                          "ব্যাকএন্ড এই নোটটি লগইন করা রিভিউয়ার ও সার্ভারের সময়সহ সংরক্ষণ করে।",
                        )}
                      </p>
                      <span className="shrink-0">{decisionNote.length}/1000</span>
                    </div>
                  </section>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => decide("approve")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-3 text-sm font-semibold text-ink-950 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {pick(
                        "Approve protected record",
                        "সুরক্ষিত রেকর্ড অনুমোদন",
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => decide("source_checked")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-teal/25 bg-archive-teal/[0.08] px-4 py-3 text-sm font-semibold text-archive-teal disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileCheck2 className="h-4 w-4" />
                      )}
                      {pick("Mark source checked", "উৎস যাচাই হয়েছে")}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => openNoteDecision("request_information")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-amber/25 bg-archive-amber/[0.08] px-4 py-3 text-sm font-semibold text-archive-amber disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {pick("Request information", "তথ্য চাইুন")}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => openNoteDecision("reject")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-rose/25 bg-archive-rose/[0.08] px-4 py-3 text-sm font-semibold text-archive-rose disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      {pick("Reject with reason", "কারণসহ প্রত্যাখ্যান")}
                    </button>
                  </div>

                  <div className="rounded-xl border border-archive-rose/20 bg-archive-rose/[0.055] p-4 text-xs leading-5 text-[#E2BEC5]">
                    <AlertTriangle className="mr-2 inline h-4 w-4" />
                    {pick(
                      "Never expose contact details, unprocessed faces, private names or original metadata in a public record.",
                      "প্রকাশ্য রেকর্ডে কখনো যোগাযোগের তথ্য, অপরিবর্তিত মুখ, ব্যক্তিগত নাম বা মূল মেটাডাটা প্রকাশ করবেন না।",
                    )}
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-black/10 p-4 text-xs leading-5 text-archive-muted">
                    <MessageSquareText className="mr-2 inline h-4 w-4 text-archive-amber" />
                    {pick(
                      "Information requests and rejection reasons are shown to the contributor in a full review-update modal and inside My Submissions.",
                      "তথ্যের অনুরোধ ও প্রত্যাখ্যানের কারণ ব্যবহারকারীকে পূর্ণ রিভিউ-আপডেট মডাল এবং আমার জমা পাতায় দেখানো হয়।",
                    )}
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}

      <SubmissionDecisionModal
        action={decisionAction}
        note={decisionNote}
        onNoteChange={setDecisionNote}
        onClose={() => !saving && setDecisionAction(null)}
        onConfirm={() => decide(decisionAction, decisionNote)}
        saving={saving}
        pick={pick}
      />

      <SubmissionReviewResultModal
        result={reviewResult}
        onClose={() => setReviewResult(null)}
        pick={pick}
      />
    </div>
  );
}
