import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Archive,
  Building2,
  GitBranch,
  Globe,
  HandCoins,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Milk,
  PawPrint,
  ScanLine,
  Shield,
  Wheat,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Page } from "../App";
import { useAuth } from "../lib/AuthContext";
import { useLang } from "../lib/LanguageContext";
import { loadProfileLogo } from "../pages/Profile";

interface LayoutProps {
  page: Page;
  setPage: (p: Page) => void;
  children: React.ReactNode;
}

const allNavItems: {
  id: Page;
  icon: React.ElementType;
  en: string;
  hi: string;
  adminOnly?: boolean;
}[] = [
  { id: "dashboard", icon: LayoutDashboard, en: "Dashboard", hi: "डैशबोर्ड" },
  { id: "cows", icon: PawPrint, en: "Cow Registry", hi: "गाय परिवार" },
  { id: "health", icon: HeartPulse, en: "Health Records", hi: "स्वास्थ्य" },
  { id: "milk", icon: Milk, en: "Milk Management", hi: "दूध प्रबंधन" },
  { id: "feed", icon: Wheat, en: "Feed Management", hi: "चारा प्रबंधन" },
  { id: "vanshavali", icon: GitBranch, en: "Offspring Records", hi: "वंशावली" },
  { id: "donations", icon: HandCoins, en: "Donations", hi: "दान" },
  { id: "announcements", icon: Megaphone, en: "Announcements", hi: "घोषणा" },
  { id: "scanner", icon: ScanLine, en: "QR Scanner", hi: "QR स्कैनर" },
  { id: "profile", icon: Building2, en: "Profile", hi: "प्रोफ़ाइल" },
  { id: "backup", icon: Archive, en: "Backup", hi: "बैकअप" },
  { id: "changelog", icon: History, en: "Change Log", hi: "बदलाव" },
  {
    id: "admin",
    icon: Shield,
    en: "Admin Panel",
    hi: "व्यवस्थापक",
    adminOnly: true,
  },
];

const ocidMap: Record<Page, string> = {
  dashboard: "nav.dashboard.link",
  cows: "nav.cows.link",
  health: "nav.health.link",
  milk: "nav.milk.link",
  feed: "nav.feed.link",
  donations: "nav.donations.link",
  announcements: "nav.announcements.link",
  scanner: "nav.scanner.link",
  backup: "nav.backup.link",
  changelog: "nav.changelog.link",
  admin: "nav.admin.link",
  profile: "nav.profile.link",
  vanshavali: "nav.vanshavali.link",
};

function roleBadgeClass(role: string) {
  const r = role.toLowerCase();
  if (r === "admin") return "bg-orange-100 text-orange-700";
  if (r === "editor") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-600";
}

function roleLabel(role: string, lang: string) {
  const r = role.toLowerCase();
  if (lang === "hi") {
    if (r === "admin") return "व्यवस्थापक";
    if (r === "editor") return "संपादक";
    return "देखने वाला";
  }
  if (r === "admin") return "Admin";
  if (r === "editor") return "Editor";
  return "Viewer";
}

export default function Layout({ page, setPage, children }: LayoutProps) {
  const { lang, setLang, t } = useLang();
  const { currentUser, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileLogo, setProfileLogo] = useState(() => loadProfileLogo());

  // Listen for profile updates
  useEffect(() => {
    function handleUpdate() {
      setProfileLogo(loadProfileLogo());
    }
    window.addEventListener("gaushala_profile_updated", handleUpdate);
    return () =>
      window.removeEventListener("gaushala_profile_updated", handleUpdate);
  }, []);

  const toggleLang = () => setLang(lang === "en" ? "hi" : "en");

  const navItems = allNavItems.filter((item) => {
    if (item.adminOnly) return isAdmin;
    return true;
  });

  const logoImg = profileLogo ? (
    <img src={profileLogo} alt="Logo" className="w-full h-full object-cover" />
  ) : (
    <img
      src="/assets/generated/gaushala-logo-transparent.dim_120x120.png"
      alt="Logo"
      className="w-full h-full object-cover"
    />
  );

  const sidebarNav = (
    <>
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={ocidMap[item.id]}
              onClick={() => {
                setPage(item.id);
                setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{lang === "hi" ? item.hi : item.en}</span>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground/60"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      {currentUser && (
        <div className="px-3 pb-2 border-t border-sidebar-border pt-3">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-sidebar-foreground">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {currentUser.name}
              </p>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadgeClass(currentUser.role)}`}
              >
                {roleLabel(currentUser.role, lang)}
              </span>
            </div>
          </div>
          <button
            type="button"
            data-ocid="auth.logout.button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-red-50 hover:text-red-600 text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>{lang === "hi" ? "लॉग आउट" : "Log Out"}</span>
          </button>
        </div>
      )}

      {/* Language toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          type="button"
          data-ocid="lang.toggle"
          onClick={toggleLang}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground text-sm font-medium transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span>{lang === "en" ? "Switch to हिन्दी" : "Switch to English"}</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-sidebar-foreground/40 text-xs text-center">
          © {new Date().getFullYear()}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sidebar-foreground/60"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 sidebar-gradient shadow-sm flex-shrink-0">
        {/* Logo Area */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-sidebar-accent border border-sidebar-border">
              {logoImg}
            </div>
            <div>
              <h1 className="text-sidebar-foreground font-display text-sm font-semibold leading-tight">
                {t("appName")}
              </h1>
              <p className="text-sidebar-foreground/50 text-xs mt-0.5">
                {lang === "hi" ? "गौ आश्रम प्रबंधन" : "Gaushala Management"}
              </p>
            </div>
          </div>
        </div>
        {sidebarNav}
      </aside>

      {/* ── Mobile Overlay Sidebar ─────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 sidebar-gradient flex flex-col lg:hidden shadow-xl"
            >
              <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-sidebar-accent border border-sidebar-border">
                    {logoImg}
                  </div>
                  <h1 className="text-sidebar-foreground font-display text-sm font-semibold">
                    {t("appName")}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {sidebarNav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-sm font-semibold text-foreground">
            {t("appName")}
          </h1>
          <button
            type="button"
            data-ocid="lang.toggle"
            onClick={toggleLang}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "en" ? "हिन्दी" : "EN"}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
