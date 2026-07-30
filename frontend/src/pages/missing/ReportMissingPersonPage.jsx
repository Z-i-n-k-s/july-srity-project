import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, Save, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import PageHeader from "../../components/ui/PageHeader";
import { useToast } from "../../context/ToastContext";
import useFilePreview from "../../hooks/useFilePreview";
import useOnlineStatus from "../../hooks/useOnlineStatus";
import { userApi } from "../../lib/api";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { isFutureLocalDateTime, makeId, toLocalDateInputValue } from "../../lib/utils";
import { useLanguage } from "../../context/LanguageContext";

const initial = { name: "", age: "", relationship: "", lastSeenDate: "", lastSeenLocation: "", clothing: "", description: "", reporterContact: "", visibilityConsent: false, declaration: false };
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

const formatFileSize = (size = 0) => {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ReportMissingPersonPage() {
  const [values, setValues] = useState(initial);
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const photoRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { pick } = useLanguage();
  const photoPreviewUrl = useFilePreview(photo);
  const maxReportDate = toLocalDateInputValue();

  useEffect(() => {
    const draft = storage.get(STORAGE_KEYS.drafts, []).find((item) => item.kind === "missing-report");
    if (draft?.values) setValues(draft.values);
  }, []);

  const updateValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const clearPhoto = () => {
    setPhoto(null);
    if (photoRef.current) photoRef.current.value = "";
  };

  const selectPhoto = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      clearPhoto();
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Choose a JPG, PNG, WEBP or GIF image.");
      clearPhoto();
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      toast.error("The photograph must be 10 MB or smaller.");
      clearPhoto();
      return;
    }

    setPhoto(file);
  };

  const validate = () => {
    const next = {};
    if (values.name.trim().length < 2) next.name = "Enter the missing person’s name.";
    if (!values.lastSeenDate) next.lastSeenDate = "Select the last-seen date.";
    else if (isFutureLocalDateTime(values.lastSeenDate)) next.lastSeenDate = "The last-seen date cannot be in the future.";
    if (!values.lastSeenLocation.trim()) next.lastSeenLocation = "Enter an approximate location.";
    if (values.description.trim().length < 20) next.description = "Add at least 20 characters of useful context.";
    if (!values.reporterContact.trim()) next.reporterContact = "Provide a private contact method.";
    if (!values.visibilityConsent) next.visibilityConsent = "Confirm the public-information consent choice.";
    if (!values.declaration) next.declaration = "Confirm the declaration.";
    setErrors(next);
    return !Object.keys(next).length;
  };

  const saveDraft = () => {
    const drafts = storage.get(STORAGE_KEYS.drafts, []);
    storage.set(STORAGE_KEYS.drafts, [...drafts.filter((item) => item.kind !== "missing-report"), { id: makeId("DRAFT"), kind: "missing-report", values, photoName: photo?.name || "", savedAt: new Date().toISOString(), status: "Saved offline" }]);
    toast.success("Missing-person report draft saved on this device.");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (!isOnline) { saveDraft(); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)));
      if (photo) formData.append("photo", photo);
      const response = await userApi.reportMissingPerson(formData);
      const reports = storage.get(STORAGE_KEYS.missingReports, []);
      const id = response?.data?.id || response?.id || makeId("MPR");
      storage.set(STORAGE_KEYS.missingReports, [{ id, ...values, photoName: photo?.name || "", status: "Under review", createdAt: new Date().toISOString() }, ...reports]);
      toast.success(pick(`Private report submitted: ${id}`, `ব্যক্তিগত রিপোর্ট জমা হয়েছে: ${id}`));
      navigate("/account/reports");
    } catch (error) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <>
      <PageHeader label={pick("Private report", "ব্যক্তিগত রিপোর্ট")} title={pick("Report a Missing Person", "নিখোঁজ ব্যক্তির রিপোর্ট করুন")} description={pick("Send information for administrator review. Nothing becomes public automatically, and your contact details remain private.", "অ্যাডমিন পর্যালোচনার জন্য তথ্য পাঠান। কিছুই স্বয়ংক্রিয়ভাবে প্রকাশ হয় না এবং আপনার যোগাযোগের তথ্য ব্যক্তিগত থাকে।")} />
      <section className="section-pad"><div className="page-shell grid gap-8 lg:grid-cols-[1fr_330px]">
        <form onSubmit={submit} className="surface-card space-y-6 rounded-2xl p-5 sm:p-7" noValidate>
          <div className="grid gap-5 sm:grid-cols-2"><FormField label="Full name" id="missing-name" error={errors.name} required><input id="missing-name" className="field-control" value={values.name} onChange={(e) => updateValue("name", e.target.value)} /></FormField><FormField label="Age (if known)" id="missing-age"><input id="missing-age" type="number" min="0" max="120" className="field-control" value={values.age} onChange={(e) => updateValue("age", e.target.value)} /></FormField></div>
          <FormField label="Your relationship to the person" id="relationship" hint="Used privately during verification."><input id="relationship" className="field-control" value={values.relationship} onChange={(e) => updateValue("relationship", e.target.value)} /></FormField>
          <div className="grid gap-5 sm:grid-cols-2"><FormField label="Last-seen date" id="lastSeenDate" error={errors.lastSeenDate} required><input id="lastSeenDate" type="date" className="field-control" value={values.lastSeenDate} max={maxReportDate} onChange={(e) => updateValue("lastSeenDate", e.target.value)} /></FormField><FormField label="Last-seen location" id="lastSeenLocation" error={errors.lastSeenLocation} required><input id="lastSeenLocation" className="field-control" value={values.lastSeenLocation} onChange={(e) => updateValue("lastSeenLocation", e.target.value)} placeholder="Area or landmark" /></FormField></div>
          <FormField label="Clothing or public identifying detail" id="clothing"><input id="clothing" className="field-control" value={values.clothing} onChange={(e) => updateValue("clothing", e.target.value)} /></FormField>
          <FormField label="Additional context" id="missing-description" error={errors.description} required><textarea id="missing-description" rows="6" className="field-control" value={values.description} onChange={(e) => updateValue("description", e.target.value)} /></FormField>
          <FormField label="Private reporter contact" id="reporterContact" error={errors.reporterContact} hint="This is never shown on the public card." required><input id="reporterContact" className="field-control" value={values.reporterContact} onChange={(e) => updateValue("reporterContact", e.target.value)} /></FormField>
          <FormField
            label="Recent photograph (optional)"
            id="missing-photo"
            hint={photo ? `${photo.name} • ${formatFileSize(photo.size)}` : "Use a clear, consented image. Large files are not saved to offline drafts."}
          >
            <input
              ref={photoRef}
              id="missing-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={selectPhoto}
            />

            {photoPreviewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-archive-rose/20 bg-black/20">
                <div className="relative p-2">
                  <img
                    src={photoPreviewUrl}
                    alt={`Selected missing-person photograph preview: ${photo.name}`}
                    className="mx-auto max-h-[460px] w-full rounded-xl object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="focus-ring absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/70 text-white hover:bg-black"
                    aria-label="Remove selected photograph"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#E8E1D8]">{photo.name}</p>
                    <p className="mt-1 text-xs text-archive-muted">{formatFileSize(photo.size)} • Preview only until submitted</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="focus-ring shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-archive-paper hover:border-archive-rose/35 hover:bg-archive-rose/[0.08]"
                  >
                    Replace photograph
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.025] px-4 py-8 text-sm text-archive-muted hover:border-archive-rose/35 hover:text-white"
              >
                <Camera className="h-5 w-5" />
                Choose photograph
              </button>
            )}
          </FormField>
          <div><label className="flex items-start gap-3 text-sm leading-6 text-[#C6C2BC]"><input type="checkbox" checked={values.visibilityConsent} onChange={(e) => updateValue("visibilityConsent", e.target.checked)} className="mt-1 h-4 w-4 accent-[#D79A54]" /><span>I understand that only admin-approved information and the approved photograph may become public.</span></label>{errors.visibilityConsent && <p className="mt-2 text-sm text-red-300">{errors.visibilityConsent}</p>}</div>
          <div><label className="flex items-start gap-3 text-sm leading-6 text-[#C6C2BC]"><input type="checkbox" checked={values.declaration} onChange={(e) => updateValue("declaration", e.target.checked)} className="mt-1 h-4 w-4 accent-[#D79A54]" /><span>I declare that this report is made in good faith and the information is accurate to the best of my knowledge.</span></label>{errors.declaration && <p className="mt-2 text-sm text-red-300">{errors.declaration}</p>}</div>
          <div className="flex flex-col gap-3 sm:flex-row"><Button type="submit" variant="rose" size="lg" loading={loading}>{isOnline ? "Submit Private Report" : "Save Report Offline"}</Button><Button type="button" variant="secondary" size="lg" onClick={saveDraft}><Save className="h-4 w-4" /> {pick("Save Draft", "খসড়া সংরক্ষণ")}</Button><Button to="/missing-persons" variant="ghost" size="lg">{pick("Cancel", "বাতিল")}</Button></div>
        </form>
        <aside className="space-y-4"><div className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.06] p-5"><ShieldCheck className="h-6 w-6 text-archive-teal" /><h2 className="mt-4 font-semibold">Verification before publication</h2><p className="mt-2 text-sm leading-6 text-[#B9CFCB]">An administrator reviews identity, relationship, consent and public safety before any profile is published.</p></div><div className="rounded-2xl border border-archive-rose/20 bg-archive-rose/[0.06] p-5"><AlertTriangle className="h-6 w-6 text-archive-rose" /><h2 className="mt-4 font-semibold">Protect the person</h2><p className="mt-2 text-sm leading-6 text-[#CDB8BC]">Do not publish private phone numbers, exact home addresses or unverified accusations.</p></div></aside>
      </div></section>
    </>
  );
}
