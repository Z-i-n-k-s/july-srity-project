import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { archiveCategories } from "../../data/landingData";
import ImageWithFallback from "../ui/ImageWithFallback";
import SectionHeading from "../ui/SectionHeading";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../context/LanguageContext";

const spans = {
  large: "md:col-span-2 md:row-span-2 min-h-[430px]",
  small: "min-h-[205px]",
  medium: "md:row-span-2 min-h-[430px]",
  wide: "md:col-span-2 min-h-[250px]",
};

export default function ArchiveOverview() {
  const { pick } = useLanguage();
  return (
    <section className="section-pad" id="archive-overview">
      <div className="page-shell">
        <SectionHeading label={pick("The July Archive", "জুলাই আর্কাইভ")} title={pick("A living record of courage, loss and resistance.", "সাহস, ক্ষতি ও প্রতিরোধের জীবন্ত দলিল।")} description={pick("Explore verified moments from July through photographs, videos, personal accounts, documents and a chronological record of events.", "ছবি, ভিডিও, ব্যক্তিগত বিবরণ, নথি ও কালানুক্রমিক ঘটনাপঞ্জির মাধ্যমে জুলাইয়ের যাচাইকৃত মুহূর্ত দেখুন।")} />
        <div className="mt-10 grid auto-rows-fr gap-4 md:grid-cols-3">
          {archiveCategories.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .07 }} className={cn("group relative overflow-hidden rounded-2xl border border-white/[0.08]", spans[item.size])}>
                <Link to={`/archive?type=${item.id}`} className="focus-ring absolute inset-0 z-20 rounded-2xl" aria-label={`Browse ${item.name}`} />
                <ImageWithFallback src={item.image} alt={`${item.name} archive category`} className="absolute inset-0 h-full" imageClassName="transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080A11] via-[#080A11]/55 to-transparent transition group-hover:via-[#080A11]/45" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/25 text-archive-amber backdrop-blur"><Icon className="h-5 w-5" /></span>
                    <ArrowUpRight className="h-5 w-5 text-white/60 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-archive-amber" />
                  </div>
                  <h3 className="mt-5 font-display text-3xl font-semibold text-white">{item.name}</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#C9C5BE]">{item.description}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[.15em] text-archive-amber">{item.count}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
