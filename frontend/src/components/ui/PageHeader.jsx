import { motion } from "framer-motion";

export default function PageHeader({ label, title, description, actions }) {
  return (
    <section className="border-b border-white/[0.07] bg-ink-900/50 pt-28 md:pt-32">
      <div className="page-shell py-12 md:py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {label && <p className="eyebrow">{label}</p>}
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[.98] tracking-tight text-archive-paper sm:text-5xl md:text-6xl">{title}</h1>
            {description && <p className="muted-copy mt-5 max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </motion.div>
      </div>
    </section>
  );
}
