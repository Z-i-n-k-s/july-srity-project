import { useState } from "react";
import { Bell, CheckCircle2, FileKey2, Languages, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";

const SettingsToggle = ({ checked, onChange, label, description, icon: Icon }) => (
  <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-white/[0.14] hover:bg-white/[0.04]">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-archive-teal/10 text-archive-teal"><Icon className="h-5 w-5" /></span>
    <span className="flex-1">
      <span className="block text-sm font-semibold text-white">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-archive-muted">{description}</span>
    </span>
    <input type="checkbox" checked={checked} onChange={onChange} className="mt-2 h-5 w-5 accent-[#D79A54]" />
  </label>
);

export default function AdminSettings() {
  const { language, setLanguage, pick } = useLanguage();
  const toast = useToast();
  const [values, setValues] = useState({
    requireDecisionNote: true,
    requirePrivacyCheck: true,
    preventOriginalPublish: true,
    notifyUrgentSupport: true,
    notifyMissingReport: true,
    reviewReminderHours: 24,
  });
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    localStorage.setItem("julySmritiAdminSettings", JSON.stringify(values));
    toast.success(pick("Admin preferences saved on this device.", "অ্যাডমিন পছন্দ এই ডিভাইসে সংরক্ষিত হয়েছে।"));
  };
  const toggle = (name, label, description, Icon) => (
    <SettingsToggle
      key={name}
      checked={values[name]}
      onChange={(event) => update(name, event.target.checked)}
      label={label}
      description={description}
      icon={Icon}
    />
  );

  return (
    <div className="space-y-6">
      <section className="admin-card"><p className="eyebrow">{pick("Administration preferences", "প্রশাসনিক পছন্দ")}</p><h2 className="mt-2 font-display text-4xl font-semibold">{pick("Privacy, review and notifications", "গোপনীয়তা, পর্যালোচনা ও বিজ্ঞপ্তি")}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">{pick("These frontend preferences demonstrate policy controls. The backend must enforce the same rules for every administrator account.", "এই ফ্রন্টএন্ড পছন্দগুলো নীতি নিয়ন্ত্রণ দেখায়। ব্যাকএন্ডে প্রতিটি অ্যাডমিন অ্যাকাউন্টের জন্য একই নিয়ম প্রয়োগ করতে হবে।")}</p></section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="admin-card"><div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-archive-amber" /><h3 className="font-display text-3xl font-semibold">{pick("Review safeguards", "পর্যালোচনা সুরক্ষা")}</h3></div><div className="mt-5 space-y-3">{toggle("requireDecisionNote", pick("Require decision notes", "সিদ্ধান্ত নোট বাধ্যতামূলক"), pick("Reject and information-request actions require an accountable reason.", "প্রত্যাখ্যান ও তথ্য চাওয়ার জন্য জবাবদিহিমূলক কারণ প্রয়োজন।"), FileKey2)}{toggle("requirePrivacyCheck", pick("Require privacy confirmation", "গোপনীয়তা নিশ্চিতকরণ বাধ্যতামূলক"), pick("Reviewers confirm identity, face, voice and metadata protections.", "রিভিউয়ার পরিচয়, মুখ, কণ্ঠ ও মেটাডাটা সুরক্ষা নিশ্চিত করেন।"), LockKeyhole)}{toggle("preventOriginalPublish", pick("Block original-file publication", "মূল ফাইল প্রকাশ বন্ধ"), pick("Only reviewed derivative copies may be public.", "কেবল পর্যালোচিত সংস্করণ প্রকাশ্য হতে পারে।"), ShieldCheck)}</div></section>
        <section className="admin-card"><div className="flex items-center gap-3"><Bell className="h-6 w-6 text-archive-rose" /><h3 className="font-display text-3xl font-semibold">{pick("Notifications", "বিজ্ঞপ্তি")}</h3></div><div className="mt-5 space-y-3">{toggle("notifyUrgentSupport", pick("Urgent support alerts", "জরুরি সহায়তা সতর্কতা"), pick("Notify authorised admins when urgent support cases arrive.", "জরুরি সহায়তা কেস এলে অনুমোদিত অ্যাডমিনকে জানান।"), Bell)}{toggle("notifyMissingReport", pick("High-priority missing reports", "উচ্চ অগ্রাধিকার নিখোঁজ রিপোর্ট"), pick("Surface new reports that require rapid verification.", "দ্রুত যাচাই প্রয়োজন এমন নতুন রিপোর্ট দেখান।"), Bell)}<label className="block rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><span className="field-label">{pick("Review reminder after", "পর্যালোচনা স্মরণ করাবে")}</span><select value={values.reviewReminderHours} onChange={(e) => update("reviewReminderHours", Number(e.target.value))} className="field-control"><option value={12}>12 hours</option><option value={24}>24 hours</option><option value={48}>48 hours</option></select></label></div></section>
        <section className="admin-card"><div className="flex items-center gap-3"><Languages className="h-6 w-6 text-archive-teal" /><h3 className="font-display text-3xl font-semibold">{pick("Interface language", "ইন্টারফেস ভাষা")}</h3></div><p className="mt-3 text-sm leading-6 text-archive-muted">{pick("Choose the default language for this browser. Record content remains in its original language.", "এই ব্রাউজারের ডিফল্ট ভাষা নির্বাচন করুন। রেকর্ডের বিষয়বস্তু মূল ভাষাতেই থাকবে।")}</p><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={() => setLanguage("en")} className={`focus-ring rounded-xl border px-4 py-3 text-sm font-semibold ${language === "en" ? "border-archive-amber/30 bg-archive-amber/10 text-archive-amber" : "border-white/10 text-archive-muted"}`}>English</button><button onClick={() => setLanguage("bn")} className={`focus-ring rounded-xl border px-4 py-3 text-sm font-semibold ${language === "bn" ? "border-archive-amber/30 bg-archive-amber/10 text-archive-amber" : "border-white/10 text-archive-muted"}`}>বাংলা</button></div></section>
        <section className="admin-card"><div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-archive-teal" /><h3 className="font-display text-3xl font-semibold">{pick("Backend enforcement", "ব্যাকএন্ড প্রয়োগ")}</h3></div><p className="mt-3 text-sm leading-7 text-archive-muted">{pick("Role checks, signed file URLs, audit logs, publication locks, private contact fields and medical-document permissions must be enforced by the server. Frontend controls alone are not security.", "রোল যাচাই, সাইনড ফাইল URL, অডিট লগ, প্রকাশ লক, ব্যক্তিগত যোগাযোগ ক্ষেত্র ও চিকিৎসা নথির অনুমতি সার্ভারে প্রয়োগ করতে হবে। কেবল ফ্রন্টএন্ড নিয়ন্ত্রণ নিরাপত্তা নয়।")}</p></section>
      </div>
      <div className="flex justify-end"><button onClick={save} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-5 py-3 text-sm font-semibold text-ink-950 shadow-amber"><Save className="h-4 w-4" />{pick("Save preferences", "পছন্দ সংরক্ষণ")}</button></div>
    </div>
  );
}
