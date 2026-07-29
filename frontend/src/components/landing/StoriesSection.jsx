import { ArrowUpRight, MapPin, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { stories } from "../../data/landingData";
import ImageWithFallback from "../ui/ImageWithFallback";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";
import { useLanguage } from "../../context/LanguageContext";

export default function StoriesSection() {
  const { pick } = useLanguage();
  return (
    <section className="section-pad border-y border-white/[0.06] bg-[#130E15]/65">
      <div className="page-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading label={pick("Stories and testimonies", "গল্প ও সাক্ষ্য")} title={pick("The people behind the history.", "ইতিহাসের পেছনের মানুষগুলো।")} description={pick("Personal accounts are published with consent, identity choices and careful review of sensitive details.", "সম্মতি, পরিচয় পছন্দ ও সংবেদনশীল তথ্যের সতর্ক পর্যালোচনার পর ব্যক্তিগত বিবরণ প্রকাশিত হয়।")} />
          <Button to="/stories" variant="secondary" showArrow>{pick("View Verified Stories", "যাচাইকৃত গল্প দেখুন")}</Button>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <article className="group relative min-h-[520px] overflow-hidden rounded-2xl border border-archive-rose/20">
            <ImageWithFallback src={stories[0].image} alt={stories[0].name} className="absolute inset-0 h-full" imageClassName="transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A080C] via-[#0A080C]/58 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
              <Quote className="h-9 w-9 text-archive-rose" />
              <blockquote className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight text-white md:text-4xl">“{stories[0].quote}”</blockquote>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[#D6D1CA]">
                <strong>{stories[0].name}</strong><span className="text-white/20">•</span><span>{stories[0].category}</span><span className="inline-flex items-center gap-1.5 text-archive-muted"><MapPin className="h-4 w-4" />{stories[0].location}</span>
              </div>
              <Link to={`/stories/${stories[0].id}`} className="focus-ring mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber">{pick("Read story", "গল্প পড়ুন")} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
            </div>
          </article>
          <div className="grid gap-5">
            {stories.slice(1).map((story) => (
              <article key={story.id} className="group grid min-h-[250px] grid-cols-[130px_1fr] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] sm:grid-cols-[180px_1fr]">
                <ImageWithFallback src={story.image} alt={story.name} className="h-full" imageClassName="transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
                <div className="flex flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-[.15em] text-archive-rose">{story.category}</p>
                  <blockquote className="mt-3 font-display text-xl font-semibold leading-snug text-white">“{story.quote}”</blockquote>
                  <p className="mt-3 text-xs text-archive-muted">{story.name} • {story.location}</p>
                  <Link to={`/stories/${story.id}`} className="focus-ring mt-auto inline-flex items-center gap-2 rounded pt-5 text-sm font-semibold text-archive-amber">{pick("Read story", "গল্প পড়ুন")} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
