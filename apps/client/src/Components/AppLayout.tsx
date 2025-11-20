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
                ? "w-full group flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-left transition-all rounded-brikx"
                : "w-full group flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-left transition-all text-white/80 hover:text-white hover:bg-white/10 rounded-brikx"
            }
            style={
              active
                ? { backgroundColor: '#2D9CDB', color: 'white', boxShadow: '0 4px 12px rgba(45, 156, 219, 0.3)' }
                : undefined
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
    <div className="min-h-screen text-gray-900" style={{ background: '#d9e0ebff' }}>
      {/* Topbar - RESPONSIVE */}
      <header
        className="sticky top-0 z-40 flex h-12 sm:h-14 items-center justify-between text-white px-3 sm:px-4 md:px-6 shadow-md"
        style={{ background: '#0A2540' }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger (mobiel) */}
          <button
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 md:hidden"
            style={{ '--tw-ring-color': '#2D9CDB' } as React.CSSProperties}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm sm:text-base font-semibold tracking-wide">
            <span className="hidden sm:inline">Brikx </span>
            <span style={{ color: '#2D9CDB' }}>
              <span className="sm:hidden">Brikx</span>
              <span className="hidden sm:inline">PersonalCoach</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-white/10 transition-colors"
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
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
              <div
                className="sticky top-16 text-white p-3 lg:p-4 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #0A2540 0%, #0A3552 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(29, 58, 92, 0.4)'
                }}
              >
                <div className="text-xs uppercase tracking-wider px-1 mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Navigatie
                </div>
                <NavList />
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ backgroundColor: '#2D9CDB' }}
                      >
                        {useAuth().user?.email?.[0].toUpperCase()}
                      </div>
                      <div className="text-xs min-w-0 flex-1">
                        <p className="font-medium truncate text-white">
                          {useAuth().user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-white/60 truncate">
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
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div
            className="fixed inset-y-0 left-0 z-50 w-[280px] sm:w-72 max-w-[85%] text-white p-4 shadow-lg md:hidden overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, #0A2540 0%, #0A3552 100%)',
              boxShadow: '0 4px 12px rgba(45, 156, 219, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-lg">Menu</div>
              <button
                aria-label="Sluit menu"
                className="rounded-md p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2"
                style={{ '--tw-ring-color': '#2D9CDB' } as React.CSSProperties}
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