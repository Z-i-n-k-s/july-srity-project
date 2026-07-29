import { useEffect, useState } from "react";
import { CalendarDays, FileCheck2, Loader2, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import StatusBadge from "../../components/ui/StatusBadge";
import { featuredArchive } from "../../data/landingData";
import { publicApi, unwrap } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function ArchiveDetailsPage() {
  const { id } = useParams();
  const fallback = featuredArchive.find((record) => record.id === id) || null;
  const [item, setItem] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    publicApi.archiveDetail(id, fallback ? { data: fallback } : null).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (data && !Array.isArray(data)) setItem(data);
    }).catch(() => {}).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading && !item) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-9 w-9 animate-spin text-archive-amber" /></div>;
  if (!item) return <div className="page-shell min-h-screen pt-36"><h1 className="font-display text-5xl">{pick("Record not found", "রেকর্ড পাওয়া যায়নি")}</h1><Button to="/archive" className="mt-6">{pick("Back to Archive", "আর্কাইভে ফিরুন")}</Button></div>;

  return (
    <article className="page-shell pb-20 pt-32">
      <Link to="/archive" className="text-sm font-semibold text-archive-amber hover:underline">← {pick("Back to archive", "আর্কাইভে ফিরুন")}</Link>
      <div className="mt-6 grid gap-9 lg:grid-cols-[1.15fr_.85fr]">
        <div><ImageWithFallback src={item.image || item.thumbnail} alt={item.title} className="aspect-[16/10] rounded-2xl border border-white/10" /><div className="mt-7"><div className="flex flex-wrap items-center gap-3"><span className="eyebrow">{item.type}</span><StatusBadge status={item.status || (item.verified ? "Verified" : "Reviewed")} /></div><h1 className="mt-4 font-display text-5xl font-semibold leading-[.98] md:text-6xl">{item.title}</h1><p className="muted-copy mt-6">{item.description || item.summary}</p>{item.body && <p className="mt-5 whitespace-pre-wrap leading-8 text-[#B9B5AE]">{item.body}</p>}</div></div>
        <aside className="space-y-5"><div className="surface-card rounded-2xl p-6"><h2 className="font-display text-2xl font-semibold">{pick("Record information", "রেকর্ডের তথ্য")}</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex gap-3"><CalendarDays className="h-5 w-5 text-archive-amber" /><div><dt className="text-archive-muted">{pick("Date", "তারিখ")}</dt><dd className="mt-1 text-white">{item.date || item.eventDate || "—"}</dd></div></div><div className="flex gap-3"><MapPin className="h-5 w-5 text-archive-amber" /><div><dt className="text-archive-muted">{pick("Location", "স্থান")}</dt><dd className="mt-1 text-white">{item.location || "—"}</dd></div></div><div className="flex gap-3"><UserRound className="h-5 w-5 text-archive-amber" /><div><dt className="text-archive-muted">{pick("Contributor", "জমাদানকারী")}</dt><dd className="mt-1 text-white">{item.contributor || item.attribution || pick("Identity protected", "পরিচয় সুরক্ষিত")}</dd></div></div></dl></div><div className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.07] p-6"><ShieldCheck className="h-6 w-6 text-archive-teal" /><h2 className="mt-4 font-semibold">{pick("Verification note", "যাচাই নোট")}</h2><p className="mt-2 text-sm leading-6 text-[#B9CFCB]">{item.verificationNote || pick("The public source context and privacy settings were reviewed before publication.", "প্রকাশের আগে উৎসের প্রেক্ষাপট ও গোপনীয়তা সেটিংস পর্যালোচনা করা হয়েছে।")}</p></div><div className="surface-card rounded-2xl p-6"><FileCheck2 className="h-6 w-6 text-archive-amber" /><h2 className="mt-4 font-semibold">{pick("Source records", "উৎস রেকর্ড")}</h2><p className="mt-2 text-sm leading-6 text-archive-muted">{pick("Original files and private contributor details remain protected. Only approved references are public.", "মূল ফাইল ও জমাদানকারীর ব্যক্তিগত তথ্য সুরক্ষিত থাকে। কেবল অনুমোদিত রেফারেন্স প্রকাশ্য।")}</p></div></aside>
      </div>
    </article>
  );
}
