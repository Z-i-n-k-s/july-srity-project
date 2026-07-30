import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const dictionary = {
  en: {
    home: "Home", archive: "Archive", timeline: "Timeline", stories: "Stories", support: "Support",
    missing: "Missing Persons", about: "About", signIn: "Sign In", signOut: "Sign Out",
    submitEvidence: "Submit Evidence", getSupport: "Get Support", dashboard: "Dashboard",
    mySubmissions: "My submissions", supportRooms: "Support rooms", myReports: "My reports",
    savedDrafts: "Saved drafts", profile: "Profile", adminPanel: "Admin Panel", english: "English", bangla: "বাংলা",
    overview: "Overview", users: "Users", submissions: "Submissions", supportCases: "Messages & Support Rooms",
    missingReports: "Missing Reports", archiveManager: "Archive Manager", settings: "Settings",
    search: "Search", filter: "Filter", status: "Status", actions: "Actions", view: "View",
    approve: "Approve", reject: "Reject", requestInfo: "Request information", publish: "Publish",
    language: "Language", account: "Account", protected: "Identity protected", privateReview: "Private admin review",
  },
  bn: {
    home: "হোম", archive: "আর্কাইভ", timeline: "টাইমলাইন", stories: "গল্প", support: "সহায়তা",
    missing: "নিখোঁজ ব্যক্তি", about: "আমাদের সম্পর্কে", signIn: "সাইন ইন", signOut: "সাইন আউট",
    submitEvidence: "তথ্য জমা দিন", getSupport: "সহায়তা নিন", dashboard: "ড্যাশবোর্ড",
    mySubmissions: "আমার জমা", supportRooms: "সহায়তা কক্ষ", myReports: "আমার রিপোর্ট",
    savedDrafts: "সংরক্ষিত খসড়া", profile: "প্রোফাইল", adminPanel: "অ্যাডমিন প্যানেল", english: "English", bangla: "বাংলা",
    overview: "সারসংক্ষেপ", users: "ব্যবহারকারী", submissions: "জমা দেওয়া তথ্য", supportCases: "বার্তা ও সহায়তা কক্ষ",
    missingReports: "নিখোঁজ রিপোর্ট", archiveManager: "আর্কাইভ ব্যবস্থাপনা", settings: "সেটিংস",
    search: "খুঁজুন", filter: "ফিল্টার", status: "অবস্থা", actions: "কাজ", view: "দেখুন",
    approve: "অনুমোদন", reject: "প্রত্যাখ্যান", requestInfo: "তথ্য চাইুন", publish: "প্রকাশ করুন",
    language: "ভাষা", account: "অ্যাকাউন্ট", protected: "পরিচয় সুরক্ষিত", privateReview: "ব্যক্তিগত অ্যাডমিন পর্যালোচনা",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("julySmritiLanguage") || "en");
  useEffect(() => {
    localStorage.setItem("julySmritiLanguage", language);
    document.documentElement.lang = language === "bn" ? "bn" : "en";
    document.body.classList.toggle("bn", language === "bn");
  }, [language]);
  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage((value) => value === "en" ? "bn" : "en"),
    t: (key) => dictionary[language]?.[key] || dictionary.en[key] || key,
    pick: (english, bangla) => language === "bn" ? (bangla || english) : english,
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
