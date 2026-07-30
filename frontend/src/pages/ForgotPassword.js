import React, { useState } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import SummaryApi from "../common";
import AuthShell from "../components/auth/AuthShell";
import { useLanguage } from "../context/LanguageContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { pick } = useLanguage();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(SummaryApi.forgotPassword.url, { method: SummaryApi.forgotPassword.method, headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.error || payload?.success === false) throw new Error(payload?.message || pick("Unable to send the reset link.", "রিসেট লিংক পাঠানো যায়নি।"));
      setSent(true);
      toast.success(payload?.message || pick("Reset instructions were sent.", "রিসেট নির্দেশনা পাঠানো হয়েছে।"));
    } catch (error) { toast.error(error.message || pick("Unable to send the reset link.", "রিসেট লিংক পাঠানো যায়নি।")); }
    finally { setSubmitting(false); }
  };

  return (
    <AuthShell
      compact
      eyebrow={pick("Account recovery", "অ্যাকাউন্ট পুনরুদ্ধার")}
      title={pick("Reset access securely.", "নিরাপদভাবে প্রবেশাধিকার ফিরিয়ে নিন।")}
      description={pick("Enter your registered email. For privacy, the confirmation message does not reveal whether an account exists.", "নিবন্ধিত ইমেইল লিখুন। গোপনীয়তার জন্য নিশ্চিতকরণ বার্তায় অ্যাকাউন্ট আছে কি না প্রকাশ করা হবে না।")}
      footer={<Link to="/login" className="font-semibold text-archive-amber hover:text-[#E7AE6D]">{pick("Return to sign in", "সাইন ইনে ফিরুন")}</Link>}
    >
      {sent ? (
        <div className="py-4 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-archive-teal/15 text-archive-teal"><MailCheck className="h-7 w-7" /></span><h2 className="mt-5 font-display text-2xl font-semibold text-white">{pick("Check your email", "ইমেইল দেখুন")}</h2><p className="mt-3 text-sm leading-6 text-archive-muted">{pick("If the address is registered, password reset instructions will arrive shortly.", "ঠিকানাটি নিবন্ধিত হলে শিগগিরই পাসওয়ার্ড রিসেট নির্দেশনা পৌঁছাবে।")}</p><button type="button" onClick={() => setSent(false)} className="focus-ring mt-5 rounded-lg px-3 py-2 text-sm font-semibold text-archive-amber hover:bg-archive-amber/10">{pick("Use another email", "অন্য ইমেইল ব্যবহার করুন")}</button></div>
      ) : (
        <form className="grid gap-5" onSubmit={handleSubmit}><div><label htmlFor="recovery-email" className="field-label">{pick("Email address", "ইমেইল ঠিকানা")}</label><input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="field-control" placeholder="name@example.com" /></div><button type="submit" disabled={submitting} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-archive-amber to-archive-copper px-5 font-semibold text-ink-950 transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}{pick(submitting ? "Sending…" : "Send reset link", submitting ? "পাঠানো হচ্ছে…" : "রিসেট লিংক পাঠান")}</button></form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
