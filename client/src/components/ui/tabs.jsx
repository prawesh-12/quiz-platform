import { createContext, useContext } from "react";

import { cn } from "@/lib/utils";

const TabsContext = createContext(null);

export function Tabs({ value, onValueChange, className, children }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-3", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }) {
  return <div className={cn("inline-flex rounded-md border bg-muted/50 p-1", className)}>{children}</div>;
}

export function TabsTrigger({ value, className, children }) {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      type="button"
      className={cn(
        "rounded-sm px-3 py-1.5 text-sm",
        isActive ? "bg-background shadow-sm" : "text-muted-foreground",
        className
      )}
      onClick={() => context?.onValueChange?.(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const context = useContext(TabsContext);
  if (context?.value !== value) {
    return null;
  }

  return <div className={cn(className)}>{children}</div>;
}
