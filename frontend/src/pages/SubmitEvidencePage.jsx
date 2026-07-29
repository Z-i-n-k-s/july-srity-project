import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  EyeOff,
  FileArchive,
  FileUp,
  ImageOff,
  LockKeyhole,
  MicOff,
  Save,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EvidenceAttachmentGrid, {
  formatFileSize,
  getEvidenceFileKind,
} from "../components/submission/EvidenceAttachmentGrid";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../context/ToastContext";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { userApi } from "../lib/api";
import { STORAGE_KEYS, storage } from "../lib/storage";
import { makeId } from "../lib/utils";

const MAX_FILES = 20;
const MAX_FILE_SIZE = 250 * 1024 * 1024;
const MAX_TOTAL_SIZE = 1024 * 1024 * 1024;

const initial = {
  title: "",
  summary: "",
  storyText: "",
  eventDate: "",
  location: "",
  sourceType: "Direct contributor",
  sourceNotes: "",
  identityPreference: "Anonymous to the public",
  pseudonym: "",
  publicationPermission: "Ask me before any public publication",
  archiveVisibility: "Eligible for public archive after approval",
  removeMetadata: true,
  redactNames: true,
  protectFaces: false,
  protectVoices: false,
  allowAdminContact: true,
  consent: false,
  accuracy: false,
  privacyConfirmed: false,
};

const allowedExtension = /\.(jpe?g|png|gif|webp|avif|heic|mp4|mov|webm|mkv|avi|mp3|wav|m4a|ogg|aac|pdf|doc|docx|odt|rtf|txt)$/i;

const getContentTypes = (values, files) => {
  const types = new Set(files.map(getEvidenceFileKind));
  if (values.storyText.trim()) types.add("Story / Testimony");
  if (!types.size && values.summary.trim()) types.add("Written record");
  return Array.from(types);
};

const getPublicIdentityLabel = (values) => {
  if (values.identityPreference === "Use a pseudonym") {
    return values.pseudonym.trim() || "Pseudonym pending";
  }
  if (values.identityPreference === "Show my name publicly") return "Contributor name visible";
  return "Anonymous contributor";
};

const migrateDraftValues = (draftValues = {}) => ({
  ...initial,
  ...draftValues,
  summary: draftValues.summary || draftValues.description || "",
  storyText: draftValues.storyText || (draftValues.type === "Testimony" ? draftValues.description || "" : ""),
  identityPreference: draftValues.identityPreference
    || (draftValues.privacy === "Show my name" ? "Show my name publicly" : draftValues.privacy === "Use a pseudonym" ? "Use a pseudonym" : "Anonymous to the public"),
});

