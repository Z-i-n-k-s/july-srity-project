import React, { useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  Camera,
  Check,
  Eye,
  EyeOff,
  FileLock2,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import SummaryApi from "../common";
import imageTobase64 from "../helpers/imageTobase64";
import { useLanguage } from "../context/LanguageContext";
import signupImage from "../assest/signup.jpg";

/*
 * Keep PasswordField outside SignUP.
 * This prevents the password input from losing focus after each character.
 */
const PasswordField = ({
  id,
  name,
  label,
  value,
  visible,
  onToggle,
  onChange,
  autoComplete,
  placeholder,
  showLabel,
  hideLabel,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2.5 block text-sm font-medium text-white/85"
      >
        {label}
      </label>

      <div className="group relative">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/35 transition group-focus-within:text-[#E2A560]" />

        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={6}
          required
          placeholder={placeholder}
          className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-14 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-[#D79A54]/70 focus:bg-black/55 focus:ring-4 focus:ring-[#D79A54]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? hideLabel : showLabel}
          className="absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D79A54]/40"
        >
          {visible ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </div>
  );
};

const SignUP = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
    profilePic: "",
  });

  const navigate = useNavigate();
  const { pick } = useLanguage();

  const initials = useMemo(() => {
    return (data.name || "JS")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [data.name]);

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (data.password.length >= 6) score += 1;
    if (data.password.length >= 10) score += 1;
    if (/[A-Z]/.test(data.password)) score += 1;
    if (/[0-9]/.test(data.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(data.password)) score += 1;

    return score;
  }, [data.password]);

  const passwordsMatch =
    data.confirmPassword.length > 0 &&
    data.password === data.confirmPassword;

  const handleOnChange = ({ target: { name, value } }) => {
    setData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleUploadPic = async ({ target }) => {
    const file = target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/") ||
      file.size > 4 * 1024 * 1024
    ) {
      toast.error(
        pick(
          "Choose an image smaller than 4 MB.",
          "৪ এমবির ছোট ছবি নির্বাচন করুন।",
        ),
      );

      target.value = "";
      return;
    }

    try {
      const profilePic = await imageTobase64(file);

      setData((previousData) => ({
        ...previousData,
        profilePic,
      }));
    } catch {
      toast.error(
        pick(
          "The profile image could not be prepared.",
          "প্রোফাইল ছবি প্রস্তুত করা যায়নি।",
        ),
      );
    } finally {
      target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (data.password.length < 6) {
      toast.error(
        pick(
          "Use at least 6 characters for your password.",
          "পাসওয়ার্ডে অন্তত ৬টি অক্ষর দিন।",
        ),
      );
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error(
        pick(
          "Passwords do not match.",
          "পাসওয়ার্ড মিলছে না।",
        ),
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(SummaryApi.signUP.url, {
        method: SummaryApi.signUP.method,
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
              "Unable to create the account.",
              "অ্যাকাউন্ট তৈরি করা যায়নি।",
            ),
        );
      }

      toast.success(
        payload?.message ||
          pick(
            "Account created. You can now sign in.",
            "অ্যাকাউন্ট তৈরি হয়েছে। এখন সাইন ইন করুন।",
          ),
      );

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error?.message ||
          pick(
            "Unable to create the account.",
            "অ্যাকাউন্ট তৈরি করা যায়নি।",
          ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#080807] text-white">
      {/* Full background image */}
      <img
        src={signupImage}
        alt={pick(
          "July Smriti Archive background",
          "জুলাই স্মৃতি আর্কাইভের পটভূমি",
        )}
        className="fixed inset-0 h-full w-full object-cover object-center"
      />

      {/* General image darkening */}
      <div className="fixed inset-0 bg-black/45" />

      {/* Darker on the left behind the form */}
      <div className="fixed inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.99)_0%,rgba(5,5,5,0.94)_24%,rgba(5,5,5,0.72)_48%,rgba(5,5,5,0.52)_70%,rgba(5,5,5,0.58)_100%)]" />

      {/* Top and bottom readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/85" />

      {/* Extra mobile contrast */}
      <div className="fixed inset-0 bg-black/35 lg:hidden" />

      {/* Decorative background effects */}
      <div className="pointer-events-none fixed -bottom-52 -left-20 h-[600px] w-[600px] rounded-full bg-[#D79A54]/10 blur-[180px]" />

      <div className="pointer-events-none fixed -right-40 bottom-0 h-[480px] w-[480px] rounded-full bg-[#A85F34]/10 blur-[150px]" />

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
              "Private and protected registration",
              "ব্যক্তিগত ও সুরক্ষিত নিবন্ধন",
            )}
          </div>
        </header>

        {/* Desktop: form left, information right */}
        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[590px_minmax(0,1fr)] xl:grid-cols-[610px_minmax(0,1fr)]">
          {/* Left registration form */}
          <section className="order-1 mx-auto w-full max-w-[590px] lg:mx-0 lg:justify-self-start">
            <div className="mb-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D79A54]/25 bg-[#D79A54]/10 px-3.5 py-2 text-xs font-medium text-[#EDB574] backdrop-blur-xl">
                <UserRoundPlus className="h-3.5 w-3.5" />

                {pick(
                  "Protected contribution account",
                  "সুরক্ষিত অবদান অ্যাকাউন্ট",
                )}
              </div>

              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-4xl">
                {pick(
                  "Create your account.",
                  "আপনার অ্যাকাউন্ট তৈরি করুন।",
                )}
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-white/70 sm:text-[15px]">
                {pick(
                  "Enter your private account information. You will control the visibility of every archive submission separately.",
                  "আপনার ব্যক্তিগত অ্যাকাউন্টের তথ্য দিন। প্রতিটি আর্কাইভ জমার দৃশ্যমানতা আপনি আলাদাভাবে নিয়ন্ত্রণ করবেন।",
                )}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[30px] border border-white/10 bg-black/55 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.62)] backdrop-blur-2xl sm:p-7"
            >
              {/* Profile image */}
              <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-4">
                <label className="group relative grid h-[72px] w-[72px] shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-[#D79A54]/25 bg-gradient-to-br from-[#D79A54]/25 to-[#8D4D35]/20 text-base font-semibold text-white">
                  {data.profilePic ? (
                    <img
                      src={data.profilePic}
                      alt={pick(
                        "Profile preview",
                        "প্রোফাইল প্রিভিউ",
                      )}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}

                  <span className="absolute inset-0 grid place-items-center bg-black/65 opacity-0 transition group-hover:opacity-100">
                    <Camera className="h-5 w-5" />
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleUploadPic}
                  />
                </label>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {pick(
                      "Optional profile image",
                      "ঐচ্ছিক প্রোফাইল ছবি",
                    )}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/50">
                    {pick(
                      "JPG, PNG or WebP under 4 MB. It remains private unless you choose otherwise.",
                      "৪ এমবির কম JPG, PNG বা WebP ছবি। আপনি অনুমতি না দিলে এটি ব্যক্তিগত থাকবে।",
                    )}
                  </p>

                  <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#E2A560] transition hover:text-[#F0BD81]">
                    <Camera className="h-3.5 w-3.5" />

                    {data.profilePic
                      ? pick(
                          "Change image",
                          "ছবি পরিবর্তন করুন",
                        )
                      : pick(
                          "Upload image",
                          "ছবি আপলোড করুন",
                        )}

                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleUploadPic}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-5">
                {/* Name and email */}
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="mb-2.5 block text-sm font-medium text-white/85"
                    >
                      {pick("Full name", "পূর্ণ নাম")}
                    </label>

                    <div className="group relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/35 transition group-focus-within:text-[#E2A560]" />

                      <input
                        id="signup-name"
                        name="name"
                        value={data.name}
                        onChange={handleOnChange}
                        autoComplete="name"
                        required
                        placeholder={pick(
                          "Your account name",
                          "আপনার অ্যাকাউন্টের নাম",
                        )}
                        className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-[#D79A54]/70 focus:bg-black/55 focus:ring-4 focus:ring-[#D79A54]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="mb-2.5 block text-sm font-medium text-white/85"
                    >
                      {pick(
                        "Email address",
                        "ইমেইল ঠিকানা",
                      )}
                    </label>

                    <div className="group relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/35 transition group-focus-within:text-[#E2A560]" />

                      <input
                        id="signup-email"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={handleOnChange}
                        autoComplete="email"
                        required
                        placeholder="name@example.com"
                        className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-[#D79A54]/70 focus:bg-black/55 focus:ring-4 focus:ring-[#D79A54]/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Password fields */}
                <div className="grid gap-5 md:grid-cols-2">
                  <PasswordField
                    id="signup-password"
                    name="password"
                    label={pick("Password", "পাসওয়ার্ড")}
                    value={data.password}
                    visible={showPassword}
                    onToggle={() =>
                      setShowPassword(
                        (currentValue) => !currentValue,
                      )
                    }
                    onChange={handleOnChange}
                    autoComplete="new-password"
                    placeholder={pick(
                      "At least 6 characters",
                      "অন্তত ৬টি অক্ষর",
                    )}
                    showLabel={pick(
                      "Show password",
                      "পাসওয়ার্ড দেখুন",
                    )}
                    hideLabel={pick(
                      "Hide password",
                      "পাসওয়ার্ড লুকান",
                    )}
                  />

                  <PasswordField
                    id="signup-confirm-password"
                    name="confirmPassword"
                    label={pick(
                      "Confirm password",
                      "পাসওয়ার্ড নিশ্চিত করুন",
                    )}
                    value={data.confirmPassword}
                    visible={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword(
                        (currentValue) => !currentValue,
                      )
                    }
                    onChange={handleOnChange}
                    autoComplete="new-password"
                    placeholder={pick(
                      "Repeat your password",
                      "পাসওয়ার্ড আবার লিখুন",
                    )}
                    showLabel={pick(
                      "Show confirm password",
                      "নিশ্চিত পাসওয়ার্ড দেখুন",
                    )}
                    hideLabel={pick(
                      "Hide confirm password",
                      "নিশ্চিত পাসওয়ার্ড লুকান",
                    )}
                  />
                </div>

                {/* Password status */}
                {data.password.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-white/55">
                        {pick(
                          "Password strength",
                          "পাসওয়ার্ডের শক্তি",
                        )}
                      </span>

                      <span className="text-xs font-semibold text-[#E2A560]">
                        {passwordStrength <= 1
                          ? pick("Weak", "দুর্বল")
                          : passwordStrength <= 3
                            ? pick("Good", "ভালো")
                            : pick("Strong", "শক্তিশালী")}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <span
                          key={level}
                          className={`h-1.5 rounded-full transition ${
                            level <= passwordStrength
                              ? "bg-[#D79A54]"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>

                    {data.confirmPassword.length > 0 && (
                      <div
                        className={`mt-3 flex items-center gap-2 text-xs ${
                          passwordsMatch
                            ? "text-[#9FD0C7]"
                            : "text-[#ECA39B]"
                        }`}
                      >
                        {passwordsMatch ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <LockKeyhole className="h-3.5 w-3.5" />
                        )}

                        {passwordsMatch
                          ? pick(
                              "Passwords match.",
                              "পাসওয়ার্ড মিলেছে।",
                            )
                          : pick(
                              "Passwords do not match yet.",
                              "পাসওয়ার্ড এখনো মিলছে না।",
                            )}
                      </div>
                    )}
                  </div>
                )}

                {/* Privacy notice */}
                <div className="flex items-start gap-3 rounded-2xl border border-[#73B5A9]/20 bg-[#73B5A9]/[0.08] p-4 text-xs leading-5 text-[#B8DAD4]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>
                    {pick(
                      "Public archive publication still requires administrator verification and your selected consent preference.",
                      "প্রকাশ্য আর্কাইভে প্রকাশের জন্য অ্যাডমিন যাচাই এবং আপনার নির্বাচিত সম্মতি প্রয়োজন।",
                    )}
                  </span>
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
                    <UserRoundPlus className="relative h-[18px] w-[18px]" />
                  )}

                  <span className="relative">
                    {pick(
                      submitting
                        ? "Creating account…"
                        : "Create protected account",
                      submitting
                        ? "অ্যাকাউন্ট তৈরি হচ্ছে…"
                        : "সুরক্ষিত অ্যাকাউন্ট তৈরি করুন",
                    )}
                  </span>

                  {!submitting && (
                    <ArrowRight className="relative h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                  )}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-white/65">
              {pick(
                "Already registered?",
                "আগে নিবন্ধন করেছেন?",
              )}{" "}
              <Link
                to="/login"
                className="font-semibold text-[#E4A660] transition hover:text-[#F0BD81]"
              >
                {pick("Sign in", "সাইন ইন")}
              </Link>
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/40">
              <ShieldCheck className="h-3.5 w-3.5" />

              {pick(
                "Your private account data is protected",
                "আপনার ব্যক্তিগত অ্যাকাউন্টের তথ্য সুরক্ষিত",
              )}
            </div>
          </section>

          {/* Right information content */}
          <section className="order-2 hidden max-w-2xl lg:block lg:justify-self-end">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-xl">
              <FileLock2 className="h-4 w-4 text-[#E2A560]" />

              {pick(
                "Your identity remains under your control",
                "আপনার পরিচয়ের নিয়ন্ত্রণ আপনার কাছেই থাকবে",
              )}
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,1)] xl:text-6xl">
              {pick(
                "Create an account. Preserve what history must remember.",
                "একটি অ্যাকাউন্ট তৈরি করুন। ইতিহাসের স্মৃতি সংরক্ষণ করুন।",
              )}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/90 drop-shadow-[0_3px_14px_rgba(0,0,0,1)] xl:text-lg">
              {pick(
                "Contribute documentary materials, personal accounts and evidence while choosing how your identity appears with every submission.",
                "তথ্য, ব্যক্তিগত অভিজ্ঞতা ও প্রমাণ জমা দিন এবং প্রতিটি জমায় আপনার পরিচয় কীভাবে দেখানো হবে তা নিজে নির্বাচন করুন।",
              )}
            </p>

            <div className="mt-9 grid max-w-xl gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#D79A54]/15 text-[#E6AA65]">
                  <Check className="h-4 w-4" />
                </div>

                <p className="text-sm text-white/85">
                  {pick(
                    "Your account name is not published automatically.",
                    "আপনার অ্যাকাউন্টের নাম স্বয়ংক্রিয়ভাবে প্রকাশ করা হবে না।",
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#D79A54]/15 text-[#E6AA65]">
                  <Check className="h-4 w-4" />
                </div>

                <p className="text-sm text-white/85">
                  {pick(
                    "Every public submission requires administrator review.",
                    "প্রতিটি প্রকাশ্য জমার জন্য অ্যাডমিন পর্যালোচনা প্রয়োজন।",
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#D79A54]/15 text-[#E6AA65]">
                  <Check className="h-4 w-4" />
                </div>

                <p className="text-sm text-white/85">
                  {pick(
                    "You choose anonymous, pseudonym or public-name visibility.",
                    "আপনি বেনামী, ছদ্মনাম বা প্রকাশ্য নাম নির্বাচন করতে পারবেন।",
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default SignUP;