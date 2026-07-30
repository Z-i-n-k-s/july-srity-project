import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Play, Search, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import PageHeader from "../../components/ui/PageHeader";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import StatusBadge from "../../components/ui/StatusBadge";
import { featuredArchive } from "../../data/landingData";
import { publicApi, unwrap } from "../../lib/api";
import { filterPublicArchiveRecords } from "../../lib/archiveVisibility";
import { useLanguage } from "../../context/LanguageContext";

const types = ["All", "Photograph", "Video", "Testimony", "Document", "Story", "Timeline"];

/**
 * Given any Cloudinary video URL (including .mkv), returns a static JPEG
 * poster by injecting the `so_0` (seek-offset 0) transformation.
 *
 * e.g.
 *   .../video/upload/v123/path/file.mkv
 *   → .../video/upload/so_0/v123/path/file.jpg
 *
 * Falls back to undefined if the URL isn't a Cloudinary video URL.
 */
function cloudinaryPoster(url) {
  if (!url) return undefined;
  // Match Cloudinary video upload URLs
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/.+?\/video\/upload\/)(.+)$/);
  if (!match) return undefined;
  // Strip existing extension and replace with .jpg, inject so_0 transform
  const pathWithoutExt = match[2].replace(/\.[^.]+$/, "");
  return `${match[1]}so_0/${pathWithoutExt}.jpg`;
}

/**
 * VideoThumbnail — card media for Video records.
 * Renders a static Cloudinary poster frame with a play-button overlay.
 * No video is loaded on the listing page.
 */
function VideoThumbnail({ item }) {
  const poster = cloudinaryPoster(item.image || item.thumbnail);
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-black/50">
      {poster && imgOk ? (
        <img
          src={poster}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          onError={() => setImgOk(false)}
        />
      ) : (
        /* Dark fallback when Cloudinary poster isn't available */
        <div className="h-full w-full bg-black/60" />
      )}

      {/* Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-archive-amber/90 shadow-lg ring-4 ring-archive-amber/20 transition duration-300 group-hover:scale-110 group-hover:bg-archive-amber">
          <Play className="h-6 w-6 fill-black text-black" />
        </span>
      </div>
    </div>
  );
}

export default function ArchivePage() {
  const [params] = useSearchParams();
  const initialType = params.get("type") || "All";
  const mappedInitial =
    initialType === "photos"
      ? "Photograph"
      : initialType === "videos"
        ? "Video"
        : initialType === "stories"
          ? "Story"
          : initialType === "documents"
            ? "Document"
            : "All";
  const [records, setRecords] = useState(filterPublicArchiveRecords(featuredArchive));
  const [query, setQuery] = useState("");
  const [type, setType] = useState(mappedInitial);
  const [location, setLocation] = useState("All locations");
  const [loading, setLoading] = useState(true);
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    publicApi
      .archive(featuredArchive)
      .then((payload) => {
        if (!active) return;
        const data = unwrap(payload);
        if (Array.isArray(data)) setRecords(filterPublicArchiveRecords(data));
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const items = useMemo(
    () =>
      filterPublicArchiveRecords(records).filter((item) => {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const matchesQuery =
          `${item.title || ""} ${item.description || item.summary || ""} ${item.location || ""} ${tags.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesType =
          type === "All" ||
          item.type === type ||
          (type === "Story" && item.type === "Testimony");
        const matchesLocation =
          location === "All locations" ||
          String(item.location || "").includes(location);
        return matchesQuery && matchesType && matchesLocation;
      }),
    [records, query, type, location],
  );

  return (
    <>
      <PageHeader
        label={pick("Public archive", "প্রকাশ্য আর্কাইভ")}
        title={pick("Explore verified records", "যাচাইকৃত রেকর্ড দেখুন")}
        description={pick(
          "Search photographs, testimonies, documents, videos and chronological records. Public items include review and source information.",
          "ছবি, সাক্ষ্য, নথি, ভিডিও ও ধারাবাহিক রেকর্ড খুঁজুন। প্রকাশ্য প্রতিটি আইটেমে পর্যালোচনা ও উৎসের তথ্য থাকে।",
        )}
      />
      <section className="section-pad">
        <div className="page-shell">
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_auto_auto]">
            <label className="relative">
              <span className="sr-only">Search archive</span>
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="field-control pl-12"
                placeholder={pick("Search records, locations or tags", "রেকর্ড, স্থান বা ট্যাগ খুঁজুন")}
              />
            </label>
            <label>
              <span className="sr-only">Filter by type</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="field-control min-w-44">
                {types.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by location</span>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="field-control min-w-44">
                <option>All locations</option>
                <option>Dhaka</option>
                <option>Mirpur</option>
                <option>Shahbag</option>
              </select>
            </label>
          </div>
          <div className="mt-6 flex items-center justify-between text-sm text-archive-muted">
            <span>
              {loading
                ? pick("Loading records…", "রেকর্ড লোড হচ্ছে…")
                : pick(`${items.length} records shown`, `${items.length}টি রেকর্ড দেখানো হচ্ছে`)}
            </span>
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {pick("Admin-verified public content", "অ্যাডমিন-যাচাইকৃত প্রকাশ্য তথ্য")}
            </span>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id || item._id}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition hover:-translate-y-1 hover:border-archive-amber/30"
              >
                <Link to={`/archive/${item.id || item._id}`} className="focus-ring block">
                  {item.type === "Video" ? (
                    <VideoThumbnail item={item} />
                  ) : (
                    <ImageWithFallback
                      src={item.image || item.thumbnail}
                      alt={item.title}
                      className="aspect-[16/10]"
                      imageClassName="transition duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[.16em] text-archive-amber">
                        {item.type}
                      </span>
                      <StatusBadge status={item.status || "Verified"} />
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-semibold">{item.title}</h2>
                    <p className="line-clamp-3 mt-3 text-sm leading-6 text-archive-muted">
                      {item.description || item.summary}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3 text-xs text-archive-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {item.date || item.eventDate}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
          {!items.length && !loading && (
            <div className="mt-8 rounded-2xl border border-white/10 p-10 text-center text-archive-muted">
              {pick("No archive records match these filters.", "এই ফিল্টারে কোনো আর্কাইভ রেকর্ড নেই।")}
            </div>
          )}
        </div>
      </section>
    </>
  );
}