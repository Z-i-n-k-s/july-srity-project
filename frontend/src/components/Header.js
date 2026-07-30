import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Languages,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Logo from "./Logo";
import SummaryApi from "../common";
import { setUserDetails } from "../store/userSlice";
import { isAdminUser } from "../common/role";
import ProfileDisplay from "./ProfileDisplay";
import { useLanguage } from "../context/LanguageContext";
import useScrollLock from "../hooks/useScrollLock";
import Button from "./ui/Button";
import { cn } from "../lib/utils";

const accountLinks = [
  { key: "dashboard", to: "/account" },
  { key: "mySubmissions", to: "/account/submissions" },
  { key: "supportRooms", to: "/account/support-rooms" },
  { key: "myReports", to: "/account/reports" },
  { key: "savedDrafts", to: "/account/drafts" },
  { key: "profile", to: "/account/profile" },
];

const directNavigation = [
  { label: "Home", labelBn: "হোম", to: "/home" },
  { label: "Archive", labelBn: "আর্কাইভ", to: "/archive" },
];

const groupedNavigation = [
  {
    id: "remember",
    label: "Remember July",
    labelBn: "জুলাইকে স্মরণ",
    items: [
      { label: "Movement Timeline", labelBn: "আন্দোলনের সময়রেখা", to: "/timeline" },
      { label: "Hero Stories", labelBn: "বীরত্বের গল্প", to: "/stories" },
      { label: "Aynaghor", labelBn: "আয়নাঘর", to: "/aynaghor" },
      { label: "July Chapters", labelBn: "জুলাইয়ের অধ্যায়", to: "/july-history" },
      { label: "Voices of July", labelBn: "জুলাইয়ের কণ্ঠস্বর", to: "/voices" },
    ],
  },
  {
    id: "help",
    label: "Support & Search",
    labelBn: "সহায়তা ও অনুসন্ধান",
    items: [
      { label: "Support", labelBn: "সহায়তা", to: "/support" },
      { label: "Missing Persons", labelBn: "নিখোঁজ ব্যক্তি", to: "/missing-persons" },
    ],
  },
];

const navLinkClass = ({ isActive }) => cn(
  "focus-ring relative rounded-lg px-3 py-2 text-sm font-medium transition after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-archive-amber after:transition-transform hover:text-white hover:after:scale-x-100",
  isActive ? "text-white after:scale-x-100" : "text-[#A8ABB4]",
);

function DesktopNavGroup({ group, pathname, pick }) {
  const active = group.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));

  return (
    <div className="group relative">
      <button
        type="button"
        className={cn(
          "focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:text-white",
          active ? "text-white" : "text-[#A8ABB4]",
        )}
        aria-haspopup="menu"
      >
        {pick(group.label, group.labelBn)}
        <ChevronDown className="h-4 w-4 transition group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>
      <div className="invisible absolute left-1/2 top-full z-20 w-72 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/10 bg-[#11141E] p-2 opacity-0 shadow-2xl transition duration-200 group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-1 group-focus-within:opacity-100" role="menu">
        {group.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "focus-ring block rounded-xl px-4 py-3 text-sm transition",
              isActive ? "bg-archive-amber/10 font-semibold text-archive-amber" : "text-[#C6C2BC] hover:bg-white/5 hover:text-white",
            )}
            role="menuitem"
          >
            {pick(item.label, item.labelBn)}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

