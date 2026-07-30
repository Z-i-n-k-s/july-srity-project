import { ArrowRight, BookOpen, LockKeyhole, Scale, Search, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import PageHeader from "../../components/ui/PageHeader";
import { aynaghorOverview, aynaghorStories } from "../../data/landingData";
import { useLanguage } from "../../context/LanguageContext";

export default function AynaghorPage() {
  const { pick } = useLanguage();

  return (
    <>
      <PageHeader
        label={pick("A separate chapter of July", "জুলাইয়ের একটি স্বতন্ত্র অধ্যায়")}
        title={pick("Aynaghor: return, testimony and those still missing", "আয়নাঘর: ফিরে আসা, সাক্ষ্য এবং এখনও নিখোঁজ মানুষ")}
        description={pick(
          "A dedicated archive of secret-detention allegations, survivor accounts, family searches and unresolved disappearance cases. Allegations are attributed and are not presented as court findings.",
          "গোপন আটক সংক্রান্ত অভিযোগ, ফিরে আসা ব্যক্তিদের সাক্ষ্য, পরিবারের অনুসন্ধান এবং অমীমাংসিত গুমের ঘটনাগুলোর জন্য আলাদা আর্কাইভ। অভিযোগগুলো উৎসসহ উপস্থাপিত, আদালতের রায় হিসেবে নয়।",
        )}
      />

      <section className="section-pad pt-0">
        <div className="page-shell">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <article className="overflow-hidden rounded-3xl border border-archive-rose/20 bg-gradient-to-br from-archive-rose/[0.1] via-white/[0.025] to-transparent p-6 sm:p-8">
              <div className="flex items-center gap-3 text-archive-rose">
                <LockKeyhole className="h-6 w-6" />
                <span className="text-xs font-semibold uppercase tracking-[.16em]">
                  {pick(aynaghorOverview.label, "গোপন অধ্যায়")}
                </span>
              </div>
              <h2 className="mt-5 font-display text-4xl font-semibold text-white">
                {pick(aynaghorOverview.title, "আয়নাঘর কী?")}
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#E0D8D1]">
                {pick(aynaghorOverview.meaning, "আয়নাঘর শব্দের অর্থ ‘House of Mirrors’। বেঁচে ফেরা ব্যক্তি, পরিবার ও অনুসন্ধানী প্রতিবেদনে বর্ণিত গোপন আটককক্ষের সঙ্গে এই নামটি যুক্ত হয়।")}
              </p>
              <p className="mt-5 text-sm leading-7 text-[#C6C2BC]">
                {pick(aynaghorOverview.description, "বিভিন্ন প্রতিবেদনে অভিযোগ করা হয়েছে যে কিছু মানুষকে পরিবারের অজান্তে নিরাপত্তা বা গোয়েন্দা সংস্থার সঙ্গে যুক্ত স্থানে যোগাযোগবিহীন অবস্থায় রাখা হয়েছিল। আগস্ট ২০২৪-এর পরিবর্তনের পর কয়েকজন দীর্ঘদিন নিখোঁজ ব্যক্তি ফিরে আসেন, কিন্তু বহু পরিবারের অনুসন্ধান শেষ হয়নি।")}
              </p>
            </article>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-archive-amber/20 bg-archive-amber/[0.06] p-5">
                <BookOpen className="h-5 w-5 text-archive-amber" />
                <h3 className="mt-3 font-display text-2xl font-semibold">{pick("How this archive reads testimony", "এই আর্কাইভ কীভাবে সাক্ষ্য উপস্থাপন করে")}</h3>
                <p className="mt-3 text-sm leading-7 text-archive-muted">{pick(aynaghorOverview.editorialNote, "এই অংশে প্রকাশ্য প্রতিবেদন, বেঁচে ফেরা ব্যক্তির বিবরণ ও পরিবারের সাক্ষ্য ব্যবহার করা হয়। অমীমাংসিত ঘটনার অবস্থা স্পষ্টভাবে চিহ্নিত করা হয়।")}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><Scale className="h-5 w-5 text-archive-teal" /><p className="mt-3 font-semibold">{pick("Attributed claims", "উৎসসহ দাবি")}</p><p className="mt-2 text-sm leading-6 text-archive-muted">{pick("Every allegation should identify whether it comes from a survivor, family, report or investigation.", "প্রতিটি অভিযোগে তা বেঁচে ফেরা ব্যক্তি, পরিবার, প্রতিবেদন বা তদন্ত—কোন উৎস থেকে এসেছে তা উল্লেখ থাকবে।")}</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><Search className="h-5 w-5 text-archive-rose" /><p className="mt-3 font-semibold">{pick("Unresolved cases", "অমীমাংসিত ঘটনা")}</p><p className="mt-2 text-sm leading-6 text-archive-muted">{pick("Families still searching are not reduced to statistics; their privacy and uncertainty are preserved.", "এখনও খুঁজছেন এমন পরিবারগুলোকে শুধু সংখ্যায় সীমাবদ্ধ করা হয় না; তাদের গোপনীয়তা ও অনিশ্চয়তা সংরক্ষিত থাকে।")}</p></div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-end justify-between gap-4">
            <div><p className="eyebrow">{pick("People and families", "মানুষ ও পরিবার")}</p><h2 className="mt-2 font-display text-4xl font-semibold">{pick("Accounts connected to Aynaghor", "আয়নাঘরের সঙ্গে যুক্ত বিবরণ")}</h2></div>
            <span className="hidden rounded-full border border-archive-rose/20 bg-archive-rose/[0.06] px-3 py-1 text-xs text-archive-rose sm:inline-flex"><ShieldAlert className="mr-2 h-4 w-4" />{pick("Sensitive archive", "সংবেদনশীল আর্কাইভ")}</span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {aynaghorStories.map((story) => (
              <article key={story.id} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition hover:-translate-y-1 hover:border-archive-rose/30">
                <ImageWithFallback src={story.image} alt={story.name} className="aspect-[16/10]" fallbackText={pick("Add a respectful archive image from assets", "assets থেকে সম্মানজনক আর্কাইভ ছবি যোগ করুন")} />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[.15em] text-archive-rose">{pick(story.status || story.collection || "Aynaghor account", "আয়নাঘর বিবরণ")}</p>
                  <h3 className="mt-3 font-display text-2xl font-semibold text-white">{story.name}</h3>
                  <p className="mt-3 line-clamp-4 text-sm leading-7 text-archive-muted">{story.summary}</p>
                  <Link to={`/stories/${story.id}`} className="focus-ring mt-5 inline-flex items-center gap-2 text-sm font-semibold text-archive-amber">{pick("Read the documented account", "নথিভুক্ত বিবরণ পড়ুন")}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
