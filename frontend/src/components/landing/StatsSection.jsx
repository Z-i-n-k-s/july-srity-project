import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { statistics } from "../../data/landingData";
import SectionHeading from "../ui/SectionHeading";
import { useLanguage } from "../../context/LanguageContext";

function Counter({ value, suffix }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) { setDisplay(value); return undefined; }
    let played = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || played) return;
      played = true;
      const duration = 900;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(value * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: .4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, reduced]);

  return <span ref={ref}>{display.toLocaleString("en-GB")}{suffix}</span>;
}

export default function StatsSection() {
  const { pick } = useLanguage();
  return (
    <section className="section-pad border-y border-white/[0.06] bg-ink-900/45">
      <div className="page-shell">
        <SectionHeading label={pick("Demo statistics", "ডেমো পরিসংখ্যান")} title={pick("A transparent view of archive and support activity.", "আর্কাইভ ও সহায়তা কার্যক্রমের স্বচ্ছ চিত্র।")} description={pick("These placeholder values demonstrate the final interface and must be replaced by live verified statistics from the backend.", "এই নমুনা মানগুলো ইন্টারফেস দেখায়; ব্যাকএন্ডের যাচাইকৃত লাইভ পরিসংখ্যান দিয়ে বদলাতে হবে।")} />
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statistics.map(({ label, value, suffix, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-archive-amber/25 sm:p-6">
              <Icon className="h-5 w-5 text-archive-amber" />
              <p className="mt-6 font-display text-4xl font-semibold text-white sm:text-5xl"><Counter value={value} suffix={suffix} /></p>
              <p className="mt-3 text-sm leading-6 text-archive-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
