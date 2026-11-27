"use client";

import type { MouseEvent } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  function toggleTheme(event: MouseEvent<HTMLButtonElement>) {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    try {
      localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    } catch {
      // The theme still changes for this page if storage is unavailable.
    }
    event.currentTarget.setAttribute("aria-label", `Switch to ${nextIsDark ? "light" : "dark"} mode`);
    event.currentTarget.setAttribute("title", `Switch to ${nextIsDark ? "light" : "dark"} mode`);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Switch to dark mode"
      title="Switch to dark mode"
      className="theme-toggle-control focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <Moon className="theme-toggle-moon" size={19} aria-hidden="true" />
      <Sun className="theme-toggle-sun" size={19} aria-hidden="true" />
    </button>
  );
}
