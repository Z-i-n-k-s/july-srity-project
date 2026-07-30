import { motion } from "framer-motion";
import { CheckCircle2, FileText, MessageSquareText, UserRound } from "lucide-react";
import { supportBenefits } from "../../data/landingData";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";
import StatusBadge from "../ui/StatusBadge";

export default function SupportSection() {
  return (
    <section className="section-pad" id="support-preview">
      <div className="page-shell grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <SectionHeading label="Support for injured people" title="Support should not end after submitting a form." description="Create a private Support Room where injured people, family members and authorised July Smriti administrators can communicate, exchange documents and follow every step of the support process." />
          <div className="mt-8 space-y-5">
            {supportBenefits.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-archive-teal/25 bg-archive-teal/10 text-archive-teal"><Icon className="h-5 w-5" /></span>
                <div><h3 className="font-semibold text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-archive-muted">{description}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/support/new" showArrow>Get Support</Button>
            <Button to="/support" variant="secondary">How Support Rooms Work</Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, x: 22 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="overflow-hidden rounded-2xl border border-archive-teal/20 bg-ink-900 shadow-2xl">
          <div className="border-b border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[.16em] text-archive-muted">Private Support Room</p>
                <h3 className="mt-2 font-display text-2xl font-semibold">Case: JS-HELP-00124</h3>
              </div>
              <StatusBadge status="Information required" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="badge border-archive-rose/35 bg-archive-rose/10 text-[#F0C6CE]">Priority: Urgent</span>
              <span className="badge border-white/10 bg-white/5 text-[#C6C2BC]"><UserRound className="h-3.5 w-3.5" /> Assigned support admin</span>
            </div>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs font-semibold text-archive-teal">Support Admin</p>
              <p className="mt-2 text-sm leading-6 text-[#D5D1CA]">Please confirm the latest hospital visit date. Only upload the requested document; do not share national ID or unrelated records.</p>
            </div>
            <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm border border-archive-amber/20 bg-archive-amber/10 p-4">
              <p className="text-xs font-semibold text-archive-amber">You</p>
              <p className="mt-2 text-sm leading-6 text-[#E1DDD5]">The latest visit was on 27 July. I can provide the discharge summary.</p>
            </div>
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4">
              <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-archive-amber" /><div><p className="text-sm font-semibold">Requested document</p><p className="text-xs text-archive-muted">Latest discharge summary • PDF or image</p></div></div>
            </div>
            <div className="border-t border-white/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[.15em] text-archive-muted">Case progress</p>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] text-archive-muted">
                {["Submitted", "Reviewed", "Info needed", "Support action"].map((step, index) => <div key={step}><span className={`mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full border ${index < 2 ? "border-archive-teal/30 bg-archive-teal/12 text-archive-teal" : index === 2 ? "border-archive-amber/30 bg-archive-amber/12 text-archive-amber" : "border-white/10 bg-white/5"}`}>{index < 2 ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span>{step}</div>)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 px-5 py-4 text-xs text-archive-muted"><MessageSquareText className="h-4 w-4 text-archive-teal" /> Messages and documents remain private.</div>
        </motion.div>
      </div>
    </section>
  );
}
