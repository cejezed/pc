// src/components/AppLayout.tsx
import React, { useState, PropsWithChildren } from "react";
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
} from "lucide-react";

type Page =
  | "home"
  | "analytics"
  | "uren"
  | "budget"
  | "taken"
  | "ideas"
  | "health"
  | "abonnementen"
  | "tekopen";

type AppLayoutProps = PropsWithChildren<{
  currentPage: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
}>;

const NAV: Array<{ key: Page; label: string; icon: React.ReactNode }> = [
  { key: "home", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
  { key: "uren", label: "Uren", icon: <Clock size={18} /> },
  { key: "budget", label: "Budget", icon: <Wallet size={18} /> },
  { key: "taken", label: "Taken", icon: <CheckSquare size={18} /> },
  { key: "ideas", label: "Ideeën", icon: <Lightbulb size={18} /> },
  { key: "health", label: "Health", icon: <Heart size={18} /> },
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
            className={`
              w-full group flex items-center gap-3 px-3 py-2 text-sm font-medium text-left transition-all
              ${active 
                ? "bg-brikx-teal text-white shadow-lg" 
                : "text-white/80 hover:text-white hover:bg-white/10"
              }
            `}
            style={{ borderRadius: '12px' }}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen text-gray-900" style={{ background: '#F5F7FA' }}>
      {/* Topbar */}
      <header 
        className="sticky top-0 z-40 flex h-14 items-center justify-between text-white px-4 shadow-md"
        style={{ background: '#0A2540' }}
      >
        <div className="flex items-center gap-3">
          {/* Hamburger (mobiel) */}
          <button
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 md:hidden"
            style={{ '--tw-ring-color': '#2D9CDB' } as React.CSSProperties}
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </button>
          <div className="font-semibold tracking-wide">
            Brikx <span style={{ color: '#2D9CDB' }}>PersonalCoach</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/10 transition-colors"
            style={{ 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-4 md:grid md:grid-cols-[240px_1fr] md:gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block">
          <div 
            className="sticky top-16 text-white p-4 shadow-md"
            style={{ 
              background: 'linear-gradient(135deg, #0A2540 0%, #0A3552 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(29, 58, 92, 0.4)'
            }}
          >
            <div className="text-xs uppercase tracking-wider px-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Navigatie
            </div>
            <NavList />
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0">{children}</main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div 
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] text-white p-4 shadow-lg md:hidden"
            style={{ 
              background: 'linear-gradient(135deg, #0A2540 0%, #0A3552 100%)',
              boxShadow: '0 4px 12px rgba(45, 156, 219, 0.3)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">Menu</div>
              <button
                aria-label="Sluit menu"
                className="rounded-md p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2"
                style={{ '--tw-ring-color': '#2D9CDB' } as React.CSSProperties}
                onClick={() => setMobileOpen(false)}
              >
                <X />
              </button>
            </div>
            <NavList onClickItem={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}