import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
  MapPinned,
  MessageSquareText,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Video,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ReactComponent as BangladeshMapSvg } from "../../assets/maps/bangladesh-divisions.svg";
import { useLanguage } from "../../context/LanguageContext";
import { publicApi, unwrap } from "../../lib/api";
import {
  divisionMapMeta,
  fallbackMapMemories,
  fallbackMapSummary,
  mapFilters,
} from "../../data/mapData";
import ImageWithFallback from "../ui/ImageWithFallback";
import StatusBadge from "../ui/StatusBadge";
import "./InteractiveMemoryMap.css";

const numberFormatter = new Intl.NumberFormat("en-US");

const typeIcon = {
  Photograph: Camera,
  Video,
  Testimony: MessageSquareText,
  Story: MessageSquareText,
  Document: FileText,
};

function formatCount(value) {
  return numberFormatter.format(Number(value) || 0);
}

function extractData(payload, fallback = []) {
  const data = unwrap(payload);
  return Array.isArray(data) ? data : fallback;
}

function MemorySkeleton() {
  return (
    <div className="flex animate-pulse gap-3 border-b border-white/[0.07] py-4">
      <div className="h-20 w-24 shrink-0 rounded-xl bg-white/[0.07]" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-3 w-3/4 rounded bg-white/[0.08]" />
        <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
        <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

function MediaViewer({ item }) {
  const media = useMemo(() => {
    const fromApi = Array.isArray(item?.media) ? item.media : [];
    if (fromApi.length) return fromApi;
    const url = item?.image || item?.thumbnail;
    return url ? [{ id: "cover", url, mimeType: "image/*", name: item.title }] : [];
  }, [item]);
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [item?.id]);

  if (!media.length) {
    return (
      <ImageWithFallback
        src=""
        alt={item?.title || "Archive record"}
        className="aspect-[16/10] rounded-xl"
      />
    );
  }

  const current = media[Math.min(index, media.length - 1)];
  const isVideo = String(current?.mimeType || "").startsWith("video/");

  const move = (direction) => {
    setIndex((currentIndex) => (currentIndex + direction + media.length) % media.length);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/35">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id || current.url}
          initial={{ opacity: 0, scale: 1.015 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: .985 }}
          transition={{ duration: .24 }}
          className="aspect-[16/10]"
        >
          {isVideo ? (
            <video src={current.url} controls className="h-full w-full object-cover" preload="metadata" />
          ) : (
            <img src={current.url} alt={current.name || item.title} className="h-full w-full object-cover" />
          )}
        </motion.div>
      </AnimatePresence>

      {media.length > 1 && (
        <>
          <button onClick={() => move(-1)} className="focus-ring absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur" aria-label="Previous media">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => move(1)} className="focus-ring absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur" aria-label="Next media">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 backdrop-blur">
            {media.map((entry, mediaIndex) => (
              <button key={entry.id || entry.url} onClick={() => setIndex(mediaIndex)} className={`h-1.5 rounded-full transition-all ${mediaIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/45"}`} aria-label={`Show media ${mediaIndex + 1}`} />
            ))}
          </div>
        </>
      )}

      <span className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-xs text-white/80 backdrop-blur">
        {index + 1} / {media.length}
      </span>
    </div>
  );
}

