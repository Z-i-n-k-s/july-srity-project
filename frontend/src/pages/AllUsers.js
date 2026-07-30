import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Eye, Loader2, Search, ShieldCheck, Trash2, UserCog, Users, X } from "lucide-react";
import { toast } from "react-toastify";
import SummaryApi from "../common";
import StatusBadge from "../components/ui/StatusBadge";
import { useLanguage } from "../context/LanguageContext";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [nextRole, setNextRole] = useState("USER");
  const { pick } = useLanguage();

  const closeModal = () => {
    if (!saving) setSelected(null);
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.allUser.url, { method: SummaryApi.allUser.method, credentials: "include" });
      const payload = await response.json();
      if (!response.ok || payload?.error) throw new Error(payload?.message || "Failed to fetch users.");
      setUsers(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      toast.error(error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchAllUsers(); }, []);

  const filtered = useMemo(() => users.filter((user) => {
    const matches = `${user.name || ""} ${user.email || ""} ${user.role || ""}`.toLowerCase().includes(query.toLowerCase());
    return matches && (role === "All" || user.role === role);
  }), [users, query, role]);

  const updateRole = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const response = await fetch(SummaryApi.updateUser.url, {
        method: SummaryApi.updateUser.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected._id, role: nextRole }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.error) throw new Error(payload?.message || "Unable to update role.");
      setUsers((current) => current.map((item) => item._id === selected._id ? { ...item, role: nextRole } : item));
      setSelected((current) => ({ ...current, role: nextRole }));
      toast.success(payload?.message || "User role updated.");
      setModalMode("view");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const response = await fetch(SummaryApi.deleteUser.url, {
        method: SummaryApi.deleteUser.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected._id }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.error) throw new Error(payload?.message || "Unable to delete user.");
      setUsers((current) => current.filter((item) => item._id !== selected._id));
      toast.success(payload?.message || "User removed.");
      setSelected(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const openModal = (user, mode) => {
    setSelected(user);
    setModalMode(mode);
    setNextRole(user.role || "USER");
  };

  const recentUsers = users.filter((user) => user.createdAt && Date.now() - new Date(user.createdAt).getTime() < 7 * 86400000).length;
  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <p className="eyebrow">{pick("Account administration", "অ্যাকাউন্ট প্রশাসন")}</p>
        <h2 className="mt-2 font-display text-4xl font-semibold">{pick("User access and roles", "ব্যবহারকারীর প্রবেশাধিকার ও ভূমিকা")}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">{pick("Review account information, manage roles and confirm every destructive action before access is removed.", "অ্যাকাউন্ট তথ্য পর্যালোচনা করুন, ভূমিকা পরিচালনা করুন এবং প্রবেশাধিকার সরানোর আগে প্রতিটি ধ্বংসাত্মক কাজ নিশ্চিত করুন।")}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: pick("Total users", "মোট ব্যবহারকারী"), value: users.length, icon: Users, tone: "amber" },
          { label: pick("New in 7 days", "৭ দিনে নতুন"), value: recentUsers, icon: CalendarDays, tone: "teal" },
          { label: pick("Administrators", "অ্যাডমিন"), value: adminCount, icon: ShieldCheck, tone: "rose" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="admin-card"><div className="flex items-center gap-4"><span className={`grid h-12 w-12 place-items-center rounded-xl border ${tone === "teal" ? "border-archive-teal/20 bg-archive-teal/10 text-archive-teal" : tone === "rose" ? "border-archive-rose/20 bg-archive-rose/10 text-archive-rose" : "border-archive-amber/20 bg-archive-amber/10 text-archive-amber"}`}><Icon className="h-5 w-5" /></span><div><p className="text-3xl font-bold text-white">{value}</p><p className="mt-1 text-sm text-archive-muted">{label}</p></div></div></article>
        ))}
      </section>

      <section className="admin-card">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="field-control pl-12" placeholder={pick("Search name, email or role", "নাম, ইমেইল বা ভূমিকা খুঁজুন")} /></label>
          <select value={role} onChange={(event) => setRole(event.target.value)} className="field-control"><option>All</option><option>USER</option><option>ADMIN</option></select>
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="admin-table">
            <thead><tr><th>{pick("User", "ব্যবহারকারী")}</th><th>{pick("Role", "ভূমিকা")}</th><th>{pick("Joined", "যোগদান")}</th><th>{pick("Status", "অবস্থা")}</th><th>{pick("Actions", "কাজ")}</th></tr></thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user._id}>
                  <td><div className="flex items-center gap-3">{user.profilePic ? <img src={user.profilePic} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-xl bg-archive-amber/10 text-sm font-bold text-archive-amber">{user.name?.[0]?.toUpperCase() || "U"}</span>}<div><p className="font-semibold text-white">{user.name}</p><p className="mt-1 text-xs text-archive-muted">{user.email}</p></div></div></td>
                  <td><StatusBadge status={user.role} /></td>
                  <td className="text-xs text-archive-muted">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "—"}</td>
                  <td><span className="inline-flex items-center gap-2 text-xs text-archive-teal"><span className="h-2 w-2 rounded-full bg-archive-teal" />{pick("Active", "সক্রিয়")}</span></td>
                  <td><div className="flex gap-2"><button onClick={() => openModal(user, "view")} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-archive-muted hover:text-white" aria-label="View user"><Eye className="h-4 w-4" /></button><button onClick={() => openModal(user, "role")} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-archive-amber/20 bg-archive-amber/10 text-archive-amber" aria-label="Change role"><UserCog className="h-4 w-4" /></button><button onClick={() => openModal(user, "delete")} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-archive-rose/20 bg-archive-rose/10 text-archive-rose" aria-label="Delete user"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="p-10 text-center text-sm text-archive-muted">{pick("Loading users…", "ব্যবহারকারী লোড হচ্ছে…")}</div>}
          {!loading && !filtered.length && <div className="p-10 text-center text-sm text-archive-muted">{pick("No users match these filters.", "এই ফিল্টারে কোনো ব্যবহারকারী নেই।")}</div>}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} aria-label="Close" />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl">
            <button type="button" onClick={closeModal} disabled={saving} className="focus-ring absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border border-white/10 disabled:opacity-50"><X className="h-5 w-5" /></button>

            {modalMode === "view" && <><p className="eyebrow">{pick("Account details", "অ্যাকাউন্ট বিস্তারিত")}</p><h3 className="mt-2 font-display text-3xl font-semibold">{selected.name}</h3><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">Email</dt><dd className="mt-1 text-white">{selected.email}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">{pick("Role", "ভূমিকা")}</dt><dd className="mt-1 text-white">{selected.role}</dd></div><div><dt className="text-xs uppercase tracking-[.12em] text-archive-muted">ID</dt><dd className="mt-1 break-all text-white">{selected._id}</dd></div></dl></>}

            {modalMode === "role" && <><p className="eyebrow">{pick("Role management", "ভূমিকা ব্যবস্থাপনা")}</p><h3 className="mt-2 font-display text-3xl font-semibold">{pick("Change user role", "ব্যবহারকারীর ভূমিকা পরিবর্তন")}</h3><p className="mt-3 text-sm text-archive-muted">{selected.name} • {selected.email}</p><label className="mt-6 block"><span className="field-label">{pick("New role", "নতুন ভূমিকা")}</span><select value={nextRole} onChange={(event) => setNextRole(event.target.value)} className="field-control"><option>USER</option><option>ADMIN</option></select></label><button type="button" disabled={saving} onClick={updateRole} className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-3 text-sm font-semibold text-ink-950 disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{pick("Update role", "ভূমিকা হালনাগাদ")}</button></>}

            {modalMode === "delete" && <><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-archive-rose/25 bg-archive-rose/10 text-archive-rose"><AlertTriangle className="h-6 w-6" /></span><div><p className="eyebrow text-archive-rose">{pick("Delete confirmation", "মুছে ফেলার নিশ্চিতকরণ")}</p><h3 className="mt-2 font-display text-3xl font-semibold">{pick("Remove this user account?", "এই ব্যবহারকারীর অ্যাকাউন্ট সরাবেন?")}</h3></div></div><div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4"><p className="font-semibold text-white">{selected.name}</p><p className="mt-1 text-sm text-archive-muted">{selected.email}</p><p className="mt-2 text-xs text-archive-muted">{pick("Role", "ভূমিকা")}: {selected.role}</p></div><p className="mt-5 text-sm leading-6 text-[#DAB8BE]">{pick("This will remove the user’s access. Preserved archive records and audit history should remain controlled by backend retention rules.", "এটি ব্যবহারকারীর প্রবেশাধিকার সরিয়ে দেবে। সংরক্ষিত আর্কাইভ রেকর্ড ও অডিট ইতিহাস ব্যাকএন্ডের সংরক্ষণ নীতি অনুযায়ী থাকা উচিত।")}</p><div className="mt-6 flex gap-3"><button type="button" disabled={saving} onClick={closeModal} className="focus-ring flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pick("Cancel", "বাতিল")}</button><button type="button" disabled={saving} onClick={deleteUser} className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-archive-rose px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{pick("Yes, delete user", "হ্যাঁ, ব্যবহারকারী মুছুন")}</button></div></>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
