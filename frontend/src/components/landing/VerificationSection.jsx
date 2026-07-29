import { motion } from "framer-motion";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { verificationSteps } from "../../data/landingData";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";

export default function VerificationSection() {
  return (
    <section className="section-pad">
      <div className="page-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading label="Verification process" title="From community submission to verified record." description="Raw user content is never published automatically. Every public record follows a human review and consent workflow." />
          <Button to="/about#verification" variant="secondary" showArrow>Learn How Verification Works</Button>
        </div>
        <div className="relative mt-12 grid gap-5 md:grid-cols-5">
          <div className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-gradient-to-r from-archive-amber/40 via-white/15 to-archive-teal/40 md:block" />
          {verificationSteps.map(({ number, title, description, icon: Icon }, index) => (
            <motion.article key={number} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 md:border-0 md:bg-transparent md:p-0">
              <div className="relative z-10 flex items-center gap-3 md:block"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-archive-amber/35 bg-ink-950 text-sm font-bold text-archive-amber">{number}</span><Icon className="h-5 w-5 text-archive-muted md:mt-7" /></div>
              <h3 className="mt-4 font-display text-2xl font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-archive-muted">{description}</p>
            </motion.article>
          ))}
        </div>
        <div className="mt-10 grid gap-4 rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.07] p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-archive-teal/25 bg-archive-teal/10 text-archive-teal"><ShieldCheck className="h-6 w-6" /></span>
          <div><h3 className="font-semibold text-white">Every public record is reviewed before publication.</h3><p className="mt-1 text-sm leading-6 text-[#B9CFCB]">Private medical and identity documents remain protected. File integrity can help detect changes, but human review checks source and context.</p></div>
          <LockKeyhole className="hidden h-7 w-7 text-archive-teal md:block" />
        </div>
      </div>
    </section>
  );
}
