import { ArrowLeft, CalendarDays, LockKeyhole, MapPin, Quote, ShieldCheck, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import { stories } from "../../data/landingData";
import { useLanguage } from "../../context/LanguageContext";

export default function StoryDetailsPage() {
  const { id } = useParams();
  const story = stories.find((item) => item.id === id) || null;
  const { pick } = useLanguage();

  if (!story) {
    return (
      <div className="page-shell min-h-screen pb-20 pt-36">
        <h1 className="font-display text-5xl">{pick("Story not found", "গল্প পাওয়া যায়নি")}</h1>
        <p className="mt-4 max-w-xl text-archive-muted">{pick("This static memorial profile does not exist or may have been moved.", "এই স্থির স্মৃতি প্রোফাইলটি নেই অথবা সরানো হয়েছে।")}</p>
        <Button to="/stories" className="mt-6"><ArrowLeft className="h-4 w-4" />{pick("Back to Stories", "গল্পে ফিরুন")}</Button>
      </div>
    );
  }

  return (
    <article className="page-shell pb-20 pt-28 md:pt-32">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <Link to="/stories" className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber"><ArrowLeft className="h-4 w-4" />{pick("Back to stories", "গল্পে ফিরুন")}</Link>
        <Link to="/stories" className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-archive-muted hover:border-archive-amber/30 hover:text-white" aria-label={pick("Close story", "গল্প বন্ধ করুন")}><X className="h-5 w-5" /></Link>
      </div>

      <div className={`mt-8 grid gap-10 ${story.anonymous ? "lg:grid-cols-[.72fr_1.28fr]" : "lg:grid-cols-[.9fr_1.1fr]"}`}>
        <div>
          {story.anonymous ? (
            <div className="grid aspect-[4/5] place-items-center rounded-2xl border border-archive-teal/20 bg-[radial-gradient(circle_at_center,rgba(75,155,141,.16),transparent_66%)] p-8 text-center lg:sticky lg:top-28">
              <div>
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-2xl border border-archive-teal/25 bg-archive-teal/10 text-archive-teal"><LockKeyhole className="h-9 w-9" /></span>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[.2em] text-archive-teal">{pick("Identity protected", "পরিচয় সুরক্ষিত")}</p>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-archive-muted">{pick("This account intentionally contains no photograph or identifying name.", "এই বিবরণে ইচ্ছাকৃতভাবে কোনো ছবি বা পরিচয় প্রকাশকারী নাম নেই।")}</p>
              </div>
            </div>
          ) : (
            <div className="lg:sticky lg:top-28">
              <ImageWithFallback src={story.image} alt={story.imageAlt || story.name} className="aspect-[4/5] rounded-2xl border border-white/10" />
              <p className="mt-3 text-xs leading-5 text-archive-muted">{pick("Memorial artwork from the project assets; not a photographic portrait.", "প্রকল্পের অ্যাসেট থেকে স্মারক শিল্পকর্ম; এটি আলোকচিত্র নয়।")}</p>
            </div>
          )}
        </div>

        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-archive-muted">
            <span className="rounded-full border border-archive-rose/20 bg-archive-rose/10 px-3 py-1 font-semibold text-[#EDC7CE]">{story.category}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{story.date}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{story.location}</span>
          </div>

          {!story.anonymous && <p className="mt-7 text-sm font-semibold uppercase tracking-[.16em] text-archive-amber">{story.name}</p>}
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">{story.title}</h1>
          <p className="mt-7 text-lg leading-8 text-[#D5CFC6] md:text-xl">{story.summary}</p>

          <div className="mt-10 border-l-2 border-archive-rose/45 pl-6">
            <Quote className="h-7 w-7 text-archive-rose" />
            <p className="mt-3 font-display text-2xl font-semibold leading-snug text-white">{story.legacy}</p>
          </div>

          <div className="mt-10 whitespace-pre-wrap text-base leading-8 text-[#C6C2BC] md:text-lg">
            <p>{story.body}</p>
          </div>

          <div className="mt-10 rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.07] p-6">
            <ShieldCheck className="h-6 w-6 text-archive-teal" />
            <h2 className="mt-4 font-semibold">{pick("Editorial and privacy note", "সম্পাদনা ও গোপনীয়তা নোট")}</h2>
            <p className="mt-2 text-sm leading-7 text-[#B9CFCB]">{story.anonymous ? pick("The archive preserves the meaning of this contribution without exposing a name, face or location that could identify the person.", "আর্কাইভটি নাম, মুখ বা পরিচয় প্রকাশকারী স্থান ছাড়াই এই অবদানের অর্থ সংরক্ষণ করে।") : pick("This static profile uses concise public biographical facts and a non-photographic memorial illustration. Sensitive and graphic details are intentionally excluded.", "এই স্থির প্রোফাইলে সংক্ষিপ্ত প্রকাশ্য জীবনীমূলক তথ্য ও অ-আলোকচিত্র স্মারক চিত্র ব্যবহার করা হয়েছে। সংবেদনশীল ও গ্রাফিক বিবরণ ইচ্ছাকৃতভাবে বাদ দেওয়া হয়েছে।")}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
