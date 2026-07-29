import React, { useContext, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SummaryApi from "../common";
import Context from "../context";
import AuthShell from "../components/auth/AuthShell";
import { useLanguage } from "../context/LanguageContext";
import { getDefaultRouteForUser } from "../common/role";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const { fetchUserDetails } = useContext(Context);
  const { pick } = useLanguage();

  const handleOnChange = ({ target: { name, value } }) => setData((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(SummaryApi.signIn.url, {
        method: SummaryApi.signIn.method,
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.error || payload?.success === false) throw new Error(payload?.message || pick("Unable to sign in.", "সাইন ইন করা যায়নি।"));
      toast.success(payload?.message || pick("Welcome back.", "স্বাগতম।"));
      const currentUserPayload = await fetchUserDetails();
      const currentUser = currentUserPayload?.data?.user
        || currentUserPayload?.data
        || currentUserPayload?.user
        || payload?.data?.user
        || payload?.data
        || payload?.user;
      navigate(getDefaultRouteForUser(currentUser), { replace: true });
    } catch (error) {
      toast.error(error.message || pick("Unable to sign in.", "সাইন ইন করা যায়নি।"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow={pick("Secure account access", "নিরাপদ অ্যাকাউন্ট প্রবেশ")}
      title={pick("Welcome back to the archive.", "আর্কাইভে আবার স্বাগতম।")}
      description={pick("Sign in to submit documentary material, manage private support rooms and follow the review status of your records.", "তথ্য জমা দেওয়া, ব্যক্তিগত সহায়তা কক্ষ পরিচালনা এবং পর্যালোচনার অবস্থা দেখতে সাইন ইন করুন।")}
      footer={<>{pick("New to July Smriti?", "July Smriti-তে নতুন?")} <Link to="/sign-up" className="font-semibold text-archive-amber hover:text-[#E7AE6D]">{pick("Create an account", "অ্যাকাউন্ট তৈরি করুন")}</Link></>}
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email" className="field-label">{pick("Email address", "ইমেইল ঠিকানা")}</label>
          <div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-muted" /><input id="login-email" type="email" name="email" value={data.email} onChange={handleOnChange} autoComplete="email" required placeholder={pick("name@example.com", "name@example.com")} className="field-control pl-11" /></div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="login-password" className="text-sm font-medium text-[#E4E0D9]">{pick("Password", "পাসওয়ার্ড")}</label><Link to="/forgot-password" className="focus-ring rounded text-xs font-semibold text-archive-amber hover:text-[#E7AE6D]">{pick("Forgot password?", "পাসওয়ার্ড ভুলেছেন?")}</Link></div>
          <div className="relative"><input id="login-password" type={showPassword ? "text" : "password"} name="password" value={data.password} onChange={handleOnChange} autoComplete="current-password" required placeholder={pick("Enter your password", "পাসওয়ার্ড লিখুন")} className="field-control pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="focus-ring absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-archive-muted hover:bg-white/5 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
        </div>
        <button type="submit" disabled={submitting} className="focus-ring mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-archive-amber to-archive-copper px-5 font-semibold text-ink-950 shadow-[0_12px_32px_rgba(215,154,84,.16)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}{pick(submitting ? "Signing in…" : "Sign in", submitting ? "সাইন ইন হচ্ছে…" : "সাইন ইন")}</button>
      </form>
    </AuthShell>
  );
};

export default Login;
