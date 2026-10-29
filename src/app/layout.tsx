import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "HIREUO ", template: "%s | HIREUO Careers" },
  description:
    "Discover career opportunities, build your candidate profile, and manage hiring from one workspace",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
