import Button from "../ui/Button";
import { useLanguage } from "../../context/LanguageContext";

export default function SubmissionCTA() {
  const { pick } = useLanguage();
  return (
    <section className="section-pad">
      <div className="page-shell">
        <div className="relative overflow-hidden rounded-3xl border border-archive-amber/20 bg-[#17110F] px-6 py-14 sm:px-10 md:px-14 md:py-20">
          <img src="/images/cta/archive-cta.svg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0A0D] via-[#0B0A0D]/90 to-[#0B0A0D]/40" />
          <div className="relative max-w-2xl">
            <p className="eyebrow">{pick("Contribute to the record", "ইতিহাসে অবদান রাখুন")}</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.02] text-white md:text-6xl">{pick("Your memory may be part of the historical record.", "আপনার স্মৃতি ইতিহাসের অংশ হতে পারে।")}</h2>
            <p className="muted-copy mt-5">{pick("Submit photographs, videos, stories, documents or first-hand testimony. Your content will remain private until it is reviewed and approved.", "ছবি, ভিডিও, গল্প, নথি বা প্রত্যক্ষ সাক্ষ্য জমা দিন। পর্যালোচনা ও অনুমোদনের আগে সবকিছু ব্যক্তিগত থাকবে।")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button to="/submit" size="lg" showArrow>{pick("Submit Your Evidence", "আপনার তথ্য জমা দিন")}</Button><Button to="/submit?type=story" variant="secondary" size="lg">{pick("Share a Story", "গল্প শেয়ার করুন")}</Button></div>
            <p className="mt-5 text-sm text-archive-muted">{pick("Choose whether your name is public, hidden or replaced with a pseudonym.", "আপনার নাম প্রকাশ্য, গোপন বা ছদ্মনামে থাকবে কি না নির্বাচন করুন।")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
