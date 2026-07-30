import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Play,
  X,
  ExternalLink,
  Download,
} from "lucide-react";
import ImageWithFallback from "../ui/ImageWithFallback";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminFilePreview({ file, compact = false }) {
  const [open, setOpen] = useState(false);
  const { pick } = useLanguage();
  const rawType = file?.type || file?.mime || "";
  const type =
    rawType === "image" || rawType.startsWith("image/")
      ? "image"
      : rawType === "video" || rawType.startsWith("video/")
        ? "video"
        : "document";

  const icon =
    type === "image" ? (
      <ImageIcon className="h-5 w-5" />
    ) : type === "video" ? (
      <Play className="h-5 w-5" />
    ) : (
      <FileText className="h-5 w-5" />
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`focus-ring group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] text-left transition hover:border-archive-amber/30 hover:bg-white/[0.045] ${compact ? "p-3" : "p-4"}`}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-archive-amber/20 bg-archive-amber/10 text-archive-amber">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {file?.name || "Attachment"}
          </span>
          <span className="mt-1 block text-xs text-archive-muted">
            {type} {file?.size ? `• ${file.size}` : ""}
          </span>
        </span>
        <span className="text-xs font-semibold text-archive-amber opacity-80 group-hover:opacity-100">
          {pick("Preview", "প্রিভিউ")}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Attachment preview"
        >
          <button
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close preview"
          />
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {file?.name}
                </p>
                <p className="mt-1 text-xs text-archive-muted">
                  {file?.mime || type}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-auto bg-black/20 p-5">
              {type === "image" && file?.url ? (
                <ImageWithFallback
                  src={file.url}
                  alt={file.name}
                  className="mx-auto max-h-[65vh] rounded-xl border border-white/10 bg-ink-900"
                  imageClassName="max-h-[65vh] object-contain"
                />
              ) : null}
              {type === "video" && file?.url ? (
                <video
                  src={file.url}
                  controls
                  className="mx-auto max-h-[65vh] w-full rounded-xl bg-black"
                />
              ) : null}
              {((type === "video" && !file?.url) || type === "document") && (
                <div className="mx-auto grid min-h-[340px] max-w-xl place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
                  <div>
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-archive-amber/10 text-archive-amber">
                      {icon}
                    </span>
                    <h3 className="mt-5 font-display text-2xl font-semibold">
                      {file?.name}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-archive-muted">
                      {pick(
                        "The backend should return a protected signed URL for inline preview. The original file must remain private and available only to authorised reviewers.",
                        "ইনলাইন প্রিভিউর জন্য ব্যাকএন্ডকে একটি সুরক্ষিত সাইনড URL দিতে হবে। মূল ফাইল ব্যক্তিগত থাকবে এবং কেবল অনুমোদিত রিভিউয়ার দেখতে পারবেন।",
                      )}
                    </p>
                    {file?.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl border border-archive-amber/25 bg-archive-amber/10 px-4 py-3 text-sm font-semibold text-archive-amber"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {pick("Open protected file", "সুরক্ষিত ফাইল খুলুন")}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-xs text-archive-muted">
              <span>
                {pick("Authorised admin preview", "অনুমোদিত অ্যাডমিন প্রিভিউ")}
              </span>
              {file?.url && (
                <a
                  href={file.url}
                  download
                  className="focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  {pick("Download", "ডাউনলোড")}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}