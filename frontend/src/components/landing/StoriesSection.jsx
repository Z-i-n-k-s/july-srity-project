import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { heroStories } from "../../data/landingData";
import ImageWithFallback from "../ui/ImageWithFallback";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";
import { useLanguage } from "../../context/LanguageContext";

export default function StoriesSection() {
  const { pick } = useLanguage();
  const featured = heroStories[0];
  const supporting = heroStories.slice(1, 4);

  return (
    <section className="section-pad border-y border-white/[0.06] bg-[#130E15]/65">
      <div className="page-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            label={pick("Stories of July", "জুলাইয়ের গল্প")}
            title={pick("Remembering courage through real lives.", "বাস্তব জীবনের সাহসে স্মরণ।")}
            description={pick("Static memorial profiles honour documented heroes while identity-protected stories remain anonymous by design.", "স্থির স্মৃতি প্রোফাইল নথিভুক্ত বীরদের সম্মান জানায়, আর পরিচয়-সুরক্ষিত গল্পগুলো নকশাগতভাবেই বেনামী থাকে।")}
          />
          <Button to="/stories" variant="secondary" showArrow>{pick("Explore Memorial Stories", "স্মৃতি-গল্প দেখুন")}</Button>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <article className="group relative min-h-[520px] overflow-hidden rounded-2xl border border-archive-rose/20">
            <ImageWithFallback src={featured.image} alt={featured.imageAlt || featured.name} className="absolute inset-0 h-full" imageClassName="transition duration-500 group-hover:scale-[1.025]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09080C] via-[#09080C]/62 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-archive-rose">{featured.category}</p>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[.14em] text-archive-amber">{featured.name}</p>
              <h3 className="mt-2 max-w-3xl font-display text-3xl font-semibold leading-tight text-white md:text-5xl">{featured.title}</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D4CEC6] md:text-base">{featured.summary}</p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-archive-muted"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{featured.date}</span><span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{featured.location}</span></div>
              <Link to={`/stories/${featured.id}`} className="focus-ring mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber">{pick("Read memorial story", "স্মৃতি-গল্প পড়ুন")} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
            </div>
          </article>

          <div className="grid gap-5">
            {supporting.map((story) => (
              <article key={story.id} className="group grid min-h-[176px] grid-cols-[116px_1fr] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] sm:grid-cols-[160px_1fr]">
                <ImageWithFallback src={story.image} alt={story.imageAlt || story.name} className="h-full border-r border-white/[0.06]" imageClassName="transition duration-500 group-hover:scale-[1.025]" loading="lazy" />
                <div className="flex flex-col p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-archive-rose">{story.category}</p>
                  <p className="mt-2 text-xs font-semibold text-archive-amber">{story.name}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold leading-snug text-white">{story.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-archive-muted">{story.summary}</p>
                  <Link to={`/stories/${story.id}`} className="focus-ring mt-auto inline-flex items-center gap-2 rounded pt-4 text-sm font-semibold text-archive-amber">{pick("Read story", "গল্প পড়ুন")} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
