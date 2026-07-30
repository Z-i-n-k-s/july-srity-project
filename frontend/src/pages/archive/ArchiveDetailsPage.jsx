import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  FileCheck2,
  Loader2,
  MapPin,
  Pause,
  Play,
  ShieldCheck,
  UserRound,
  Volume2,
  VolumeX,
  Maximize2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import StatusBadge from "../../components/ui/StatusBadge";
import { featuredArchive } from "../../data/landingData";
import { publicApi, unwrap } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

// ---------------------------------------------------------------------------
// Cloudinary helpers
// ---------------------------------------------------------------------------

/**
 * Converts any Cloudinary video URL (including .mkv) to a browser-playable
 * .mp4 URL by rewriting the file extension.
 * Cloudinary transcodes on-the-fly when a supported extension is requested.
 *
 * e.g.  .../video/upload/v123/.../file.mkv  →  .../video/upload/v123/.../file.mp4
 */
function cloudinaryMp4(url) {
  if (!url) return url;
  if (!url.includes("res.cloudinary.com")) return url;
  // Replace extension with .mp4
  return url.replace(/\.[^./?#]+(\?.*)?$/, ".mp4$1");
}

/**
 * Generates a static JPEG poster from a Cloudinary video URL using the
 * `so_0` (seek-to-second-0) transformation.
 *
 * e.g.  .../video/upload/v123/path/file.mkv
 *       → .../video/upload/so_0/v123/path/file.jpg
 */
function cloudinaryPoster(url) {
  if (!url) return undefined;
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/.+?\/video\/upload\/)(.+)$/);
  if (!match) return undefined;
  const pathWithoutExt = match[2].replace(/\.[^.]+$/, "");
  return `${match[1]}so_0/${pathWithoutExt}.jpg`;
}

// ---------------------------------------------------------------------------
// VideoPlayer
// ---------------------------------------------------------------------------

/**
 * VideoPlayer
 *
 * Uses a native <video> element so there's no third-party player dependency.
 * - Shows a poster + play button before the user starts playback (no autoload)
 * - Transcodes .mkv → .mp4 via Cloudinary on-the-fly URL rewrite
 * - Custom controls: play/pause, mute, seek bar, time, fullscreen
 * - Controls auto-hide 2 s after playback starts; reappear on hover/tap
 */
