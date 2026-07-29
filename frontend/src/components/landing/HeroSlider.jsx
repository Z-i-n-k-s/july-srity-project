import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { heroSlides } from "../../data/landingData";
import ImageWithFallback from "../ui/ImageWithFallback";
import { cn } from "../../lib/utils";

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const intervalRef = useRef(null);

  const next = () => setActive((index) => (index + 1) % heroSlides.length);
  const previous = () => setActive((index) => (index - 1 + heroSlides.length) % heroSlides.length);

  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    intervalRef.current = window.setInterval(next, 5000);
    const visibility = () => document.hidden ? window.clearInterval(intervalRef.current) : (intervalRef.current = window.setInterval(next, 5000));
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [paused, reduceMotion, active]);

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") previous();
  };

  const current = heroSlides[active];
  const behind = heroSlides[(active + 1) % heroSlides.length];

  return (
    <div
      className="relative mx-auto w-full max-w-[680px] outline-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label={`July archive image slider. Slide ${active + 1} of ${heroSlides.length}`}
    >
      <div className="absolute -right-5 top-10 hidden h-[78%] w-[58%] rotate-3 overflow-hidden rounded-[22px] border border-white/10 opacity-35 md:block">
        <ImageWithFallback src={behind.image} alt="" className="h-full" imageClassName="object-cover" aria-hidden="true" />
      </div>
      <div className="relative h-[420px] overflow-hidden rounded-[20px] border border-white/10 bg-ink-800 shadow-2xl sm:h-[500px] lg:h-[590px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 42, scale: 1.035 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -35, scale: .985 }}
            transition={{ duration: reduceMotion ? .1 : .75, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <ImageWithFallback src={current.image} alt={current.alt} className="h-full" imageClassName="object-cover" fetchPriority={active === 0 ? "high" : "auto"} />
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#080A11_0%,rgba(8,10,17,.88)_8%,rgba(8,10,17,.42)_30%,rgba(8,10,17,.06)_62%,transparent_100%),linear-gradient(0deg,rgba(8,10,17,.92),transparent_58%)]" />
        <div className="absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-7">
          <p className="text-sm font-semibold text-white">{current.location}</p>
          <p className="mt-1 text-xs uppercase tracking-[.18em] text-archive-muted">{current.source}</p>
        </div>
        <div className="absolute right-4 top-4 z-20 flex gap-2">
          <button onClick={previous} className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur" aria-label="Previous slide"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={next} className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur" aria-label="Next slide"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setPaused((value) => !value)} className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur" aria-label={paused ? "Resume automatic slider" : "Pause automatic slider"}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2" aria-label="Choose slide">
        {heroSlides.map((slide, index) => (
          <button key={slide.id} onClick={() => setActive(index)} className="focus-ring relative h-1 overflow-hidden rounded-full bg-white/10" aria-label={`Show slide ${index + 1}`} aria-current={index === active ? "true" : undefined}>
            <span className={cn("absolute inset-0 origin-left bg-archive-amber", index === active && !paused && !reduceMotion ? "animate-progress" : index === active ? "scale-x-100" : "scale-x-0")} />
          </button>
        ))}
      </div>
    </div>
  );
}
