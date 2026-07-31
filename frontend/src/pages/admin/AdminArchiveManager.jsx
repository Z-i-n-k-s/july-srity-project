import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Eye,
  Maximize2,
  Pause,
  Play,
  Search,
  ShieldCheck,
  UploadCloud,
  Volume2,
  VolumeX,
} from "lucide-react";
import { adminApi, unwrap } from "../../lib/api";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

// ---------------------------------------------------------------------------
// Cloudinary helpers (same as public archive)
// ---------------------------------------------------------------------------

/** Injects so_0 transform + .jpg → static poster frame from any CL video URL */
function cloudinaryPoster(url) {
  if (!url) return undefined;
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/.+?\/video\/upload\/)(.+)$/);
  if (!m) return undefined;
  return `${m[1]}so_0/${m[2].replace(/\.[^.]+$/, "")}.jpg`;
}

/** Rewrites extension to .mp4 for on-the-fly Cloudinary transcoding */
function cloudinaryMp4(url) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace(/\.[^./?#]+(\?.*)?$/, ".mp4$1");
}

function isVideoItem(item) {
  return item?.type === "Video";
}

// ---------------------------------------------------------------------------
// VideoCardThumbnail — static poster + play badge for list cards
// ---------------------------------------------------------------------------

function VideoCardThumbnail({ item }) {
  const poster = cloudinaryPoster(item.image);
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-black/50">
      {poster && imgOk ? (
        <img
          src={poster}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          loading="lazy"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="h-full w-full bg-black/60" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-archive-amber/90 shadow-lg ring-4 ring-archive-amber/20">
          <Play className="h-5 w-5 fill-black text-black" />
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VideoPlayer — full player used inside the modal
// ---------------------------------------------------------------------------

function VideoPlayer({ item }) {
  const rawUrl = item.videoUrl || item.video || item.image;
  const src = cloudinaryMp4(rawUrl);
  const poster = cloudinaryPoster(rawUrl);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimer = useRef(null);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(false);

  function fmt(s) {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  function scheduleHide() {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2000);
  }

  function revealControls() {
    setShowControls(true);
    if (playing) scheduleHide();
  }

  function handlePlay() {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    v.play().then(() => { setPlaying(true); scheduleHide(); }).catch(() => setError(true));
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { handlePlay(); }
    else { v.pause(); setPlaying(false); clearTimeout(hideTimer.current); setShowControls(true); }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function seek(e) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
    revealControls();
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.();
  }

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="absolute inset-0 h-full w-full object-contain"
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          setCurrentTime(v.currentTime);
          setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => { setPlaying(false); setShowControls(true); }}
        onError={() => setError(true)}
        playsInline
        preload="metadata"
      />

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-sm text-archive-muted">
          <span>Unable to load video.</span>
          <a href={rawUrl} target="_blank" rel="noopener noreferrer" className="text-archive-amber underline">
            Open original file ↗
          </a>
        </div>
      )}

      {!started && !error && (
        <button type="button" aria-label="Play video" onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-archive-amber/90 shadow-2xl ring-4 ring-archive-amber/20 transition hover:scale-110 hover:bg-archive-amber">
            <Play className="h-7 w-7 fill-black text-black" />
          </span>
        </button>
      )}

      {started && !error && (
        <div className={[
          "absolute inset-x-0 bottom-0 px-4 pb-3 pt-10",
          "bg-gradient-to-t from-black/80 to-transparent",
          "transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}>
          {/* Seek bar */}
          <div
            role="slider" aria-label="Seek" tabIndex={0}
            aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}
            className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/20"
            onClick={seek}
            onKeyDown={(e) => {
              const v = videoRef.current;
              if (!v) return;
              if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration, v.currentTime + 5);
              if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
            }}
          >
            <div className="absolute left-0 top-0 h-full rounded-full bg-archive-amber" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-archive-amber shadow" style={{ left: `${progress}%` }} />
          </div>
          {/* Buttons */}
          <div className="mt-2.5 flex items-center gap-2">
            <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-archive-amber hover:text-black">
              {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
            <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-archive-amber hover:text-black">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <span className="ml-1 text-xs tabular-nums text-white/70">{fmt(currentTime)} / {fmt(duration)}</span>
            <button type="button" aria-label="Fullscreen" onClick={toggleFullscreen}
              className="ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-archive-amber hover:text-black">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminArchiveManager() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [publishNote, setPublishNote] = useState("");
  const toast = useToast();
  const { pick } = useLanguage();

  // AFTER
useEffect(() => {
  let active = true;

  Promise.all([adminApi.archive(), adminApi.submissions()])
    .then(([archivePayload, subsPayload]) => {
      if (!active) return;

      const archiveData = unwrap(archivePayload);
      const subsData = unwrap(subsPayload);

      // Build rejected title set from submissions
      const rejectedTitles = new Set(
        (Array.isArray(subsData) ? subsData : [])
          .filter((s) => s.status === 'Rejected')
          .map((s) => (s.title || '').toLowerCase().trim()),
      );

      if (Array.isArray(archiveData)) {
        setItems(
          archiveData.filter(
            (item) => !rejectedTitles.has((item.title || '').toLowerCase().trim()),
          ),
        );
      }
    })
    .catch((error) => {
      if (active) {
        setItems([]);
        toast.error(
          error.message ||
            pick('Unable to load archive records.', 'আর্কাইভ রেকর্ড লোড করা যায়নি।'),
        );
      }
    });

  return () => { active = false; };
}, []);
 // Remove archive item when submission is rejected on submissions page
useEffect(() => {
  const handleReviewUpdate = ({ detail }) => {
    const sub = detail?.submission;
    if (!sub || sub.status !== 'Rejected') return;

    const norm = (t) => (t || '').toLowerCase().trim();
    const subSlug = norm(sub.title)
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    setItems((current) =>
      current.filter(
        (item) =>
          item.slug !== subSlug &&
          norm(item.title) !== norm(sub.title),
      ),
    );

    // Close modal if showing the removed item
    setSelected((current) =>
      current &&
      (current.slug === subSlug || norm(current.title) === norm(sub.title))
        ? null
        : current,
    );
  };

  window.addEventListener('july-smriti:submission-review-updated', handleReviewUpdate);
  return () =>
    window.removeEventListener('july-smriti:submission-review-updated', handleReviewUpdate);
}, []);
  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${item.id} ${item.title} ${item.type} ${item.source} ${item.status}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [items, query],
  );

  const publish = async (item, nextStatus = "Published") => {
    try {
      await adminApi.publishArchive(item.id, {
        status: nextStatus,
        note: publishNote,
        publishOriginal: false,
        privacyProcessedCopyOnly: true,
      });
      setItems((current) =>
        current.map((record) =>
          record.id === item.id
            ? { ...record, status: nextStatus, updatedAt: "Just now" }
            : record,
        ),
      );
      setSelected((current) => (current ? { ...current, status: nextStatus } : current));
      setPublishNote("");
      toast.success(
        pick(
          `Archive record marked ${nextStatus}.`,
          `আর্কাইভ রেকর্ডটি ${nextStatus} হিসেবে চিহ্নিত হয়েছে।`,
        ),
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">{pick("Public record control", "প্রকাশ্য রেকর্ড নিয়ন্ত্রণ")}</p>
            <h2 className="mt-2 font-display text-4xl font-semibold">
              {pick("Archive publication and corrections", "আর্কাইভ প্রকাশ ও সংশোধন")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">
              {pick(
                "Manage only approved public derivatives. Keep original uploads, source contacts and sensitive metadata outside the public archive.",
                "কেবল অনুমোদিত প্রকাশ্য সংস্করণ পরিচালনা করুন। মূল আপলোড, উৎসের যোগাযোগ ও সংবেদনশীল মেটাডাটা প্রকাশ্য আর্কাইভের বাইরে রাখুন।",
              )}
            </p>
          </div>
          <div className="rounded-xl border border-archive-teal/20 bg-archive-teal/[0.07] p-4 text-xs leading-5 text-[#B9CFCB]">
            <ShieldCheck className="mr-2 inline h-4 w-4" />
            {pick("Publication audit trail enabled", "প্রকাশ অডিট ট্রেইল সক্রিয়")}
          </div>
        </div>
      </section>

      <section className="admin-card">
        <label className="relative block max-w-xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field-control pl-12"
            placeholder={pick(
              "Search record ID, title, type, source or status",
              "রেকর্ড আইডি, শিরোনাম, ধরন, উৎস বা অবস্থা খুঁজুন",
            )}
          />
        </label>
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition hover:border-archive-amber/25"
            >
              {/* ── Card media ── */}
              {isVideoItem(item) ? (
                <VideoCardThumbnail item={item} />
              ) : (
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="aspect-[16/10]"
                  imageClassName="transition duration-500 group-hover:scale-[1.025]"
                />
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.13em] text-archive-amber">{item.id}</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-4 space-y-2 text-xs text-archive-muted">
                  <p>{item.type} • {item.verification}</p>
                  <p>{pick("Source", "উৎস")}: {item.source}</p>
                  <p>{pick("Updated", "হালনাগাদ")}: {item.updatedAt}</p>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setSelected(item)}
                    className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-[#D8D3CA] hover:bg-white/5"
                  >
                    <Eye className="h-4 w-4" />
                    {pick("Review public record", "প্রকাশ্য রেকর্ড দেখুন")}
                  </button>
                  {item.status !== "Published" && (
                    <button
                      onClick={() => publish(item)}
                      className="focus-ring grid h-10 w-10 place-items-center rounded-xl bg-archive-amber text-ink-950"
                      aria-label="Publish"
                    >
                      <UploadCloud className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            aria-label="Close"
          />
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-ink-800 p-5 shadow-2xl sm:p-7">
            <div className="grid gap-7 lg:grid-cols-[1.05fr_.95fr]">

              {/* ── Modal media ── */}
              {isVideoItem(selected) ? (
                <VideoPlayer item={selected} />
              ) : (
                <ImageWithFallback
                  src={selected.image}
                  alt={selected.title}
                  className="aspect-[16/11] rounded-2xl border border-white/10"
                />
              )}

              <div>
                <p className="eyebrow">{selected.id}</p>
                <h2 className="mt-2 font-display text-4xl font-semibold">{selected.title}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="rounded-full border border-archive-teal/20 bg-archive-teal/10 px-2.5 py-1 text-xs text-archive-teal">
                    {selected.verification}
                  </span>
                </div>
                <p className="mt-5 text-sm leading-7 text-[#C6C2BC]">
                  {pick(
                    "This preview represents the redacted public derivative. Confirm the title, date, location, source label, consent-safe attribution and correction history before publishing.",
                    "এই প্রিভিউ সম্পাদিত প্রকাশ্য সংস্করণ। প্রকাশের আগে শিরোনাম, তারিখ, স্থান, উৎসের লেবেল, সম্মতিপূর্ণ পরিচয় এবং সংশোধনের ইতিহাস নিশ্চিত করুন।",
                  )}
                </p>
                <label className="mt-5 block">
                  <span className="field-label">{pick("Publication or correction note", "প্রকাশ বা সংশোধন নোট")}</span>
                  <textarea
                    value={publishNote}
                    onChange={(e) => setPublishNote(e.target.value)}
                    rows={5}
                    className="field-control resize-none"
                    placeholder={pick(
                      "Record what was redacted, corrected or approved…",
                      "কী সম্পাদিত, সংশোধিত বা অনুমোদিত হয়েছে লিখুন…",
                    )}
                  />
                </label>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => publish(selected, "Published")}
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-3 text-sm font-semibold text-ink-950"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {pick("Publish approved version", "অনুমোদিত সংস্করণ প্রকাশ")}
                  </button>
                  <button
                    onClick={() => publish(selected, "Unpublished")}
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-rose/25 bg-archive-rose/10 px-4 py-3 text-sm font-semibold text-archive-rose"
                  >
                    <Archive className="h-4 w-4" />
                    {pick("Unpublish for review", "পর্যালোচনার জন্য সরান")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}