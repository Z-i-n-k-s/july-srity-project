import { ArrowLeft, Languages, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../Logo";
import { useLanguage } from "../../context/LanguageContext";

const AuthShell = ({ eyebrow, title, description, children, footer, compact = false }) => {
  const { language, toggleLanguage, pick } = useLanguage();

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink-950 text-archive-paper">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(215,154,84,.14),transparent_31%),radial-gradient(circle_at_88%_22%,rgba(185,103,118,.12),transparent_32%),linear-gradient(135deg,#080A11_0%,#10121B_53%,#17111A_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#080A11_0%,rgba(8,10,17,.78)_18%,rgba(8,10,17,.18)_66%,transparent_100%)]" />
        <div className="absolute right-[12%] top-[17%] h-[64%] w-[64%] rotate-2 rounded-[2rem] border border-white/10 bg-white/[0.025] shadow-[0_35px_100px_rgba(0,0,0,.55)]">
          <div className="absolute inset-5 overflow-hidden rounded-[1.4rem] border border-white/[0.07] bg-[radial-gradient(circle_at_55%_30%,rgba(215,154,84,.19),transparent_32%),linear-gradient(145deg,#21151F,#11141D_62%,#18121A)]">
            <svg viewBox="0 0 640 760" className="h-full w-full opacity-85" aria-hidden="true">
              <defs>
                <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#D79A54" stopOpacity=".76" />
                  <stop offset="1" stopColor="#B96776" stopOpacity=".22" />
                </linearGradient>
              </defs>
              <path d="M168 105h254l72 76v418c0 32-26 58-58 58H168c-32 0-58-26-58-58V163c0-32 26-58 58-58Z" fill="none" stroke="url(#paper)" strokeWidth="4" />
              <path d="M422 105v80h72" fill="none" stroke="#F4F1EA" strokeOpacity=".48" strokeWidth="4" />
              <path d="M186 265h230M186 327h178M186 389h230M186 451h146" stroke="#F4F1EA" strokeOpacity=".28" strokeWidth="9" strokeLinecap="round" />
              <path d="M222 547c50-18 93-59 114-122 26 62 7 123-49 170" fill="none" stroke="#D79A54" strokeWidth="11" strokeLinecap="round" />
              <circle cx="486" cy="558" r="52" fill="#4B9B8D" fillOpacity=".12" stroke="#4B9B8D" strokeWidth="4" />
              <path d="m463 558 16 16 30-34" fill="none" stroke="#80C3B7" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute -bottom-8 -left-12 w-64 rounded-2xl border border-white/10 bg-ink-800/95 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-archive-teal/15 text-archive-teal"><ShieldCheck className="h-5 w-5" /></span>
              <div><p className="text-sm font-semibold text-white">{pick("Protected by default", "ডিফল্টভাবেই সুরক্ষিত")}</p><p className="mt-1 text-xs leading-5 text-archive-muted">{pick("Your identity and original files stay private until review.", "পর্যালোচনার আগে পরিচয় ও মূল ফাইল ব্যক্তিগত থাকে।")}</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-5 sm:px-7 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleLanguage} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-sm font-semibold text-[#D6D1C9] transition hover:border-archive-amber/35 hover:bg-white/[0.06]" aria-label="Change language">
              <Languages className="h-4 w-4" /> {language === "en" ? "বাংলা" : "EN"}
            </button>
            <Link to="/home" className="focus-ring hidden min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-archive-muted transition hover:text-white sm:inline-flex"><ArrowLeft className="h-4 w-4" />{pick("Back to archive", "আর্কাইভে ফিরুন")}</Link>
          </div>
        </header>

        <div className="flex flex-1 items-center py-10 lg:w-[48%] lg:py-16">
          <div className={`w-full ${compact ? "max-w-lg" : "max-w-xl"}`}>
            <div className="mb-7">
              <span className="eyebrow inline-flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5" />{eyebrow}</span>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.02] tracking-[-.025em] text-archive-paper sm:text-5xl">{title}</h1>
              {description && <p className="mt-4 max-w-lg text-sm leading-7 text-[#BEBAB4] sm:text-base">{description}</p>}
            </div>
            <div className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,.36)] backdrop-blur-xl sm:p-7">
              {children}
            </div>
            {footer && <div className="mt-6 text-center text-sm text-archive-muted">{footer}</div>}
            <div className="mt-7 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[.13em] text-archive-muted sm:justify-start">
              <span>{pick("Admin reviewed", "অ্যাডমিন পর্যালোচিত")}</span><span className="h-1 w-1 rounded-full bg-white/20" /><span>{pick("Privacy protected", "গোপনীয়তা সুরক্ষিত")}</span><span className="h-1 w-1 rounded-full bg-white/20" /><span>{pick("Consent based", "সম্মতিভিত্তিক")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthShell;
