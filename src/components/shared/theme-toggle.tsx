"use client";

import type { MouseEvent } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  function toggleTheme(event: MouseEvent<HTMLButtonElement>) {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    event.currentTarget.setAttribute("aria-label", `Switch to ${nextIsDark ? "light" : "dark"} mode`);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Switch color theme"
      title="Switch color theme"
      className="fixed bottom-5 left-5 z-100 grid size-12 place-items-center rounded-full border border-slate-300 bg-white text-slate-800 shadow-lg transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <Moon className="theme-toggle-moon" size={20} aria-hidden="true" />
      <Sun className="theme-toggle-sun" size={20} aria-hidden="true" />
    </button>
  );
}
