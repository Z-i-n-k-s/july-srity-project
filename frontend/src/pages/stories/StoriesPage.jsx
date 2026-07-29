import { useEffect, useMemo, useState } from "react";
import { MapPin, Quote, Search } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import { stories as fallbackStories } from "../../data/landingData";
import { publicApi, unwrap } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function StoriesPage() {
  const [records, setRecords] = useState(fallbackStories);
  const [query, setQuery] = useState("");
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    publicApi.stories(fallbackStories).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setRecords(data);
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => records.filter((story) => `${story.name || story.publicName || ""} ${story.location || ""} ${story.category || ""} ${story.quote || story.summary || ""}`.toLowerCase().includes(query.toLowerCase())), [records, query]);
  return (
    <>
      <PageHeader label={pick("Verified testimony", "যাচাইকৃত সাক্ষ্য")} title={pick("Stories from the people behind the history", "ইতিহাসের পেছনের মানুষের গল্প")} description={pick("Read consent-based personal accounts presented with privacy choices, source review and respectful editorial context.", "গোপনীয়তা পছন্দ, উৎস যাচাই ও সম্মানজনক প্রেক্ষাপটসহ সম্মতিপূর্ণ ব্যক্তিগত বিবরণ পড়ুন।")} />
      <section className="section-pad"><div className="page-shell">
        <label className="relative block max-w-xl"><span className="sr-only">Search stories</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input className="field-control pl-12" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={pick("Search stories, locations or categories", "গল্প, স্থান বা ধরন খুঁজুন")} /></label>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">{filtered.map((story, index) => <article key={story.id || story._id} className={`group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] ${index === 0 ? "lg:col-span-2 lg:grid lg:grid-cols-[1.05fr_.95fr]" : ""}`}><ImageWithFallback src={story.image || story.thumbnail} alt={story.name || story.publicName || "Protected contributor"} className={index === 0 ? "min-h-80" : "aspect-[16/11]"} imageClassName="transition duration-500 group-hover:scale-[1.03]" /><div className="flex flex-col p-6"><Quote className="h-7 w-7 text-archive-rose" /><blockquote className={`mt-4 font-display font-semibold leading-tight text-white ${index === 0 ? "text-3xl md:text-4xl" : "text-2xl"}`}>“{story.quote || story.summary}”</blockquote><p className="mt-5 text-sm font-semibold text-[#E5E0D8]">{story.name || story.publicName || pick("Identity protected", "পরিচয় সুরক্ষিত")}</p><p className="mt-2 flex items-center gap-2 text-xs text-archive-muted"><MapPin className="h-3.5 w-3.5" />{story.location} • {story.category}</p><Link to={`/stories/${story.id || story._id}`} className="focus-ring mt-7 inline-flex w-fit rounded text-sm font-semibold text-archive-amber">{pick("Read verified story →", "যাচাইকৃত গল্প পড়ুন →")}</Link></div></article>)}</div>
      </div></section>
    </>
  );
}
