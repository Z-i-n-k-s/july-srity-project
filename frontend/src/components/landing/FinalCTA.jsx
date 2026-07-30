import { Archive, HeartHandshake } from "lucide-react";
import Button from "../ui/Button";
import { useLanguage } from "../../context/LanguageContext";

export default function FinalCTA() {
  const { pick } = useLanguage();
  return (
    <section className="pb-20 md:pb-28">
      <div className="page-shell grid overflow-hidden rounded-3xl border border-white/[0.08] md:grid-cols-2">
        <div className="bg-gradient-to-br from-archive-amber/14 to-[#1A1512] p-7 sm:p-10 md:p-12">
          <Archive className="h-8 w-8 text-archive-amber" />
          <p className="eyebrow mt-7">{pick("Preserve a memory", "একটি স্মৃতি সংরক্ষণ করুন")}</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-white">{pick("Submit documentary material", "ডকুমেন্টারি উপাদান জমা দিন")}</h2>
          <p className="mt-4 text-sm leading-7 text-[#C6C2BC]">Help build a reviewed, source-aware public record while keeping your privacy choices clear.</p>
          <Button to="/submit" className="mt-7" showArrow>{pick("Submit Evidence", "তথ্য জমা দিন")}</Button>
        </div>
        <div className="border-t border-white/[0.08] bg-gradient-to-br from-archive-teal/13 to-[#0E1818] p-7 sm:p-10 md:border-l md:border-t-0 md:p-12">
          <HeartHandshake className="h-8 w-8 text-archive-teal" />
          <p className="mt-7 text-[11px] font-semibold uppercase tracking-[.22em] text-archive-teal sm:text-xs">{pick("Request support", "সহায়তা চান")}</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-white">{pick("Open a private Support Room", "ব্যক্তিগত সহায়তা কক্ষ খুলুন")}</h2>
          <p className="mt-4 text-sm leading-7 text-[#C6C2BC]">Submit your need, communicate privately and follow each update through a clear case timeline.</p>
          <Button to="/support/new" variant="teal" className="mt-7" showArrow>{pick("Get Support", "সহায়তা নিন")}</Button>
        </div>
      </div>
    </section>
  );
}