function VideoPlayer({ item }) {
  const rawUrl = item.videoUrl || item.video || item.image || item.thumbnail;
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
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
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
    if (!started) setStarted(true);
    v.play().then(() => {
      setPlaying(true);
      scheduleHide();
    }).catch(() => setError(true));
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      handlePlay();
    } else {
      v.pause();
      setPlaying(false);
      clearTimeout(hideTimer.current);
      setShowControls(true);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
  }

  function seek(e) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
    revealControls();
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      {/* ── Video element ── */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="absolute inset-0 h-full w-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => { setPlaying(false); setShowControls(true); }}
        onError={() => setError(true)}
        playsInline
        preload="metadata"
      />

      {/* ── Error state ── */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-sm text-archive-muted">
          <span>Unable to load video.</span>
          <a href={rawUrl} target="_blank" rel="noopener noreferrer"
            className="text-archive-amber underline">
            Open original file ↗
          </a>
        </div>
      )}

      {/* ── Pre-play poster overlay ── */}
      {!started && !error && (
        <button
          type="button"
          aria-label="Play video"
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-archive-amber/90 shadow-2xl ring-4 ring-archive-amber/20 transition duration-300 hover:scale-110 hover:bg-archive-amber">
            <Play className="h-9 w-9 fill-black text-black" />
          </span>
        </button>
      )}

      {/* ── Controls bar ── */}
      {started && !error && (
        <div
          className={[
            "absolute inset-x-0 bottom-0 px-4 pb-3 pt-10",
            "bg-gradient-to-t from-black/80 to-transparent",
            "transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          {/* Seek bar */}
          <div
            role="slider"
            aria-label="Seek"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/20"
            onClick={seek}
            onKeyDown={(e) => {
              const v = videoRef.current;
              if (!v) return;
              if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration, v.currentTime + 5);
              if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
            }}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-archive-amber"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-archive-amber shadow"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Button row */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              aria-label={playing ? "Pause" : "Play"}
              onClick={togglePlay}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-archive-amber hover:text-black"
            >
              {playing
                ? <Pause className="h-4 w-4 fill-current" />
                : <Play className="h-4 w-4 fill-current" />}
            </button>

            <button
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={toggleMute}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-archive-amber hover:text-black"
            >
              {muted
                ? <VolumeX className="h-4 w-4" />
                : <Volume2 className="h-4 w-4" />}
            </button>

            <span className="ml-1 text-xs tabular-nums text-white/70">
              {fmt(currentTime)} / {fmt(duration)}
            </span>

            <button
              type="button"
              aria-label="Fullscreen"
              onClick={toggleFullscreen}
              className="ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-archive-amber hover:text-black"
            >
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

export default function ArchiveDetailsPage() {
  const { id } = useParams();
  const fallback = featuredArchive.find((record) => record.id === id) || null;
  const [item, setItem] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    publicApi
      .archiveDetail(id, fallback ? { data: fallback } : null)
      .then((payload) => {
        if (!active) return;
        const data = unwrap(payload);
        if (data && !Array.isArray(data)) setItem(data);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading && !item)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-9 w-9 animate-spin text-archive-amber" />
      </div>
    );
  if (!item)
    return (
      <div className="page-shell min-h-screen pt-36">
        <h1 className="font-display text-5xl">
          {pick("Record not found", "রেকর্ড পাওয়া যায়নি")}
        </h1>
        <Button to="/archive" className="mt-6">
          {pick("Back to Archive", "আর্কাইভে ফিরুন")}
        </Button>
      </div>
    );

  const isVideo = item.type === "Video";

  return (
    <article className="page-shell pb-20 pt-32">
      <Link to="/archive" className="text-sm font-semibold text-archive-amber hover:underline">
        ← {pick("Back to archive", "আর্কাইভে ফিরুন")}
      </Link>
      <div className="mt-6 grid gap-9 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          {/* ── Media area ── */}
          {isVideo ? (
            <VideoPlayer item={item} />
          ) : (
            <ImageWithFallback
              src={item.image || item.thumbnail}
              alt={item.title}
              className="aspect-[16/10] rounded-2xl border border-white/10"
            />
          )}

          <div className="mt-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">{item.type}</span>
              <StatusBadge status={item.status || (item.verified ? "Verified" : "Reviewed")} />
            </div>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[.98] md:text-6xl">
              {item.title}
            </h1>
            <p className="muted-copy mt-6">{item.description || item.summary}</p>
            {item.body && (
              <p className="mt-5 whitespace-pre-wrap leading-8 text-[#B9B5AE]">{item.body}</p>
            )}
          </div>
        </div>
        <aside className="space-y-5">
          <div className="surface-card rounded-2xl p-6">
            <h2 className="font-display text-2xl font-semibold">
              {pick("Record information", "রেকর্ডের তথ্য")}
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3">
                <CalendarDays className="h-5 w-5 text-archive-amber" />
                <div>
                  <dt className="text-archive-muted">{pick("Date", "তারিখ")}</dt>
                  <dd className="mt-1 text-white">{item.date || item.eventDate || "—"}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-archive-amber" />
                <div>
                  <dt className="text-archive-muted">{pick("Location", "স্থান")}</dt>
                  <dd className="mt-1 text-white">{item.location || "—"}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <UserRound className="h-5 w-5 text-archive-amber" />
                <div>
                  <dt className="text-archive-muted">{pick("Contributor", "জমাদানকারী")}</dt>
                  <dd className="mt-1 text-white">
                    {item.contributor || item.attribution || pick("Identity protected", "পরিচয় সুরক্ষিত")}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.07] p-6">
            <ShieldCheck className="h-6 w-6 text-archive-teal" />
            <h2 className="mt-4 font-semibold">{pick("Verification note", "যাচাই নোট")}</h2>
            <p className="mt-2 text-sm leading-6 text-[#B9CFCB]">
              {item.verificationNote ||
                pick(
                  "The public source context and privacy settings were reviewed before publication.",
                  "প্রকাশের আগে উৎসের প্রেক্ষাপট ও গোপনীয়তা সেটিংস পর্যালোচনা করা হয়েছে।",
                )}
            </p>
          </div>
          <div className="surface-card rounded-2xl p-6">
            <FileCheck2 className="h-6 w-6 text-archive-amber" />
            <h2 className="mt-4 font-semibold">{pick("Source records", "উৎস রেকর্ড")}</h2>
            <p className="mt-2 text-sm leading-6 text-archive-muted">
              {pick(
                "Original files and private contributor details remain protected. Only approved references are public.",
                "মূল ফাইল ও জমাদানকারীর ব্যক্তিগত তথ্য সুরক্ষিত থাকে। কেবল অনুমোদিত রেফারেন্স প্রকাশ্য।",
              )}
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}