import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, LockKeyhole, MapPin, Search, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import { stories } from "../../data/landingData";
import { useLanguage } from "../../context/LanguageContext";

export default function StoriesPage() {
  const [query, setQuery] = useState("");
  const { pick } = useLanguage();

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return stories;
    return stories.filter((story) => `${story.anonymous ? "anonymous identity protected" : story.name || ""} ${story.location || ""} ${story.category || ""} ${story.title || ""} ${story.summary || ""}`.toLowerCase().includes(search));
  }, [query]);

  return (
    <>
      <PageHeader
        label={pick("Static memorial stories", "স্থির স্মৃতি-গল্প")}
        title={pick("The people whose courage shaped July", "যাদের সাহস জুলাইকে রূপ দিয়েছিল")}
        description={pick("A carefully presented memorial page for documented heroes and identity-protected contributors. These profiles are static and are not loaded from the backend.", "নথিভুক্ত বীর ও পরিচয়-সুরক্ষিত অবদানকারীদের জন্য যত্নসহকারে উপস্থাপিত স্থির স্মৃতি পাতা। এই প্রোফাইলগুলো ব্যাকএন্ড থেকে লোড হয় না।")}
      />

      <section className="section-pad">
        <div className="page-shell">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="surface-card rounded-2xl p-5 md:col-span-2">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-archive-amber/10 text-archive-amber"><ShieldCheck className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-white">{pick("Memory with editorial care", "সম্পাদনাগত যত্নে স্মৃতি")}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-archive-muted">{pick("Named profiles use documented public facts. Anonymous accounts intentionally omit names and photographs so that remembrance never overrides personal safety or consent.", "নামযুক্ত প্রোফাইলে নথিভুক্ত প্রকাশ্য তথ্য ব্যবহার করা হয়েছে। বেনামী বিবরণে ইচ্ছাকৃতভাবে নাম ও ছবি বাদ দেওয়া হয়েছে, যাতে স্মৃতি কখনও ব্যক্তিগত নিরাপত্তা বা সম্মতির চেয়ে বড় না হয়।")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.06] p-5">
              <UsersRound className="h-6 w-6 text-archive-teal" />
              <p className="mt-4 text-3xl font-semibold text-white">{stories.length}</p>
              <p className="mt-1 text-sm text-[#B9CFCB]">{pick("Memorial profiles", "স্মৃতি প্রোফাইল")}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-b border-white/[0.08] pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">{pick("Browse the collection", "সংগ্রহ দেখুন")}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">{pick("Stories of courage, care and witness", "সাহস, যত্ন ও সাক্ষ্যের গল্প")}</h2>
            </div>
            <label className="relative block w-full md:max-w-md">
              <span className="sr-only">{pick("Search stories", "গল্প খুঁজুন")}</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" />
              <input
                className="field-control pl-12"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={pick("Search heroes, locations or roles", "বীর, স্থান বা ভূমিকা খুঁজুন")}
              />
            </label>
          </div>

          {filtered.length ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((story) => (
                <article key={story.id} className={`group flex min-h-full flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${story.anonymous ? "border-archive-teal/20 bg-gradient-to-br from-archive-teal/[0.08] to-white/[0.025]" : "border-white/[0.08] bg-white/[0.03] hover:border-archive-amber/25"}`}>
                  {story.anonymous ? (
                    <div className="grid aspect-[16/10] place-items-center border-b border-archive-teal/15 bg-[radial-gradient(circle_at_center,rgba(75,155,141,.16),transparent_65%)] p-8 text-center">
                      <div>
                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-archive-teal/25 bg-archive-teal/10 text-archive-teal"><LockKeyhole className="h-7 w-7" /></span>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-archive-teal">{pick("Identity protected", "পরিচয় সুরক্ষিত")}</p>
                        <p className="mt-2 text-sm text-archive-muted">{pick("No name or photograph is displayed", "কোনো নাম বা ছবি প্রদর্শিত নয়")}</p>
                      </div>
                    </div>
                  ) : (
                    <ImageWithFallback src={story.image} alt={story.imageAlt || story.name} className="aspect-[16/10] border-b border-white/[0.06]" imageClassName="transition duration-500 group-hover:scale-[1.025]" loading="lazy" />
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-archive-muted">
                      <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 font-semibold text-[#D9D4CC]">{story.category}</span>
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{story.date}</span>
                    </div>
                    {!story.anonymous && <p className="mt-5 text-sm font-semibold uppercase tracking-[.12em] text-archive-amber">{story.name}</p>}
                    <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-white">{story.title}</h3>
                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-archive-muted">{story.summary}</p>
                    <div className="mt-5 flex items-center gap-2 text-xs text-archive-muted"><MapPin className="h-3.5 w-3.5" />{story.location}</div>
                    <Link to={`/stories/${story.id}`} className="focus-ring mt-7 inline-flex w-fit items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber">
                      {pick("Read memorial story", "স্মৃতি-গল্প পড়ুন")} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-12 text-center">
              <Search className="mx-auto h-8 w-8 text-archive-muted" />
              <h3 className="mt-4 font-display text-2xl font-semibold">{pick("No matching stories", "মিল পাওয়া যায়নি")}</h3>
              <p className="mt-2 text-sm text-archive-muted">{pick("Try a different name, location or role.", "অন্য নাম, স্থান বা ভূমিকা দিয়ে চেষ্টা করুন।")}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
