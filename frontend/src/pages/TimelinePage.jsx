import { useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Search,
  ShieldAlert,
  BookOpen,
  X,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import {
  timelineEvents,
  REGIONS,
  TAGS,
} from "../data/julyTimelineData";
import { useLanguage } from "../context/LanguageContext";

/**
 * TimelinePage — fully static, source-attributed chronology of the
 * July 2024 movement. No backend dependency: `timelineEvents` in
 * data/julyTimelineData.js is the single source of truth and is meant
 * to be maintained by hand (add/edit entries there, not here).
 *
 * Design intent: this reads like a maintained archive record, not a
 * live feed — every entry carries a location, a source line, and a
 * category chip, and the page groups entries by date so the sequence
 * of a single day (often across several districts) stays legible.
 */

function TagChip({ tag, active, onClick, lang }) {
  const meta = TAGS.find((t) => t.id === tag);
  if (!meta) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-archive-amber/50 bg-archive-amber/15 text-archive-amber"
          : "border-white/10 bg-white/[0.02] text-archive-muted hover:border-white/20 hover:text-[#C6C2BC]",
      ].join(" ")}
    >
      {lang === "bn" ? meta.bn : meta.en}
    </button>
  );
}

export default function TimelinePage() {
  const { pick, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [activeTags, setActiveTags] = useState([]);
  const [expandedSource, setExpandedSource] = useState(null);

  function toggleTag(tagId) {
    setActiveTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return timelineEvents.filter((event) => {
      if (region !== "all" && event.region !== region) return false;
      if (activeTags.length && !activeTags.some((t) => event.tags.includes(t)))
        return false;
      if (!q) return true;
      const haystack = [
        event.title,
        event.titleBn,
        event.location,
        event.locationBn,
        event.summary,
        event.summaryBn,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, region, activeTags]);

  const regionCounts = useMemo(() => {
    const counts = {};
    for (const r of REGIONS) counts[r.id] = 0;
    for (const e of timelineEvents) {
      counts.all += 1;
      counts[e.region] = (counts[e.region] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <>
      <PageHeader
        label={pick("Verified chronology · 1 July – 5 August 2024", "যাচাইকৃত কালপঞ্জি · ১ জুলাই – ৫ আগস্ট, ২০২৪")}
        title={pick("The July Timeline", "জুলাই টাইমলাইন")}
        description={pick(
          "A day-by-day record of the 2024 movement across Bangladesh — Dhaka and beyond it, in Rangpur, Chattogram, Sylhet, Narayanganj, and other districts. Every entry is attributed to public reporting; where sources disagree on a figure, that is noted rather than resolved for you.",
          "২০২৪ সালের আন্দোলনের দিনভিত্তিক লিপিবদ্ধ ইতিহাস, শুধু ঢাকা নয় — রংপুর, চট্টগ্রাম, সিলেট, নারায়ণগঞ্জসহ দেশের বিভিন্ন জেলা জুড়ে। প্রতিটি তথ্য প্রকাশিত সংবাদ প্রতিবেদনের সূত্র উল্লেখসহ দেওয়া হয়েছে; কোনো সংখ্যা নিয়ে সূত্রগুলোর মধ্যে অমিল থাকলে তা গোপন না করে উল্লেখ করা হয়েছে।"
        )}
      />

      <section className="section-pad">
        <div className="page-shell">
          {/* Controls */}
          <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <label className="relative block">
              <span className="sr-only">
                {pick("Search timeline", "টাইমলাইন খুঁজুন")}
              </span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="field-control pl-12"
                placeholder={pick(
                  "Search events, districts, or names",
                  "ঘটনা, জেলা বা নাম খুঁজুন"
                )}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegion(r.id)}
                  aria-pressed={region === r.id}
                  className={[
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    region === r.id
                      ? "border-archive-teal/50 bg-archive-teal/15 text-[#BCE4DC]"
                      : "border-white/10 bg-transparent text-archive-muted hover:border-white/20 hover:text-[#C6C2BC]",
                  ].join(" ")}
                >
                  {lang === "bn" ? r.bn : r.en}
                  <span className="ml-1.5 opacity-60">
                    {regionCounts[r.id] || 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
              {TAGS.map((t) => (
                <TagChip
                  key={t.id}
                  tag={t.id}
                  lang={lang}
                  active={activeTags.includes(t.id)}
                  onClick={() => toggleTag(t.id)}
                />
              ))}
              {activeTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTags([])}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-archive-muted underline decoration-dotted underline-offset-4 hover:text-[#C6C2BC]"
                >
                  <X className="h-3 w-3" />
                  {pick("Clear filters", "ফিল্টার মুছুন")}
                </button>
              )}
            </div>
          </div>

          {/* Result count */}
          <p className="mt-6 text-sm text-archive-muted">
            {pick(
              `Showing ${filtered.length} of ${timelineEvents.length} entries`,
              `${timelineEvents.length}টির মধ্যে ${filtered.length}টি এন্ট্রি দেখানো হচ্ছে`
            )}
          </p>

          {/* Alternating timeline */}
          <div className="relative mt-10">
            <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-archive-amber via-white/15 to-transparent md:left-1/2 md:-translate-x-1/2" />

            <div className="space-y-10">
              {filtered.map((event, index) => {
                const regionMeta = REGIONS.find((item) => item.id === event.region);
                const placeLeft = index % 2 === 0;

                return (
                  <article
                    key={event.id}
                    className="relative grid gap-5 pl-14 md:grid-cols-2 md:gap-14 md:pl-0"
                  >
                    <span className="absolute left-5 top-7 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-ink-950 bg-archive-amber shadow-[0_0_0_4px_rgba(210,163,86,.16)] md:left-1/2" />

                    <div className={placeLeft ? "md:col-start-1 md:pr-1" : "md:col-start-2 md:pl-1"}>
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-archive-amber/25 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-archive-amber/20 bg-archive-amber/[0.07] px-3 py-1 text-xs font-semibold text-archive-amber">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {event.date} {event.year}
                            </div>
                            <h2 className="mt-4 font-display text-2xl font-semibold leading-snug">
                              {pick(event.title, event.titleBn)}
                            </h2>
                            <span className="mt-2 inline-flex flex-wrap items-center gap-2 text-sm text-archive-muted">
                              <MapPin className="h-3.5 w-3.5" />
                              {pick(event.location, event.locationBn)}
                              {regionMeta && regionMeta.id !== "national" && (
                                <span className="badge border-archive-teal/25 bg-archive-teal/10 text-[#BCE4DC]">
                                  {lang === "bn" ? regionMeta.bn : regionMeta.en}
                                </span>
                              )}
                            </span>
                          </div>

                          {event.tags.includes("death") && (
                            <span className="badge border-red-400/30 bg-red-400/10 text-red-200">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              {pick("Reported deaths", "মৃত্যুর খবর")}
                            </span>
                          )}
                        </div>

                        <p className="mt-4 leading-7 text-[#C6C2BC]">
                          {pick(event.summary, event.summaryBn)}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                          <div className="flex flex-wrap gap-1.5">
                            {event.tags.map((tagId) => {
                              const meta = TAGS.find((item) => item.id === tagId);
                              if (!meta) return null;
                              return (
                                <span key={tagId} className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-archive-muted">
                                  {lang === "bn" ? meta.bn : meta.en}
                                </span>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedSource(expandedSource === event.id ? null : event.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-archive-muted hover:text-archive-amber"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            {pick("Source", "সূত্র")}
                          </button>
                        </div>

                        {expandedSource === event.id && (
                          <p className="mt-3 rounded-lg border border-white/[0.06] bg-black/20 px-4 py-3 text-xs leading-relaxed text-archive-muted">
                            {pick("Source: ", "সূত্র: ")}{event.source}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {!filtered.length && (
                <div className="ml-14 rounded-2xl border border-dashed border-white/10 py-16 text-center text-archive-muted md:ml-0">
                  {pick("No entries match this search or filter combination.", "এই অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো এন্ট্রি নেই।")}
                </div>
              )}
            </div>
          </div>

          {/* Methodology footnote */}
          <div className="mt-14 max-w-4xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-sm leading-6 text-archive-muted">
            <p className="font-semibold text-[#C6C2BC]">
              {pick("A note on sourcing", "সূত্র সম্পর্কে একটি নোট")}
            </p>
            <p className="mt-2">
              {pick(
                "Casualty figures for the movement as a whole are disputed across sources: Bangladesh's health ministry recorded over 1,000 deaths, the UN Human Rights Office estimated more than 1,400, and the student-led Students Against Discrimination platform has cited 1,581. Entries on this page attribute specific figures to the outlet or organisation that reported them rather than presenting a single reconciled total.",
                "সামগ্রিকভাবে আন্দোলনে নিহতের সংখ্যা নিয়ে বিভিন্ন সূত্রে ভিন্নতা রয়েছে: বাংলাদেশ স্বাস্থ্য মন্ত্রণালয় ১,০০০-এর বেশি মৃত্যু নথিভুক্ত করেছে, জাতিসংঘ মানবাধিকার দপ্তরের হিসাবে এই সংখ্যা ১,৪০০-এর বেশি, এবং শিক্ষার্থী নেতৃত্বাধীন ‘বৈষম্যবিরোধী ছাত্র আন্দোলন’ প্ল্যাটফর্ম ১,৫৮১ জনের কথা উল্লেখ করেছে। এই পাতার এন্ট্রিগুলোতে নির্দিষ্ট সংখ্যা একক কোনো চূড়ান্ত হিসাব হিসেবে উপস্থাপনের বদলে যে সংবাদমাধ্যম বা সংস্থা তা প্রতিবেদন করেছে তার নামসহ উল্লেখ করা হয়েছে।"
              )}
            </p>
          </div>
        </div>
      </section>
      
    </>
  );
}