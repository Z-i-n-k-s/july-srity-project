import { motion } from "framer-motion";
import { CheckCircle2, Images, MapPin } from "lucide-react";
import { timelineEvents } from "../../data/landingData";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";

export default function TimelinePreview() {
  return (
    <section className="section-pad">
      <div className="page-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading label="Chronology" title="Follow the events of July." description="Move through a verified chronological view where each event can be connected back to source records." />
          <Button to="/timeline" variant="secondary" showArrow>See the July Timeline</Button>
        </div>
        <div className="relative mt-12">
          <div className="absolute bottom-0 left-[8px] top-0 w-px bg-gradient-to-b from-archive-amber via-white/15 to-transparent md:left-0 md:right-0 md:top-[76px] md:h-px md:w-auto" />
          <div className="grid gap-8 md:grid-cols-5 md:gap-4">
            {timelineEvents.map((event, index) => (
              <motion.article key={event.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="relative pl-9 md:pl-0 md:pt-24">
                <span className="absolute left-0 top-1 grid h-4 w-4 place-items-center rounded-full border-4 border-ink-950 bg-archive-amber md:left-1/2 md:top-[68px] md:-translate-x-1/2" />
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-archive-amber/30">
                  <p className="text-sm font-bold text-archive-amber">{event.date}</p>
                  <p className="text-xs text-archive-muted">{event.year}</p>
                  <h3 className="mt-4 font-display text-xl font-semibold leading-tight text-white">{event.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#B9B5AE]">{event.summary}</p>
                  <div className="mt-4 space-y-2 text-xs text-archive-muted">
                    <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
                    <span className="flex items-center gap-2"><Images className="h-3.5 w-3.5" />{event.mediaCount} media records</span>
                    <span className="flex items-center gap-2 text-archive-teal"><CheckCircle2 className="h-3.5 w-3.5" />Verified event</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
