import { useEffect, useState } from "react";
import {
  Eye,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  File as FileIcon,
  X,
} from "lucide-react";

export const formatFileSize = (size = 0) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.ceil(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const getEvidenceFileKind = (file) => {
  const type = file?.type || "";
  const name = file?.name || "";

  if (type.startsWith("image/")) return "Photograph";
  if (type.startsWith("video/")) return "Video";
  if (type.startsWith("audio/")) return "Audio";
  if (type === "application/pdf" || /\.(pdf|doc|docx|odt|rtf|txt)$/i.test(name)) return "Document";
  return "Other";
};

function AttachmentPreview({ file, index, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const kind = getEvidenceFileKind(file);

  useEffect(() => {
    const canPreview = file && (
      file.type?.startsWith("image/")
      || file.type?.startsWith("video/")
      || file.type?.startsWith("audio/")
      || file.type === "application/pdf"
    );

    if (!canPreview) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const Icon = kind === "Photograph"
    ? FileImage
    : kind === "Video"
      ? FileVideo
      : kind === "Audio"
        ? FileAudio
        : kind === "Document"
          ? FileText
          : FileIcon;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
      <div className="relative min-h-40 bg-black/25">
        {kind === "Photograph" && previewUrl && (
          <img
            src={previewUrl}
            alt={`Selected evidence preview: ${file.name}`}
            className="h-52 w-full object-contain"
          />
        )}

        {kind === "Video" && previewUrl && (
          <video
            src={previewUrl}
            controls
            preload="metadata"
            className="h-52 w-full bg-black object-contain"
            aria-label={`Selected video preview: ${file.name}`}
          />
        )}

        {kind === "Audio" && previewUrl && (
          <div className="flex h-52 flex-col items-center justify-center gap-5 p-5">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-archive-amber/20 bg-archive-amber/10 text-archive-amber">
              <FileAudio className="h-7 w-7" />
            </span>
            <audio src={previewUrl} controls className="w-full" aria-label={`Selected audio preview: ${file.name}`} />
          </div>
        )}

        {kind === "Document" && file.type === "application/pdf" && previewUrl && (
          <div className="relative h-52 overflow-hidden bg-white">
            <iframe
              src={`${previewUrl}#toolbar=0&navpanes=0`}
              title={`PDF preview: ${file.name}`}
              className="h-full w-full border-0"
            />
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/80 px-3 py-2 text-xs font-semibold text-white"
            >
              <Eye className="h-3.5 w-3.5" /> Open PDF
            </a>
          </div>
        )}

        {((kind === "Document" && file.type !== "application/pdf") || kind === "Other") && (
          <div className="flex h-52 flex-col items-center justify-center gap-4 p-5 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-archive-amber/20 bg-archive-amber/10 text-archive-amber">
              <Icon className="h-7 w-7" />
            </span>
            <p className="max-w-[16rem] text-sm leading-6 text-archive-muted">
              This file will be sent for private administrator review. Browser preview is not available for this format.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="focus-ring absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/75 text-white transition hover:bg-black"
          aria-label={`Remove ${file.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-archive-amber/20 bg-archive-amber/10 text-archive-amber">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#E9E4DD]">{file.name}</p>
          <p className="mt-1 text-xs text-archive-muted">{kind} • {formatFileSize(file.size)}</p>
        </div>
      </div>
    </article>
  );
}

export default function EvidenceAttachmentGrid({ files, onRemove }) {
  if (!files.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {files.map((file, index) => (
        <AttachmentPreview
          key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
          file={file}
          index={index}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
