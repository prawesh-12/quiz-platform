import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

export function useMobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((previous) => !previous), []);

  return useMemo(() => ({ isOpen, close, toggle }), [close, isOpen, toggle]);
}
