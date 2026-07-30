import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  FileCheck2,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  ExternalLink,
} from "lucide-react";
import { isAdminUser } from "../common/role";
import Logo from "../components/Logo";
import { cn } from "../lib/utils";
import { useLanguage } from "../context/LanguageContext";
import SummaryApi from "../common";
import { setUserDetails } from "../store/userSlice";

const items = [
  { key: "overview", path: "/admin-panel", end: true, icon: LayoutDashboard },
  { key: "submissions", path: "/admin-panel/submissions", icon: FileCheck2 },
  {
    key: "supportCases",
    path: "/admin-panel/support-cases",
    icon: MessageSquareText,
  },
  { key: "missingReports", path: "/admin-panel/missing-reports", icon: Search },
  {
    key: "archiveManager",
    path: "/admin-panel/archive-manager",
    icon: Archive,
  },
  { key: "users", path: "/admin-panel/all-users", icon: Users },
  { key: "settings", path: "/admin-panel/settings", icon: Settings },
];

const Adminpanel = () => {
  const user = useSelector((state) => state?.user?.user);
  const loading = useSelector((state) => state?.user?.loading);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage, t, pick } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAdminUser(user)) navigate("/home", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const logout = async () => {
    try {
      await fetch(SummaryApi.logout_user.url, {
        method: SummaryApi.logout_user.method,
        credentials: "include",
      });
    } catch (error) {
      void error;
    }
    dispatch(setUserDetails(null));
    navigate("/", {
      replace: true,
    });
  };

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-archive-amber border-t-transparent" />
      </div>
    );
  if (!isAdminUser(user)) return null;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-between border-b border-white/[0.08] px-5">
        <Logo compact />
        <button
          onClick={() => setMobileOpen(false)}
          className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10 lg:hidden"
          aria-label="Close admin menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="border-b border-white/[0.08] p-5">
        <div className="flex items-center gap-3">
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt=""
              className="h-11 w-11 rounded-xl object-cover"
            />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-archive-amber/10 text-archive-amber">
              <ShieldCheck className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name}
            </p>
            <p className="mt-1 truncate text-xs text-archive-muted">
              {pick("Authorised administrator", "অনুমোদিত অ্যাডমিন")}
            </p>
          </div>
        </div>
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto p-3"
        aria-label="Admin navigation"
      >
        {items.map(({ key, path, end, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              cn(
                "focus-ring flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "border border-archive-amber/20 bg-archive-amber/10 text-archive-amber"
                  : "border border-transparent text-[#B9B5AE] hover:bg-white/[0.045] hover:text-white",
              )
            }
          >
            <Icon className="h-4 w-4" /> {t(key)}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/[0.08] p-3">
        <button
          onClick={logout}
          className="focus-ring flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#E6B4BD] hover:bg-archive-rose/10"
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-950 text-archive-paper">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-white/[0.08] bg-[#0B0E15] lg:block">
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin navigation"
          />
          <aside className="relative h-full w-[min(88vw,320px)] border-r border-white/10 bg-[#0B0E15] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-ink-950/92 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 lg:hidden"
                aria-label="Open admin menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="eyebrow">
                  {pick("Protected administration", "সুরক্ষিত প্রশাসন")}
                </p>
                <h1 className="truncate font-display text-2xl font-semibold sm:text-3xl">
                  {t(
                    items.find((item) =>
                      item.end
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path),
                    )?.key || "adminPanel",
                  )}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-[#C6C2BC] hover:text-white"
              >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {language === "en" ? "বাংলা" : "English"}
                </span>
              </button>
              <button
                onClick={() => navigate("/home")}
                className="focus-ring hidden h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-[#C6C2BC] hover:border-archive-amber/30 hover:text-white sm:inline-flex"
              >
                {pick("User site", "ইউজার সাইট")}
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Adminpanel;
