import { motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { featuredArchive } from "../../data/landingData";
import ImageWithFallback from "../ui/ImageWithFallback";
import StatusBadge from "../ui/StatusBadge";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";
import { useLanguage } from "../../context/LanguageContext";

export default function FeaturedArchive() {
  const { pick } = useLanguage();
  return (
    <section className="section-pad border-y border-white/[0.06] bg-ink-900/45">
      <div className="page-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading label={pick("Featured records", "নির্বাচিত রেকর্ড")} title={pick("Reviewed documentary material, ready to explore.", "পর্যালোচিত ডকুমেন্টারি উপাদান, দেখার জন্য প্রস্তুত।")} description={pick("Every item shown publicly includes a review status, source note and privacy-aware presentation.", "প্রকাশ্য প্রতিটি উপাদানে পর্যালোচনার অবস্থা, উৎসের নোট ও গোপনীয়তাসচেতন উপস্থাপন থাকে।")} />
          <Button to="/archive" variant="secondary" showArrow>{pick("View the Full Archive", "সম্পূর্ণ আর্কাইভ দেখুন")}</Button>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredArchive.map((item, index) => (
            <motion.article key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (index % 3) * .08 }} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-archive-amber/30 hover:bg-white/[0.045] hover:shadow-warm">
              <Link to={`/archive/${item.id}`} className="focus-ring block">
                <ImageWithFallback src={item.image} alt={item.title} className="aspect-[16/10]" imageClassName="transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[.16em] text-archive-amber">{item.type}</span>
                    <StatusBadge status="Verified" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold leading-tight text-white">{item.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-archive-muted">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{item.date}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{item.location}</span>
                  </div>
                  <p className="line-clamp-3 mt-4 text-sm leading-6 text-[#BDB9B2]">{item.description}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                    <span className="text-xs text-archive-muted">{item.contributor}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-archive-paper">{pick("View details", "বিস্তারিত দেখুন")} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" /></span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
