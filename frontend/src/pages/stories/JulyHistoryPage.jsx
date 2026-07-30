import { useEffect } from "react";
import {
  ArrowDown,
  BookOpen,
  Building2,
  CalendarDays,
  ExternalLink,
  Facebook,
  Landmark,
  MessageCircleMore,
  Paintbrush,
  Radio,
  ShieldAlert,
  WifiOff as SmartphoneOff,
  UsersRound,
} from "lucide-react";
import { useLocation } from "react-router-dom";

import ImageWithFallback from "../../components/ui/ImageWithFallback";
import PageHeader from "../../components/ui/PageHeader";
import { useLanguage } from "../../context/LanguageContext";

import {
  augustFiveHighlight,
  blackoutChapter,
  formerGovernmentFigures,
  graffitiStories,
  interimAdvisers,
  julyChapterSources,
  memorialPeople,
  offlineResistance,
  securityResponse,
  socialMemoryPosts,
} from "../../data/julyHistoryData";

const chapterLinks = [
  ["august-5", "5 August", "৫ আগস্ট"],
  ["blackout", "Internet blackout", "ইন্টারনেট ব্ল্যাকআউট"],
  ["offline-resistance", "Offline resistance", "অফলাইন প্রতিরোধ"],
  ["state-response", "State response", "রাষ্ট্রীয় প্রতিক্রিয়া"],
  ["martyrs-injured", "Martyrs & injured", "শহীদ ও আহত"],
  ["power-transition", "Power & transition", "ক্ষমতা ও রূপান্তর"],
  ["social-memory", "Social memory", "সামাজিক স্মৃতি"],
  ["graffiti", "Graffiti", "গ্রাফিতি"],
];

