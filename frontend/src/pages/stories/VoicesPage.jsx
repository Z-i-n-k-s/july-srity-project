import { ExternalLink, Scale, ShieldCheck, UsersRound } from "lucide-react";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import PageHeader from "../../components/ui/PageHeader";
import { publicVoices } from "../../data/landingData";
import { useLanguage } from "../../context/LanguageContext";

function VoiceCard({ voice, pick }) {
  const solidarity = voice.group === "solidarity";

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white/[0.03] ${solidarity ? "border-archive-teal/20" : "border-archive-rose/20"}`}>
      <ImageWithFallback
        src={voice.image}
        alt={`${voice.name} — replace with a licensed project asset`}
        className="aspect-[16/10] border-b border-white/[0.06]"
        imageClassName="object-cover"
      />
      <div className="p-6">
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${solidarity ? "border-archive-teal/25 bg-archive-teal/10 text-[#B9DCD5]" : "border-archive-rose/25 bg-archive-rose/10 text-[#EDC7CE]"}`}>
          {solidarity ? pick("Student solidarity", "শিক্ষার্থীদের প্রতি সংহতি") : pick("Contested public record", "বিতর্কিত প্রকাশ্য রেকর্ড")}
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-white">{voice.name}</h2>
        <p className="mt-1 text-sm text-archive-muted">{voice.role}</p>
        <div className={`mt-5 border-l-2 pl-4 ${solidarity ? "border-archive-teal/45" : "border-archive-rose/45"}`}>
          <p className="text-base font-medium leading-7 text-[#E0DAD1]">{voice.position}</p>
        </div>
        <p className="mt-4 text-sm leading-7 text-archive-muted">{voice.context}</p>
        <a href={voice.sourceUrl} target="_blank" rel="noreferrer" className="focus-ring mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber">
          {pick("View public source", "প্রকাশ্য উৎস দেখুন")} — {voice.sourceName}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

export default function VoicesPage() {
  const { pick } = useLanguage();
  const solidarityVoices = publicVoices.filter((voice) => voice.group === "solidarity");
  const contestedVoices = publicVoices.filter((voice) => voice.group === "contested");

  return (
    <>
      <PageHeader
        label={pick("Static public record", "স্থির প্রকাশ্য রেকর্ড")}
        title={pick("Voices of July", "জুলাইয়ের কণ্ঠস্বর")}
        description={pick(
          "A sourced view of public figures who expressed solidarity with students and of statements or private-group discussions that became publicly contested.",
          "শিক্ষার্থীদের প্রতি সংহতি জানানো জনপরিচিত ব্যক্তিদের বক্তব্য এবং পরে প্রকাশ্যে বিতর্কিত হওয়া বক্তব্য বা ব্যক্তিগত গ্রুপ আলোচনার উৎসভিত্তিক উপস্থাপন।",
        )}
      />

      <section className="section-pad">
        <div className="page-shell">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="surface-card rounded-2xl p-5 md:col-span-2">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-archive-amber/10 text-archive-amber">
                  <Scale className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-white">{pick("Context, not a blacklist", "প্রেক্ষাপট, কোনো কালো তালিকা নয়")}</h2>
                  <p className="mt-2 text-sm leading-7 text-archive-muted">
                    {pick(
                      "This section records attributed public reporting. It does not decide guilt, endorse online harassment or imply that every member of a group held the same opinion. Explanations and denials are included where reported.",
                      "এই বিভাগে উৎসসহ প্রকাশ্য প্রতিবেদন নথিভুক্ত করা হয়েছে। এটি দোষ নির্ধারণ করে না, অনলাইন হয়রানিকে সমর্থন করে না এবং কোনো গ্রুপের সব সদস্য একই মত পোষণ করেছেন—এমন ধারণাও দেয় না। প্রকাশিত ব্যাখ্যা ও অস্বীকারও যুক্ত করা হয়েছে।",
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.06] p-5">
              <UsersRound className="h-6 w-6 text-archive-teal" />
              <p className="mt-4 text-3xl font-semibold text-white">{publicVoices.length}</p>
              <p className="mt-1 text-sm text-[#B9CFCB]">{pick("Sourced public records", "উৎসভিত্তিক প্রকাশ্য রেকর্ড")}</p>
            </div>
          </div>

          <section className="mt-14">
            <div className="border-b border-white/[0.08] pb-5">
              <p className="eyebrow !text-archive-teal">{pick("Public solidarity", "প্রকাশ্য সংহতি")}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">{pick("Public figures who stood with students", "শিক্ষার্থীদের পাশে দাঁড়ানো জনপরিচিত ব্যক্তিরা")}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-archive-muted">
                {pick("Examples of practical help or public statements against violence and injustice.", "ব্যবহারিক সহায়তা অথবা সহিংসতা ও অন্যায়ের বিরুদ্ধে প্রকাশ্য বক্তব্যের উদাহরণ।")}
              </p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {solidarityVoices.map((voice) => <VoiceCard key={voice.id} voice={voice} pick={pick} />)}
            </div>
          </section>

          <section className="mt-16">
            <div className="border-b border-white/[0.08] pb-5">
              <p className="eyebrow !text-archive-rose">{pick("Contested records", "বিতর্কিত রেকর্ড")}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">{pick("Statements and discussions that drew public criticism", "যেসব বক্তব্য ও আলোচনা জনসমালোচনার জন্ম দিয়েছিল")}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-archive-muted">
                {pick("Each card includes the reported context and, where available, the person's explanation.", "প্রতিটি কার্ডে প্রকাশিত প্রেক্ষাপট এবং যেখানে পাওয়া গেছে, সংশ্লিষ্ট ব্যক্তির ব্যাখ্যাও রয়েছে।")}
              </p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {contestedVoices.map((voice) => <VoiceCard key={voice.id} voice={voice} pick={pick} />)}
            </div>
          </section>

          <div className="mt-14 flex gap-3 rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.06] p-5 text-sm leading-7 text-[#B9CFCB]">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-archive-teal" />
            <p>
              {pick(
                "Before publishing new entries, verify the original post or recording, preserve the date and context, provide a right of reply, and avoid cropped screenshots that could change meaning.",
                "নতুন এন্ট্রি প্রকাশের আগে মূল পোস্ট বা রেকর্ডিং যাচাই করুন, তারিখ ও প্রেক্ষাপট সংরক্ষণ করুন, জবাব দেওয়ার সুযোগ রাখুন এবং অর্থ বদলে দিতে পারে এমন কাটা স্ক্রিনশট এড়িয়ে চলুন।",
              )}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
