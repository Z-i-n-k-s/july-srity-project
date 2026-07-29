import { FileCheck2, HeartHandshake, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SectionHeading from "../components/ui/SectionHeading";

const values = [
  { title: "Memory", text: "Preserve documentary images, records and testimony before details disappear.", icon: FileCheck2 },
  { title: "Truth", text: "Keep source context visible and describe uncertainty honestly.", icon: ShieldCheck },
  { title: "Dignity", text: "Use consent, privacy choices and careful handling of sensitive information.", icon: LockKeyhole },
  { title: "Human support", text: "Connect affected people with a private, organised support workflow.", icon: HeartHandshake },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader label="About the platform" title="A civic archive built around memory, truth and dignity." description="July Smriti Archive preserves reviewed documentary records while offering private support and missing-person reporting workflows." />
      <section className="section-pad"><div className="page-shell">
        <SectionHeading label="Our principles" title="The archive is not only a collection of files." description="It is a responsibility to the people represented in each record, testimony and support request." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{values.map(({ title, text, icon: Icon }) => <article key={title} className="surface-card rounded-2xl p-6"><Icon className="h-6 w-6 text-archive-amber" /><h2 className="mt-5 font-display text-2xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-archive-muted">{text}</p></article>)}</div>
      </div></section>
      <section id="verification" className="section-pad border-y border-white/[0.06] bg-ink-900/45"><div className="page-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <SectionHeading label="Verification policy" title="Human review before public publication." description="No submission should become a public record automatically. Reviewers assess source context, dates, locations, privacy risks, consent and corroborating materials." />
        <div className="rounded-2xl border border-archive-amber/20 bg-archive-amber/[0.06] p-6 sm:p-8"><Scale className="h-7 w-7 text-archive-amber" /><h2 className="mt-5 text-xl font-semibold">File integrity is not the same as truth verification.</h2><p className="mt-3 text-sm leading-7 text-[#C6C2BC]">A file hash can help detect later changes to a file. It does not prove that the date, place or claim is true. Human review checks source and context, and public records should show remaining uncertainty.</p></div>
      </div></section>
      <section id="privacy" className="section-pad"><div className="page-shell grid gap-8 md:grid-cols-3">
        <div><p className="eyebrow">Privacy</p><h2 className="mt-3 font-display text-4xl font-semibold">Sensitive information stays protected.</h2></div>
        <div className="md:col-span-2 grid gap-4 sm:grid-cols-2"><div className="surface-card rounded-2xl p-6"><h3 className="font-semibold">Public archive</h3><p className="mt-3 text-sm leading-7 text-archive-muted">Only approved content and approved identity details are visible publicly.</p></div><div className="surface-card rounded-2xl p-6"><h3 className="font-semibold">Private workflows</h3><p className="mt-3 text-sm leading-7 text-archive-muted">Support documents, contact details, sighting reports and raw submissions remain restricted.</p></div></div>
      </div></section>
      <section id="guidelines" className="section-pad border-t border-white/[0.06] bg-ink-900/45"><div className="page-shell"><SectionHeading label="Content guidelines" title="Respect people, evidence and context." description="Do not submit graphic material without necessity, private details without consent, unverified accusations, unrelated political promotion or manipulated media." /></div></section>
      <section id="contact" className="section-pad"><div className="page-shell"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7"><h2 className="font-display text-3xl font-semibold">Contact placeholder</h2><p className="mt-3 text-archive-muted">Connect your project email, help desk or contact form here when the backend contact workflow is ready.</p></div></div></section>
    </>
  );
}