function SectionTitle({
  icon: Icon,
  label,
  title,
  description,
}) {
  return (
    <div className="max-w-4xl">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-archive-amber">
        <Icon className="h-4 w-4" />
        {label}
      </span>

      <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 text-sm leading-7 text-archive-muted sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export default function JulyHistoryPage() {
  const location = useLocation();
  const { pick } = useLanguage();

  useEffect(() => {
    if (!location.hash) return;

    const target = document.getElementById(
      location.hash.slice(1)
    );

    window.setTimeout(() => {
      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }, [location.hash]);

  return (
    <>
      <PageHeader
        label={pick(
          "Static historical chapters",
          "স্থির ঐতিহাসিক অধ্যায়"
        )}
        title={pick(
          "July 2024: protest, repression, resistance and transition",
          "জুলাই ২০২৪: আন্দোলন, দমন, প্রতিরোধ ও রূপান্তর"
        )}
        description={pick(
          "A structured, source-aware record of major events surrounding the July–August uprising. Images are intentionally represented by placeholders so they can later be added from the local assets folder.",
          "জুলাই–আগস্ট গণঅভ্যুত্থানের প্রধান ঘটনাগুলোর একটি কাঠামোবদ্ধ ও উৎসসচেতন নথি। পরে স্থানীয় assets ফোল্ডার থেকে ছবি যোগ করার জন্য এখানে ইচ্ছাকৃতভাবে প্লেসহোল্ডার রাখা হয়েছে।"
        )}
      />

      <section className="border-y border-white/[0.07] bg-white/[0.018]">
        <div className="page-shell flex gap-2 overflow-x-auto py-4">
          {chapterLinks.map(([id, en, bn]) => (
            <a
              key={id}
              href={`#${id}`}
              className="focus-ring shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-[#D8D3CA] hover:border-archive-amber/30 hover:text-archive-amber"
            >
              {pick(en, bn)}
            </a>
          ))}
        </div>
      </section>

      <section
        id="august-5"
        className="scroll-mt-28 section-pad"
      >
        <div className="page-shell">
          <div className="overflow-hidden rounded-3xl border border-archive-amber/25 bg-gradient-to-br from-archive-amber/[0.12] via-white/[0.025] to-archive-teal/[0.07]">
            <div className="grid lg:grid-cols-[1.05fr_.95fr]">
              <div className="p-6 sm:p-9 lg:p-12">
                <span className="inline-flex items-center gap-2 rounded-full border border-archive-amber/25 bg-archive-amber/10 px-3 py-1 text-xs font-semibold uppercase tracking-[.16em] text-archive-amber">
                  <CalendarDays className="h-4 w-4" />
                  {augustFiveHighlight.eyebrow}
                </span>

                <h2 className="mt-5 font-display text-5xl font-semibold leading-[.98] text-white sm:text-6xl">
                  {pick(
                    augustFiveHighlight.title,
                    augustFiveHighlight.titleBn
                  )}
                </h2>

                <p className="mt-6 text-base leading-8 text-[#D8D2CA]">
                  {pick(
                    augustFiveHighlight.description,
                    augustFiveHighlight.descriptionBn
                  )}
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {augustFiveHighlight.moments.map(
                    (moment, index) => (
                      <div
                        key={moment}
                        className="rounded-2xl border border-white/10 bg-black/10 p-4"
                      >
                        <span className="text-xs font-bold text-archive-amber">
                          0{index + 1}
                        </span>

                        <p className="mt-2 text-sm leading-6 text-[#D6D1C9]">
                          {moment}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <ImageWithFallback
                alt="5 August 2024 public gathering placeholder"
                className="min-h-[360px] border-l border-white/[0.07]"
                fallbackText={pick(
                  "Add a 5 August image from assets",
                  "assets থেকে ৫ আগস্টের ছবি যোগ করুন"
                )}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="blackout"
        className="scroll-mt-28 section-pad bg-black/10"
      >
        <div className="page-shell grid gap-8 lg:grid-cols-[.82fr_1.18fr]">
          <ImageWithFallback
            alt="Internet blackout archive placeholder"
            className="min-h-[420px] rounded-3xl border border-white/10"
            fallbackText={pick(
              "Add blackout and communication images from assets",
              "assets থেকে ব্ল্যাকআউট ও যোগাযোগের ছবি যোগ করুন"
            )}
          />

          <div>
            <SectionTitle
              icon={SmartphoneOff}
              label={pick(
                blackoutChapter.eyebrow,
                "যোগাযোগের ওপর চাপ"
              )}
              title={pick(
                blackoutChapter.title,
                blackoutChapter.titleBn
              )}
              description={pick(
                blackoutChapter.description,
                blackoutChapter.descriptionBn
              )}
            />

            <div className="mt-7 space-y-3">
              {blackoutChapter.facts.map(
                (fact, index) => (
                  <div
                    key={fact}
                    className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-archive-rose/10 text-xs font-bold text-archive-rose">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-7 text-[#CEC8C0]">
                      {fact}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="offline-resistance"
        className="scroll-mt-28 section-pad"
      >
        <div className="page-shell">
          <SectionTitle
            icon={Radio}
            label={pick(
              "Connection beyond the internet",
              "ইন্টারনেটের বাইরের সংযোগ"
            )}
            title={pick(
              "Offline resistance and the people who kept messages moving",
              "অফলাইন প্রতিরোধ ও যারা বার্তা সচল রেখেছিলেন"
            )}
            description={pick(
              "This section honours collective communication work without inventing individual credit where the public record is incomplete.",
              "যেখানে প্রকাশ্য নথি অসম্পূর্ণ, সেখানে ব্যক্তিগত কৃতিত্ব বানিয়ে না বলে এই অংশ সম্মিলিত যোগাযোগ প্রচেষ্টাকে সম্মান জানায়।"
            )}
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {offlineResistance.map((item, index) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6"
              >
                <div className="flex items-center justify-between">
                  <MessageCircleMore className="h-6 w-6 text-archive-teal" />

                  <span className="font-display text-4xl text-white/10">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-2xl font-semibold text-white">
                  {pick(item.title, item.titleBn)}
                </h3>

                <p className="mt-3 text-sm leading-7 text-archive-muted">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="state-response"
        className="scroll-mt-28 section-pad bg-black/10"
      >
        <div className="page-shell">
          <SectionTitle
            icon={ShieldAlert}
            label={pick(
              "Institutions and accountability",
              "প্রতিষ্ঠান ও জবাবদিহি"
            )}
            title={pick(
              "Police, security forces and groups mobilised against protesters",
              "আন্দোলনকারীদের বিরুদ্ধে মোতায়েন পুলিশ, নিরাপত্তা বাহিনী ও গোষ্ঠী"
            )}
            description={pick(
              "The cards distinguish institutional roles, verified findings and allegations. They do not assign guilt to an individual without evidence.",
              "কার্ডগুলো প্রাতিষ্ঠানিক ভূমিকা, যাচাইকৃত অনুসন্ধান ও অভিযোগ আলাদা করে। প্রমাণ ছাড়া কোনো ব্যক্তিকে দায়ী করা হয় না।"
            )}
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {securityResponse.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-archive-rose/15 bg-archive-rose/[0.04] p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[.13em] text-archive-rose">
                  {item.role}
                </p>

                <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                  {item.name}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#CFC8C1]">
                  {item.summary}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="martyrs-injured"
        className="scroll-mt-28 section-pad"
      >
        <div className="page-shell">
          <SectionTitle
            icon={UsersRound}
            label={pick(
              "Lives, loss and survival",
              "জীবন, ক্ষতি ও বেঁচে থাকা"
            )}
            title={pick(
              "A dedicated memorial for those killed and badly injured",
              "নিহত ও গুরুতর আহতদের জন্য আলাদা স্মরণাংশ"
            )}
            description={pick(
              "The archive should grow only through verified records and consent-safe family information.",
              "এই আর্কাইভ কেবল যাচাইকৃত নথি ও পরিবারের সম্মতিসম্মত তথ্যের মাধ্যমে সম্প্রসারিত হবে।"
            )}
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {memorialPeople.map((person) => (
              <article
                key={person.name}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]"
              >
                {person.image ? (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-black/20">
                    <img
                      src={person.image}
                      alt={person.imageAlt || person.name}
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                      onError={(event) => {
                        console.error(
                          `Failed to load image for ${person.name}:`,
                          person.image
                        );

                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                ) : (
                  <ImageWithFallback
                    alt={`${person.name} archive placeholder`}
                    className="aspect-[16/9]"
                    fallbackText={pick(
                      "Add a verified memorial image",
                      "যাচাইকৃত স্মরণ ছবি যোগ করুন"
                    )}
                  />
                )}

                <div className="p-5">
                  <h3 className="font-display text-2xl font-semibold text-white">
                    {person.name}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-archive-muted">
                    {person.note}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="power-transition"
        className="scroll-mt-28 section-pad bg-black/10"
      >
        <div className="page-shell">
          <SectionTitle
            icon={Landmark}
            label={pick(
              "Before and after 5 August",
              "৫ আগস্টের আগে ও পরে"
            )}
            title={pick(
              "People in power, public statements and the interim transition",
              "ক্ষমতায় থাকা ব্যক্তি, প্রকাশ্য বক্তব্য ও অন্তর্বর্তী রূপান্তর"
            )}
            description={pick(
              "This is an accountability-oriented historical index. It records offices, public positions and institutional responsibility while avoiding unsourced accusations.",
              "এটি জবাবদিহিমুখী ঐতিহাসিক সূচি। উৎসহীন অভিযোগ এড়িয়ে পদ, প্রকাশ্য অবস্থান ও প্রাতিষ্ঠানিক দায়িত্ব নথিভুক্ত করা হয়েছে।"
            )}
          />

          <div className="mt-9 grid gap-8 xl:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-archive-rose" />

                <h3 className="font-display text-3xl font-semibold">
                  {pick(
                    "Former government figures",
                    "সাবেক সরকারের গুরুত্বপূর্ণ ব্যক্তি"
                  )}
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                {formerGovernmentFigures.map((person) => (
                  <article
                    key={person.name}
                    className="rounded-2xl border border-archive-rose/15 bg-archive-rose/[0.035] p-5"
                  >
                    <p className="text-xs uppercase tracking-[.12em] text-archive-muted">
                      {person.office}
                    </p>

                    <h4 className="mt-2 font-display text-2xl font-semibold text-white">
                      {person.name}
                    </h4>

                    <blockquote className="mt-3 border-l-2 border-archive-rose/50 pl-3 text-sm font-semibold text-[#E4BDC4]">
                      {person.quotation}
                    </blockquote>

                    <p className="mt-3 text-sm leading-7 text-archive-muted">
                      {person.context}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-archive-teal" />

                <h3 className="font-display text-3xl font-semibold">
                  {pick(
                    "Initial interim advisory council",
                    "প্রাথমিক অন্তর্বর্তী উপদেষ্টা পরিষদ"
                  )}
                </h3>
              </div>

              <p className="mt-3 text-sm leading-7 text-archive-muted">
                {pick(
                  "Muhammad Yunus and thirteen advisers were sworn in on 8 August 2024; additional advisers joined in the following days.",
                  "৮ আগস্ট ২০২৪ মুহাম্মদ ইউনূস ও তেরোজন উপদেষ্টা শপথ নেন; পরবর্তী দিনগুলোতে আরও উপদেষ্টা যোগ দেন।"
                )}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {interimAdvisers.map((person) => (
                  <article
                    key={person.name}
                    className="rounded-2xl border border-archive-teal/15 bg-archive-teal/[0.035] p-4"
                  >
                    <p className="text-xs uppercase tracking-[.12em] text-archive-teal">
                      {person.role}
                    </p>

                    <h4 className="mt-2 font-semibold text-white">
                      {person.name}
                    </h4>

                    <p className="mt-2 text-xs leading-5 text-archive-muted">
                      {person.focus}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="social-memory"
        className="scroll-mt-28 section-pad"
      >
        <div className="page-shell">
          <SectionTitle
            icon={Facebook}
            label={pick(
              "Digital public memory",
              "ডিজিটাল জনস্মৃতি"
            )}
            title={pick(
              "Facebook-style posts, slogans and verification culture",
              "ফেসবুকধর্মী পোস্ট, স্লোগান ও যাচাই সংস্কৃতি"
            )}
            description={pick(
              "These are static archive cards summarising widely circulated themes, not live Facebook embeds or private posts.",
              "এগুলো বহুল প্রচারিত বিষয়গুলোর স্থির আর্কাইভ কার্ড; লাইভ ফেসবুক এমবেড বা ব্যক্তিগত পোস্ট নয়।"
            )}
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {socialMemoryPosts.map((post) => (
              <article
                key={post.label}
                className="rounded-2xl border border-white/[0.08] bg-[#121722] p-5 shadow-xl"
              >
                <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-archive-amber/10 text-archive-amber">
                    <Facebook className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      July public memory archive
                    </p>

                    <p className="text-xs text-archive-muted">
                      {post.label}
                    </p>
                  </div>
                </div>

                <p className="mt-5 font-display text-2xl leading-snug text-white">
                  “{post.text}”
                </p>

                <p className="mt-4 text-sm leading-7 text-archive-muted">
                  {post.context}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="graffiti"
        className="scroll-mt-28 section-pad bg-black/10"
      >
        <div className="page-shell">
          <SectionTitle
            icon={Paintbrush}
            label={pick(
              "The country as a canvas",
              "দেশজুড়ে দেয়ালচিত্র"
            )}
            title={pick(
              "Graffiti after and during the uprising",
              "গণঅভ্যুত্থানের সময় ও পরে গ্রাফিতি"
            )}
            description={pick(
              "Students and citizens turned walls, pillars and campuses into a decentralised public archive of grief, protest and hope.",
              "শিক্ষার্থী ও নাগরিকরা দেয়াল, স্তম্ভ ও ক্যাম্পাসকে শোক, প্রতিবাদ ও আশার বিকেন্দ্রীভূত জনআর্কাইভে রূপ দেন।"
            )}
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {graffitiStories.map((item) => (
              <article
                key={item.title}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]"
              >
                <ImageWithFallback
                  alt={`${item.title} graffiti placeholder`}
                  className="aspect-[16/10]"
                  fallbackText={pick(
                    "Add a graffiti photograph from assets",
                    "assets থেকে গ্রাফিতির ছবি যোগ করুন"
                  )}
                />

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[.13em] text-archive-teal">
                    {item.theme}
                  </p>

                  <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-archive-muted">
                    {item.translation}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <BookOpen className="mt-1 h-6 w-6 shrink-0 text-archive-amber" />

            <div>
              <h2 className="font-display text-3xl font-semibold">
                {pick(
                  "Sources and editorial standard",
                  "সূত্র ও সম্পাদকীয় মান"
                )}
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-archive-muted">
                {pick(
                  "Static content should still be corrected when stronger evidence becomes available. Dates, casualty figures and allegations must remain attributed to their source.",
                  "স্থির কনটেন্ট হলেও শক্তিশালী প্রমাণ পাওয়া গেলে সংশোধন করতে হবে। তারিখ, হতাহতের সংখ্যা ও অভিযোগ উৎসসহ রাখতে হবে।"
                )}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {julyChapterSources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-[#D8D3CA] hover:border-archive-amber/30 hover:text-archive-amber"
                  >
                    {source.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <a
        href="#august-5"
        className="focus-ring fixed bottom-5 right-5 z-30 grid h-11 w-11 rotate-180 place-items-center rounded-full border border-white/10 bg-ink-800 text-archive-amber shadow-2xl"
        aria-label={pick("Back to top", "উপরে ফিরুন")}
      >
        <ArrowDown className="h-5 w-5" />
      </a>
    </>
  );
}