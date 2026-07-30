import { ArrowRight, BookOpen, Heart, Quote, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import PageHeader from "../../components/ui/PageHeader";
import { heroStories, julyMovementSummary } from "../../data/landingData";
import { useLanguage } from "../../context/LanguageContext";

export default function StoriesPage() {
  const { pick } = useLanguage();

  return (
    <>
      <PageHeader
        label={pick("Human stories of July", "জুলাইয়ের মানুষের গল্প")}
        title={pick("Courage, care and sacrifice", "সাহস, যত্ন ও আত্মত্যাগ")}
        description={pick(
          "This page is dedicated to people whose actions, lives and losses became part of the July uprising. Aynaghor is now preserved as a separate major archive chapter.",
          "এই পাতা জুলাই গণঅভ্যুত্থানে যাদের কাজ, জীবন ও ক্ষতি স্মৃতির অংশ হয়েছে তাদের জন্য। আয়নাঘর এখন একটি আলাদা গুরুত্বপূর্ণ আর্কাইভ অধ্যায়।",
        )}
      />

      <section className="section-pad pt-0">
        <div className="page-shell">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <article className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
              <div className="flex items-center gap-3 text-archive-amber"><BookOpen className="h-5 w-5" /><span className="eyebrow">{pick("How the movement unfolded", "আন্দোলন কীভাবে এগিয়েছে")}</span></div>
              <h2 className="mt-4 font-display text-4xl font-semibold text-white">{pick(julyMovementSummary.title, "কোটা সংস্কারের দাবি থেকে গণঅভ্যুত্থান")}</h2>
              <p className="mt-5 text-sm leading-7 text-[#CFC9C1]">{pick(julyMovementSummary.intro, "সরকারি চাকরির কোটা সংস্কারের দাবিতে শুরু হওয়া আন্দোলন দ্রুত ন্যায়বিচার, জবাবদিহি এবং রাষ্ট্রীয় সহিংসতার অবসানের বৃহত্তর দাবিতে রূপ নেয়।")}</p>
              <p className="mt-4 text-sm leading-7 text-[#CFC9C1]">{pick(julyMovementSummary.closing, "৫ আগস্ট ২০২৪-এ শেখ হাসিনা পদত্যাগ করে ভারতে চলে যান। এরপর দীর্ঘদিন গোপন আটক থাকা কয়েকজন ফিরে আসেন, তবে বহু পরিবার এখনও উত্তরের অপেক্ষায়।")}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">{(julyMovementSummary.phases || []).map((phase, index) => <div key={`${phase.date}-${phase.title}`} className="rounded-2xl border border-white/[0.08] bg-black/10 p-4"><span className="text-xs font-semibold uppercase tracking-[.13em] text-archive-amber">{phase.date}</span><h3 className="mt-2 font-semibold text-white">{phase.title}</h3><p className="mt-2 text-xs leading-6 text-archive-muted">{phase.text}</p></div>)}</div>
            </article>

            <aside className="rounded-3xl border border-archive-rose/20 bg-gradient-to-br from-archive-rose/[0.1] to-transparent p-6 sm:p-8">
              <ShieldCheck className="h-7 w-7 text-archive-rose" />
              <h2 className="mt-5 font-display text-4xl font-semibold">{pick("Aynaghor has its own archive", "আয়নাঘরের নিজস্ব আর্কাইভ")}</h2>
              <p className="mt-4 text-sm leading-7 text-[#D5CBC7]">{pick("Secret detention allegations, survivor returns and unresolved disappearance cases should not be hidden inside a general stories page.", "গোপন আটক সংক্রান্ত অভিযোগ, বেঁচে ফেরা ব্যক্তি এবং অমীমাংসিত গুমের ঘটনা সাধারণ গল্পের ভেতরে লুকিয়ে রাখা উচিত নয়।")}</p>
              <Link to="/aynaghor" className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-archive-rose px-4 py-3 text-sm font-semibold text-white">{pick("Open the Aynaghor archive", "আয়নাঘর আর্কাইভ খুলুন")}<ArrowRight className="h-4 w-4" /></Link>
            </aside>
          </div>

          <div className="mt-14"><p className="eyebrow">{pick("Hero stories", "বীরত্বের গল্প")}</p><h2 className="mt-2 font-display text-4xl font-semibold">{pick("People remembered through action", "কর্মের মাধ্যমে স্মরণীয় মানুষ")}</h2></div>
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {heroStories.map((story) => (
              <article key={story.id} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition hover:-translate-y-1 hover:border-archive-amber/30">
                <ImageWithFallback src={story.image} alt={story.name} className="aspect-[16/10]" fallbackText={pick("Add a verified story image from assets", "assets থেকে যাচাইকৃত গল্পের ছবি যোগ করুন")} />
                <div className="p-5">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.14em] text-archive-amber">{pick("Hero story", "বীরত্বের গল্প")}</span><Heart className="h-4 w-4 text-archive-rose" /></div>
                  <h3 className="mt-3 font-display text-2xl font-semibold text-white">{story.name}</h3>
                  <p className="mt-2 font-medium text-[#D8D3CA]">{story.title}</p>
                  <p className="mt-3 line-clamp-4 text-sm leading-7 text-archive-muted">{story.summary}</p>
                  {story.legacy && <div className="mt-4 flex gap-2 rounded-xl border border-white/[0.07] bg-black/10 p-3 text-xs leading-5 text-[#CFC9C1]"><Quote className="h-4 w-4 shrink-0 text-archive-teal" />{story.legacy}</div>}
                  <Link to={`/stories/${story.id}`} className="focus-ring mt-5 inline-flex items-center gap-2 text-sm font-semibold text-archive-amber">{pick("Read full story", "সম্পূর্ণ গল্প পড়ুন")}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
