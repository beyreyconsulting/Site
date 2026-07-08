import { useEffect, useRef } from "react";

/**
 * Accessible modal dialog behaviour (WCAG 2.1.2 / 2.4.3):
 * - moves focus into the dialog on open, restores it on close
 * - Escape closes
 * - Tab is trapped inside the dialog
 * Attach the returned ref to the dialog container and give it
 * role="dialog" aria-modal="true" tabIndex={-1}.
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const node = ref.current;

    const focusables = (): HTMLElement[] =>
      node
        ? Array.from(
            node.querySelectorAll<HTMLElement>(
              'a[href],button:not([disabled]),textarea,input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null)
        : [];

    // Initial focus: first focusable, else the container itself.
    const first = focusables()[0];
    (first || node)?.focus?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "Tab") {
        const f = focusables();
        if (f.length === 0) { e.preventDefault(); return; }
        const idx = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && idx <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && idx === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return ref;
}
