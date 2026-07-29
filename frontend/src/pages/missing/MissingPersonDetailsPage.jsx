import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Eye, Loader2, LockKeyhole, MapPin, Shirt, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import Modal from "../../components/ui/Modal";
import FormField from "../../components/ui/FormField";
import StatusBadge from "../../components/ui/StatusBadge";
import { missingPersons } from "../../data/landingData";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { publicApi, unwrap, userApi } from "../../lib/api";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { makeId } from "../../lib/utils";

const initialSighting = { date: "", time: "", location: "", details: "", contact: "", consent: false };

export default function MissingPersonDetailsPage() {
  const { id } = useParams();
  const fallback = missingPersons.find((item) => item.id === id) || null;
  const [person, setPerson] = useState(fallback);
  const [pageLoading, setPageLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialSighting);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;
    publicApi.missingPerson(id, fallback ? { data: fallback } : null).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (data && !Array.isArray(data)) setPerson(data);
    }).catch(() => {}).finally(() => active && setPageLoading(false));
    return () => { active = false; };
  }, [id]);

  if (pageLoading && !person) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-9 w-9 animate-spin text-archive-rose" /></div>;
  if (!person) return <div className="page-shell min-h-screen pt-36"><h1 className="font-display text-5xl">{pick("Profile not found", "প্রোফাইল পাওয়া যায়নি")}</h1><Button to="/missing-persons" className="mt-6">{pick("Back to list", "তালিকায় ফিরুন")}</Button></div>;

  const personId = person.id || person._id || id;
  const submitSighting = async (event) => {
    event.preventDefault();
    const next = {};
    if (!values.date) next.date = pick("Select the sighting date.", "দেখার তারিখ নির্বাচন করুন।");
    if (!values.location.trim()) next.location = pick("Enter an approximate sighting location.", "আনুমানিক স্থান লিখুন।");
    if (values.details.trim().length < 15) next.details = pick("Add at least 15 characters of useful detail.", "অন্তত ১৫ অক্ষরের প্রয়োজনীয় বিবরণ দিন।");
    if (!values.contact.trim()) next.contact = pick("Provide a safe contact method for verification.", "যাচাইয়ের জন্য নিরাপদ যোগাযোগ দিন।");
    if (!values.consent) next.consent = pick("Consent is required.", "সম্মতি প্রয়োজন।");
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await userApi.reportSighting(personId, values);
      const sightings = storage.get(STORAGE_KEYS.sightings, []);
      storage.set(STORAGE_KEYS.sightings, [...sightings, { id: makeId("SIGHT"), personId, ...values, status: "Pending verification" }]);
      toast.success(pick("Possible sighting submitted privately for administrator review.", "সম্ভাব্য দেখার তথ্য ব্যক্তিগতভাবে অ্যাডমিন পর্যালোচনার জন্য জমা হয়েছে।"));
      setOpen(false);
      setValues(initialSighting);
    } catch (error) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <>
      <article className="page-shell pb-20 pt-32">
        <Link to="/missing-persons" className="text-sm font-semibold text-archive-amber">← {pick("Back to missing persons", "নিখোঁজ তালিকায় ফিরুন")}</Link>
        <div className="mt-7 grid gap-9 lg:grid-cols-[.82fr_1.18fr]">
          <ImageWithFallback src={person.image || person.photo} alt={pick(`Verified public profile for ${person.name}`, `${person.name}-এর যাচাইকৃত প্রকাশ্য প্রোফাইল`)} className="aspect-[4/3] rounded-2xl border border-archive-rose/20 lg:aspect-[4/5]" />
          <div><div className="flex flex-wrap items-center gap-3"><p className="eyebrow !text-archive-rose">{pick("Verified missing-person information", "যাচাইকৃত নিখোঁজ ব্যক্তির তথ্য")}</p><StatusBadge status={person.status || "Verified"} /></div><h1 className="mt-4 font-display text-5xl font-semibold md:text-6xl">{person.name}</h1><p className="mt-3 text-lg text-archive-muted">{pick("Age", "বয়স")} {person.age || "—"}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="surface-card rounded-2xl p-5"><MapPin className="h-5 w-5 text-archive-rose" /><p className="mt-4 text-xs uppercase tracking-[.15em] text-archive-muted">{pick("Last seen location", "শেষ দেখা স্থান")}</p><p className="mt-2 font-semibold">{person.lastSeenLocation}</p></div><div className="surface-card rounded-2xl p-5"><CalendarDays className="h-5 w-5 text-archive-rose" /><p className="mt-4 text-xs uppercase tracking-[.15em] text-archive-muted">{pick("Last seen date", "শেষ দেখা তারিখ")}</p><p className="mt-2 font-semibold">{person.lastSeenDate}</p></div><div className="surface-card rounded-2xl p-5 sm:col-span-2"><Shirt className="h-5 w-5 text-archive-rose" /><p className="mt-4 text-xs uppercase tracking-[.15em] text-archive-muted">{pick("Public identifying detail", "প্রকাশ্য শনাক্তকারী বিবরণ")}</p><p className="mt-2 font-semibold">{person.clothing || "—"}</p></div></div>
            <p className="mt-7 leading-8 text-[#C6C2BC]">{person.description}</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button variant="rose" size="lg" onClick={() => setOpen(true)}><Eye className="h-4 w-4" /> {pick("Report Possible Sighting", "সম্ভাব্য দেখা রিপোর্ট করুন")}</Button><Button to="/missing-persons/report" variant="secondary" size="lg">{pick("Report another missing person", "অন্য নিখোঁজ ব্যক্তি রিপোর্ট করুন")}</Button></div><div className="mt-6 flex gap-3 rounded-xl border border-archive-teal/20 bg-archive-teal/[0.06] p-4 text-sm leading-6 text-[#B9CFCB]"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-archive-teal" />{pick("Sighting reports, contact details and exact notes remain private until an authorised administrator reviews them.", "সম্ভাব্য দেখার রিপোর্ট, যোগাযোগ ও নির্দিষ্ট নোট অনুমোদিত অ্যাডমিন পর্যালোচনা না করা পর্যন্ত ব্যক্তিগত থাকে।")}</div>
          </div>
        </div>
      </article>
      <Modal open={open} onClose={() => setOpen(false)} title={pick("Report a possible sighting", "সম্ভাব্য দেখা রিপোর্ট করুন")} description={pick(`Your report about ${person.name} will remain private until reviewed.`, `${person.name} সম্পর্কে আপনার রিপোর্ট পর্যালোচনা না হওয়া পর্যন্ত ব্যক্তিগত থাকবে।`)}>
        {!isAuthenticated ? <div className="text-center"><ShieldCheck className="mx-auto h-10 w-10 text-archive-teal" /><h3 className="mt-4 font-display text-3xl font-semibold">{pick("Sign in to submit a protected report", "সুরক্ষিত রিপোর্ট জমা দিতে সাইন ইন করুন")}</h3><p className="mt-3 text-sm leading-6 text-archive-muted">{pick("Authentication helps administrators follow up safely while keeping your contact details private.", "সাইন ইন নিরাপদ ফলোআপে সাহায্য করে এবং আপনার যোগাযোগ ব্যক্তিগত রাখে।")}</p><Button to="/login" className="mt-6" onClick={() => setOpen(false)}>{pick("Sign In", "সাইন ইন")}</Button></div> : <form onSubmit={submitSighting} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2"><FormField label={pick("Date seen", "দেখার তারিখ")} id="sighting-date" error={errors.date} required><input id="sighting-date" type="date" className="field-control" value={values.date} onChange={(e) => setValues({ ...values, date: e.target.value })} /></FormField><FormField label={pick("Approximate time", "আনুমানিক সময়")} id="sighting-time"><input id="sighting-time" type="time" className="field-control" value={values.time} onChange={(e) => setValues({ ...values, time: e.target.value })} /></FormField></div>
          <FormField label={pick("Approximate location", "আনুমানিক স্থান")} id="sighting-location" error={errors.location} required><input id="sighting-location" className="field-control" value={values.location} onChange={(e) => setValues({ ...values, location: e.target.value })} /></FormField>
          <FormField label={pick("What did you observe?", "আপনি কী দেখেছেন?")} id="sighting-details" error={errors.details} required><textarea id="sighting-details" rows="5" className="field-control" value={values.details} onChange={(e) => setValues({ ...values, details: e.target.value })} /></FormField>
          <FormField label={pick("Safe contact method", "নিরাপদ যোগাযোগ")} id="sighting-contact" error={errors.contact} required><input id="sighting-contact" className="field-control" value={values.contact} onChange={(e) => setValues({ ...values, contact: e.target.value })} /></FormField>
          <div><label className="flex items-start gap-3 text-sm leading-6 text-[#C6C2BC]"><input type="checkbox" checked={values.consent} onChange={(e) => setValues({ ...values, consent: e.target.checked })} className="mt-1 h-4 w-4 accent-[#D79A54]" /><span>{pick("I confirm this report is made in good faith and may be reviewed privately by authorised administrators.", "আমি নিশ্চিত করছি রিপোর্টটি সৎ উদ্দেশ্যে করা এবং অনুমোদিত অ্যাডমিন ব্যক্তিগতভাবে পর্যালোচনা করতে পারেন।")}</span></label>{errors.consent && <p className="mt-2 text-sm text-red-300">{errors.consent}</p>}</div>
          <div className="flex gap-3"><Button type="submit" loading={loading}>{pick("Submit Private Sighting", "ব্যক্তিগত দেখা-তথ্য জমা দিন")}</Button><Button type="button" variant="secondary" onClick={() => setOpen(false)}>{pick("Cancel", "বাতিল")}</Button></div><div className="flex gap-3 rounded-xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4 text-sm text-[#CDB8BC]"><AlertTriangle className="h-5 w-5 shrink-0 text-archive-rose" />{pick("Do not publish this information on social media before verification.", "যাচাইয়ের আগে এই তথ্য সামাজিক মাধ্যমে প্রকাশ করবেন না।")}</div>
        </form>}
      </Modal>
    </>
  );
}
