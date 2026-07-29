import { motion } from "framer-motion";
import { CheckCircle2, LockKeyhole, Users } from "lucide-react";
import Button from "../ui/Button";
import HeroSlider from "./HeroSlider";
import { useLanguage } from "../../context/LanguageContext";

const trust = [
  { en: "Admin verified", bn: "অ্যাডমিন যাচাইকৃত", icon: CheckCircle2 },
  { en: "Privacy protected", bn: "গোপনীয়তা সুরক্ষিত", icon: LockKeyhole },
  { en: "Community submitted", bn: "কমিউনিটি জমাকৃত", icon: Users },
];

export default function Hero() {
  const { pick } = useLanguage();
  return (
    <section className="relative overflow-hidden pb-16 pt-28 md:pb-20 md:pt-32 lg:min-h-[860px] lg:pb-24 lg:pt-36">
      <div className="pointer-events-none absolute left-[8%] top-32 h-72 w-72 rounded-full bg-archive-rose/10 blur-[100px]" />
      <div className="pointer-events-none absolute right-[10%] top-24 h-80 w-80 rounded-full bg-archive-amber/10 blur-[110px]" />
      <div className="page-shell grid items-center gap-14 lg:grid-cols-[.92fr_1.08fr] lg:gap-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: "easeOut" }} className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-archive-teal/25 bg-archive-teal/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.15em] text-[#BCE4DC]">
            <CheckCircle2 className="h-4 w-4" /> {pick("Verified memories. Preserved with care.", "যাচাইকৃত স্মৃতি। যত্নে সংরক্ষিত।")}
          </div>
          <h1 className="mt-7 font-display text-[clamp(3.5rem,7vw,5.6rem)] font-semibold leading-[.89] tracking-[-.035em] text-archive-paper">
            {pick(<>Preserving the voices, evidence and <span className="text-archive-amber">human stories</span> of July.</>, <>জুলাইয়ের কণ্ঠ, প্রমাণ ও <span className="text-archive-amber">মানুষের গল্প</span> সংরক্ষণ করি।</>)}
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#C6C2BC] sm:text-lg">
            {pick("July Smriti is a digital archive for verified photographs, videos, testimonies and events from Bangladesh’s July movement, while connecting injured people and affected families with private, organised support.", "July Smriti বাংলাদেশের জুলাই আন্দোলনের যাচাইকৃত ছবি, ভিডিও, সাক্ষ্য ও ঘটনার ডিজিটাল আর্কাইভ। একই সঙ্গে আহত মানুষ ও ক্ষতিগ্রস্ত পরিবারকে ব্যক্তিগত ও সংগঠিত সহায়তার সঙ্গে যুক্ত করে।")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/archive" size="lg" showArrow>{pick("Explore the Archive", "আর্কাইভ দেখুন")}</Button>
            <Button to="/support" variant="secondary" size="lg">{pick("Get Support", "সহায়তা নিন")}</Button>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-archive-muted">
            {trust.map(({ en, bn, icon: Icon }, index) => (
              <span key={en} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-archive-teal" /> {pick(en, bn)}
                {index < trust.length - 1 && <span className="ml-2 hidden h-4 w-px bg-white/10 sm:block" />}
              </span>
            ))}
          </div>
          <p className="mt-7 font-bangla text-xl text-[#E4DFD5]">স্মৃতি বাঁচুক, সত্য কথা বলুক।</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .8, delay: .15 }} className="relative"><HeroSlider /></motion.div>
      </div>
    </section>
  );
}
