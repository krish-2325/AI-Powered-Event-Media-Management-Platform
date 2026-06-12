// src/lib/hooks/use-toast.ts
// Unified toast store shared between use-toast and Toaster component

export type ToastVariant = "default" | "success" | "error" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// ── Module-level singleton store ──────────────────────────────
type Listener = (toasts: Toast[]) => void;
const listeners = new Set<Listener>();
let _toasts: Toast[] = [];
let _counter = 0;

function notify() {
  const snapshot = [..._toasts];
  listeners.forEach((l) => l(snapshot));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener([..._toasts]);
  return () => listeners.delete(listener);
}

export function toast({
  title,
  description,
  variant = "default",
  duration = 4000,
}: Omit<Toast, "id">): string {
  const id = String(++_counter);
  _toasts = [{ id, title, description, variant, duration }, ..._toasts].slice(0, 5);
  notify();

  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  }, duration);

  return id;
}

export function dismissToast(id: string): void {
  _toasts = _toasts.filter((t) => t.id !== id);
  notify();
}
