import { cloneElement, createContext, isValidElement, useContext, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const DropdownMenuContext = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, []);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild = false, children }) {
  const context = useContext(DropdownMenuContext);

  const onClick = () => context?.setOpen(!context.open);

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      onClick
    });
  }

  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className }) {
  const context = useContext(DropdownMenuContext);

  if (!context?.open) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute right-0 z-50 mt-2 min-w-40 rounded-md border bg-background p-1 shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ className, onClick, children, disabled = false }) {
  const context = useContext(DropdownMenuContext);

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        context?.setOpen(false);
      }}
    >
      {children}
    </button>
  );
}
