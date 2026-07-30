import { Archive, ArrowRight, EyeOff, FileCheck2, HeartHandshake, History, LockKeyhole, Scale, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import SectionHeading from "../components/ui/SectionHeading";
import { useLanguage } from "../context/LanguageContext";
import marchImage from "../assets/about/march.webp";
import memorialImage from "../assets/about/memorial.webp";
import flagImage from "../assets/about/flag.jpg";

const values = [
  { title: "Memory", titleBn: "স্মৃতি", text: "Preserve documentary images, records and testimony before important details disappear.", textBn: "গুরুত্বপূর্ণ বিবরণ হারিয়ে যাওয়ার আগে ছবি, নথি ও সাক্ষ্য সংরক্ষণ করা।", icon: History },
  { title: "Truth", titleBn: "সত্য", text: "Keep source context visible, separate evidence from interpretation and describe uncertainty honestly.", textBn: "উৎসের প্রেক্ষাপট দৃশ্যমান রাখা, প্রমাণ ও ব্যাখ্যাকে আলাদা করা এবং অনিশ্চয়তা সৎভাবে বলা।", icon: FileCheck2 },
  { title: "Dignity", titleBn: "মর্যাদা", text: "Respect consent, identity choices and the safety of every person represented in the archive.", textBn: "আর্কাইভে থাকা প্রতিটি মানুষের সম্মতি, পরিচয়ের পছন্দ ও নিরাপত্তাকে সম্মান করা।", icon: LockKeyhole },
  { title: "Human support", titleBn: "মানবিক সহায়তা", text: "Connect affected people with a private and organised support process without exposing sensitive details.", textBn: "সংবেদনশীল তথ্য প্রকাশ না করে ক্ষতিগ্রস্ত মানুষকে ব্যক্তিগত ও সংগঠিত সহায়তা প্রক্রিয়ার সঙ্গে যুক্ত করা।", icon: HeartHandshake },
];

const responsibilities = [
  { title: "Preserve", titleBn: "সংরক্ষণ", text: "Collect photographs, video, documents and testimony with enough context to remain meaningful.", textBn: "ছবি, ভিডিও, নথি ও সাক্ষ্য যথেষ্ট প্রেক্ষাপটসহ সংগ্রহ করা।", icon: Archive },
  { title: "Review", titleBn: "পর্যালোচনা", text: "Check dates, locations, consent, source information and privacy risks before publication.", textBn: "প্রকাশের আগে তারিখ, স্থান, সম্মতি, উৎস ও গোপনীয়তার ঝুঁকি যাচাই করা।", icon: ShieldCheck },
  { title: "Remember", titleBn: "স্মরণ", text: "Present stories with clarity and care so that people are remembered as human beings, not records alone.", textBn: "মানুষকে শুধু রেকর্ড নয়, মানুষ হিসেবে স্মরণ করতে গল্পগুলো স্পষ্টতা ও যত্নে উপস্থাপন করা।", icon: UsersRound },
];

export default function AboutPage() {
  const { pick } = useLanguage();

  return (
    <>
      <PageHeader
        label={pick("About July Smriti", "জুলাই স্মৃতি সম্পর্কে")}
        title={pick("A civic archive built around memory, truth and dignity.", "স্মৃতি, সত্য ও মর্যাদাকে কেন্দ্র করে নির্মিত একটি নাগরিক আর্কাইভ।")}
        description={pick("July Smriti Archive preserves reviewed documentary records, honours the people behind them and supports privacy-first reporting and assistance workflows.", "জুলাই স্মৃতি আর্কাইভ পর্যালোচিত নথি সংরক্ষণ করে, নথির পেছনের মানুষদের সম্মান জানায় এবং গোপনীয়তাভিত্তিক রিপোর্ট ও সহায়তা প্রক্রিয়া সমর্থন করে।")}
        actions={<><Button to="/archive" showArrow>{pick("Explore archive", "আর্কাইভ দেখুন")}</Button><Button to="/stories" variant="secondary">{pick("Read stories", "গল্প পড়ুন")}</Button></>}
      />

      <section className="section-pad">
        <div className="page-shell grid gap-10 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
          <div>
            <p className="eyebrow">{pick("Why this archive exists", "এই আর্কাইভ কেন")}</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-5xl">{pick("History is strongest when evidence and human memory stay together.", "প্রমাণ ও মানুষের স্মৃতি একসঙ্গে থাকলে ইতিহাস সবচেয়ে শক্তিশালী হয়।")}</h2>
            <p className="mt-6 text-base leading-8 text-[#C6C2BC]">{pick("During moments of public crisis, photographs, messages and testimony can disappear, lose context or expose vulnerable people. July Smriti is designed to preserve what matters while keeping verification, consent and privacy visible at every step.", "জনসংকটের সময়ে ছবি, বার্তা ও সাক্ষ্য হারিয়ে যেতে পারে, প্রেক্ষাপট হারাতে পারে অথবা ঝুঁকিতে থাকা মানুষকে প্রকাশ করে দিতে পারে। জুলাই স্মৃতি এমনভাবে তৈরি, যাতে গুরুত্বপূর্ণ বিষয় সংরক্ষিত থাকে এবং প্রতিটি ধাপে যাচাই, সম্মতি ও গোপনীয়তা দৃশ্যমান থাকে।")}</p>
            <div className="mt-8 rounded-2xl border border-archive-amber/20 bg-archive-amber/[0.06] p-6">
              <Sparkles className="h-6 w-6 text-archive-amber" />
              <p className="mt-4 font-display text-2xl font-semibold leading-snug text-white">{pick("“স্মৃতি বাঁচুক, সত্য কথা বলুক।”", "“স্মৃতি বাঁচুক, সত্য কথা বলুক।”")}</p>
              <p className="mt-3 text-sm leading-7 text-archive-muted">{pick("The archive is a public memory project, not an emergency service and not a substitute for legal or medical professionals.", "এই আর্কাইভ একটি জনস্মৃতি প্রকল্প; এটি জরুরি সেবা নয় এবং আইনগত বা চিকিৎসা পেশাজীবীর বিকল্প নয়।")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <figure className="col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
              <img src={marchImage} alt={pick("A large public march during the July movement", "জুলাই আন্দোলনের একটি বড় জনমিছিল")} className="aspect-[16/8.5] w-full object-cover" />
              <figcaption className="border-t border-white/[0.08] px-4 py-3 text-xs text-archive-muted">{pick("Public memory is built from many witnesses and many records.", "জনস্মৃতি বহু সাক্ষী ও বহু নথি থেকে তৈরি হয়।")}</figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
              <img src={flagImage} alt={pick("A protester holding the Bangladesh flag", "বাংলাদেশের পতাকা হাতে একজন প্রতিবাদকারী")} className="aspect-square w-full object-cover" />
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
              <img src={memorialImage} alt={pick("People gathered around a public memorial", "একটি জনস্মারকের পাশে সমবেত মানুষ")} className="aspect-square w-full object-cover" />
            </figure>
          </div>
        </div>
      </section>

      <section className="section-pad border-y border-white/[0.06] bg-ink-900/45">
        <div className="page-shell">
          <SectionHeading label={pick("Our principles", "আমাদের নীতি")} title={pick("The archive is more than a collection of files.", "আর্কাইভ শুধু ফাইলের সংগ্রহ নয়।")} description={pick("Every record creates a responsibility to the person shown, the contributor who shared it and the public that may rely on it.", "প্রতিটি রেকর্ড ছবিতে থাকা মানুষ, যিনি তা দিয়েছেন এবং যে জনসাধারণ তা ব্যবহার করতে পারে—সবার প্রতি দায়িত্ব তৈরি করে।")} />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {values.map(({ title, titleBn, text, textBn, icon: Icon }) => (
              <article key={title} className="surface-card rounded-2xl p-6 transition hover:-translate-y-1 hover:border-archive-amber/20">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-archive-amber/10 text-archive-amber"><Icon className="h-5 w-5" /></span>
                <h2 className="mt-5 font-display text-2xl font-semibold">{pick(title, titleBn)}</h2>
                <p className="mt-3 text-sm leading-7 text-archive-muted">{pick(text, textBn)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell">
          <SectionHeading label={pick("Our responsibility", "আমাদের দায়িত্ব")} title={pick("Preserve carefully. Review honestly. Remember humanely.", "যত্নে সংরক্ষণ। সততায় পর্যালোচনা। মানবিকভাবে স্মরণ।")} />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {responsibilities.map(({ title, titleBn, text, textBn, icon: Icon }, index) => (
              <article key={title} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7">
                <span className="absolute right-5 top-4 font-display text-6xl font-semibold text-white/[0.035]">0{index + 1}</span>
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-archive-teal/20 bg-archive-teal/10 text-archive-teal"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-6 font-display text-3xl font-semibold">{pick(title, titleBn)}</h3>
                <p className="mt-4 text-sm leading-7 text-archive-muted">{pick(text, textBn)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="verification" className="section-pad scroll-mt-24 border-y border-white/[0.06] bg-ink-900/45">
        <div className="page-shell grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img src={memorialImage} alt={pick("Community members gathered at a memorial", "স্মারকের পাশে সমবেত কমিউনিটির মানুষ")} className="aspect-[4/3] w-full object-cover" />
          </div>
          <div>
            <SectionHeading label={pick("Verification policy", "যাচাই নীতি")} title={pick("Human review before public publication.", "প্রকাশের আগে মানবিক পর্যালোচনা।")} description={pick("No submission should become a public record automatically. Reviewers assess source context, dates, locations, privacy risks, consent and corroborating materials.", "কোনো জমা দেওয়া তথ্য স্বয়ংক্রিয়ভাবে প্রকাশ্য রেকর্ড হওয়া উচিত নয়। রিভিউয়াররা উৎস, তারিখ, স্থান, গোপনীয়তার ঝুঁকি, সম্মতি ও সমর্থনকারী নথি যাচাই করেন।")} />
            <div className="mt-7 rounded-2xl border border-archive-amber/20 bg-archive-amber/[0.06] p-6">
              <Scale className="h-7 w-7 text-archive-amber" />
              <h2 className="mt-5 text-xl font-semibold">{pick("File integrity is not the same as truth verification.", "ফাইল অক্ষত থাকা সত্য যাচাইয়ের সমান নয়।")}</h2>
              <p className="mt-3 text-sm leading-7 text-[#C6C2BC]">{pick("A file hash can help detect later changes. It cannot prove that a date, place or claim is true. Human review checks source and context, and public records should show remaining uncertainty.", "ফাইল হ্যাশ পরে পরিবর্তন হয়েছে কি না বুঝতে সাহায্য করতে পারে। এটি তারিখ, স্থান বা দাবি সত্য প্রমাণ করে না। মানবিক পর্যালোচনা উৎস ও প্রেক্ষাপট যাচাই করে এবং বাকি অনিশ্চয়তা প্রকাশ্য রেকর্ডে দেখানো উচিত।")}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="section-pad scroll-mt-24">
        <div className="page-shell grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="eyebrow">{pick("Privacy", "গোপনীয়তা")}</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">{pick("Sensitive information stays protected.", "সংবেদনশীল তথ্য সুরক্ষিত থাকে।")}</h2>
            <p className="mt-5 text-sm leading-7 text-archive-muted">{pick("Public remembrance should never require publishing a private phone number, exact home address, medical document or identity that a person chose to protect.", "জনস্মৃতির জন্য কখনও ব্যক্তিগত ফোন নম্বর, সঠিক বাসার ঠিকানা, চিকিৎসা নথি বা সুরক্ষিত রাখতে চাওয়া পরিচয় প্রকাশের প্রয়োজন নেই।")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card rounded-2xl p-6"><ShieldCheck className="h-6 w-6 text-archive-teal" /><h3 className="mt-4 font-semibold">{pick("Public archive", "প্রকাশ্য আর্কাইভ")}</h3><p className="mt-3 text-sm leading-7 text-archive-muted">{pick("Only approved content, redacted media and consented identity details are visible.", "শুধু অনুমোদিত বিষয়বস্তু, সম্পাদিত মিডিয়া ও সম্মত পরিচয় তথ্য দৃশ্যমান।")}</p></div>
            <div className="surface-card rounded-2xl p-6"><EyeOff className="h-6 w-6 text-archive-rose" /><h3 className="mt-4 font-semibold">{pick("Private workflows", "ব্যক্তিগত প্রক্রিয়া")}</h3><p className="mt-3 text-sm leading-7 text-archive-muted">{pick("Support documents, contact details, sighting reports and raw submissions remain restricted.", "সহায়তা নথি, যোগাযোগ, সম্ভাব্য দেখার রিপোর্ট ও মূল জমা সীমিত থাকে।")}</p></div>
          </div>
        </div>
      </section>

      <section id="guidelines" className="section-pad scroll-mt-24 border-y border-white/[0.06] bg-ink-900/45">
        <div className="page-shell grid gap-8 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <SectionHeading label={pick("Content guidelines", "বিষয়বস্তু নির্দেশিকা")} title={pick("Respect people, evidence and context.", "মানুষ, প্রমাণ ও প্রেক্ষাপটকে সম্মান করুন।")} description={pick("Do not submit graphic material without necessity, private details without consent, unverified accusations, unrelated promotion or manipulated media. Give dates, locations and source context whenever possible.", "প্রয়োজন ছাড়া গ্রাফিক উপাদান, সম্মতি ছাড়া ব্যক্তিগত তথ্য, যাচাইহীন অভিযোগ, অপ্রাসঙ্গিক প্রচারণা বা পরিবর্তিত মিডিয়া জমা দেবেন না। সম্ভব হলে তারিখ, স্থান ও উৎসের প্রেক্ষাপট দিন।")} />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="text-sm font-semibold text-white">{pick("Before you submit", "জমা দেওয়ার আগে")}</p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-archive-muted">
              {[pick("Confirm that sharing the material will not put someone at risk.", "নিশ্চিত করুন যে উপাদান শেয়ার করলে কেউ ঝুঁকিতে পড়বে না।"), pick("Keep the original file and explain where it came from.", "মূল ফাইল রাখুন এবং এটি কোথা থেকে এসেছে বলুন।"), pick("Separate what you directly observed from what you heard from others.", "নিজে যা দেখেছেন এবং অন্যের কাছে যা শুনেছেন তা আলাদা করুন।")].map((item) => <div key={item} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-archive-amber" /><span>{item}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section-pad scroll-mt-24">
        <div className="page-shell">
          <div className="overflow-hidden rounded-3xl border border-archive-amber/20 bg-gradient-to-br from-archive-amber/[0.11] via-white/[0.035] to-archive-rose/[0.08] p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="eyebrow">{pick("Take part", "অংশ নিন")}</p>
                <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold">{pick("Help preserve a record or request protected support.", "একটি রেকর্ড সংরক্ষণে সাহায্য করুন অথবা সুরক্ষিত সহায়তা চান।")}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-archive-muted">{pick("Use the existing submission and support workflows. Contact and case information stays within the project’s current authenticated backend flow.", "বর্তমান জমা ও সহায়তা প্রক্রিয়া ব্যবহার করুন। যোগাযোগ ও কেসের তথ্য প্রকল্পের বিদ্যমান প্রমাণীকৃত ব্যাকএন্ড প্রবাহের মধ্যেই থাকে।")}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button to="/submit" showArrow>{pick("Submit evidence", "তথ্য জমা দিন")}</Button>
                <Button to="/support/new" variant="secondary">{pick("Request support", "সহায়তা চান")} <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
