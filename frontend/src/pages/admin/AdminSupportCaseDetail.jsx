import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, FileCheck2, Image as ImageIcon, LockKeyhole, Paperclip, Send, ShieldAlert, UserRound, X, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { adminApi, unwrap } from "../../lib/api";
import { adminSupportFallback } from "../../data/adminData";
import AdminFilePreview from "../../components/admin/AdminFilePreview";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import useFilePreview from "../../hooks/useFilePreview";

export default function AdminSupportCaseDetail() {
  const { caseId } = useParams();
  const fallback = useMemo(() => adminSupportFallback.find((item) => item.id === caseId) || adminSupportFallback[0], [caseId]);
  const [caseData, setCaseData] = useState(fallback);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const createdObjectUrls = useRef([]);
  const toast = useToast();
  const { pick } = useLanguage();
  const attachmentPreview = useFilePreview(attachment);

  useEffect(() => {
    let active = true;
    adminApi.supportCase(caseId, fallback).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      if (data?.id) setCaseData(data);
    });
    return () => { active = false; };
  }, [caseId, fallback]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [caseData.messages?.length]);
  useEffect(() => () => createdObjectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const verifyDocument = async (document, status) => {
    try {
      await adminApi.verifyMedicalDocument(caseData.id, document.id, { status, note: status === "Verified" ? "Document reviewed by authorised admin." : "Document is unclear or not relevant to the request." });
      setCaseData((current) => ({ ...current, documents: current.documents.map((item) => item.id === document.id ? { ...item, status } : item) }));
      toast.success(pick(`Document marked ${status}.`, `নথিটি ${status} হিসেবে চিহ্নিত হয়েছে।`));
    } catch (error) { toast.error(error.message); }
  };

  const selectAttachment = (file) => {
    if (!file) { setAttachment(null); return; }
    const allowed = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!allowed) return toast.error(pick("Choose an image or PDF file.", "ছবি বা PDF ফাইল নির্বাচন করুন।"));
    if (file.size > 10 * 1024 * 1024) return toast.error(pick("The file must be 10 MB or smaller.", "ফাইলটি ১০ এমবি বা ছোট হতে হবে।"));
    setAttachment(file);
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!message.trim() && !attachment) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("message", message.trim());
      if (attachment) formData.append("file", attachment);
      const response = await adminApi.sendSupportMessage(caseData.id, formData);
      const remote = response?.data?.attachment || response?.attachment || response?.file;
      const remoteUrl = remote?.url || remote?.secureUrl || response?.fileUrl || "";
      const localUrl = attachment?.type?.startsWith("image/") && !remoteUrl ? URL.createObjectURL(attachment) : "";
      if (localUrl) createdObjectUrls.current.push(localUrl);
      const next = {
        id: `admin-${Date.now()}`,
        sender: "admin",
        name: "Support Admin",
        text: message.trim(),
        time: "Just now",
        attachment: attachment ? {
          name: remote?.name || attachment.name,
          type: remote?.type || attachment.type,
          size: remote?.size || attachment.size,
          url: remoteUrl || localUrl,
        } : null,
      };
      setCaseData((current) => ({ ...current, messages: [...(current.messages || []), next] }));
      setMessage("");
      setAttachment(null);
    } catch (error) { toast.error(error.message); } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <Link to="/admin-panel/support-cases" className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber"><ArrowLeft className="h-4 w-4" />{pick("Back to support cases", "সহায়তা কেসে ফিরুন")}</Link>
      <section className="admin-card"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="eyebrow">{caseData.id}</p><h2 className="mt-2 font-display text-4xl font-semibold">{caseData.title}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">{caseData.summary}</p><div className="mt-4 flex flex-wrap gap-2"><StatusBadge status={caseData.status} /><span className={`rounded-full border px-2.5 py-1 text-xs ${caseData.priority === "Urgent" ? "border-archive-rose/25 bg-archive-rose/10 text-archive-rose" : "border-white/10 text-archive-muted"}`}>{caseData.priority}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-archive-muted">{caseData.category}</span></div></div><div className="rounded-xl border border-archive-teal/20 bg-archive-teal/[0.07] p-4 text-xs leading-5 text-[#B9CFCB]"><LockKeyhole className="mr-2 inline h-4 w-4" />{pick("Private room: requester and authorised admins only", "ব্যক্তিগত কক্ষ: কেবল অনুরোধকারী ও অনুমোদিত অ্যাডমিন")}</div></div></section>

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-6">
          <section className="admin-card"><h3 className="font-display text-3xl font-semibold">{pick("Case information", "কেসের তথ্য")}</h3><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Requester", "অনুরোধকারী")}</dt><dd className="mt-1 text-white">{caseData.requester}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Assigned admin", "দায়িত্বপ্রাপ্ত অ্যাডমিন")}</dt><dd className="mt-1 text-white">{caseData.assignedAdmin}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Approximate location", "আনুমানিক স্থান")}</dt><dd className="mt-1 text-white">{caseData.location}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Hospital", "হাসপাতাল")}</dt><dd className="mt-1 text-white">{caseData.hospital}</dd></div></dl></section>

          <section className="admin-card"><div className="flex items-center justify-between"><div><p className="eyebrow">{pick("Sensitive documents", "সংবেদনশীল নথি")}</p><h3 className="mt-2 font-display text-3xl font-semibold">{pick("Medical-document verification", "চিকিৎসা নথি যাচাই")}</h3></div><FileCheck2 className="h-6 w-6 text-archive-teal" /></div><p className="mt-3 text-sm leading-6 text-archive-muted">{pick("Verify only relevance and readability for this support request. Do not diagnose, alter or publish medical information.", "এই সহায়তা অনুরোধের জন্য কেবল প্রাসঙ্গিকতা ও পাঠযোগ্যতা যাচাই করুন। চিকিৎসা তথ্য বিশ্লেষণ, পরিবর্তন বা প্রকাশ করবেন না।")}</p><div className="mt-5 space-y-4">{(caseData.documents || []).map((document) => <div key={document.id} className="rounded-2xl border border-white/[0.08] p-4"><AdminFilePreview file={document} compact /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><StatusBadge status={document.status} /><div className="flex gap-2"><button onClick={() => verifyDocument(document, "Verified")} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-archive-teal/25 bg-archive-teal/10 px-3 py-2 text-xs font-semibold text-archive-teal"><CheckCircle2 className="h-4 w-4" />{pick("Verify", "যাচাই")}</button><button onClick={() => verifyDocument(document, "Rejected")} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-archive-rose/25 bg-archive-rose/10 px-3 py-2 text-xs font-semibold text-archive-rose"><XCircle className="h-4 w-4" />{pick("Reject", "প্রত্যাখ্যান")}</button></div></div></div>)}{!caseData.documents?.length && <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-archive-muted">{pick("No documents have been uploaded.", "কোনো নথি আপলোড করা হয়নি।")}</div>}</div></section>

          <section className="admin-card"><p className="eyebrow">{pick("Case progress", "কেসের অগ্রগতি")}</p><div className="mt-5 space-y-4">{(caseData.progress || []).map((step, index) => <div key={step} className="flex gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${index === caseData.progress.length - 1 ? "bg-archive-amber text-ink-950" : "bg-archive-teal/15 text-archive-teal"}`}>{index + 1}</span><p className="text-sm text-[#D8D3CA]">{step}</p></div>)}</div></section>
        </div>

        <section className="admin-card flex min-h-[680px] flex-col overflow-hidden p-0 2xl:sticky 2xl:top-28 2xl:h-[calc(100vh-150px)]">
          <div className="border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-archive-teal/10 text-archive-teal"><UserRound className="h-5 w-5" /></span><div><h3 className="font-semibold text-white">{pick("Private support conversation", "ব্যক্তিগত সহায়তা কথোপকথন")}</h3><p className="mt-1 text-xs text-archive-muted">{caseData.requester} • {caseData.assignedAdmin}</p></div></div></div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">{(caseData.messages || []).map((item) => <div key={item.id} className={`flex ${item.sender === "admin" ? "justify-end" : "justify-start"}`}><div className={`max-w-[86%] rounded-2xl border p-4 ${item.sender === "admin" ? "border-archive-amber/20 bg-archive-amber/[0.08]" : "border-white/10 bg-white/[0.035]"}`}><div className="flex items-center justify-between gap-5"><p className={`text-xs font-semibold ${item.sender === "admin" ? "text-archive-amber" : "text-archive-teal"}`}>{item.name}</p><span className="text-[11px] text-archive-muted">{item.time}</span></div>{item.text && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#E0DBD3]">{item.text}</p>}{(item.attachment || item.attachmentName) && (() => { const file = item.attachment || { name: item.attachmentName }; const isImage = file.type?.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(file.name || ""); return isImage && file.url ? <a href={file.url} target="_blank" rel="noreferrer" className="focus-ring mt-3 block overflow-hidden rounded-xl border border-white/10 bg-black/20"><img src={file.url} alt={`Support attachment ${file.name}`} className="max-h-72 w-full object-contain" /><span className="block truncate border-t border-white/10 px-3 py-2 text-xs text-archive-muted">{file.name}</span></a> : <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 p-3 text-xs text-archive-muted">{isImage ? <ImageIcon className="h-4 w-4 text-archive-amber" /> : <FileCheck2 className="h-4 w-4 text-archive-amber" />}<span className="truncate">{file.name}</span></div>; })()}</div></div>)}<div ref={endRef} /></div>
          <form onSubmit={sendReply} className="border-t border-white/10 p-4">{attachment && <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">{attachmentPreview ? <div className="relative p-2"><img src={attachmentPreview} alt={`Selected attachment ${attachment.name}`} className="mx-auto max-h-64 w-full rounded-lg object-contain" /><button type="button" onClick={() => setAttachment(null)} className="focus-ring absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/75 text-white" aria-label="Remove attachment"><X className="h-4 w-4" /></button></div> : <div className="flex items-center gap-3 p-3"><FileCheck2 className="h-5 w-5 text-archive-amber" /><span className="min-w-0 flex-1 truncate text-xs text-[#D8D3CA]">{attachment.name}</span><button type="button" onClick={() => setAttachment(null)} className="focus-ring p-2 text-archive-rose" aria-label="Remove attachment"><X className="h-4 w-4" /></button></div>}</div>}<textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="field-control resize-none" placeholder={pick("Reply with the next clear step. Do not request national ID or unrelated records.", "পরবর্তী পরিষ্কার পদক্ষেপ লিখুন। জাতীয় পরিচয়পত্র বা অপ্রাসঙ্গিক নথি চাইবেন না।")} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-[#C6C2BC] hover:bg-white/5"><Paperclip className="h-4 w-4" />{attachment ? attachment.name : pick("Attach requested file", "প্রয়োজনীয় ফাইল সংযুক্ত করুন")}<input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => selectAttachment(e.target.files?.[0] || null)} /></label><button disabled={sending || (!message.trim() && !attachment)} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-40"><Send className="h-4 w-4" />{sending ? pick("Sending…", "পাঠানো হচ্ছে…") : pick("Send reply", "উত্তর পাঠান")}</button></div><div className="mt-3 rounded-lg border border-archive-rose/15 bg-archive-rose/[0.05] p-3 text-[11px] leading-5 text-[#DAB8BE]"><ShieldAlert className="mr-2 inline h-4 w-4" />{pick("Messages and files stay inside the authorised support room.", "বার্তা ও ফাইল অনুমোদিত সহায়তা কক্ষের ভেতরেই থাকবে।")}</div></form>
        </section>
      </div>
    </div>
  );
}
