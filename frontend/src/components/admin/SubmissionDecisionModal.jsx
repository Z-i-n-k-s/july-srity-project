import { useEffect } from "react";
import { AlertTriangle, Loader2, Send, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SUBMISSION_ACTIONS } from "../../lib/submissionReview";

const MIN_NOTE_LENGTH = 8;
const MAX_NOTE_LENGTH = 1000;

export default function SubmissionDecisionModal({
  action,
  note,
  onNoteChange,
  onClose,
  onConfirm,
  saving,
  pick,
}) {
  const open = Boolean(action);
  const isReject = action === "reject";
  const config = action ? SUBMISSION_ACTIONS[action] : null;
  const cleanLength = note.trim().length;
  const canSubmit = cleanLength >= MIN_NOTE_LENGTH && !saving;
  const Icon = isReject ? XCircle : Send;

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, saving, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[170] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="submission-decision-title"
        >
          <button
            type="button"
            aria-label="Close decision dialog"
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={saving ? undefined : onClose}
          />

          <motion.section
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full max-w-xl overflow-hidden rounded-[28px] border bg-[#111720] shadow-2xl ${
              isReject ? "border-archive-rose/30" : "border-archive-amber/30"
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 ${
                isReject
                  ? "bg-gradient-to-r from-archive-rose to-red-400"
                  : "bg-gradient-to-r from-archive-amber to-archive-copper"
              }`}
            />

            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${
                    isReject
                      ? "border-archive-rose/30 bg-archive-rose/10 text-archive-rose"
                      : "border-archive-amber/30 bg-archive-amber/10 text-archive-amber"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="eyebrow">
                    {pick("Review decision", "রিভিউ সিদ্ধান্ত")}
                  </p>
                  <h2
                    id="submission-decision-title"
                    className="mt-2 font-display text-3xl font-semibold text-white"
                  >
                    {pick(config?.title || "Review action", config?.titleBn || "রিভিউ কার্যক্রম")}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-archive-muted">
                    {isReject
                      ? pick(
                          "Explain the rejection clearly. The contributor will receive this reason with the updated status.",
                          "প্রত্যাখ্যানের কারণ পরিষ্কারভাবে লিখুন। অবস্থা হালনাগাদ হওয়ার সঙ্গে জমাদানকারী এই কারণটি দেখতে পাবেন।",
                        )
                      : pick(
                          "Describe exactly what is missing and what the contributor should provide next.",
                          "ঠিক কোন তথ্য অনুপস্থিত এবং জমাদানকারীকে পরবর্তী ধাপে কী দিতে হবে তা লিখুন।",
                        )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-archive-muted transition hover:text-white disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <label className="mt-6 block">
                <span className="field-label">
                  {isReject
                    ? pick("Rejection reason", "প্রত্যাখ্যানের কারণ")
                    : pick("Information request", "তথ্যের অনুরোধ")}
                </span>
                <textarea
                  autoFocus
                  value={note}
                  onChange={(event) => onNoteChange(event.target.value.slice(0, MAX_NOTE_LENGTH))}
                  rows={7}
                  className="field-control mt-2 resize-none"
                  placeholder={
                    isReject
                      ? pick(
                          "Example: The submitted material cannot be verified because…",
                          "উদাহরণ: জমা দেওয়া উপাদানটি যাচাই করা যাচ্ছে না কারণ…",
                        )
                      : pick(
                          "Example: Please provide the original capture date and a source contact…",
                          "উদাহরণ: অনুগ্রহ করে মূল ধারণের তারিখ ও উৎসের যোগাযোগ দিন…",
                        )
                  }
                />
              </label>

              <div className="mt-2 flex items-start justify-between gap-4 text-xs">
                <p className={cleanLength > 0 && cleanLength < MIN_NOTE_LENGTH ? "text-archive-rose" : "text-archive-muted"}>
                  {pick(
                    `At least ${MIN_NOTE_LENGTH} characters are required.`,
                    `কমপক্ষে ${MIN_NOTE_LENGTH} অক্ষর প্রয়োজন।`,
                  )}
                </p>
                <span className="shrink-0 text-archive-muted">
                  {note.length}/{MAX_NOTE_LENGTH}
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-archive-amber" />
                  <p className="text-xs leading-5 text-[#CFC9C1]">
                    {pick(
                      "The backend must save this note with the authenticated reviewer identity and a server-generated timestamp. Do not trust reviewer identity or time supplied by the browser.",
                      "ব্যাকএন্ডে এই নোটটি লগইন করা রিভিউয়ারের পরিচয় এবং সার্ভার-তৈরি সময়সহ সংরক্ষণ করতে হবে। ব্রাউজার থেকে পাঠানো রিভিউয়ার পরিচয় বা সময় বিশ্বাস করবেন না।",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={onClose}
                  className="focus-ring rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-archive-muted transition hover:border-white/20 hover:text-white disabled:opacity-50"
                >
                  {pick("Cancel", "বাতিল")}
                </button>
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={onConfirm}
                  className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    isReject
                      ? "bg-archive-rose text-white hover:brightness-110"
                      : "bg-gradient-to-r from-archive-amber to-archive-copper text-ink-950 hover:brightness-110"
                  }`}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                  {saving
                    ? pick("Saving decision…", "সিদ্ধান্ত সংরক্ষণ হচ্ছে…")
                    : pick(config?.title || "Confirm", config?.titleBn || "নিশ্চিত করুন")}
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
