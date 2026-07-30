import { motion } from "framer-motion";
import {
  CheckCircle2,
  LockKeyhole,
  Users,
} from "lucide-react";

import Button from "../ui/Button";
import HeroSlider from "./HeroSlider";
import { useLanguage } from "../../context/LanguageContext";

const trust = [
  {
    en: "Admin verified",
    bn: "অ্যাডমিন যাচাইকৃত",
    icon: CheckCircle2,
  },
  {
    en: "Privacy protected",
    bn: "গোপনীয়তা সুরক্ষিত",
    icon: LockKeyhole,
  },
  {
    en: "Community submitted",
    bn: "কমিউনিটি জমাকৃত",
    icon: Users,
  },
];

export default function Hero() {
  const { pick } = useLanguage();

  return (
    <section className="relative overflow-hidden pb-16 pt-28 md:pb-20 md:pt-32 lg:min-h-[850px] lg:pb-24 lg:pt-36">
      {/* Background effects */}
      <div className="pointer-events-none absolute left-[5%] top-32 h-72 w-72 rounded-full bg-archive-rose/10 blur-[110px]" />

      <div className="pointer-events-none absolute right-[7%] top-24 h-96 w-96 rounded-full bg-archive-amber/10 blur-[130px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[70%] -translate-x-1/2 rounded-full bg-archive-teal/[0.05] blur-[130px]" />

      <div className="page-shell grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 xl:gap-14">
        {/* Left content */}
        <motion.div
          initial={{
            opacity: 0,
            y: 24,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
            ease: "easeOut",
          }}
          className="relative z-20 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-archive-teal/25 bg-archive-teal/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#BCE4DC]">
            <CheckCircle2 className="h-4 w-4" />

            {pick(
              "Verified memories. Preserved with care.",
              "যাচাইকৃত স্মৃতি। যত্নে সংরক্ষিত।",
            )}
          </div>

          <h1 className="mt-7 font-display text-7xl font-semibold leading-[0.89] tracking-[-0.035em] text-archive-paper">
            {pick(
              <>
                Preserving the voices, evidence and{" "}
                <span className="text-archive-amber text-6xl">
                  human stories
                </span>{" "}
                of July.
              </>,
              <>
                জুলাইয়ের কণ্ঠ, প্রমাণ ও{" "}
                <span className="text-archive-amber">
                  মানুষের গল্প
                </span>{" "}
                সংরক্ষণ করি।
              </>,
            )}
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-[#C6C2BC] sm:text-lg">
            {pick(
              "July Smriti is a digital archive for verified photographs, videos, testimonies and events from Bangladesh’s July movement, while connecting injured people and affected families with private, organised support.",
              "July Smriti বাংলাদেশের জুলাই আন্দোলনের যাচাইকৃত ছবি, ভিডিও, সাক্ষ্য ও ঘটনার ডিজিটাল আর্কাইভ। একই সঙ্গে আহত মানুষ ও ক্ষতিগ্রস্ত পরিবারকে ব্যক্তিগত ও সংগঠিত সহায়তার সঙ্গে যুক্ত করে।",
            )}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              to="/archive"
              size="lg"
              showArrow
            >
              {pick(
                "Explore the Archive",
                "আর্কাইভ দেখুন",
              )}
            </Button>

            <Button
              to="/support"
              variant="secondary"
              size="lg"
            >
              {pick(
                "Get Support",
                "সহায়তা নিন",
              )}
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-archive-muted">
            {trust.map(
              ({ en, bn, icon: Icon }, index) => (
                <span
                  key={en}
                  className="inline-flex items-center gap-2"
                >
                  <Icon className="h-4 w-4 text-archive-teal" />

                  {pick(en, bn)}

                  {index < trust.length - 1 && (
                    <span className="ml-2 hidden h-4 w-px bg-white/10 sm:block" />
                  )}
                </span>
              ),
            )}
          </div>

          <p className="mt-7 font-bangla text-xl text-[#E4DFD5]">
            স্মৃতি বাঁচুক, সত্য কথা বলুক।
          </p>
        </motion.div>

        {/* Right image animation */}
        <motion.div
          initial={{
            opacity: 0,
            x: 35,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.85,
            delay: 0.15,
            ease: "easeOut",
          }}
          className="relative z-10 -mx-4 sm:mx-0 lg:-mr-8 xl:-mr-12"
        >
          <HeroSlider />
        </motion.div>
      </div>
    </section>
  );
}