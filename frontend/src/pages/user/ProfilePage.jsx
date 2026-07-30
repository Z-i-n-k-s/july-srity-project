import { useState } from "react";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { userApi } from "../../lib/api";

export default function ProfilePage() {
  const { user, updateLocalUser } = useAuth();
  const [values, setValues] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", language: user?.language || "English", publicName: user?.publicName || "Hide by default" });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async (event) => {
    event.preventDefault();
    if (values.name.trim().length < 2) return toast.error("Enter a valid name.");
    setLoading(true);
    try {
      const updated = await userApi.updateProfile(values);
      updateLocalUser({ ...user, ...updated, ...values });
      toast.success("Profile preferences updated.");
    } catch (error) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div><p className="eyebrow">Account settings</p><h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Profile and privacy</h1><p className="mt-3 text-sm leading-6 text-archive-muted">Manage your account details and default contributor identity preference.</p>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_300px]"><form onSubmit={submit} className="surface-card space-y-6 rounded-2xl p-5 sm:p-7"><div className="grid gap-5 sm:grid-cols-2"><FormField label="Full name" id="profile-name" required><div className="relative"><UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted"/><input id="profile-name" className="field-control pl-12" value={values.name} onChange={(e)=>setValues({...values,name:e.target.value})}/></div></FormField><FormField label="Email" id="profile-email"><div className="relative"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted"/><input id="profile-email" type="email" className="field-control pl-12" value={values.email} onChange={(e)=>setValues({...values,email:e.target.value})}/></div></FormField></div><FormField label="Phone (private)" id="profile-phone" hint="Never displayed publicly."><input id="profile-phone" className="field-control" value={values.phone} onChange={(e)=>setValues({...values,phone:e.target.value})}/></FormField><div className="grid gap-5 sm:grid-cols-2"><FormField label="Interface language" id="profile-language"><select id="profile-language" className="field-control" value={values.language} onChange={(e)=>setValues({...values,language:e.target.value})}><option>English</option><option>বাংলা</option></select></FormField><FormField label="Default contributor identity" id="profile-public-name"><select id="profile-public-name" className="field-control" value={values.publicName} onChange={(e)=>setValues({...values,publicName:e.target.value})}><option>Hide by default</option><option>Show my name</option><option>Ask every time</option></select></FormField></div><Button type="submit" loading={loading}>Save Changes</Button></form><aside className="space-y-4"><div className="rounded-2xl border border-archive-teal/20 bg-archive-teal/[0.06] p-5"><ShieldCheck className="h-6 w-6 text-archive-teal"/><h2 className="mt-4 font-semibold">User account</h2><p className="mt-2 text-sm leading-6 text-[#B9CFCB]">Role: {user?.role || "USER"}. User accounts cannot access administrator review tools.</p></div><div className="surface-card rounded-2xl p-5"><h2 className="font-semibold">Privacy reminder</h2><p className="mt-2 text-sm leading-6 text-archive-muted">Each submission still asks for its own public identity preference and consent.</p></div></aside></div>
    </div>
  );
}
