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
          </div>
        </>
      )
}
    </div >
  );
}