export default function SubmitEvidencePage() {
  const [params] = useSearchParams();
  const requestedType = params.get("type");
  const [values, setValues] = useState(() => ({
    ...initial,
    storyText: requestedType === "story" ? "" : initial.storyText,
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const draft = storage.get(STORAGE_KEYS.drafts, []).find((item) => item.kind === "evidence");
    if (draft?.values) setValues(migrateDraftValues(draft.values));
  }, []);

  const contentTypes = useMemo(() => getContentTypes(values, files), [values, files]);
  const totalFileSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const publicIdentityLabel = getPublicIdentityLabel(values);

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "", material: "" }));
  };

  const validate = () => {
    const next = {};
    if (values.title.trim().length < 4) next.title = "Add a clear title.";
    if (values.summary.trim().length < 20) next.summary = "Add a neutral summary of at least 20 characters.";
    if (!values.storyText.trim() && !files.length) next.material = "Add written testimony or at least one photograph, video, audio file or document.";
    if (values.storyText.trim() && values.storyText.trim().length < 30) next.storyText = "Written stories or testimonies should contain at least 30 characters.";
    if (!values.eventDate) next.eventDate = "Choose an approximate event date.";
    if (!values.location.trim()) next.location = "Enter an approximate location.";
    if (values.identityPreference === "Use a pseudonym" && values.pseudonym.trim().length < 2) next.pseudonym = "Enter the pseudonym that may appear publicly.";
    if (!values.consent) next.consent = "Private administrator review consent is required.";
    if (!values.accuracy) next.accuracy = "Confirm the accuracy declaration.";
    if (!values.privacyConfirmed) next.privacyConfirmed = "Confirm that you reviewed the identity and publication settings.";
    setErrors(next);
    return !Object.keys(next).length;
  };

  const addFiles = (incomingFiles) => {
    const incoming = Array.from(incomingFiles || []);
    if (!incoming.length) return;

    const rejected = [];
    const valid = incoming.filter((file) => {
      const accepted = file.type.startsWith("image/")
        || file.type.startsWith("video/")
        || file.type.startsWith("audio/")
        || file.type === "application/pdf"
        || allowedExtension.test(file.name);

      if (!accepted) {
        rejected.push(`${file.name}: unsupported file type`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: larger than 250 MB`);
        return false;
      }
      return true;
    });

    const merged = [...files];
    valid.forEach((file) => {
      const duplicate = merged.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
      if (!duplicate) merged.push(file);
    });

    if (merged.length > MAX_FILES) {
      toast.error(`You can attach up to ${MAX_FILES} files in one submission.`);
      return;
    }

    const mergedSize = merged.reduce((sum, file) => sum + file.size, 0);
    if (mergedSize > MAX_TOTAL_SIZE) {
      toast.error("The total attachment size must be 1 GB or less.");
      return;
    }

    setFiles(merged);
    setErrors((current) => ({ ...current, material: "" }));
    if (rejected.length) toast.error(rejected.slice(0, 2).join(" • "));
  };

  const selectFiles = (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const saveDraft = () => {
    const drafts = storage.get(STORAGE_KEYS.drafts, []);
    const nextDraft = {
      id: makeId("DRAFT"),
      kind: "evidence",
      values,
      contentTypes,
      fileNames: files.map((file) => file.name),
      fileMetadata: files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        kind: getEvidenceFileKind(file),
      })),
      savedAt: new Date().toISOString(),
      status: "Saved offline",
    };
    storage.set(STORAGE_KEYS.drafts, [...drafts.filter((item) => item.kind !== "evidence"), nextDraft]);
    toast.success("Private draft saved on this device. Re-select attachment files before submitting.");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (!isOnline) {
      saveDraft();
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const submissionType = contentTypes.length > 1 ? "Mixed archive submission" : contentTypes[0] || "Written record";
      const privacyControls = {
        identityPreference: values.identityPreference,
        publicAttribution: publicIdentityLabel,
        publicationPermission: values.publicationPermission,
        archiveVisibility: values.archiveVisibility,
        removeMetadata: values.removeMetadata,
        redactNames: values.redactNames,
        protectFaces: values.protectFaces,
        protectVoices: values.protectVoices,
        allowAdminContact: values.allowAdminContact,
      };

      Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)));
      formData.append("type", submissionType);
      formData.append("contentTypes", JSON.stringify(contentTypes));
      formData.append("privacyControls", JSON.stringify(privacyControls));
      files.forEach((file) => formData.append("files", file));

      const response = await userApi.submitEvidence(formData);
      const id = response?.data?.id || response?.id || makeId("SUB");
      const submissions = storage.get(STORAGE_KEYS.submissions, []);
      storage.set(STORAGE_KEYS.submissions, [{
        id,
        title: values.title,
        type: submissionType,
        contentTypes,
        attachmentCount: files.length,
        identity: publicIdentityLabel,
        publicationPermission: values.publicationPermission,
        archiveVisibility: values.archiveVisibility,
        status: "Pending admin review",
        visibility: "Private",
        updatedAt: "Just now",
        createdAt: "Just now",
      }, ...submissions]);
      storage.set(STORAGE_KEYS.drafts, storage.get(STORAGE_KEYS.drafts, []).filter((item) => item.kind !== "evidence"));
      toast.success(`Submission received privately: ${id}`);
      navigate("/account/submissions");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        label="Private until an administrator approves it"
        title="Submit Any July Record"
        description="Send photographs, written stories, first-hand testimony, videos, audio and documents together in one protected submission. Nothing appears publicly automatically."
      />

      <section className="section-pad">
        <div className="page-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
          <form onSubmit={submit} className="surface-card space-y-8 rounded-2xl p-5 sm:p-7" noValidate>
            <section aria-labelledby="submission-content-heading" className="space-y-6">
              <div>
                <p className="eyebrow">1. Your record</p>
                <h2 id="submission-content-heading" className="mt-2 font-display text-3xl font-semibold">Share one item or a complete mixed collection.</h2>
                <p className="mt-2 text-sm leading-6 text-archive-muted">A single submission may contain text, photographs, video, audio and documents. Administrators review every part together.</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Submission title" id="submission-title" error={errors.title} required>
                  <input
                    id="submission-title"
                    className="field-control"
                    value={values.title}
                    onChange={(event) => updateValue("title", event.target.value)}
                    placeholder="A clear, neutral title"
                  />
                </FormField>
                <FormField label="Detected content" id="detected-content" hint="This updates automatically from your written record and attachments.">
                  <div id="detected-content" className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5">
                    {contentTypes.length ? contentTypes.map((type) => (
                      <span key={type} className="badge border-archive-amber/25 bg-archive-amber/10 text-archive-amber">{type}</span>
                    )) : <span className="text-sm text-archive-muted">No material added yet</span>}
                  </div>
                </FormField>
              </div>

              <FormField label="Short public-safe summary" id="submission-summary" error={errors.summary} hint="Use neutral language. Administrators can edit or redact this before publication." required>
                <textarea
                  id="submission-summary"
                  rows="4"
                  className="field-control"
                  value={values.summary}
                  onChange={(event) => updateValue("summary", event.target.value)}
                  placeholder="Briefly explain what this collection contains and why it matters."
                />
              </FormField>

              <FormField label="Written story or first-hand testimony" id="submission-story" error={errors.storyText} hint="Optional when files are attached. Text-only submissions are fully supported.">
                <textarea
                  id="submission-story"
                  rows="9"
                  className="field-control"
                  value={values.storyText}
                  onChange={(event) => updateValue("storyText", event.target.value)}
                  placeholder="Write the memory, sequence of events, testimony or context in your own words..."
                />
              </FormField>

              <FormField
                label="Photographs, videos, audio and documents"
                id="evidence-files"
                error={errors.material}
                hint={`${files.length}/${MAX_FILES} files • ${formatFileSize(totalFileSize)} selected • up to 250 MB per file`}
              >
                <input
                  ref={fileRef}
                  id="evidence-files"
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.odt,.rtf,.txt"
                  onChange={selectFiles}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                  onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                  onDragLeave={(event) => { event.preventDefault(); setDragActive(false); }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                    addFiles(event.dataTransfer.files);
                  }}
                  className={`focus-ring flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center transition ${dragActive ? "border-archive-amber bg-archive-amber/10 text-white" : "border-white/15 bg-white/[0.025] text-archive-muted hover:border-archive-amber/40 hover:text-white"}`}
                >
                  <FileUp className="h-8 w-8 text-archive-amber" />
                  <span className="font-semibold text-[#E9E4DD]">Choose files or drop them here</span>
                  <span className="max-w-xl text-xs leading-5">Images, videos, audio, PDF, Word, OpenDocument, RTF and text files. You may add more files in several selections.</span>
                </button>
              </FormField>

              <EvidenceAttachmentGrid files={files} onRemove={removeFile} />
            </section>

            <section aria-labelledby="record-context-heading" className="space-y-6 border-t border-white/10 pt-8">
              <div>
                <p className="eyebrow">2. Source and context</p>
                <h2 id="record-context-heading" className="mt-2 font-display text-3xl font-semibold">Help administrators verify the material.</h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Approximate event date" id="event-date" error={errors.eventDate} required>
                  <input id="event-date" type="date" className="field-control" value={values.eventDate} onChange={(event) => updateValue("eventDate", event.target.value)} />
                </FormField>
                <FormField label="Approximate location" id="event-location" error={errors.location} required>
                  <input id="event-location" className="field-control" value={values.location} onChange={(event) => updateValue("location", event.target.value)} placeholder="Area, campus, city or district" />
                </FormField>
              </div>

              <FormField label="Source type" id="source-type">
                <select id="source-type" className="field-control" value={values.sourceType} onChange={(event) => updateValue("sourceType", event.target.value)}>
                  <option>Direct contributor</option>
                  <option>First-hand witness</option>
                  <option>Family or authorised representative</option>
                  <option>Received from another person</option>
                  <option>Public report</option>
                  <option>Licensed archive</option>
                  <option>Source uncertain</option>
                </select>
              </FormField>

              <FormField label="Private source notes for administrators" id="source-notes" hint="These notes are not public by default. Mention who created the material, how you received it and any uncertainty.">
                <textarea id="source-notes" rows="5" className="field-control" value={values.sourceNotes} onChange={(event) => updateValue("sourceNotes", event.target.value)} />
              </FormField>
            </section>

            <section aria-labelledby="identity-heading" className="space-y-6 border-t border-white/10 pt-8">
              <div>
                <p className="eyebrow">3. Identity and publication protection</p>
                <h2 id="identity-heading" className="mt-2 font-display text-3xl font-semibold">You control how your identity may appear.</h2>
                <p className="mt-2 text-sm leading-6 text-archive-muted">Your account identity is available only to authorised administrators for verification. The public sees only the option you select below.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Public identity preference">
                {[
                  { value: "Anonymous to the public", title: "Anonymous", description: "Your real name is never shown publicly.", icon: UserRoundX },
                  { value: "Use a pseudonym", title: "Pseudonym", description: "Show only a chosen public name.", icon: EyeOff },
                  { value: "Show my name publicly", title: "Public name", description: "Show your account name after approval.", icon: UserRoundCheck },
                ].map(({ value, title, description, icon: Icon }) => {
                  const selected = values.identityPreference === value;
                  return (
                    <label key={value} className={`focus-within:ring-2 focus-within:ring-archive-amber cursor-pointer rounded-2xl border p-4 transition ${selected ? "border-archive-teal/45 bg-archive-teal/10" : "border-white/10 bg-black/10 hover:border-white/20"}`}>
                      <input type="radio" name="identityPreference" value={value} checked={selected} onChange={(event) => updateValue("identityPreference", event.target.value)} className="sr-only" />
                      <div className="flex items-start gap-3">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${selected ? "border-archive-teal/35 bg-archive-teal/15 text-archive-teal" : "border-white/10 text-archive-muted"}`}><Icon className="h-5 w-5" /></span>
                        <div><p className="font-semibold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-archive-muted">{description}</p></div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {values.identityPreference === "Use a pseudonym" && (
                <FormField label="Public pseudonym" id="submission-pseudonym" error={errors.pseudonym} required>
                  <input id="submission-pseudonym" className="field-control" value={values.pseudonym} onChange={(event) => updateValue("pseudonym", event.target.value)} placeholder="Name to show if approved" />
                </FormField>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Publication permission" id="publication-permission" hint="An approval status never overrides this choice.">
                  <select id="publication-permission" className="field-control" value={values.publicationPermission} onChange={(event) => updateValue("publicationPermission", event.target.value)}>
                    <option>Ask me before any public publication</option>
                    <option>May publish after approval using my privacy settings</option>
                    <option>Do not publish; preserve privately only</option>
                  </select>
                </FormField>
                <FormField label="Archive visibility" id="archive-visibility">
                  <select id="archive-visibility" className="field-control" value={values.archiveVisibility} onChange={(event) => updateValue("archiveVisibility", event.target.value)}>
                    <option>Eligible for public archive after approval</option>
                    <option>Restricted archive access only</option>
                    <option>Administrator review only</option>
                  </select>
                </FormField>
              </div>

              <div className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.055] p-5">
                <h3 className="flex items-center gap-2 font-semibold text-white"><ShieldCheck className="h-5 w-5 text-archive-teal" /> Protection requests</h3>
                <p className="mt-2 text-sm leading-6 text-[#B9CFCB]">These requests travel with the submission so administrators can prepare a protected public version without changing the private original.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "removeMetadata", label: "Remove location/device metadata", icon: LockKeyhole },
                    { key: "redactNames", label: "Redact private names and contacts", icon: EyeOff },
                    { key: "protectFaces", label: "Blur identifiable faces before publishing", icon: ImageOff },
                    { key: "protectVoices", label: "Mask identifiable voices before publishing", icon: MicOff },
                    { key: "allowAdminContact", label: "Allow an authorised admin to contact me", icon: UserRoundCheck },
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-3 text-sm leading-6 text-[#D7D2CA] hover:border-archive-teal/25">
                      <input type="checkbox" checked={values[key]} onChange={(event) => updateValue(key, event.target.checked)} className="mt-1 h-4 w-4 accent-[#4B9B8D]" />
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-archive-teal" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-[#D6D1C9]">
                <span className="font-semibold text-archive-teal">Public attribution preview:</span> {publicIdentityLabel}. {values.publicationPermission}. Current visibility: private.
              </div>
            </section>

            <section aria-labelledby="confirm-heading" className="space-y-4 border-t border-white/10 pt-8">
              <div>
                <p className="eyebrow">4. Confirm and send</p>
                <h2 id="confirm-heading" className="mt-2 font-display text-3xl font-semibold">Submit privately for administrator review.</h2>
              </div>

              <div>
                <label className="flex items-start gap-3 text-sm leading-6 text-[#C6C2BC]"><input type="checkbox" checked={values.consent} onChange={(event) => updateValue("consent", event.target.checked)} className="mt-1 h-4 w-4 accent-[#D79A54]" /><span>I consent to private administrator review. I understand that no item is published automatically and that approval requires source, consent and safety checks.</span></label>
                {errors.consent && <p className="mt-2 text-sm text-red-300" role="alert">{errors.consent}</p>}
              </div>
              <div>
                <label className="flex items-start gap-3 text-sm leading-6 text-[#C6C2BC]"><input type="checkbox" checked={values.accuracy} onChange={(event) => updateValue("accuracy", event.target.checked)} className="mt-1 h-4 w-4 accent-[#D79A54]" /><span>I confirm that the source and context information is accurate to the best of my knowledge and that I have not intentionally misrepresented the material.</span></label>
                {errors.accuracy && <p className="mt-2 text-sm text-red-300" role="alert">{errors.accuracy}</p>}
              </div>
              <div>
                <label className="flex items-start gap-3 text-sm leading-6 text-[#C6C2BC]"><input type="checkbox" checked={values.privacyConfirmed} onChange={(event) => updateValue("privacyConfirmed", event.target.checked)} className="mt-1 h-4 w-4 accent-[#4B9B8D]" /><span>I reviewed my identity, publication and protection choices. Authorised administrators must follow these choices when preparing any public version.</span></label>
                {errors.privacyConfirmed && <p className="mt-2 text-sm text-red-300" role="alert">{errors.privacyConfirmed}</p>}
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button type="submit" size="lg" loading={loading}>
                  {isOnline ? "Send Privately for Admin Approval" : "Save Submission Offline"}
                </Button>
                <Button type="button" size="lg" variant="secondary" onClick={saveDraft}><Save className="h-4 w-4" /> Save Private Draft</Button>
              </div>
            </section>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.06] p-5">
              <ShieldCheck className="h-6 w-6 text-archive-teal" />
              <h2 className="mt-4 font-semibold">Approval workflow</h2>
              <ol className="mt-4 space-y-3 text-sm text-[#B9CFCB]">
                {["Submitted privately", "Administrator verifies source and context", "Identity and sensitive details are protected", "Approved public version or private preservation"].map((label, index) => (
                  <li key={label} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-archive-teal/30 bg-archive-teal/10 text-xs font-semibold text-archive-teal">{index + 1}</span><span className="pt-0.5 leading-5">{label}</span></li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <LockKeyhole className="h-6 w-6 text-archive-amber" />
              <h2 className="mt-4 font-semibold">Who sees what?</h2>
              <div className="mt-4 space-y-3 text-sm leading-6">
                <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="font-semibold text-white">Authorised administrators</p><p className="mt-1 text-archive-muted">Private originals, account identity and source notes for verification.</p></div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="font-semibold text-white">Public visitors</p><p className="mt-1 text-archive-muted">Only the approved, protected version and your selected attribution.</p></div>
              </div>
            </div>

            <div className="rounded-2xl border border-archive-amber/20 bg-archive-amber/[0.06] p-5">
              <FileArchive className="h-6 w-6 text-archive-amber" />
              <h2 className="mt-4 font-semibold">Mixed submissions supported</h2>
              <p className="mt-2 text-sm leading-6 text-archive-muted">Combine a written story with photographs, video, audio and supporting documents in the same record.</p>
            </div>

            <div className="rounded-2xl border border-archive-rose/20 bg-archive-rose/[0.06] p-5">
              <AlertTriangle className="h-6 w-6 text-archive-rose" />
              <h2 className="mt-4 font-semibold">Before uploading</h2>
              <p className="mt-2 text-sm leading-6 text-[#CDB8BC]">Do not include passwords, complete national-ID numbers, exact private addresses or unrelated sensitive documents.</p>
            </div>

            <div className="flex gap-3 rounded-xl border border-white/10 p-4 text-sm leading-6 text-archive-muted">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-archive-teal" />
              Raw files remain private while the administrator review is pending.
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
