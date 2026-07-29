import { FileCheck2, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const items = [
  { en: "Community submitted", bn: "কমিউনিটি জমাকৃত", icon: Users },
  { en: "Admin verified", bn: "অ্যাডমিন যাচাইকৃত", icon: ShieldCheck },
  { en: "Consent-based publishing", bn: "সম্মতিভিত্তিক প্রকাশ", icon: FileCheck2 },
  { en: "Sensitive data protected", bn: "সংবেদনশীল তথ্য সুরক্ষিত", icon: LockKeyhole },
];

export default function TrustStrip() {
  const { pick } = useLanguage();
  return <section className="border-y border-white/[0.08] bg-ink-900/70"><div className="page-shell grid grid-cols-2 divide-x divide-y divide-white/[0.07] sm:divide-y-0 lg:grid-cols-4">{items.map(({ en, bn, icon: Icon }) => <div key={en} className="flex min-h-24 items-center gap-3 px-4 py-5 sm:px-6"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-archive-teal/20 bg-archive-teal/10 text-archive-teal"><Icon className="h-5 w-5" /></span><span className="text-sm font-medium leading-5 text-[#D5D1CA]">{pick(en, bn)}</span></div>)}</div></section>;
}
