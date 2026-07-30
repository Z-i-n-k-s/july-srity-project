import React, { useState } from "react";
import { Mail, ShieldCheck, UserRound, X } from "lucide-react";

const DisplayUserDetails = ({
  name,
  email,
  role,
  onClose,
  profilePic,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
        className="w-full max-w-lg rounded-t-2xl border border-white/10 bg-ink-900 shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="eyebrow">User management</p>
            <h2 id="user-details-title" className="mt-1 font-display text-2xl font-semibold text-archive-paper">
              User details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg p-2 text-archive-muted transition hover:bg-white/5 hover:text-white"
            aria-label="Close user details dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-archive">
              {!profilePic || imgError ? (
                <UserRound className="h-12 w-12 text-archive-muted" aria-hidden="true" />
              ) : (
                <img
                  src={profilePic}
                  alt={`${name || "User"} profile`}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold text-archive-paper">{name || "Unnamed user"}</h3>

            <dl className="mt-5 grid w-full gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-archive-amber" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">Email</dt>
                  <dd className="mt-1 break-all text-archive-paper">{email || "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-white/[0.07] pt-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-archive-amber" aria-hidden="true" />
                <div>
                  <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">Role</dt>
                  <dd className="mt-1 text-archive-paper">{role || "—"}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex justify-end border-t border-white/10 pt-5">
            <button
              type="button"
              className="focus-ring min-h-11 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-archive-paper transition hover:bg-white/5"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DisplayUserDetails;
