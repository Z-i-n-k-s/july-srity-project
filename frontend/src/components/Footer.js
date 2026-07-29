import React from "react";
import { Facebook, Instagram, Languages, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { footerLinks } from "../data/landingData";
import { useLanguage } from "../context/LanguageContext";
import Logo from "./Logo";

const Footer = () => {
  const { language, toggleLanguage, pick } = useLanguage();
  return (
    <footer className="border-t border-white/[0.08] bg-[#07090F]">
      <div className="page-shell py-14 md:py-18">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-md text-sm leading-7 text-archive-muted">{pick("Built to preserve truth, protect dignity and support the people whose lives were changed by July.", "সত্য সংরক্ষণ, মর্যাদা রক্ষা এবং জুলাইয়ে বদলে যাওয়া মানুষের পাশে দাঁড়ানোর জন্য নির্মিত।")}</p>
            <p className="mt-4 font-bangla text-lg text-[#D8D3CA]">স্মৃতি বাঁচুক, সত্য কথা বলুক।</p>
            <div className="mt-6 flex gap-2" aria-label="Social media placeholders">
              {[Facebook, Instagram, Linkedin].map((Icon, index) => <button key={index} className="focus-ring grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-archive-muted hover:border-archive-amber/30 hover:text-archive-amber" aria-label="Social media link placeholder"><Icon className="h-4 w-4" /></button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h2 className="text-sm font-semibold text-archive-paper">{heading}</h2>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => <li key={`${heading}-${link.label}`}><Link to={link.to} className="focus-ring rounded text-sm text-archive-muted hover:text-archive-amber">{link.label}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.08] pt-6 text-xs text-archive-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} July Smriti Archive. {pick("Civic archive platform; not an emergency service.", "নাগরিক আর্কাইভ প্ল্যাটফর্ম; এটি জরুরি সেবা নয়।")}</p>
          <button onClick={toggleLanguage} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 hover:text-white"><Languages className="h-4 w-4" /> {language === "en" ? "English / বাংলা" : "বাংলা / English"}</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
