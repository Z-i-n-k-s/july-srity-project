import React, { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import SummaryApi from "../common";
import AuthShell from "../components/auth/AuthShell";
import { useLanguage } from "../context/LanguageContext";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { pick } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const verifyToken = async () => {
      try {
        const response = await fetch(`${SummaryApi.verifyResetToken.url}/${encodeURIComponent(token)}`, { credentials: "include" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.success === false || payload?.error) throw new Error(payload?.message || "Invalid or expired token");
        if (active) setLoading(false);
      } catch (error) {
        toast.error(error.message || pick("This reset link is invalid or expired.", "রিসেট লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ।"));
        navigate("/login", { replace: true });
      }
    };
    verifyToken();
    return () => { active = false; };
  }, [token, navigate, pick]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 6) return toast.error(pick("Use at least 6 characters.", "অন্তত ৬টি অক্ষর দিন।"));
    if (password !== confirm) return toast.error(pick("Passwords do not match.", "পাসওয়ার্ড মিলছে না।"));
    setSubmitting(true);
    try {
      const response = await fetch(SummaryApi.resetPassword.url, { method: SummaryApi.resetPassword.method, headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.error || payload?.success === false) throw new Error(payload?.message || pick("Unable to reset the password.", "পাসওয়ার্ড রিসেট করা যায়নি।"));
      toast.success(payload?.message || pick("Password updated.", "পাসওয়ার্ড হালনাগাদ হয়েছে।"));
      navigate("/login", { replace: true });
    } catch (error) { toast.error(error.message || pick("Unable to reset the password.", "পাসওয়ার্ড রিসেট করা যায়নি।")); }
    finally { setSubmitting(false); }
  };

  const SecretField = ({ id, label, value, onChange, visible, onToggle }) => <div><label htmlFor={id} className="field-label">{label}</label><div className="relative"><input id={id} type={visible ? "text" : "password"} value={value} onChange={onChange} minLength={6} autoComplete="new-password" required className="field-control pr-12" placeholder={pick("At least 6 characters", "অন্তত ৬টি অক্ষর")} /><button type="button" onClick={onToggle} className="focus-ring absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-archive-muted hover:bg-white/5 hover:text-white" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>;

  return (
    <AuthShell compact eyebrow={pick("Secure password update", "নিরাপদ পাসওয়ার্ড হালনাগাদ")} title={pick("Choose a new password.", "নতুন পাসওয়ার্ড নির্বাচন করুন।")} description={pick("Use a password that is unique to July Smriti and is not shared with another service.", "July Smriti-র জন্য আলাদা পাসওয়ার্ড ব্যবহার করুন, অন্য কোনো সেবার সঙ্গে একই নয়।")} footer={<Link to="/login" className="font-semibold text-archive-amber hover:text-[#E7AE6D]">{pick("Return to sign in", "সাইন ইনে ফিরুন")}</Link>}>
      {loading ? <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-archive-muted"><Loader2 className="h-8 w-8 animate-spin text-archive-amber" /><span>{pick("Verifying your secure link…", "নিরাপদ লিংক যাচাই হচ্ছে…")}</span></div> : <form className="grid gap-5" onSubmit={handleSubmit}><SecretField id="new-password" label={pick("New password", "নতুন পাসওয়ার্ড")} value={password} onChange={(event) => setPassword(event.target.value)} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} /><SecretField id="confirm-new-password" label={pick("Confirm new password", "নতুন পাসওয়ার্ড নিশ্চিত করুন")} value={confirm} onChange={(event) => setConfirm(event.target.value)} visible={showConfirm} onToggle={() => setShowConfirm((value) => !value)} /><div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-black/10 p-3 text-xs leading-5 text-archive-muted"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-archive-teal" />{pick("After updating, all future sign-ins will require this new password.", "হালনাগাদের পর ভবিষ্যৎ সব সাইন ইনে নতুন পাসওয়ার্ড প্রয়োজন হবে।")}</div><button type="submit" disabled={submitting} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-archive-amber to-archive-copper px-5 font-semibold text-ink-950 transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}{pick(submitting ? "Updating…" : "Update password", submitting ? "হালনাগাদ হচ্ছে…" : "পাসওয়ার্ড হালনাগাদ করুন")}</button></form>}
    </AuthShell>
  );
};

export default ResetPassword;
