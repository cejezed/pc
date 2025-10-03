// src/components/ui/tabs.tsx
import React, { createContext, useContext, useId, useState } from "react";
import { cn } from "@/lib/utils";

type TabsContextType = {
  value: string;
  setValue: (v: string) => void;
  idBase: string;
};

const TabsCtx = createContext<TabsContextType | null>(null);

const useTabs = () => {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
};

// ============================================================
// Tabs Root Component
// ============================================================
type TabsProps = {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
};

export function Tabs({ 
  defaultValue, 
  value, 
  onValueChange, 
  className, 
  children 
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const idBase = useId();
  const current = value ?? internal;

  const setValue = (v: string) => {
    if (onValueChange) onValueChange(v);
    else setInternal(v);
  };

  return (
    <TabsCtx.Provider value={{ value: current, setValue, idBase }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsCtx.Provider>
  );
}

// ============================================================
// TabsList - Container voor tab triggers
// ============================================================
type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

export function TabsList({ className = "", ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-2 rounded-brikx bg-gray-100 p-1.5",
        className
      )}
      {...props}
    />
  );
}

// ============================================================
// TabsTrigger - Individuele tab button
// ============================================================
type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  value: string;
};

export function TabsTrigger({ 
  value, 
  className = "", 
  children, 
  ...props 
}: TabsTriggerProps) {
  const { value: active, setValue, idBase } = useTabs();
  const selected = active === value;

  return (
    <button
      id={`${idBase}-tab-${value}`}
      role="tab"
      aria-selected={selected}
      aria-controls={`${idBase}-panel-${value}`}
      onClick={() => setValue(value)}
      className={cn(
        // Base styles
        "inline-flex min-w-[100px] items-center justify-center whitespace-nowrap",
        "rounded-brikx px-4 py-2.5 text-sm font-semibold",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brikx-teal focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        
        // Niet-actieve staat
        !selected && [
          "bg-transparent text-gray-600",
          "hover:bg-white hover:text-gray-900",
          "hover:shadow-sm",
        ],
        
        // Actieve staat - Brikx Teal
        selected && [
          "bg-brikx-teal text-white",
          "shadow-lg shadow-brikx-teal/30",
        ],
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================================
// TabsContent - Content panel voor elke tab
// ============================================================
type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & { 
  value: string;
};

export function TabsContent({ 
  value, 
  className = "", 
  children, 
  ...props 
}: TabsContentProps) {
  const { value: active, idBase } = useTabs();
  
  if (active !== value) return null;
  
  return (
    <div
      id={`${idBase}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${idBase}-tab-${value}`}
      tabIndex={0}
      className={cn(
        "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brikx-teal focus-visible:ring-offset-2 rounded-brikx",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================
// Export alles
// ============================================================
export default Tabs;