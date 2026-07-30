import React, { useState } from "react";
import { Mail, ShieldCheck, UserRound, X } from "lucide-react";
import ROLE from "../common/role";
import SummaryApi from "../common";
import { toast } from "react-toastify";

const ChangeUserRole = ({
  name,
  email,
  role,
  _id,
  onClose,
  callFunc,
}) => {
  const [userRole, setUserRole] = useState(role);
  const [userNewName, setUserNewName] = useState(name);
  const [userNewEmail, setUserNewEmail] = useState(email);

  const updateUserRole = async () => {
    const fetchResponse = await fetch(SummaryApi.updateUser.url, {
      method: SummaryApi.updateUser.method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: _id,
        role: userRole,
        name: userNewName,
        email: userNewEmail,
      }),
    });
    const responseData = await fetchResponse.json();

    if (responseData.success) {
      toast.success(responseData.message);
      onClose();
      callFunc();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-user-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900 shadow-2xl sm:rounded-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-ink-900/95 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div>
            <p className="eyebrow">User management</p>
            <h2 id="change-user-title" className="mt-1 font-display text-2xl font-semibold text-archive-paper">
              Change user details
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

        <div className="space-y-5 p-5 sm:p-6">
          <label className="block">
            <span className="field-label inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-archive-amber" aria-hidden="true" />
              Name
            </span>
            <input
              type="text"
              placeholder="Enter the user name"
              name="newName"
              value={userNewName}
              onChange={(event) => setUserNewName(event.target.value)}
              className="field-control"
            />
          </label>

          <label className="block">
            <span className="field-label inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-archive-amber" aria-hidden="true" />
              Email address
            </span>
            <input
              type="email"
              placeholder="Enter the user email"
              name="newEmail"
              value={userNewEmail}
              onChange={(event) => setUserNewEmail(event.target.value)}
              className="field-control"
            />
          </label>

          <label className="block">
            <span className="field-label inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-archive-amber" aria-hidden="true" />
              Role
            </span>
            <select
              className="field-control"
              value={userRole}
              onChange={(event) => setUserRole(event.target.value)}
            >
              {Object.values(ROLE).map((entry) => (
                <option value={entry} key={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="focus-ring min-h-11 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-archive-paper transition hover:bg-white/5"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="focus-ring min-h-11 rounded-xl bg-gradient-to-br from-archive-amber to-archive-copper px-5 py-2.5 text-sm font-semibold text-[#11131A] shadow-warm transition hover:brightness-105"
              onClick={updateUserRole}
            >
              Save changes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChangeUserRole;
