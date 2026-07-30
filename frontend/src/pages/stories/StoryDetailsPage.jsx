import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileSearch,
  LockKeyhole,
  MapPin,
  Quote,
  ShieldCheck,
  X,
} from "lucide-react";
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
        <p className="mt-4 max-w-xl text-archive-muted">
          {pick("This static archive profile does not exist or may have been moved.", "এই স্থির আর্কাইভ প্রোফাইলটি নেই অথবা সরানো হয়েছে।")}
        </p>
        <Button to="/stories" className="mt-6">
          <ArrowLeft className="h-4 w-4" />
          {pick("Back to Stories", "গল্পে ফিরুন")}
        </Button>
      </div>
    );
  }

  const isAynaghor = story.collection === "aynaghor";

  return (
    <article className="page-shell pb-20 pt-28 md:pt-32">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <Link to="/stories" className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber">
          <ArrowLeft className="h-4 w-4" />
          {pick("Back to stories", "গল্পে ফিরুন")}
        </Link>
        <Link
          to="/stories"
          className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-archive-muted hover:border-archive-amber/30 hover:text-white"
          aria-label={pick("Close story", "গল্প বন্ধ করুন")}
        >
          <X className="h-5 w-5" />
        </Link>
      </div>

      <div className={`mt-8 grid gap-10 ${story.anonymous ? "lg:grid-cols-[.72fr_1.28fr]" : "lg:grid-cols-[.9fr_1.1fr]"}`}>
        <div>
          {story.anonymous ? (
            <div className="grid aspect-[4/5] place-items-center rounded-2xl border border-archive-teal/20 bg-[radial-gradient(circle_at_center,rgba(75,155,141,.16),transparent_66%)] p-8 text-center lg:sticky lg:top-28">
              <div>
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-2xl border border-archive-teal/25 bg-archive-teal/10 text-archive-teal">
                  <LockKeyhole className="h-9 w-9" />
                </span>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[.2em] text-archive-teal">
                  {pick("Identity protected", "পরিচয় সুরক্ষিত")}
                </p>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-archive-muted">
                  {pick("This account intentionally contains no photograph or identifying name.", "এই বিবরণে ইচ্ছাকৃতভাবে কোনো ছবি বা পরিচয় প্রকাশকারী নাম নেই।")}
                </p>
              </div>
            </div>
          ) : (
            <div className="lg:sticky lg:top-28">
              <ImageWithFallback src={story.image} alt={story.imageAlt || story.name} className="aspect-[4/5] rounded-2xl border border-white/10" />
              <p className="mt-3 text-xs leading-5 text-archive-muted">
                {pick(
                  "Static project image. Replace it with an appropriately licensed image from the assets folder.",
                  "স্থির প্রকল্পের ছবি। অ্যাসেট ফোল্ডার থেকে উপযুক্ত লাইসেন্সকৃত ছবি দিয়ে পরিবর্তন করুন।",
                )}
              </p>
            </div>
          )}
        </div>

        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-archive-muted">
            <span className={`rounded-full border px-3 py-1 font-semibold ${isAynaghor ? "border-archive-teal/20 bg-archive-teal/10 text-[#B9DCD5]" : "border-archive-rose/20 bg-archive-rose/10 text-[#EDC7CE]"}`}>
              {story.status || story.category}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {story.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {story.location}
            </span>
          </div>

          {!story.anonymous && (
            <p className={`mt-7 text-sm font-semibold uppercase tracking-[.16em] ${isAynaghor ? "text-archive-teal" : "text-archive-amber"}`}>
              {story.name}
            </p>
          )}
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">{story.title}</h1>
          <p className="mt-7 text-lg leading-8 text-[#D5CFC6] md:text-xl">{story.summary}</p>

          <div className={`mt-10 border-l-2 pl-6 ${isAynaghor ? "border-archive-teal/45" : "border-archive-rose/45"}`}>
            <Quote className={`h-7 w-7 ${isAynaghor ? "text-archive-teal" : "text-archive-rose"}`} />
            <p className="mt-3 font-display text-2xl font-semibold leading-snug text-white">{story.legacy}</p>
          </div>

          <div className="mt-10 whitespace-pre-wrap text-base leading-8 text-[#C6C2BC] md:text-lg">
            <p>{story.body}</p>
          </div>

          {story.sourceUrl && (
            <a
              href={story.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring mt-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-archive-amber hover:border-archive-amber/30"
            >
              <FileSearch className="h-4 w-4" />
              {pick("Open supporting public source", "সহায়ক প্রকাশ্য উৎস খুলুন")}
              {story.sourceName ? ` — ${story.sourceName}` : ""}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <div className="mt-10 rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.07] p-6">
            <ShieldCheck className="h-6 w-6 text-archive-teal" />
            <h2 className="mt-4 font-semibold">{pick("Editorial and privacy note", "সম্পাদনা ও গোপনীয়তা নোট")}</h2>
            <p className="mt-2 text-sm leading-7 text-[#B9CFCB]">
              {story.anonymous
                ? pick(
                    "The archive preserves the meaning of this account without exposing a name, face or identifying location. Composite entries are labelled and are not presented as one verified individual case.",
                    "আর্কাইভটি নাম, মুখ বা পরিচয় প্রকাশকারী স্থান ছাড়াই এই বিবরণের অর্থ সংরক্ষণ করে। সমন্বিত বিবরণ আলাদাভাবে চিহ্নিত এবং একটি যাচাইকৃত ব্যক্তিগত কেস হিসেবে দেখানো হয়নি।",
                  )
                : isAynaghor
                  ? pick(
                      "This static account summarises public reporting and reported survivor or family testimony. Allegations are not presented as court findings, and graphic details are excluded.",
                      "এই স্থির বিবরণে প্রকাশ্য প্রতিবেদন এবং রিপোর্টকৃত বেঁচে ফেরা ব্যক্তি বা পরিবারের সাক্ষ্য সংক্ষেপে উপস্থাপিত। অভিযোগকে আদালতের রায় হিসেবে দেখানো হয়নি এবং গ্রাফিক বিবরণ বাদ দেওয়া হয়েছে।",
                    )
                  : pick(
                      "This static profile uses concise public biographical information. Sensitive and graphic details are intentionally excluded.",
                      "এই স্থির প্রোফাইলে সংক্ষিপ্ত প্রকাশ্য জীবনীমূলক তথ্য ব্যবহার করা হয়েছে। সংবেদনশীল ও গ্রাফিক বিবরণ ইচ্ছাকৃতভাবে বাদ দেওয়া হয়েছে।",
                    )}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
