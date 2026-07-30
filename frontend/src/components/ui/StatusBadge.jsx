import { CheckCircle2, Clock3, CircleAlert, XCircle } from "lucide-react";
import { cn, normaliseStatus } from "../../lib/utils";

const styles = {
  verified: "border-archive-teal/35 bg-archive-teal/10 text-[#BCE4DC]",
  published: "border-archive-teal/35 bg-archive-teal/10 text-[#BCE4DC]",
  "in-progress": "border-archive-amber/35 bg-archive-amber/10 text-[#F0C998]",
  "under-review": "border-archive-amber/35 bg-archive-amber/10 text-[#F0C998]",
  pending: "border-archive-amber/35 bg-archive-amber/10 text-[#F0C998]",
  "pending-admin-review": "border-archive-amber/35 bg-archive-amber/10 text-[#F0C998]",
  urgent: "border-archive-rose/40 bg-archive-rose/12 text-[#F0C6CE]",
  "information-required": "border-archive-rose/40 bg-archive-rose/12 text-[#F0C6CE]",
  rejected: "border-red-400/30 bg-red-400/10 text-red-200",
  normal: "border-white/10 bg-white/5 text-[#C6C2BC]",
};

const getIcon = (key) => {
  if (["verified", "published"].includes(key)) return CheckCircle2;
  if (["urgent", "information-required"].includes(key)) return CircleAlert;
  if (key === "rejected") return XCircle;
  return Clock3;
};

export default function StatusBadge({ status, className }) {
  const key = normaliseStatus(status);
  const Icon = getIcon(key);
  return (
    <span className={cn("badge", styles[key] || styles.normal, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}
