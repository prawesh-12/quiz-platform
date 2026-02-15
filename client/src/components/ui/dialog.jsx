import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const DialogContext = React.createContext(null);

export function Dialog({ open: openProp, onOpenChange, children }) {
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

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ asChild = false, children, ...props }) {
  const context = React.useContext(DialogContext);

  const handleClick = (event) => {
    props.onClick?.(event);
    if (!event.defaultPrevented) {
      context?.setOpen(true);
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

export function DialogPortal({ children }) {
  return createPortal(children, document.body);
}

export function DialogOverlay({ className, ...props }) {
  return <div className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />;
}

export function DialogContent({ className, children, ...props }) {
  const context = React.useContext(DialogContext);

  React.useEffect(() => {
    if (!context?.open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        context.setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [context]);

  if (!context?.open) {
    return null;
  }

  return (
    <DialogPortal>
      <DialogOverlay onClick={() => context.setOpen(false)} />
      <div
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 text-left", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogClose({ asChild = false, children, ...props }) {
  const context = React.useContext(DialogContext);

  const handleClick = (event) => {
    props.onClick?.(event);
    if (!event.defaultPrevented) {
      context?.setOpen(false);
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