function DetailDrawer({ item, loading, onClose, pick }) {
  useEffect(() => {
    if (!item && !loading) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, loading, onClose]);

  const shareRecord = async () => {
    const shareData = {
      title: item?.title || "July Smriti Archive",
      text: item?.description || item?.summary || "",
      url: `${window.location.origin}/archive/${item?.id || item?._id}`,
    };

    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(shareData.url);
    } catch (_error) {
      // The user may cancel the native share sheet; no visible error is needed.
    }
  };

  return (
    <AnimatePresence>
      {(item || loading) && (
        <motion.div className="fixed inset-0 z-[110] bg-black/70 p-3 backdrop-blur-sm sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={pick("Memory details", "স্মৃতির বিস্তারিত")}
            initial={{ opacity: 0, x: 36, scale: .985 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 36, scale: .985 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onMouseDown={(event) => event.stopPropagation()}
            className="ml-auto flex h-full w-full max-w-[470px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#101822]/[0.98] shadow-[0_30px_100px_rgba(0,0,0,.65)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="eyebrow">{pick("Archive record", "আর্কাইভ রেকর্ড")}</p>
                <h3 className="mt-1 line-clamp-2 font-display text-2xl font-semibold text-white">{item?.title || pick("Loading record…", "রেকর্ড লোড হচ্ছে…")}</h3>
              </div>
              <button onClick={onClose} className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/75 transition hover:bg-white/[0.08] hover:text-white" aria-label="Close details">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="grid flex-1 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-archive-amber" /></div>
            ) : (
              <div className="memory-map-panel-scroll flex-1 overflow-y-auto p-5">
                <MediaViewer item={item} />

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[.16em] text-archive-amber">{item.type}</span>
                  <StatusBadge status={item.status || (item.verified ? "Verified" : "Reviewed")} />
                </div>

                <dl className="mt-5 space-y-3 border-y border-white/[0.08] py-5 text-sm">
                  <div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-archive-muted" /><div><dt className="text-archive-muted">{pick("Date", "তারিখ")}</dt><dd className="mt-1 text-white">{item.date || item.eventDate || "—"}</dd></div></div>
                  <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-archive-muted" /><div><dt className="text-archive-muted">{pick("Location", "স্থান")}</dt><dd className="mt-1 text-white">{item.location || "—"}</dd></div></div>
                  <div className="flex gap-3"><UserRound className="mt-0.5 h-4 w-4 text-archive-muted" /><div><dt className="text-archive-muted">{pick("Contributor", "জমাদানকারী")}</dt><dd className="mt-1 text-white">{item.contributor || item.attribution || pick("Identity protected", "পরিচয় সুরক্ষিত")}</dd></div></div>
                  <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-archive-teal" /><div><dt className="text-archive-muted">{pick("Verification", "যাচাই")}</dt><dd className="mt-1 text-white">{item.status || pick("Reviewed", "পর্যালোচিত")}</dd></div></div>
                </dl>

                <div className="mt-5">
                  <h4 className="font-semibold text-white">{pick("Description", "বর্ণনা")}</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#C6C2BC]">{item.description || item.summary || item.body || pick("No public description is available.", "কোনো প্রকাশ্য বর্ণনা নেই।")}</p>
                </div>

                {item.verificationNote && (
                  <div className="mt-5 rounded-xl border border-archive-teal/20 bg-archive-teal/[0.07] p-4 text-sm leading-6 text-[#B9CFCB]">
                    <div className="flex items-center gap-2 font-semibold text-archive-teal"><ShieldCheck className="h-4 w-4" />{pick("Verification note", "যাচাই নোট")}</div>
                    <p className="mt-2">{item.verificationNote}</p>
                  </div>
                )}
              </div>
            )}

            {!loading && item && (
              <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-4">
                <button onClick={shareRecord} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] font-semibold text-white transition hover:bg-white/[0.07]"><Share2 className="h-4 w-4" />{pick("Share", "শেয়ার")}</button>
                <Link to={`/archive/${item.id || item._id}`} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#bd242b] to-[#d3383f] font-semibold text-white shadow-lg transition hover:brightness-110">{pick("Full details", "সম্পূর্ণ বিস্তারিত")}<ArrowRight className="h-4 w-4" /></Link>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function InteractiveMemoryMap() {
  const { pick } = useLanguage();
  const [summary, setSummary] = useState(divisionMapMeta.map((division) => ({ ...division, count: 0 })));
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("dhaka");
  const [filter, setFilter] = useState("all");
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [memoryError, setMemoryError] = useState("");
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const sentinelRef = useRef(null);
  const mapRootRef = useRef(null);
  const requestVersion = useRef(0);

  const selectedMeta = useMemo(() => {
    const base = divisionMapMeta.find((division) => division.slug === selectedSlug) || divisionMapMeta[0];
    const apiDivision = summary.find((division) => division.slug === selectedSlug);
    return { ...base, ...(apiDivision || {}) };
  }, [selectedSlug, summary]);

  useEffect(() => {
    let active = true;
    publicApi.memoryMapSummary(fallbackMapSummary)
      .then((payload) => {
        if (!active) return;
        const apiData = extractData(payload);
        const merged = divisionMapMeta.map((division) => ({
          ...division,
          ...(apiData.find((item) => item.slug === division.slug || item.id === division.slug) || {}),
        }));
        setSummary(merged);
        setSummaryError("");
      })
      .catch((error) => {
        if (!active) return;
        setSummaryError(error.message || pick("The map summary could not be loaded.", "মানচিত্রের সারাংশ লোড করা যায়নি।"));
      })
      .finally(() => active && setSummaryLoading(false));
    return () => { active = false; };
  }, [pick]);

  const fetchFirstPage = useCallback(async (divisionSlug, activeFilter) => {
    const version = ++requestVersion.current;
    setMemoriesLoading(true);
    setMemoryError("");
    setCursor(null);
    setHasMore(false);

    try {
      const payload = await publicApi.memoryMapMemories(
        divisionSlug,
        { type: activeFilter, limit: 10 },
        () => fallbackMapMemories(divisionSlug, activeFilter),
      );
      if (version !== requestVersion.current) return;
      const data = extractData(payload);
      setMemories(data);
      setTotal(Number(payload?.meta?.total) || data.length);
      setCursor(payload?.meta?.nextCursor || null);
      setHasMore(Boolean(payload?.meta?.hasMore));
    } catch (error) {
      if (version !== requestVersion.current) return;
      setMemories([]);
      setTotal(0);
      setMemoryError(error.message || pick("Memories could not be loaded.", "স্মৃতিগুলো লোড করা যায়নি।"));
    } finally {
      if (version === requestVersion.current) setMemoriesLoading(false);
    }
  }, [pick]);

  useEffect(() => {
    fetchFirstPage(selectedSlug, filter);
  }, [selectedSlug, filter, fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loadingMore || memoriesLoading) return;

    const version = requestVersion.current;
    const divisionSlug = selectedSlug;
    const activeFilter = filter;
    setLoadingMore(true);

    try {
      const payload = await publicApi.memoryMapMemories(
        divisionSlug,
        { type: activeFilter, limit: 10, cursor },
        () => fallbackMapMemories(divisionSlug, activeFilter),
      );
      if (version !== requestVersion.current) return;

      const data = extractData(payload);
      setMemories((current) => {
        const known = new Set(current.map((item) => item.id || item._id));
        return [...current, ...data.filter((item) => !known.has(item.id || item._id))];
      });
      setCursor(payload?.meta?.nextCursor || null);
      setHasMore(Boolean(payload?.meta?.hasMore));
    } catch (error) {
      if (version !== requestVersion.current) return;
      setMemoryError(error.message || pick("More memories could not be loaded.", "আরও স্মৃতি লোড করা যায়নি।"));
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
    }
  }, [cursor, filter, hasMore, loadingMore, memoriesLoading, pick, selectedSlug]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: "180px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    const root = mapRootRef.current?.querySelector(".memory-map-svg");
    if (!root) return;
    divisionMapMeta.forEach((division) => {
      root.querySelector(`#${division.svgId}`)?.classList.toggle("is-active", division.slug === selectedSlug);
    });
  }, [selectedSlug]);

  const selectDivision = (slug) => {
    requestVersion.current += 1;
    setLoadingMore(false);
    setSelectedSlug(slug);
    setFilter("all");
  };

  const selectFilter = (filterId) => {
    requestVersion.current += 1;
    setLoadingMore(false);
    setFilter(filterId);
  };

  const handleMapClick = (event) => {
    const group = event.target.closest?.("g[id]");
    const division = divisionMapMeta.find((item) => item.svgId === group?.id);
    if (division) selectDivision(division.slug);
  };

  const selectedDivisionTotal = Number(selectedMeta.count) || (filter === "all" ? total : 0);
  const displayedListTotal = memoriesLoading ? selectedDivisionTotal : total;

  const openDetail = async (item) => {
    setDetailItem(item);
    setDetailLoading(true);
    try {
      const payload = await publicApi.archiveDetail(item.id || item._id, item);
      const data = unwrap(payload);
      if (data && !Array.isArray(data)) setDetailItem({ ...item, ...data });
    } catch (_error) {
      setDetailItem(item);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section id="memory-map" className="section-pad border-y border-white/[0.06] bg-[#071019]/70">
      <div className="page-shell">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="eyebrow inline-flex items-center gap-2"><MapPinned className="h-4 w-4" />{pick("Interactive memory map", "ইন্টারঅ্যাকটিভ স্মৃতি মানচিত্র")}</span>
            <h2 className="section-title mt-4">{pick("Explore July memories across Bangladesh.", "বাংলাদেশজুড়ে জুলাইয়ের স্মৃতি দেখুন।")}</h2>
            <p className="muted-copy mt-5 max-w-2xl">{pick("Select any division to load its latest published records. The map only requests a small page at a time, so even thousands of memories remain fast to browse.", "যেকোনো বিভাগ নির্বাচন করে সর্বশেষ প্রকাশিত রেকর্ড দেখুন। একসঙ্গে অল্প কিছু রেকর্ড লোড হওয়ায় হাজারো স্মৃতিও দ্রুত দেখা যায়।")}</p>
          </div>
          <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.07] px-4 py-3 text-sm text-[#B9CFCB] lg:self-auto">
            <Sparkles className="h-5 w-5 text-archive-teal" />
            <span><strong className="text-white">{formatCount(summary.reduce((sum, item) => sum + (Number(item.count) || 0), 0))}</strong> {pick("mapped memories", "মানচিত্রভুক্ত স্মৃতি")}</span>
          </div>
        </motion.div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <motion.div initial={{ opacity: 0, scale: .99 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: .5 }} className="memory-map-stage">
            <div className="memory-map-intro">
              <h3 className="memory-map-intro-title">
                {pick(
                  <>
                    <span>Explore July memories</span>
                    <span>across Bangladesh</span>
                  </>,
                  <>
                    <span>বাংলাদেশজুড়ে জুলাইয়ের</span>
                    <span>স্মৃতি দেখুন</span>
                  </>,
                )}
              </h3>

              
              {summaryError && (
                <p className="memory-map-intro-error">{summaryError}</p>
              )}
            </div>

            <div ref={mapRootRef} className="memory-map-canvas" aria-label="Interactive map of the divisions of Bangladesh">
              <BangladeshMapSvg className="memory-map-svg" onClick={handleMapClick} role="img" aria-label="Bangladesh divisions memory map" />
              {summary.map((division) => {
                const meta = divisionMapMeta.find((item) => item.slug === division.slug) || division;
                return (
                  <button
                    key={`${division.slug}-marker`}
                    type="button"
                    onClick={() => selectDivision(division.slug)}
                    className={`memory-map-marker focus-ring ${selectedSlug === division.slug ? "is-active" : ""}`}
                    style={{ left: `${meta.marker.x}%`, top: `${meta.marker.y}%`, "--marker-color": meta.color }}
                    aria-label={`${meta.name}: ${formatCount(division.count)} memories`}
                  />
                );
              })}
            </div>

            {summary.map((division, index) => {
              const meta = divisionMapMeta.find((item) => item.slug === division.slug) || division;
              const rightSide = meta.label.align === "right" || meta.label.x > 58;
              return (
                <motion.button
                  key={division.slug}
                  type="button"
                  onClick={() => selectDivision(division.slug)}
                  initial={{ opacity: 0, scale: .92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: .08 + index * .045, type: "spring", stiffness: 260, damping: 24 }}
                  className={`memory-map-label focus-ring ${rightSide ? "is-right" : ""} ${selectedSlug === division.slug ? "is-active" : ""}`}
                  style={{ left: `${meta.label.x}%`, top: `${meta.label.y}%`, "--marker-color": meta.color, "--line-angle": rightSide ? "-4deg" : "4deg" }}
                >
                  <span className="block text-sm font-semibold leading-tight">{pick(meta.name, meta.nameBn)}</span>
                  <span className="memory-count mt-1 block text-xs text-white/[0.72]">{summaryLoading ? pick("Loading…", "লোড হচ্ছে…") : `${formatCount(division.count)} ${pick("memories", "স্মৃতি")}`}</span>
                </motion.button>
              );
            })}

            <div className="absolute bottom-5 left-5 z-[7] hidden items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/[0.55] backdrop-blur sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-archive-teal" />{pick("Live counts from the archive API", "আর্কাইভ API থেকে লাইভ সংখ্যা")}
            </div>
          </motion.div>

          <motion.aside initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: .14 }} className="flex min-h-[690px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#151f2b] to-[#0c141d] shadow-[0_24px_80px_rgba(0,0,0,.42)]">
            <div className="border-b border-white/[0.08] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{pick("Selected division", "নির্বাচিত বিভাগ")}</p>
                  <h3 className="mt-2 font-display text-3xl font-semibold text-white">{pick(selectedMeta.name, selectedMeta.nameBn)}</h3>
                  <p className="mt-1 text-sm text-[#B8C0C8]" aria-live="polite">{formatCount(displayedListTotal)} {filter === "all" ? pick("memories found", "টি স্মৃতি পাওয়া গেছে") : pick("matching memories", "টি মিল পাওয়া গেছে")}</p>
                </div>
                <span className="mt-1 h-3 w-3 rounded-full" style={{ background: selectedMeta.color, boxShadow: `0 0 18px ${selectedMeta.color}` }} />
              </div>

              <div className="mt-5 grid grid-cols-5 overflow-hidden rounded-xl border border-white/[0.08] bg-black/15">
                {mapFilters.map((item) => {
                  const Icon = item.id === "photo" ? Camera : item.id === "video" ? Play : item.id === "testimony" ? MessageSquareText : item.id === "document" ? FileText : null;
                  return (
                    <button key={item.id} onClick={() => selectFilter(item.id)} className={`focus-ring flex min-h-10 items-center justify-center gap-1.5 border-r border-white/[0.07] px-2 text-[11px] font-semibold transition last:border-r-0 ${filter === item.id ? "bg-[#c72d34] text-white shadow-inner" : "text-white/[0.65] hover:bg-white/[0.05] hover:text-white"}`}>
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline xl:inline">{pick(item.label, item.labelBn)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="memory-map-panel-scroll flex-1 overflow-y-auto px-5">
              {memoriesLoading ? (
                <div>{[0, 1, 2, 3].map((item) => <MemorySkeleton key={item} />)}</div>
              ) : memoryError ? (
                <div className="grid h-full min-h-56 place-items-center py-10 text-center"><div><MapPin className="mx-auto h-8 w-8 text-archive-rose" /><p className="mt-3 text-sm text-[#C6C2BC]">{memoryError}</p><button onClick={() => fetchFirstPage(selectedSlug, filter)} className="mt-4 text-sm font-semibold text-archive-amber">{pick("Try again", "আবার চেষ্টা করুন")}</button></div></div>
              ) : memories.length ? (
                <div>
                  {memories.map((item, index) => {
                    const Icon = typeIcon[item.type] || FileText;
                    return (
                      <motion.button key={item.id || item._id} type="button" onClick={() => openDetail(item)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * .035 }} className="memory-map-record group focus-ring flex w-full gap-3 border-b border-white/[0.07] py-4 text-left transition hover:bg-white/[0.035]">
                        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/25">
                          <ImageWithFallback src={item.thumbnail || item.image} alt={item.title} className="h-full w-full" imageClassName="transition duration-500 group-hover:scale-105" />
                          {item.type === "Video" && <span className="absolute inset-0 grid place-items-center bg-black/25"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.85] text-black"><Play className="h-4 w-4 fill-current" /></span></span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-white">{item.title}</h4>
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#B9C0C7]"><Icon className="h-3.5 w-3.5" />{item.type} <span className="text-white/25">•</span> {item.date || item.eventDate || "—"}</p>
                          <div className="mt-2"><StatusBadge status={item.status || (item.verified ? "Verified" : "Reviewed")} className="px-2 py-0.5 text-[10px]" /></div>
                        </div>
                      </motion.button>
                    );
                  })}
                  <div ref={sentinelRef} className="grid min-h-16 place-items-center py-4">
                    {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-archive-amber" />}
                    {!hasMore && memories.length > 4 && <span className="text-xs text-white/35">{pick("All loaded", "সব লোড হয়েছে")}</span>}
                  </div>
                </div>
              ) : (
                <div className="grid h-full min-h-56 place-items-center py-10 text-center"><div><MapPin className="mx-auto h-8 w-8 text-white/35" /><h4 className="mt-3 font-semibold text-white">{pick("No published memories yet", "এখনও কোনো প্রকাশিত স্মৃতি নেই")}</h4><p className="mt-2 text-sm leading-6 text-archive-muted">{pick("Try another filter or select a different division.", "অন্য ফিল্টার বা বিভাগ নির্বাচন করুন।")}</p></div></div>
              )}
            </div>

            <div className="border-t border-white/[0.08] p-4">
              <Link to={`/archive?location=${encodeURIComponent(selectedMeta.name)}`} className="focus-ring flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ba242b] to-[#d83b42] px-4 font-semibold text-white shadow-[0_12px_28px_rgba(190,38,45,.25)] transition hover:brightness-110">
                {pick(`View all ${formatCount(selectedDivisionTotal)} memories from ${selectedMeta.name}`, `${pick(selectedMeta.name, selectedMeta.nameBn)} থেকে সব ${formatCount(selectedDivisionTotal)}টি স্মৃতি দেখুন`)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.aside>
        </div>

        <div className="mt-5 grid gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:grid-cols-3">
          {[
            [pick("1. Select a division", "১. বিভাগ নির্বাচন"), pick("Click the map, marker or label.", "মানচিত্র, মার্কার বা লেবেলে ক্লিক করুন।")],
            [pick("2. Browse a small page", "২. অল্প রেকর্ড দেখুন"), pick("Only 10 records are requested initially.", "শুরুতে শুধু ১০টি রেকর্ড লোড হয়।")],
            [pick("3. Load more as needed", "৩. প্রয়োজনে আরও লোড"), pick("Infinite scrolling requests the next page.", "স্ক্রল করলে পরের পৃষ্ঠা লোড হয়।")],
          ].map(([title, description]) => <div key={title} className="rounded-xl border border-white/[0.06] bg-black/10 p-4"><p className="font-semibold text-white">{title}</p><p className="mt-1 text-sm leading-6 text-archive-muted">{description}</p></div>)}
        </div>
      </div>

      <DetailDrawer item={detailItem} loading={detailLoading} onClose={() => { setDetailItem(null); setDetailLoading(false); }} pick={pick} />
    </section>
  );
}
