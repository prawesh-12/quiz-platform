import { useEffect, useState } from "react";

let toastCounter = 0;
const listeners = new Set();
let currentToasts = [];

function emit() {
  for (const listener of listeners) {
    listener(currentToasts);
  }
}

function removeToast(id) {
  currentToasts = currentToasts.filter((item) => item.id !== id);
  emit();
}

export function pushToast({ title, description, variant = "default", duration = 3500 }) {
  const id = ++toastCounter;

  currentToasts = [...currentToasts, { id, title, description, variant }];
  emit();

  window.setTimeout(() => removeToast(id), duration);
}

export function useToast() {
  const [toasts, setToasts] = useState(currentToasts);

  useEffect(() => {
    listeners.add(setToasts);
    return () => listeners.delete(setToasts);
  }, []);

  return {
    toasts,
    toast: pushToast,
    dismiss: removeToast
  };
}
