import { useEffect, useState } from "react";
import { Archive, ArrowRight, CheckCircle2, Clock3, FileCheck2, HeartHandshake, Search, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi, unwrap } from "../../lib/api";
import { adminDashboardFallback } from "../../data/adminData";
import { useLanguage } from "../../context/LanguageContext";

const toneClass = {
  amber: "border-archive-amber/20 bg-archive-amber/[0.08] text-archive-amber",
  rose: "border-archive-rose/20 bg-archive-rose/[0.08] text-archive-rose",
  teal: "border-archive-teal/20 bg-archive-teal/[0.08] text-archive-teal",
};

const queueItems = [
  { title: "Evidence and story review", titleBn: "তথ্য ও গল্প পর্যালোচনা", description: "Check source context, privacy controls and publication consent.", descriptionBn: "উৎস, গোপনীয়তা এবং প্রকাশের সম্মতি যাচাই করুন।", to: "/admin-panel/submissions", icon: FileCheck2, count: 28, tone: "amber" },
  { title: "Support case coordination", titleBn: "সহায়তা কেস সমন্বয়", description: "Reply to requesters and verify only requested medical documents.", descriptionBn: "ব্যবহারকারীকে উত্তর দিন এবং কেবল প্রয়োজনীয় চিকিৎসা নথি যাচাই করুন।", to: "/admin-panel/support-cases", icon: HeartHandshake, count: 14, tone: "rose" },
  { title: "Missing-person verification", titleBn: "নিখোঁজ রিপোর্ট যাচাই", description: "Confirm reporter relationship, consent and safe public details.", descriptionBn: "রিপোর্টারের সম্পর্ক, সম্মতি এবং নিরাপদ প্রকাশ্য তথ্য নিশ্চিত করুন।", to: "/admin-panel/missing-reports", icon: Search, count: 9, tone: "rose" },
  { title: "Archive publication", titleBn: "আর্কাইভ প্রকাশ", description: "Publish approved redacted versions and maintain corrections.", descriptionBn: "অনুমোদিত ও সম্পাদিত সংস্করণ প্রকাশ করুন এবং সংশোধন সংরক্ষণ করুন।", to: "/admin-panel/archive-manager", icon: Archive, count: 7, tone: "teal" },
];

export default function AdminDashboard() {
  const [data, setData] = useState(adminDashboardFallback);
  const [loading, setLoading] = useState(true);
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    adminApi.dashboard(adminDashboardFallback).then((payload) => {
      if (!active) return;
      const next = unwrap(payload);
      setData(next?.stats ? next : adminDashboardFallback);
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-archive-amber/[0.09] via-white/[0.025] to-archive-rose/[0.07] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="eyebrow">{pick("Administrator workspace", "অ্যাডমিন কর্মক্ষেত্র")}</p><h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.02] sm:text-5xl">{pick("Review every record with care, context and accountable decisions.", "প্রতিটি তথ্য যত্ন, প্রেক্ষাপট ও জবাবদিহিমূলক সিদ্ধান্তের সাথে পর্যালোচনা করুন।")}</h2><p className="mt-5 max-w-3xl text-sm leading-7 text-[#C6C2BC] sm:text-base">{pick("Original uploads stay private. Only approved, consent-safe and identity-protected versions should enter the public archive.", "মূল আপলোড ব্যক্তিগত থাকবে। কেবল অনুমোদিত, সম্মতিপূর্ণ এবং পরিচয়-সুরক্ষিত সংস্করণ প্রকাশ্য আর্কাইভে যাবে।")}</p></div>
          <div className="rounded-xl border border-archive-teal/20 bg-archive-teal/[0.08] p-4 text-sm text-[#B9CFCB]"><CheckCircle2 className="h-5 w-5 text-archive-teal" /><p className="mt-3 font-semibold text-white">{pick("Privacy-first review active", "গোপনীয়তা-প্রথম পর্যালোচনা সক্রিয়")}</p><p className="mt-1 text-xs leading-5">{pick("All public actions require explicit admin approval.", "সব প্রকাশ্য কাজের জন্য অ্যাডমিন অনুমোদন প্রয়োজন।")}</p></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data.stats || adminDashboardFallback.stats).map((item) => (
          <article key={item.key} className="admin-card">
            <div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl border ${toneClass[item.tone] || toneClass.amber}`}>{item.tone === "rose" ? <ShieldAlert className="h-5 w-5" /> : item.tone === "teal" ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-archive-muted">{item.trend}</span></div>
            <p className="mt-5 text-3xl font-bold text-white">{loading ? "—" : Number(item.value || 0).toLocaleString()}</p>
            <p className="mt-2 text-sm leading-6 text-archive-muted">{pick(item.label, item.labelBn)}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">{pick("Review queues", "পর্যালোচনা কিউ")}</p><h2 className="mt-2 font-display text-3xl font-semibold">{pick("Work that needs attention", "যে কাজগুলো এখন প্রয়োজন")}</h2></div></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {queueItems.map(({ title, titleBn, description, descriptionBn, to, icon: Icon, count, tone }) => <Link key={to} to={to} className="focus-ring group admin-card flex items-start gap-4 transition hover:-translate-y-0.5 hover:border-archive-amber/25"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${toneClass[tone]}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className="font-display text-2xl font-semibold text-white">{pick(title, titleBn)}</span><span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-bold text-white">{count}</span></span><span className="mt-2 block text-sm leading-6 text-archive-muted">{pick(description, descriptionBn)}</span><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-archive-amber">{pick("Open queue", "কিউ খুলুন")}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></span></Link>)}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="admin-card"><div className="flex items-center justify-between"><div><p className="eyebrow">{pick("Recent activity", "সাম্প্রতিক কার্যক্রম")}</p><h2 className="mt-2 font-display text-3xl font-semibold">{pick("Latest protected actions", "সর্বশেষ সুরক্ষিত কার্যক্রম")}</h2></div></div><div className="mt-5 divide-y divide-white/[0.07]">{(data.recentActivity || []).map((item) => <div key={item.id} className="flex items-start gap-3 py-4"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-archive-amber" /><div><p className="text-sm font-semibold text-white">{item.title}</p><p className="mt-1 text-xs text-archive-muted">{item.meta}</p></div></div>)}</div></div>
        <div className="admin-card"><p className="eyebrow">{pick("Review standard", "পর্যালোচনা মানদণ্ড")}</p><h2 className="mt-2 font-display text-3xl font-semibold">{pick("Before approving", "অনুমোদনের আগে")}</h2><div className="mt-5 space-y-4 text-sm leading-6 text-[#C6C2BC]">{[
          pick("Confirm the source and event context without overstating certainty.", "নিশ্চয়তা বাড়িয়ে না বলে উৎস ও ঘটনার প্রেক্ষাপট যাচাই করুন।"),
          pick("Apply the contributor’s identity, face, voice and metadata protections.", "জমাদানকারীর পরিচয়, মুখ, কণ্ঠ এবং মেটাডাটা সুরক্ষা প্রয়োগ করুন।"),
          pick("Publish only the approved derivative, never the private original.", "কেবল অনুমোদিত সংস্করণ প্রকাশ করুন, ব্যক্তিগত মূল ফাইল নয়।"),
          pick("Record the reason, reviewer and timestamp for every decision.", "প্রতিটি সিদ্ধান্তের কারণ, রিভিউয়ার ও সময় সংরক্ষণ করুন।"),
        ].map((text) => <p key={text} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-archive-teal" />{text}</p>)}</div></div>
      </section>
    </div>
  );
}
