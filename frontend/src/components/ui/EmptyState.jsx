import { Inbox } from "lucide-react";
import Button from "./Button";

export default function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="surface-card flex min-h-64 flex-col items-center justify-center rounded-2xl p-8 text-center">
      <div className="rounded-2xl border border-archive-amber/20 bg-archive-amber/10 p-4 text-archive-amber"><Inbox className="h-7 w-7" /></div>
      <h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-archive-muted">{description}</p>
      {actionLabel && <Button to={actionTo} className="mt-5" showArrow>{actionLabel}</Button>}
    </div>
  );
}
