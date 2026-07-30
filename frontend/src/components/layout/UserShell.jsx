import { NavLink, Outlet } from "react-router-dom";
import { FileClock, FileText, LayoutDashboard, MessageSquareText, Search, UserRound } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../context/LanguageContext";

const links = [
  { key: "overview", to: "/account", end: true, icon: LayoutDashboard },
  { key: "mySubmissions", to: "/account/submissions", icon: FileText },
  { key: "supportRooms", to: "/account/support-rooms", icon: MessageSquareText },
  { key: "myReports", to: "/account/reports", icon: Search },
  { key: "savedDrafts", to: "/account/drafts", icon: FileClock },
  { key: "profile", to: "/account/profile", icon: UserRound },
];

export default function UserShell() {
  const { t } = useLanguage();
  return (
    <div className="page-shell grid gap-8 pb-20 pt-28 lg:grid-cols-[250px_minmax(0,1fr)] lg:pt-32">
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <nav className="hide-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2 lg:flex-col" aria-label="Account navigation">
          {links.map(({ key, to, end, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("focus-ring flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition", isActive ? "bg-archive-amber/12 text-archive-amber" : "text-[#B9B5AE] hover:bg-white/5 hover:text-white")}>
              <Icon className="h-4 w-4" /> {t(key)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0"><Outlet /></section>
    </div>
  );
}
