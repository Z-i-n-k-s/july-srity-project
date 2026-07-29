import { useEffect, useState } from "react";
import { Loader2, MapPin, Quote, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import { stories } from "../../data/landingData";
import { publicApi, unwrap } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function StoryDetailsPage() {
  const { id } = useParams();
  const fallback = stories.find((item) => item.id === id) || null;
  const [story, setStory] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    publicApi.storyDetail(id, fallback ? { data: fallback } : null).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (data && !Array.isArray(data)) setStory(data);
    }).catch(() => {}).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading && !story) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-9 w-9 animate-spin text-archive-amber" /></div>;
  if (!story) return <div className="page-shell min-h-screen pt-36"><h1 className="font-display text-5xl">{pick("Story not found", "গল্প পাওয়া যায়নি")}</h1><Button to="/stories" className="mt-6">{pick("Back to Stories", "গল্পে ফিরুন")}</Button></div>;

  return (
    <article className="page-shell pb-20 pt-32">
      <Link to="/stories" className="text-sm font-semibold text-archive-amber">← {pick("Back to stories", "গল্পে ফিরুন")}</Link>
      <div className="mt-7 grid gap-10 lg:grid-cols-[.82fr_1.18fr]">
        <div><ImageWithFallback src={story.image || story.thumbnail} alt={story.name || story.title} className="aspect-[4/5] rounded-2xl border border-white/10 lg:sticky lg:top-28" /></div>
        <div className="max-w-3xl"><p className="eyebrow">{story.category || pick("Verified testimony", "যাচাইকৃত সাক্ষ্য")}</p><Quote className="mt-7 h-10 w-10 text-archive-rose" /><h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-6xl">“{story.quote || story.title}”</h1><div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-archive-muted"><strong className="text-white">{story.name || story.attribution || pick("Identity protected", "পরিচয় সুরক্ষিত")}</strong><span>•</span><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{story.location || "—"}</span></div><div className="mt-10 space-y-6 whitespace-pre-wrap text-lg leading-9 text-[#C6C2BC]"><p>{story.body || story.description}</p></div><div className="mt-10 rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.07] p-6"><ShieldCheck className="h-6 w-6 text-archive-teal" /><h2 className="mt-4 font-semibold">{pick("Consent and privacy", "সম্মতি ও গোপনীয়তা")}</h2><p className="mt-2 text-sm leading-7 text-[#B9CFCB]">{pick("Identity visibility, media treatment and publication permission are checked before a story becomes public.", "গল্প প্রকাশের আগে পরিচয়, মিডিয়া সুরক্ষা ও প্রকাশের অনুমতি যাচাই করা হয়।")}</p></div></div>
      </div>
    </article>
  );
}
