import React, { useContext, useState } from "react";
import {
  Archive,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import SummaryApi from "../common";
import Context from "../context";
import { useLanguage } from "../context/LanguageContext";
import { getDefaultRouteForUser } from "../common/role";
import loginImage from "../assest/login.jpg";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { fetchUserDetails } = useContext(Context);
  const { pick } = useLanguage();

  const handleOnChange = ({ target: { name, value } }) => {
    setData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(SummaryApi.signIn.url, {
        method: SummaryApi.signIn.method,
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const payload = await response.json().catch(() => ({}));

      if (
        !response.ok ||
        payload?.error ||
        payload?.success === false
      ) {
        throw new Error(
          payload?.message ||
            pick(
              "Unable to sign in.",
              "সাইন ইন করা যায়নি।",
            ),
        );
      }

      toast.success(
        payload?.message ||
          pick("Welcome back.", "স্বাগতম।"),
      );

      const currentUserPayload = await fetchUserDetails();

      const currentUser =
        currentUserPayload?.data?.user ||
        currentUserPayload?.data ||
        currentUserPayload?.user ||
        payload?.data?.user ||
        payload?.data ||
        payload?.user;

      navigate(getDefaultRouteForUser(currentUser), {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error?.message ||
          pick(
            "Unable to sign in.",
            "সাইন ইন করা যায়নি।",
          ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080807] text-white">
      {/* Full-screen background image */}
      <img
        src={loginImage}
        alt={pick(
          "July Smriti Archive background",
          "জুলাই স্মৃতি আর্কাইভের পটভূমি",
        )}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* General dark layer to reduce image opacity */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Left-side contrast for readable text */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.72)_0%,rgba(5,5,5,0.55)_35%,rgba(5,5,5,0.62)_55%,rgba(5,5,5,0.94)_82%,rgba(5,5,5,0.99)_100%)]" />

      {/* Vertical gradient for better top and bottom contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80" />

      {/* Mobile overlay */}
      <div className="absolute inset-0 bg-black/25 lg:hidden" />

      {/* Decorative light effects */}
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[450px] w-[450px] rounded-full bg-[#B86D35]/10 blur-[150px]" />

      <div className="pointer-events-none absolute -bottom-52 right-0 h-[550px] w-[550px] rounded-full bg-[#D79A54]/10 blur-[170px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-5 py-6 sm:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D79A54]/50"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#D79A54]/30 bg-black/45 backdrop-blur-xl">
              <Archive className="h-5 w-5 text-[#E2A560]" />
            </div>

            <div>
              <p className="font-semibold tracking-wide text-white">
                July Smriti Archive
              </p>

              <p className="text-xs text-white/65">
                স্মৃতি বাঁচুক, সত্য কথা বলুক
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/70 backdrop-blur-xl sm:flex">
            <ShieldCheck className="h-4 w-4 text-[#E2A560]" />

            {pick(
              "Protected historical archive",
              "সুরক্ষিত ঐতিহাসিক আর্কাইভ",
            )}
          </div>
        </header>

        {/* Main content */}
        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_470px] lg:py-8 xl:grid-cols-[minmax(0,1fr)_500px]">
          {/* Left content */}
          <section className="hidden max-w-2xl lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4 text-[#E2A560]" />

              {pick(
                "Every memory deserves to be preserved",
                "প্রতিটি স্মৃতি সংরক্ষণের যোগ্য",
              )}
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,1)] xl:text-6xl">
              {pick(
                "Preserving the memories that must never be forgotten.",
                "যে স্মৃতিগুলো কখনো ভুলে যাওয়া উচিত নয়।",
              )}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/90 drop-shadow-[0_3px_14px_rgba(0,0,0,1)] xl:text-lg">
              {pick(
                "A protected archive for documentary materials, personal accounts and historical evidence—preserved for future generations.",
                "তথ্য, ব্যক্তিগত অভিজ্ঞতা ও ঐতিহাসিক প্রমাণ ভবিষ্যৎ প্রজন্মের জন্য সংরক্ষণের একটি সুরক্ষিত আর্কাইভ।",
              )}
            </p>

            <div className="mt-9 flex items-center gap-4 text-sm font-medium text-white/75 drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
              <span className="h-px w-12 bg-[#D79A54]" />

              {pick(
                "Memory survives when stories are protected.",
                "গল্প সুরক্ষিত থাকলেই স্মৃতি বেঁচে থাকে।",
              )}
            </div>
          </section>

          {/* Login section */}
          <section className="mx-auto w-full max-w-[470px] lg:mx-0">
            <div className="mb-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D79A54]/25 bg-[#D79A54]/10 px-3.5 py-2 text-xs font-medium text-[#EDB574] backdrop-blur-xl">
                <LockKeyhole className="h-3.5 w-3.5" />

                {pick(
                  "Secure account access",
                  "নিরাপদ অ্যাকাউন্ট প্রবেশ",
                )}
              </div>

              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-4xl">
                {pick("Welcome back.", "আবার স্বাগতম।")}
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/70 sm:text-[15px]">
                {pick(
                  "Sign in to submit records, manage support rooms and follow the review status of your materials.",
                  "তথ্য জমা দেওয়া, সহায়তা কক্ষ পরিচালনা এবং আপনার তথ্যের পর্যালোচনার অবস্থা দেখতে সাইন ইন করুন।",
                )}
              </p>
            </div>

            {/* Login form */}
            <form
              onSubmit={handleSubmit}
              className="rounded-[28px] border border-white/10 bg-black/50 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-7"
            >
              <div className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-2.5 block text-sm font-medium text-white/90"
                  >
                    {pick(
                      "Email address",
                      "ইমেইল ঠিকানা",
                    )}
                  </label>

                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40 transition group-focus-within:text-[#E2A560]" />

                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      value={data.email}
                      onChange={handleOnChange}
                      autoComplete="email"
                      required
                      placeholder="name@example.com"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-[#D79A54]/70 focus:bg-black/55 focus:ring-4 focus:ring-[#D79A54]/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-4">
                    <label
                      htmlFor="login-password"
                      className="text-sm font-medium text-white/90"
                    >
                      {pick("Password", "পাসওয়ার্ড")}
                    </label>

                    <Link
                      to="/forgot-password"
                      className="rounded text-xs font-semibold text-[#DDA05A] transition hover:text-[#F0BD81] focus:outline-none focus:ring-2 focus:ring-[#D79A54]/40"
                    >
                      {pick(
                        "Forgot password?",
                        "পাসওয়ার্ড ভুলেছেন?",
                      )}
                    </Link>
                  </div>

                  <div className="group relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40 transition group-focus-within:text-[#E2A560]" />

                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={data.password}
                      onChange={handleOnChange}
                      autoComplete="current-password"
                      required
                      placeholder={pick(
                        "Enter your password",
                        "পাসওয়ার্ড লিখুন",
                      )}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-14 text-sm text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-[#D79A54]/70 focus:bg-black/55 focus:ring-4 focus:ring-[#D79A54]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      className="absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-white/45 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D79A54]/40"
                      aria-label={
                        showPassword
                          ? pick(
                              "Hide password",
                              "পাসওয়ার্ড লুকান",
                            )
                          : pick(
                              "Show password",
                              "পাসওয়ার্ড দেখুন",
                            )
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#E0A157] via-[#D3914B] to-[#B96D37] px-5 text-sm font-bold text-[#17100B] shadow-[0_14px_35px_rgba(211,145,75,0.22)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_18px_45px_rgba(211,145,75,0.3)] focus:outline-none focus:ring-4 focus:ring-[#D79A54]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <span className="absolute inset-0 -translate-x-[110%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[110%]" />

                  {submitting ? (
                    <Loader2 className="relative h-5 w-5 animate-spin" />
                  ) : (
                    <LockKeyhole className="relative h-[18px] w-[18px]" />
                  )}

                  <span className="relative">
                    {pick(
                      submitting
                        ? "Signing in…"
                        : "Sign in securely",
                      submitting
                        ? "সাইন ইন হচ্ছে…"
                        : "নিরাপদভাবে সাইন ইন করুন",
                    )}
                  </span>

                  {!submitting && (
                    <ArrowRight className="relative h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                  )}
                </button>
              </div>
            </form>

            {/* Signup link */}
            <p className="mt-6 text-center text-sm text-white/65">
              {pick(
                "New to July Smriti?",
                "July Smriti-তে নতুন?",
              )}{" "}
              <Link
                to="/sign-up"
                className="font-semibold text-[#E4A660] transition hover:text-[#F0BD81]"
              >
                {pick(
                  "Create an account",
                  "অ্যাকাউন্ট তৈরি করুন",
                )}
              </Link>
            </p>

            {/* Security information */}
            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-white/45">
              <ShieldCheck className="h-3.5 w-3.5" />

              {pick(
                "Your information is securely protected",
                "আপনার তথ্য নিরাপদভাবে সুরক্ষিত",
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Login;