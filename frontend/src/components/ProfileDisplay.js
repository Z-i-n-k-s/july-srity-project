import React, { useState } from "react";
import { Camera, Mail, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "react-toastify";
import SummaryApi from "../common";
import imageTobase64 from "../helpers/imageTobase64";
import { useDispatch } from "react-redux";
import { setUserDetails } from "../store/userSlice";
import { useLanguage } from "../context/LanguageContext";

const ProfileDisplay = ({ onClose, name, email, role, userId, profilePic, callFunc }) => {
  const [data, setData] = useState({ newname: name || "", newemail: email || "", newprofilepic: profilePic || "" });
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { pick } = useLanguage();

  const handleUploadPic = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Profile image must be under 5 MB.");
    try {
      const imagePic = await imageTobase64(file);
      setData((prev) => ({ ...prev, newprofilepic: imagePic }));
    } catch {
      toast.error("Failed to preview image.");
    }
  };

  const updateUserProfile = async () => {
    if (!data.newname.trim() || !data.newemail.trim()) return toast.error("Name and email are required.");
    setIsLoading(true);
    try {
      const response = await fetch(SummaryApi.updateProfile.url, {
        method: SummaryApi.updateProfile.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: data.newemail, name: data.newname, profilePic: data.newprofilepic }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.error) throw new Error(payload?.message || "Failed to update profile.");
      dispatch(setUserDetails(payload?.data || { _id: userId, name: data.newname, email: data.newemail, role, profilePic: data.newprofilepic }));
      toast.success(payload?.message || "Profile updated.");
      onClose();
      callFunc?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close profile settings" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-archive-amber/15 via-white/[0.03] to-archive-rose/10 px-6 py-6">
          <button className="focus-ring absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/15 text-archive-muted hover:text-white" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
          <p className="eyebrow">{pick("Account settings", "অ্যাকাউন্ট সেটিংস")}</p>
          <h2 id="profile-title" className="mt-2 font-display text-3xl font-semibold">{pick("Profile Settings", "প্রোফাইল সেটিংস")}</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-archive-amber/40 bg-ink-900">
              {data.newprofilepic ? <img src={data.newprofilepic} alt="Profile preview" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-archive-muted"><UserRound className="h-9 w-9" /></div>}
              <label className="absolute inset-0 grid cursor-pointer place-items-center bg-black/0 transition hover:bg-black/45"><Camera className="h-5 w-5 opacity-0 transition group-hover:opacity-100" /><input type="file" accept="image/*" className="hidden" onChange={handleUploadPic} /></label>
            </div>
            <p className="mt-3 text-xs text-archive-muted">{pick("Choose a respectful profile image", "একটি উপযুক্ত প্রোফাইল ছবি নির্বাচন করুন")}</p>
          </div>
          <div className="mt-7 space-y-5">
            <label><span className="field-label inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-archive-amber" />{pick("Full name", "পূর্ণ নাম")}</span><input value={data.newname} onChange={(e) => setData({ ...data, newname: e.target.value })} className="field-control" /></label>
            <label><span className="field-label inline-flex items-center gap-2"><Mail className="h-4 w-4 text-archive-amber" />{pick("Email address", "ইমেইল ঠিকানা")}</span><input type="email" value={data.newemail} onChange={(e) => setData({ ...data, newemail: e.target.value })} className="field-control" /></label>
            <div><span className="field-label inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-archive-teal" />{pick("Account role", "অ্যাকাউন্ট ভূমিকা")}</span><div className="field-control capitalize text-archive-muted">{role}</div></div>
          </div>
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <button onClick={onClose} className="focus-ring rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-[#C6C2BC] hover:bg-white/5">{pick("Cancel", "বাতিল")}</button>
            <button onClick={updateUserProfile} disabled={isLoading} className="focus-ring rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-5 py-3 text-sm font-semibold text-ink-950 shadow-amber disabled:opacity-50">{isLoading ? pick("Saving…", "সংরক্ষণ হচ্ছে…") : pick("Save Changes", "পরিবর্তন সংরক্ষণ")}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDisplay;
