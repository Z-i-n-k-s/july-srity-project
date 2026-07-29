import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export default function SectionHeading({ label, title, description, align = "left", className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}
    >
      {label && <p className="eyebrow">{label}</p>}
      <h2 className="section-title mt-3">{title}</h2>
      {description && <p className="muted-copy mt-5 max-w-2xl">{description}</p>}
    </motion.div>
  );
}
