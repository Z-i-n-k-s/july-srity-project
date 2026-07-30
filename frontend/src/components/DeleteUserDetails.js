import React, { useState } from "react";
import { AlertTriangle, UserRound, X } from "lucide-react";
import SummaryApi from "../common";
import { toast } from "react-toastify";

const DeleteUserDetails = ({
  name,
  email,
  role,
  _id,
  onClose,
  profilePic,
  callFunc,
}) => {
  const [imgError, setImgError] = useState(false);

  const deleteUser = async () => {
    const dataResponse = await fetch(SummaryApi.deleteUser.url, {
      method: SummaryApi.deleteUser.method,
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ userId: _id }),
    });
    const dataApi = await dataResponse.json();

    if (dataApi.success) {
      toast.success(dataApi.message);
      callFunc();
      onClose();
    }

    if (dataApi.error) {
      toast.error(dataApi.message);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        aria-describedby="delete-user-description"
        className="w-full max-w-lg rounded-t-2xl border border-archive-rose/25 bg-ink-900 shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="eyebrow text-archive-rose">Destructive action</p>
            <h2 id="delete-user-title" className="mt-1 font-display text-2xl font-semibold text-archive-paper">
              Delete this user?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg p-2 text-archive-muted transition hover:bg-white/5 hover:text-white"
            aria-label="Close delete user dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-archive">
              {!profilePic || imgError ? (
                <UserRound className="h-11 w-11 text-archive-muted" aria-hidden="true" />
              ) : (
                <img
                  src={profilePic}
                  alt={`${name || "User"} profile`}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              )}
            </div>

            <div className="mt-5 rounded-xl border border-archive-rose/20 bg-archive-rose/[0.08] p-4 text-left">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-archive-rose" aria-hidden="true" />
                <p id="delete-user-description" className="text-sm leading-6 text-[#DDD7D0]">
                  This action removes <strong className="text-archive-paper">{name || "this user"}</strong> from the system. Confirm only when you are certain.
                </p>
              </div>
            </div>

            <dl className="mt-5 grid w-full gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left text-sm">
              <div className="grid gap-1 sm:grid-cols-[90px_1fr]">
                <dt className="text-archive-muted">Email</dt>
                <dd className="break-all text-archive-paper">{email || "—"}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[90px_1fr]">
                <dt className="text-archive-muted">Role</dt>
                <dd className="text-archive-paper">{role || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="focus-ring min-h-11 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-archive-paper transition hover:bg-white/5"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="focus-ring min-h-11 rounded-xl border border-archive-rose/40 bg-archive-rose/20 px-5 py-2.5 text-sm font-semibold text-[#F7E6E9] transition hover:bg-archive-rose/30"
              onClick={deleteUser}
            >
              Delete user
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeleteUserDetails;
