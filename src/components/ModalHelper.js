"use client";

import { useEffect } from "react";

// Shared modal behaviour so every dialog is easy to dismiss:
//  - Esc closes the top-most modal
//  - tapping the dark backdrop closes it, unless it holds a form (avoids losing typed data)
// Closing = clicking the modal's own close (X) button, so each page's state handling still runs.
function closeTop(overlay) {
  const content = overlay.querySelector(".modal-content, .modal-content-lg");
  const buttons = content ? content.querySelectorAll(":scope > div:first-child button") : [];
  const closeBtn = buttons[buttons.length - 1];
  if (closeBtn) closeBtn.click();
}

export default function ModalHelper() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const overlays = document.querySelectorAll(".modal-overlay");
      if (overlays.length) closeTop(overlays[overlays.length - 1]);
    };
    const onClick = (e) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.classList.contains("modal-overlay") && !t.querySelector("form")) {
        closeTop(t);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
