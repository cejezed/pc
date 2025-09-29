import React, { createContext, useContext, useId, useState } from "react";

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

type TabsProps = {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
};

export function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const idBase = useId();
  const current = value ?? internal;

  const setValue = (v: string) => {
    if (onValueChange) onValueChange(v);
    else setInternal(v);
  };

  return (
    <TabsCtx.Provider value={{ value: current, setValue, idBase }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;
export function TabsList({ className = "", ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`inline-grid rounded-md bg-gray-100 p-1 text-gray-600 ${className}`}
      {...props}
    />
  );
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string };
export function TabsTrigger({ value, className = "", children, ...props }: TabsTriggerProps) {
  const { value: active, setValue, idBase } = useTabs();
  const selected = active === value;
  return (
    <button
      id={`${idBase}-tab-${value}`}
      role="tab"
      aria-selected={selected}
      aria-controls={`${idBase}-panel-${value}`}
      onClick={() => setValue(value)}
      className={[
        "px-3 py-1.5 text-sm font-medium rounded-md transition",
        selected ? "bg-white text-gray-900 shadow" : "text-gray-600 hover:text-gray-900",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & { value: string };
export function TabsContent({ value, className = "", children, ...props }: TabsContentProps) {
  const { value: active, idBase } = useTabs();
  if (active !== value) return null;
  return (
    <div
      id={`${idBase}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${idBase}-tab-${value}`}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
