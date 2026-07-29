import { FileClock, LockKeyhole, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../context/ToastContext";
import useLocalStorage from "../../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../lib/storage";
import { formatDate } from "../../lib/utils";

const routeForKind = {
  evidence: "/submit",
  support: "/support/new",
  "missing-report": "/missing-persons/report",
};

const titleForKind = {
  evidence: "Archive submission draft",
  support: "Support request draft",
  "missing-report": "Missing-person report draft",
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useLocalStorage(STORAGE_KEYS.drafts, []);
  const toast = useToast();

  const remove = (id) => {
    setDrafts((items) => items.filter((item) => item.id !== id));
    toast.success("Draft removed from this device.");
  };

  return (
    <div>
      <p className="eyebrow">Local offline storage</p>
      <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Saved Drafts</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-archive-muted">Draft text, privacy choices and attachment names are stored only in this browser. Attachment bytes are not stored and must be selected again.</p>

      {drafts.length ? (
        <div className="mt-8 space-y-4">
          {drafts.map((draft) => (
            <article key={draft.id} className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-archive-amber/20 bg-archive-amber/10 text-archive-amber"><FileClock className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-white">{draft.values?.title || titleForKind[draft.kind] || "Saved draft"}</h2>
                  <p className="mt-1 text-xs text-archive-muted">Saved {formatDate(draft.savedAt)} • {draft.status || "Local draft"}</p>
                  {draft.contentTypes?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{draft.contentTypes.map((type) => <span key={type} className="badge border-white/10 bg-white/[0.04] text-[#CFC9C1]">{type}</span>)}</div>}
                  {draft.fileNames?.length > 0 && <p className="mt-2 max-w-2xl truncate text-xs text-[#B9B5AE]">Re-select {draft.fileNames.length} attachment(s): {draft.fileNames.join(", ")}</p>}
                  {draft.kind === "evidence" && <p className="mt-2 flex items-center gap-2 text-xs text-archive-teal"><LockKeyhole className="h-3.5 w-3.5" />{draft.values?.identityPreference || "Identity protection selected"} • not submitted</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link to={routeForKind[draft.kind] || "/account"} className="focus-ring rounded-xl border border-archive-amber/25 bg-archive-amber/10 px-4 py-2.5 text-sm font-semibold text-archive-amber">Continue</Link>
                <button onClick={() => remove(draft.id)} className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-archive-muted hover:border-archive-rose/30 hover:text-archive-rose" aria-label="Delete draft"><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8"><EmptyState title="No saved drafts" description="Offline or manually saved form drafts will appear here." actionLabel="Create Submission" actionTo="/submit" /></div>
      )}
    </div>
  );
}
