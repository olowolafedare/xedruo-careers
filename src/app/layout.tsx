import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import ThemeToggle from "@/src/components/shared/theme-toggle";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

// Manrope is a variable font: one file covers every weight the landing
// page uses (400 to 800) instead of one file per weight.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

// Poppins ships as static weights. The wordmark only uses 500 and 700.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Xedruo Career", template: "%s | Xedruo Career" },
  description:
    "Discover career opportunities, build your candidate profile, and manage hiring from one workspace",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${manrope.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
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
