import * as React from "react";

import { cn } from "@/lib/utils";

const PopoverContext = React.createContext(null);

export function Popover({ open: openProp, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof openProp === "boolean";
  const open = isControlled ? openProp : internalOpen;

  const setOpen = React.useCallback(
    (next) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return <PopoverContext.Provider value={{ open, setOpen }}>{children}</PopoverContext.Provider>;
}

export function PopoverTrigger({ asChild = false, children, ...props }) {
  const context = React.useContext(PopoverContext);

  const handleClick = (event) => {
    props.onClick?.(event);
    if (!event.defaultPrevented) {
      context?.setOpen(!context.open);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick
    });
  }

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

export function PopoverContent({ className, children, ...props }) {
  const context = React.useContext(PopoverContext);

  if (!context?.open) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 w-80 rounded-md border bg-card p-3 shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
