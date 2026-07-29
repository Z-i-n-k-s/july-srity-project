import { AlertTriangle, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { missingPersons } from "../../data/landingData";
import ImageWithFallback from "../ui/ImageWithFallback";
import StatusBadge from "../ui/StatusBadge";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";
import { useLanguage } from "../../context/LanguageContext";

export default function MissingSection() {
  const { pick } = useLanguage();
  return (
    <section className="section-pad border-y border-archive-rose/10 bg-gradient-to-b from-[#170E14]/75 to-ink-950/50">
      <div className="page-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading label={pick("Verified missing-person information", "যাচাইকৃত নিখোঁজ ব্যক্তির তথ্য")} title={pick("Help families find reliable information.", "পরিবারকে নির্ভরযোগ্য তথ্য খুঁজতে সহায়তা করুন।")} description={pick("Users can submit missing-person reports and possible sightings. Information becomes public only after administrator verification.", "ব্যবহারকারী নিখোঁজ রিপোর্ট ও সম্ভাব্য দেখার তথ্য জমা দিতে পারেন। অ্যাডমিন যাচাইয়ের পরই তথ্য প্রকাশ্য হয়।")} />
          <div className="flex flex-wrap gap-3"><Button to="/missing-persons" variant="secondary">{pick("View Missing Persons", "নিখোঁজ তালিকা দেখুন")}</Button><Button to="/missing-persons/report" variant="rose" showArrow>{pick("Report a Missing Person", "নিখোঁজ রিপোর্ট করুন")}</Button></div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {missingPersons.map((person) => (
            <article key={person.id} className="group overflow-hidden rounded-2xl border border-archive-rose/15 bg-white/[0.03] transition hover:-translate-y-1 hover:border-archive-rose/35 hover:shadow-rose">
              <ImageWithFallback src={person.image} alt={`Public missing-person profile for ${person.name}`} className="aspect-[4/3]" imageClassName="transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-2xl font-semibold text-white">{person.name}</h3><p className="mt-1 text-sm text-archive-muted">Age {person.age}</p></div><StatusBadge status="Verified" /></div>
                <div className="mt-4 space-y-2 text-sm text-[#BDB9B2]"><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-archive-rose" />{person.lastSeenLocation}</p><p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-archive-rose" />{person.lastSeenDate}</p></div>
                <Link to={`/missing-persons/${person.id}`} className="focus-ring mt-5 inline-flex items-center gap-2 rounded text-sm font-semibold text-archive-paper">{pick("View details", "বিস্তারিত দেখুন")} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-archive-rose/20 bg-archive-rose/[0.07] px-4 py-3 text-sm text-[#D9C2C7]"><AlertTriangle className="h-5 w-5 shrink-0 text-archive-rose" /><p>{pick("Possible sightings remain private until verified. Public cards never show private phone numbers.", "সম্ভাব্য দেখার তথ্য যাচাই না হওয়া পর্যন্ত ব্যক্তিগত থাকে। প্রকাশ্য কার্ডে ব্যক্তিগত ফোন নম্বর দেখানো হয় না।")}</p></div>
      </div>
    </section>
  );
}
