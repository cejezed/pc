// src/components/AppLayout.tsx - VOLLEDIG RESPONSIVE
import { useState } from "react";
import type { PropsWithChildren } from "react";
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  Clock,
  Wallet,
  CheckSquare,
  Lightbulb,
  Heart,
  CreditCard,
  ShoppingCart,
  Menu,
  LogOut,
  X,
  Sparkles,
  FileText,
  ChefHat,
  ShoppingBasket,
} from "lucide-react";

type Page =
  | "home"
  | "analytics"
  | "uren"
  | "budget"
  | "facturen"
  | "taken"
  | "ideas"
  | "health"
  | "eten"
  | "boodschappen"
  | "abonnementen"
  | "tekopen"
  | "affirmaties"
  | "simple-import"
  | "coach";

type AppLayoutProps = PropsWithChildren<{
  currentPage: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
}>;

const NAV: Array<{ key: Page; label: string; icon: React.ReactNode }> = [
  { key: "home", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { key: "coach", label: "Personal Coach", icon: <Sparkles size={18} /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
  { key: "uren", label: "Uren", icon: <Clock size={18} /> },
  { key: "facturen", label: "Facturen", icon: <FileText size={18} /> },
  { key: "budget", label: "Budget", icon: <Wallet size={18} /> },
  { key: "taken", label: "Taken", icon: <CheckSquare size={18} /> },
  { key: "ideas", label: "Ideeën", icon: <Lightbulb size={18} /> },
  { key: "affirmaties", label: "Affirmaties", icon: <Sparkles size={18} /> },
  { key: "health", label: "Health", icon: <Heart size={18} /> },
  { key: "eten", label: "Mijn Keuken", icon: <ChefHat size={18} /> },
  { key: "boodschappen", label: "Boodschappen", icon: <ShoppingBasket size={18} /> },
  { key: "abonnementen", label: "Abonnementen", icon: <CreditCard size={18} /> },
  { key: "tekopen", label: "Te kopen", icon: <ShoppingCart size={18} /> },
];

export default function AppLayout({
  currentPage,
  onNavigate,
  onLogout,
  children,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavList = ({ onClickItem }: { onClickItem?: () => void }) => (
    <nav className="mt-3 space-y-1">
      {NAV.map((item) => {
        const active = currentPage === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              onNavigate(item.key);
              onClickItem?.();
            }}
            className={
              active
                ? "w-full group flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-left transition-all rounded-xl bg-zeus-accent text-white shadow-[0_0_15px_rgba(45,156,219,0.4)]"
                : "w-full group flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-left transition-all text-slate-400 hover:text-white hover:bg-white/10 rounded-xl border border-transparent"
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen text-zeus-text bg-zeus-bg">
      {/* Topbar - RESPONSIVE */}
      <header
        className="sticky top-0 z-40 flex h-12 sm:h-14 items-center justify-between px-3 sm:px-4 md:px-6 bg-brikx-dark border-b border-white/10 text-white shadow-md"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger (mobiel) */}
          <button
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-white/10 text-white focus-visible:outline-none focus-visible:ring-2 md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm sm:text-base font-bold tracking-wider font-['Orbitron',sans-serif] text-white">
            <span className="hidden sm:inline">Brikx </span>
            <span className="text-zeus-accent">
              <span className="sm:hidden">Brikx</span>
              <span className="hidden sm:inline">PersonalCoach</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 text-xs sm:text-sm hover:bg-white/10 hover:text-white transition-all rounded-xl border border-white/20 text-white"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Grid Layout - VOLLEDIG RESPONSIVE */}
      <div className="w-full">
        {/* Container met max-width alleen op grote schermen */}
        <div className="mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 max-w-[1920px]">
          <div className="md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr] md:gap-4 lg:gap-6">

            {/* Sidebar (desktop only) */}
            <aside className="hidden md:block">
              <div className="sticky top-20 bg-brikx-dark p-4 rounded-3xl border border-white/5 shadow-xl">
                <div className="text-xs uppercase tracking-[0.2em] px-1 mb-2 text-slate-400 opacity-70 font-semibold">
                  Navigatie
                </div>
                <NavList />
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-zeus-accent text-white shadow-[0_0_10px_rgba(45,156,219,0.2)]"
                      >
                        {useAuth().user?.email?.[0].toUpperCase()}
                      </div>
                      <div className="text-xs min-w-0 flex-1">
                        <p className="font-bold truncate text-white tracking-wide">
                          {useAuth().user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-slate-400 truncate opacity-80">
                          {useAuth().user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content - Full Width on Mobile */}
            <main className="min-w-0 w-full">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* Mobile drawer - RESPONSIVE */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div
            className="fixed inset-y-0 left-0 z-50 w-[280px] sm:w-72 max-w-[85%] bg-brikx-dark p-4 shadow-2xl md:hidden overflow-y-auto border-r border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="font-bold text-lg text-white font-['Orbitron',sans-serif]">
                MENU
              </div>
              <button
                aria-label="Sluit menu"
                className="rounded-md p-2 hover:bg-white/10 text-white focus-visible:outline-none focus-visible:ring-2"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavList onClickItem={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}