import type { ReactNode } from "react";
import type { Metadata } from "next";
import ThemeToggle from "@/src/components/shared/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Xedruo Career", template: "%s | Xedruo Career" },
  description:
    "Discover career opportunities, build your candidate profile, and manage hiring from one workspace",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark'); } catch {}`,
          }}
        />
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
