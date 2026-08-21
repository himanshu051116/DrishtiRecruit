"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const current = document.documentElement.dataset.theme === "dark";
    setDark(current);
  }, []);
  function toggle() {
    const next = !(dark ?? document.documentElement.dataset.theme === "dark");
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("drishtirecruit-theme", next ? "dark" : "light");
  }
  const isDark = dark ?? false;
  return <button type="button" onClick={toggle} aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"} className="icon-button" title={isDark ? "Light theme" : "Dark theme"}>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>{isDark ? <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></> : <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"/>}</svg>
  </button>;
}