const Header = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage, t, pick } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState("remember");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDisplay, setProfileDisplay] = useState(false);
  const authenticated = Boolean(user?._id || user?.id);
  const admin = isAdminUser(user);
  const profileRef = useRef(null);
  useScrollLock(mobileOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setProfileOpen(false);
      }
    };
    const onClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target))
        setProfileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(SummaryApi.logout_user.url, {
        method: SummaryApi.logout_user.method,
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.error)
        throw new Error(payload?.message || "Unable to sign out.");
      toast.success(payload?.message || "Signed out successfully.");
    } catch (error) {
      toast.info("Local session cleared.");
    } finally {
      dispatch(setUserDetails(null));
      setProfileOpen(false);
      setMobileOpen(false);
      navigate("/", {
        replace: true,
      });
    }
  };

  return (
    <>
      <header className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled ? "border-white/10 bg-ink-950/[0.92] py-2 shadow-xl backdrop-blur-xl" : "border-white/[0.06] bg-ink-950/35 py-3 backdrop-blur-sm",
      )}>
        <div className="page-shell flex h-14 items-center justify-between gap-4">
          <Logo compact className="shrink-0" />

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
            {directNavigation.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {pick(item.label, item.labelBn)}
              </NavLink>
            ))}
            {groupedNavigation.map((group) => (
              <DesktopNavGroup key={group.id} group={group} pathname={location.pathname} pick={pick} />
            ))}
            <NavLink to="/about" className={navLinkClass}>{pick("About", "আমাদের সম্পর্কে")}</NavLink>
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <button
              onClick={toggleLanguage}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-[#C6C2BC] hover:border-archive-amber/30 hover:text-white"
              aria-label="Change language"
            >
              <Languages className="h-4 w-4" />{" "}
              {language === "en" ? "বাংলা" : "EN"}
            </button>
            {authenticated ? (
              <>
                {admin ? <Button to="/admin-panel" size="sm" showArrow>{t("adminPanel")}</Button> : <Button to="/submit" size="sm" showArrow>{t("submitEvidence")}</Button>}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((value) => !value)}
                    className="focus-ring flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-archive-paper hover:bg-white/[0.07]"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                  >
                    {user?.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-archive-teal/15 text-archive-teal">
                        <User className="h-4 w-4" />
                      </span>
                    )}
                    <span className="max-w-28 truncate">
                      {user?.name || t("account")}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-archive-muted transition",
                        profileOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div initial={{ opacity: 0, y: 8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border border-white/10 bg-ink-800 p-2 shadow-2xl" role="menu">
                        <div className="border-b border-white/10 px-3 py-3"><p className="truncate text-sm font-semibold text-white">{user?.name}</p><p className="truncate text-xs text-archive-muted">{user?.email}</p></div>
                        <div className="py-2">
                          {!admin &&
                            accountLinks.map((link) => (
                              <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setProfileOpen(false)}
                                className="focus-ring block rounded-lg px-3 py-2.5 text-sm text-[#C6C2BC] hover:bg-white/5 hover:text-white"
                                role="menuitem"
                              >
                                {t(link.key)}
                              </Link>
                            ))}
                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              setProfileDisplay(true);
                            }}
                            className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[#C6C2BC] hover:bg-white/5 hover:text-white"
                          >
                            <Settings className="h-4 w-4" />
                            {pick(
                              "Quick profile settings",
                              "দ্রুত প্রোফাইল সেটিংস",
                            )}
                          </button>
                          {admin && (
                            <Link
                              to="/admin-panel"
                              onClick={() => setProfileOpen(false)}
                              className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-archive-amber hover:bg-archive-amber/10"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              {t("adminPanel")}
                            </Link>
                          )}
                        </div>
                        <button
                          onClick={handleLogout}
                          className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[#E6B4BD] hover:bg-archive-rose/10"
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("signOut")}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <><Button to="/login" size="sm" variant="ghost">{t("signIn")}</Button><Button to="/sign-up" size="sm" showArrow>{pick("Create Account", "অ্যাকাউন্ট তৈরি")}</Button></>
            )}
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <button
              onClick={toggleLanguage}
              className="focus-ring grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"
              aria-label="Change language"
            >
              <Languages className="h-5 w-5" />
            </button>
            {!admin && (
              <Link
                to="/support/new"
                className="focus-ring hidden min-h-10 items-center gap-2 rounded-xl border border-archive-rose/25 bg-archive-rose/10 px-3 text-xs font-semibold text-[#F0C6CE] sm:flex"
              >
                <ShieldCheck className="h-4 w-4" />
                {t("getSupport")}
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className="focus-ring grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] overflow-y-auto bg-[#080A11] xl:hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,103,118,.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(75,155,141,.12),transparent_38%)]" />
              <div className="page-shell relative flex min-h-screen flex-col py-4">
                <div className="flex h-14 items-center justify-between"><Logo /><button onClick={() => setMobileOpen(false)} className="focus-ring grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]" aria-label="Close navigation menu"><X className="h-5 w-5" /></button></div>
                {authenticated && <div className="mt-6 rounded-xl border border-white/10 bg-[#11141E] p-4"><p className="text-sm font-semibold text-white">{user?.name}</p><p className="mt-1 text-xs text-archive-muted">{user?.email}</p></div>}

                <nav className="mt-6 grid gap-2" aria-label="Mobile navigation">
                  {directNavigation.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("focus-ring rounded-xl px-4 py-3.5 text-lg font-medium", isActive ? "bg-archive-amber/10 text-archive-amber" : "bg-white/[0.025] text-[#D4D0C9]")}>{pick(item.label, item.labelBn)}</NavLink>)}
                  {groupedNavigation.map((group) => {
                    const expanded = mobileSection === group.id;
                    return (
                      <div key={group.id} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#10131C]">
                        <button type="button" onClick={() => setMobileSection(expanded ? "" : group.id)} className="focus-ring flex w-full items-center justify-between px-4 py-3.5 text-left text-lg font-medium text-[#E2DDD5]" aria-expanded={expanded}>
                          {pick(group.label, group.labelBn)}
                          <ChevronDown className={cn("h-5 w-5 text-archive-muted transition", expanded && "rotate-180")} />
                        </button>
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="grid gap-1 border-t border-white/[0.07] p-2">
                                {group.items.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("focus-ring rounded-lg px-4 py-3 text-sm", isActive ? "bg-archive-amber/10 font-semibold text-archive-amber" : "text-[#C6C2BC] hover:bg-white/5")}>{pick(item.label, item.labelBn)}</NavLink>)}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  <NavLink to="/about" className={({ isActive }) => cn("focus-ring rounded-xl px-4 py-3.5 text-lg font-medium", isActive ? "bg-archive-amber/10 text-archive-amber" : "bg-white/[0.025] text-[#D4D0C9]")}>{pick("About", "আমাদের সম্পর্কে")}</NavLink>
                </nav>

                {authenticated && !admin && <div className="mt-5 grid grid-cols-2 gap-2">{accountLinks.map((item) => <Link key={item.to} to={item.to} className="focus-ring rounded-xl border border-white/10 bg-[#11141E] px-3 py-3 text-sm text-[#C6C2BC]">{t(item.key)}</Link>)}</div>}
                <div className="mt-auto grid gap-3 pt-8">
                  {admin ? <Button to="/admin-panel" size="lg" showArrow>{t("adminPanel")}</Button> : <><Button to="/support/new" variant="rose" size="lg">{t("getSupport")}</Button><Button to="/submit" size="lg" showArrow>{t("submitEvidence")}</Button></>}
                  {!authenticated ? <Button to="/login" variant="secondary" size="lg">{t("signIn")}</Button> : <Button variant="secondary" size="lg" onClick={handleLogout}>{t("signOut")}</Button>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {profileDisplay && (
        <ProfileDisplay
          onClose={() => setProfileDisplay(false)}
          name={user?.name}
          email={user?.email}
          role={user?.role}
          userId={user?._id || user?.id}
          profilePic={user?.profilePic}
          callFunc={() => window.location.reload()}
        />
      )}
    </>
  );
};

export default Header;
