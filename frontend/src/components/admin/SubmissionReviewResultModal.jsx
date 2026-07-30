import { useEffect } from "react";
import { CheckCircle2, Clock3, MessageSquareText, UserRoundCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import StatusBadge from "../ui/StatusBadge";
import { formatReviewDate } from "../../lib/submissionReview";

export default function SubmissionReviewResultModal({ result, onClose, pick }) {
  const open = Boolean(result);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[180] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-result-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={onClose}
            aria-label="Close update"
          />
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-archive-teal/30 bg-[#111820] shadow-2xl"
          >
            <div className="h-1 bg-gradient-to-r from-archive-teal via-archive-amber to-archive-copper" />
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-archive-teal/30 bg-archive-teal/10 text-archive-teal">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow">{pick("Review saved", "রিভিউ সংরক্ষিত")}</p>
                  <h2 id="review-result-title" className="mt-2 font-display text-3xl font-semibold text-white">
                    {pick("Submission updated successfully", "জমাটি সফলভাবে হালনাগাদ হয়েছে")}
                  </h2>
                </div>
                <button type="button" onClick={onClose} className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-archive-muted hover:text-white" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{result.title}</p>
                    <p className="mt-1 text-xs text-archive-muted">{result.id}</p>
                  </div>
                  <StatusBadge status={result.status} />
                </div>

                {result.note && (
                  <div className="mt-5 rounded-xl border border-archive-amber/15 bg-archive-amber/[0.05] p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-archive-amber">
                      <MessageSquareText className="h-4 w-4" />
                      {pick("Message for contributor", "জমাদানকারীর জন্য বার্তা")}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#DDD7CE]">{result.note}</p>
                  </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
                    <p className="flex items-center gap-2 text-[11px] uppercase tracking-[.12em] text-archive-muted">
                      <UserRoundCheck className="h-3.5 w-3.5" />
                      {pick("Reviewer", "রিভিউয়ার")}
                    </p>
                    <p className="mt-2 text-sm text-white">{result.reviewer || pick("Authenticated reviewer", "লগইন করা রিভিউয়ার")}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
                    <p className="flex items-center gap-2 text-[11px] uppercase tracking-[.12em] text-archive-muted">
                      <Clock3 className="h-3.5 w-3.5" />
                      {pick("Saved at", "সংরক্ষণের সময়")}
                    </p>
                    <p className="mt-2 text-sm text-white">{formatReviewDate(result.reviewedAt, "en") || "—"}</p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-archive-muted">
                {pick(
                  "The contributor view will receive this status and note through the live-update channel, with periodic API refresh as a fallback.",
                  "লাইভ-আপডেট চ্যানেলের মাধ্যমে ব্যবহারকারীর পাতায় এই অবস্থা ও নোট পৌঁছাবে; বিকল্প হিসেবে নিয়মিত API রিফ্রেশও থাকবে।",
                )}
              </p>

              <button type="button" onClick={onClose} className="focus-ring mt-6 w-full rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-5 py-3 text-sm font-semibold text-ink-950 hover:brightness-110">
                {pick("Done", "সম্পন্ন")}
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
