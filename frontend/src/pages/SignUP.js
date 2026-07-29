import React, { useMemo, useState } from "react";
import { Camera, Eye, EyeOff, Loader2, ShieldCheck, UserRoundPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SummaryApi from "../common";
import imageTobase64 from "../helpers/imageTobase64";
import AuthShell from "../components/auth/AuthShell";
import { useLanguage } from "../context/LanguageContext";

const SignUP = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({ email: "", password: "", name: "", confirmPassword: "", profilePic: "" });
  const navigate = useNavigate();
  const { pick } = useLanguage();
  const initials = useMemo(() => (data.name || "JS").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(), [data.name]);

  const handleOnChange = ({ target: { name, value } }) => setData((prev) => ({ ...prev, [name]: value }));
  const handleUploadPic = async ({ target }) => {
    const file = target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) return toast.error(pick("Choose an image smaller than 4 MB.", "৪ এমবির ছোট ছবি নির্বাচন করুন।"));
    try {
      const profilePic = await imageTobase64(file);
      setData((prev) => ({ ...prev, profilePic }));
    }
    catch { toast.error(pick("The profile image could not be prepared.", "প্রোফাইল ছবি প্রস্তুত করা যায়নি।")); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (data.password.length < 6) return toast.error(pick("Use at least 6 characters for your password.", "পাসওয়ার্ডে অন্তত ৬টি অক্ষর দিন।"));
    if (data.password !== data.confirmPassword) return toast.error(pick("Passwords do not match.", "পাসওয়ার্ড মিলছে না।"));
    setSubmitting(true);
    try {
      const response = await fetch(SummaryApi.signUP.url, { method: SummaryApi.signUP.method, headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.error || payload?.success === false) throw new Error(payload?.message || pick("Unable to create the account.", "অ্যাকাউন্ট তৈরি করা যায়নি।"));
      toast.success(payload?.message || pick("Account created. You can now sign in.", "অ্যাকাউন্ট তৈরি হয়েছে। এখন সাইন ইন করুন।"));
      navigate("/login", { replace: true });
    } catch (error) { toast.error(error.message || pick("Unable to create the account.", "অ্যাকাউন্ট তৈরি করা যায়নি।")); }
    finally { setSubmitting(false); }
  };

  const PasswordField = ({ id, name, label, value, visible, onToggle, autoComplete }) => (
    <div><label htmlFor={id} className="field-label">{label}</label><div className="relative"><input id={id} type={visible ? "text" : "password"} name={name} value={value} onChange={handleOnChange} autoComplete={autoComplete} minLength={6} required className="field-control pr-12" placeholder={pick("At least 6 characters", "অন্তত ৬টি অক্ষর")} /><button type="button" onClick={onToggle} className="focus-ring absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-archive-muted hover:bg-white/5 hover:text-white" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
  );

  return (
    <AuthShell
      eyebrow={pick("Private contribution account", "ব্যক্তিগত অবদান অ্যাকাউন্ট")}
      title={pick("Create a protected account.", "সুরক্ষিত অ্যাকাউন্ট তৈরি করুন।")}
      description={pick("Your account name is never made public automatically. Each submission has separate anonymous, pseudonym or public-name controls.", "অ্যাকাউন্টের নাম স্বয়ংক্রিয়ভাবে প্রকাশ হয় না। প্রতিটি জমায় আলাদা বেনামী, ছদ্মনাম বা প্রকাশ্য নামের নিয়ন্ত্রণ থাকে।")}
      footer={<>{pick("Already registered?", "আগে নিবন্ধন করেছেন?")} <Link to="/login" className="font-semibold text-archive-amber hover:text-[#E7AE6D]">{pick("Sign in", "সাইন ইন")}</Link></>}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-black/10 p-3">
          <label className="group relative grid h-16 w-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-archive-amber/20 to-archive-rose/10 text-sm font-semibold text-archive-paper">
            {data.profilePic ? <img src={data.profilePic} alt={pick("Profile preview", "প্রোফাইল প্রিভিউ")} className="h-full w-full object-cover" /> : initials}
            <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100"><Camera className="h-5 w-5" /></span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleUploadPic} />
          </label>
          <div><p className="text-sm font-semibold text-white">{pick("Optional profile image", "ঐচ্ছিক প্রোফাইল ছবি")}</p><p className="mt-1 text-xs leading-5 text-archive-muted">{pick("Used only inside your account unless you explicitly choose otherwise.", "আপনি স্পষ্টভাবে অনুমতি না দিলে এটি শুধু অ্যাকাউন্টে ব্যবহৃত হবে।")}</p></div>
        </div>
        <div><label htmlFor="signup-name" className="field-label">{pick("Full name", "পূর্ণ নাম")}</label><input id="signup-name" name="name" value={data.name} onChange={handleOnChange} autoComplete="name" required className="field-control" placeholder={pick("Your account name", "আপনার অ্যাকাউন্টের নাম")} /></div>
        <div><label htmlFor="signup-email" className="field-label">{pick("Email address", "ইমেইল ঠিকানা")}</label><input id="signup-email" type="email" name="email" value={data.email} onChange={handleOnChange} autoComplete="email" required className="field-control" placeholder="name@example.com" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField id="signup-password" name="password" label={pick("Password", "পাসওয়ার্ড")} value={data.password} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" />
          <PasswordField id="signup-confirm-password" name="confirmPassword" label={pick("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")} value={data.confirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} autoComplete="new-password" />
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-archive-teal/20 bg-archive-teal/[0.07] p-3 text-xs leading-5 text-[#B8DAD4]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>{pick("Public archive publication still requires administrator verification and your selected consent preference.", "প্রকাশ্য আর্কাইভে প্রকাশের জন্য অ্যাডমিন যাচাই এবং আপনার নির্বাচিত সম্মতি প্রয়োজন।")}</span></div>
        <button type="submit" disabled={submitting} className="focus-ring mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-archive-amber to-archive-copper px-5 font-semibold text-ink-950 transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserRoundPlus className="h-5 w-5" />}{pick(submitting ? "Creating account…" : "Create account", submitting ? "অ্যাকাউন্ট তৈরি হচ্ছে…" : "অ্যাকাউন্ট তৈরি করুন")}</button>
      </form>
    </AuthShell>
  );
};

export default SignUP;
