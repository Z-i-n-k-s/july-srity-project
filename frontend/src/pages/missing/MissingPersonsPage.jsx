import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import StatusBadge from "../../components/ui/StatusBadge";
import { missingPersons as fallbackPersons } from "../../data/landingData";
import { publicApi, unwrap } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function MissingPersonsPage() {
  const [persons, setPersons] = useState(fallbackPersons);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("All locations");
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    publicApi.missingPersons(fallbackPersons).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (Array.isArray(data)) setPersons(data);
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => persons.filter((person) => {
    const matches = `${person.name || ""} ${person.lastSeenLocation || ""} ${person.clothing || ""}`.toLowerCase().includes(query.toLowerCase());
    return matches && (location === "All locations" || String(person.lastSeenLocation || "").includes(location));
  }), [persons, query, location]);

  return (
    <>
      <PageHeader label={pick("Admin-verified public information", "অ্যাডমিন-যাচাইকৃত প্রকাশ্য তথ্য")} title={pick("Missing Persons", "নিখোঁজ ব্যক্তি")} description={pick("Browse verified public reports or submit information for review. Private contacts and unverified sightings are never displayed publicly.", "যাচাইকৃত প্রকাশ্য রিপোর্ট দেখুন বা পর্যালোচনার জন্য তথ্য জমা দিন। ব্যক্তিগত যোগাযোগ ও যাচাই না হওয়া দেখা-সংক্রান্ত তথ্য কখনো প্রকাশ করা হয় না।")} actions={<Button to="/missing-persons/report" variant="rose" showArrow>{pick("Report a Missing Person", "নিখোঁজ ব্যক্তির রিপোর্ট করুন")}</Button>} />
      <section className="section-pad"><div className="page-shell">
        <div className="grid gap-3 rounded-2xl border border-archive-rose/15 bg-archive-rose/[0.04] p-4 md:grid-cols-[1fr_220px]"><label className="relative"><span className="sr-only">Search missing persons</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input className="field-control pl-12" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={pick("Search by public name, area or clothing", "প্রকাশ্য নাম, এলাকা বা পোশাক দিয়ে খুঁজুন")} /></label><select className="field-control" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Filter location"><option>All locations</option><option>Dhaka</option><option>Mirpur</option><option>Farmgate</option><option>Jatrabari</option></select></div>
        <div className="mt-6 flex items-center gap-2 text-sm text-archive-muted"><ShieldCheck className="h-4 w-4 text-archive-teal" />{pick("Only verified public reports appear here.", "এখানে কেবল যাচাইকৃত প্রকাশ্য রিপোর্ট দেখানো হয়।")}</div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((person) => <article key={person.id || person._id} className="group overflow-hidden rounded-2xl border border-archive-rose/15 bg-white/[0.03] transition hover:-translate-y-1 hover:border-archive-rose/35"><Link to={`/missing-persons/${person.id || person._id}`} className="focus-ring block"><ImageWithFallback src={person.image || person.photo} alt={`Verified public missing-person profile for ${person.name}`} className="aspect-[4/3]" imageClassName="transition duration-500 group-hover:scale-[1.03]" /><div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold">{person.name}</h2><p className="mt-1 text-sm text-archive-muted">{pick("Age", "বয়স")} {person.age}</p></div><StatusBadge status={person.status || "Verified"} /></div><div className="mt-5 space-y-2 text-sm text-[#C6C2BC]"><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-archive-rose" />{person.lastSeenLocation}</p><p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-archive-rose" />{person.lastSeenDate}</p></div><p className="mt-5 text-sm font-semibold text-archive-paper">{pick("View verified details →", "যাচাইকৃত বিস্তারিত দেখুন →")}</p></div></Link></article>)}</div>
      </div></section>
    </>
  );
}
