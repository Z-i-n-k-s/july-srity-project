import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Image as ImageIcon, Paperclip, Save, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import useOnlineStatus from "../../hooks/useOnlineStatus";
import { userApi } from "../../lib/api";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { makeId } from "../../lib/utils";
import { filterOwnedRecords, isOwnedByUser, stampOwner } from "../../lib/ownership";

const initial = { requesterName: "", relationship: "Self", category: "Medical Treatment", urgency: "Needs Attention", location: "", hospital: "", description: "", contact: "", consent: false };
const MAX_FILES = 6;
const MAX_SIZE = 10 * 1024 * 1024;

const sizeLabel = (size) => size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;

export default function NewSupportRequestPage() {
  const { user } = useAuth();
  const { pick } = useLanguage();
  const [values, setValues] = useState({ ...initial, requesterName: user?.name || "" });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const isOnline = useOnlineStatus();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const draft = filterOwnedRecords(storage.get(STORAGE_KEYS.drafts, []), user).find((item) => item.kind === "support");
    if (draft?.values) setValues(draft.values);
  }, [user]);

  const previews = useMemo(() => files.map((file) => ({ file, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "" })), [files]);
  useEffect(() => () => previews.forEach((item) => item.url && URL.revokeObjectURL(item.url)), [previews]);

  const validate = () => {
    const next = {};
    if (values.requesterName.trim().length < 2) next.requesterName = pick("Enter the requester name.", "অনুরোধকারীর নাম লিখুন।");
    if (!values.location.trim()) next.location = pick("Enter an approximate location.", "একটি আনুমানিক স্থান লিখুন।");
    if (values.description.trim().length < 20) next.description = pick("Describe the support need in at least 20 characters.", "কমপক্ষে ২০ অক্ষরে সহায়তার প্রয়োজন লিখুন।");
    if (!values.contact.trim()) next.contact = pick("Enter a contact number or safe contact method.", "যোগাযোগ নম্বর বা নিরাপদ যোগাযোগ পদ্ধতি লিখুন।");
    if (!values.consent) next.consent = pick("Consent is required.", "সম্মতি প্রয়োজন।");
    setErrors(next);
    return !Object.keys(next).length;
  };

  const addFiles = (event) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = "";
    const valid = incoming.filter((file) => {
      if (!(file.type.startsWith("image/") || file.type === "application/pdf")) { toast.error(pick(`${file.name}: choose an image or PDF.`, `${file.name}: ছবি বা PDF নির্বাচন করুন।`)); return false; }
      if (file.size > MAX_SIZE) { toast.error(pick(`${file.name}: file must be 10 MB or smaller.`, `${file.name}: ফাইল ১০ এমবি বা কম হতে হবে।`)); return false; }
      return true;
    });
    const merged = [...files];
    valid.forEach((file) => { if (!merged.some((item) => item.name === file.name && item.size === file.size)) merged.push(file); });
    if (merged.length > MAX_FILES) return toast.error(pick(`Attach up to ${MAX_FILES} files.`, `সর্বোচ্চ ${MAX_FILES}টি ফাইল সংযুক্ত করুন।`));
    setFiles(merged);
  };

  const saveDraft = () => {
    const drafts = storage.get(STORAGE_KEYS.drafts, []);
    const otherDrafts = drafts.filter((draft) => draft.kind !== "support" || !isOwnedByUser(draft, user));
    storage.set(STORAGE_KEYS.drafts, [...otherDrafts, stampOwner({ id: makeId("DRAFT"), kind: "support", values, fileNames: files.map((file) => file.name), savedAt: new Date().toISOString(), status: "Saved offline" }, user)]);
    toast.success(pick("Support request draft saved on this device. Re-select files before sending.", "সহায়তা অনুরোধের খসড়া এই ডিভাইসে সংরক্ষিত হয়েছে। পাঠানোর আগে ফাইল আবার নির্বাচন করুন।"));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (!isOnline) { saveDraft(); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)));
      files.forEach((file) => formData.append("documents", file));
      const response = await userApi.createSupportRequest(formData);
      const id = response?.data?.id || response?.id || `JS-HELP-${String(Math.floor(Math.random() * 90000) + 10000)}`;
      const rooms = storage.get(STORAGE_KEYS.supportRooms, []);
      storage.set(STORAGE_KEYS.supportRooms, [stampOwner({ id, title: values.category, status: "Under review", priority: values.urgency, updatedAt: new Date().toISOString(), assignedAdmin: "Awaiting assignment", unread: 0, requester: user?.name || values.requesterName, requesterEmail: user?.email || "" }, user), ...rooms]);
      toast.success(pick(`Support request created: ${id}`, `সহায়তা অনুরোধ তৈরি হয়েছে: ${id}`));
      navigate(`/account/support-rooms/${id}`);
    } catch (error) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <>
      <PageHeader label={pick("Private request", "ব্যক্তিগত অনুরোধ")} title={pick("Open a Support Room", "সহায়তা কক্ষ খুলুন")} description={pick("Share enough information for an administrator to understand the need. Do not upload national ID, exact home address or unrelated medical documents.", "অ্যাডমিন যাতে প্রয়োজন বুঝতে পারেন ততটুকু তথ্য দিন। জাতীয় পরিচয়পত্র, সঠিক বাড়ির ঠিকানা বা অপ্রাসঙ্গিক চিকিৎসা নথি আপলোড করবেন না।")} />
      <section className="section-pad"><div className="page-shell grid gap-8 lg:grid-cols-[1fr_330px]">
        <form onSubmit={submit} className="surface-card space-y-6 rounded-2xl p-5 sm:p-7" noValidate>
          <div className="grid gap-5 sm:grid-cols-2"><FormField label={pick("Requester name", "অনুরোধকারীর নাম")} id="requesterName" error={errors.requesterName} required><input id="requesterName" className="field-control" value={values.requesterName} onChange={(e) => setValues({ ...values, requesterName: e.target.value })} /></FormField><FormField label={pick("Relationship", "সম্পর্ক")} id="relationship"><select id="relationship" className="field-control" value={values.relationship} onChange={(e) => setValues({ ...values, relationship: e.target.value })}><option>Self</option><option>Family member</option><option>Guardian</option><option>Authorised representative</option></select></FormField></div>
          <div className="grid gap-5 sm:grid-cols-2"><FormField label={pick("Support category", "সহায়তার ধরন")} id="category" required><select id="category" className="field-control" value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })}><option>Medical Treatment</option><option>Medicine</option><option>Rehabilitation</option><option>Legal Support</option></select></FormField><FormField label={pick("Urgency", "জরুরিতা")} id="urgency" required><select id="urgency" className="field-control" value={values.urgency} onChange={(e) => setValues({ ...values, urgency: e.target.value })}><option>Stable</option><option>Needs Attention</option><option>Urgent</option><option>Critical</option></select></FormField></div>
          <div className="grid gap-5 sm:grid-cols-2"><FormField label={pick("Approximate location", "আনুমানিক স্থান")} id="location" error={errors.location} required><input id="location" className="field-control" value={values.location} onChange={(e) => setValues({ ...values, location: e.target.value })} placeholder={pick("Area, city or district", "এলাকা, শহর বা জেলা")} /></FormField><FormField label={pick("Hospital or clinic (optional)", "হাসপাতাল বা ক্লিনিক (ঐচ্ছিক)")} id="hospital"><input id="hospital" className="field-control" value={values.hospital} onChange={(e) => setValues({ ...values, hospital: e.target.value })} /></FormField></div>
          <FormField label={pick("Describe the support need", "সহায়তার প্রয়োজন লিখুন")} id="description" error={errors.description} hint={pick("Avoid detailed medical history. An admin can request specific information later.", "বিস্তারিত চিকিৎসা ইতিহাস এড়িয়ে চলুন। পরে অ্যাডমিন নির্দিষ্ট তথ্য চাইতে পারেন।")} required><textarea id="description" rows="6" className="field-control resize-y" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} /></FormField>
          <FormField label={pick("Safe contact method", "নিরাপদ যোগাযোগ পদ্ধতি")} id="contact" error={errors.contact} required><input id="contact" className="field-control" value={values.contact} onChange={(e) => setValues({ ...values, contact: e.target.value })} placeholder={pick("Phone number or preferred contact", "ফোন নম্বর বা পছন্দের যোগাযোগ")} /></FormField>

          <div><div className="flex items-center justify-between"><div><span className="field-label">{pick("Requested medical images or documents (optional)", "প্রয়োজনীয় চিকিৎসা ছবি বা নথি (ঐচ্ছিক)")}</span><p className="text-xs leading-5 text-archive-muted">{pick("Images and PDFs only, up to 10 MB each. These remain private.", "শুধু ছবি ও PDF, প্রতিটি সর্বোচ্চ ১০ এমবি। এগুলো ব্যক্তিগত থাকবে।")}</p></div><button type="button" onClick={() => fileRef.current?.click()} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-[#C6C2BC] hover:border-archive-amber/30"><Paperclip className="h-4 w-4" />{pick("Add files", "ফাইল যোগ করুন")}</button><input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={addFiles} /></div>{files.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{previews.map(({ file, url }, index) => <div key={`${file.name}-${file.size}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/15">{url ? <img src={url} alt={`Preview ${file.name}`} className="h-40 w-full object-contain bg-black/20" /> : <div className="grid h-32 place-items-center text-archive-amber"><FileText className="h-8 w-8" /></div>}<div className="flex items-center gap-3 p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-archive-amber/10 text-archive-amber">{url ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{file.name}</p><p className="mt-1 text-[11px] text-archive-muted">{sizeLabel(file.size)}</p></div><button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-archive-rose" aria-label={`Remove ${file.name}`}><X className="h-4 w-4" /></button></div></div>)}</div> : <button type="button" onClick={() => fileRef.current?.click()} className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-8 text-sm text-archive-muted hover:border-archive-amber/30 hover:text-white"><Paperclip className="h-5 w-5" />{pick("Choose protected files", "সুরক্ষিত ফাইল নির্বাচন করুন")}</button>}</div>

          <div><label className="flex items-start gap-3 text-sm leading-6 text-[#C6C2BC]"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#D79A54]" checked={values.consent} onChange={(e) => setValues({ ...values, consent: e.target.checked })} /><span>{pick("I confirm that the information is accurate to the best of my knowledge and may be reviewed by authorised support administrators.", "আমি নিশ্চিত করছি যে তথ্য আমার জানা মতে সঠিক এবং অনুমোদিত সহায়তা অ্যাডমিন এটি পর্যালোচনা করতে পারেন।")}</span></label>{errors.consent && <p className="mt-2 text-sm text-red-300">{errors.consent}</p>}</div>
          <div className="flex flex-col gap-3 sm:flex-row"><Button type="submit" size="lg" loading={loading}>{isOnline ? pick("Create Support Room", "সহায়তা কক্ষ তৈরি") : pick("Save Request Offline", "অফলাইনে সংরক্ষণ")}</Button><Button type="button" variant="secondary" size="lg" onClick={saveDraft}><Save className="h-4 w-4" /> {pick("Save Draft", "খসড়া সংরক্ষণ")}</Button></div>
        </form>
        <aside className="space-y-4"><div className={`rounded-2xl border p-5 ${isOnline ? "border-archive-teal/20 bg-archive-teal/[0.07]" : "border-archive-amber/20 bg-archive-amber/[0.07]"}`}><div className="flex items-center gap-3">{isOnline ? <CheckCircle2 className="h-5 w-5 text-archive-teal" /> : <AlertTriangle className="h-5 w-5 text-archive-amber" />}<h2 className="font-semibold">{isOnline ? pick("Connected", "সংযুক্ত") : pick("Offline mode", "অফলাইন মোড")}</h2></div><p className="mt-2 text-sm leading-6 text-archive-muted">{isOnline ? pick("Your request can be sent securely to the backend.", "আপনার অনুরোধ নিরাপদভাবে ব্যাকএন্ডে পাঠানো যাবে।") : pick("Text information can be saved locally. Submit it when the connection returns.", "লিখিত তথ্য স্থানীয়ভাবে সংরক্ষণ করা যাবে। সংযোগ ফিরলে জমা দিন।")}</p></div><div className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.06] p-5"><ShieldCheck className="h-5 w-5 text-archive-teal" /><h2 className="mt-3 font-semibold">{pick("Document privacy", "নথির গোপনীয়তা")}</h2><p className="mt-2 text-sm leading-6 text-[#B9CFCB]">{pick("Medical files are visible only to the requester and authorised support administrators.", "চিকিৎসা ফাইল কেবল অনুরোধকারী ও অনুমোদিত সহায়তা অ্যাডমিন দেখতে পারবেন।")}</p></div><div className="rounded-2xl border border-archive-rose/20 bg-archive-rose/[0.06] p-5"><AlertTriangle className="h-5 w-5 text-archive-rose" /><h2 className="mt-3 font-semibold">{pick("Not an emergency service", "জরুরি সেবা নয়")}</h2><p className="mt-2 text-sm leading-6 text-[#CDB8BC]">{pick("Seek immediate local medical or emergency assistance when someone is in immediate danger.", "কেউ তাৎক্ষণিক বিপদে থাকলে স্থানীয় জরুরি চিকিৎসা সহায়তা নিন।")}</p></div></aside>
      </div></section>
    </>
  );
}
