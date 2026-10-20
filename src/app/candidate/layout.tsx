"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "WORKSPACE",
    items: [
      { name: "Dashboard", href: "/candidate/dashboard", icon: "⌂" },
      { name: "My Applications", href: "/candidate/applications", icon: "▤" },
      { name: "Saved Jobs", href: "/candidate/saved-jobs", icon: "♡" },
      { name: "Assessments", href: "/candidate/assessments", icon: "✓" },
      { name: "Interviews", href: "/candidate/interviews", icon: "▦" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { name: "My Profile", href: "/candidate/profile", icon: "◎" },
    ],
  },
];

export default function CandidateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="candidate-shell">
      {mobileMenuOpen && (
        <button
          className="candidate-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`candidate-sidebar ${
          mobileMenuOpen ? "candidate-sidebar-open" : ""
        }`}
      >
        <Link
          href="/candidate/dashboard"
          className="candidate-brand"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="candidate-brand-mark">H</span>
          <span className="candidate-brand-copy">
            <strong>HIREUO</strong>
            <small>CANDIDATE SPACE</small>
          </span>
        </Link>

        <div className="candidate-nav-label">MENU</div>

        <nav className="candidate-navigation" aria-label="Candidate navigation">
          {navigation.map((group) => (
            <div className="candidate-nav-group" key={group.label}>
              <p className="candidate-group-label">{group.label}</p>

              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/candidate/dashboard" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`candidate-nav-link ${
                      isActive ? "candidate-nav-link-active" : ""
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="candidate-nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="candidate-active-indicator" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="candidate-sidebar-bottom">
          <div className="candidate-help-card">
            <div className="candidate-help-icon">?</div>
            <strong>Need some help?</strong>
            <p>We’re here to help you move forward</p>
            <a href="mailto:support@xedruocom">Contact support ↗</a>
          </div>

          <div className="candidate-sidebar-footer">
            <span className="candidate-status-dot" />
            Your next opportunity starts here
          </div>
        </div>
      </aside>

      <div className="candidate-main">
        <header className="candidate-topbar">
          <div className="candidate-topbar-left">
            <button
              className="candidate-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="candidate-breadcrumb">
              <span>HIREUO</span>
              <span className="candidate-breadcrumb-divider">/</span>
              <span className="candidate-breadcrumb-current">
                {getPageTitle(pathname)}
              </span>
            </div>
          </div>

          <div className="candidate-topbar-right">
            <span className="candidate-topbar-caption">
              YOUR CAREER, YOUR NEXT MOVE
            </span>

            <button
              className="candidate-notification"
              type="button"
              aria-label="Notifications"
              title="Notifications"
            >
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="none"
                stroke="currentColor"
                strokeWidth="17"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
              <span className="candidate-notification-dot" />
            </button>

            <div className="candidate-user-avatar" aria-label="Candidate profile">
              C
            </div>
          </div>
        </header>

        <main className="candidate-page-content">{children}</main>
      </div>

      <style jsx global>{`
        :root {
          --hireuo-ink: #172033;
          --hireuo-muted: #788397;
          --hireuo-purple: #7665e8;
          --hireuo-border: #e9ebf2;
          --hireuo-page: #f7f8fc;
          --hireuo-sidebar: #151a2b;
        }

        candidate-shell,
        candidate-shell * {
          box-sizing: border-box;
        }

        candidate-shell {
          min-height: 100vh;
          background: var(--hireuo-page);
          color: var(--hireuo-ink);
          font-family: Arial, Helvetica, sans-serif;
        }

        candidate-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          width: 258px;
          padding: 27px 17px 16px;
          overflow-y: auto;
          background: var(--hireuo-sidebar);
          color: #fff;
        }

        candidate-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 8px 30px;
          color: #fff;
          text-decoration: none;
        }

        candidate-brand-mark {
          display: grid;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 13px;
          background: linear-gradient(145deg, #9385ff, #6955df);
          box-shadow: 0 5px 18px #7665e833;
          font-size: 24px;
          font-weight: 800;
        }

        candidate-brand-copy {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        candidate-brand-copy strong {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        candidate-brand-copy small {
          color: #9da5ba;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 17px;
        }

        candidate-nav-label {
          padding: 0 12px;
          color: #737d96;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 18px;
        }

        candidate-navigation {
          display: flex;
          flex-direction: column;
          gap: 27px;
          margin-top: 14px;
        }

        candidate-nav-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        candidate-group-label {
          margin: 0 12px 8px;
          color: #737d96;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 13px;
        }

        candidate-nav-link {
          position: relative;
          display: flex;
          min-height: 46px;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          border: 1px solid transparent;
          border-radius: 9px;
          color: #a9b1c4;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition:
            background 160ms ease,
            color 160ms ease;
        }

        candidate-nav-link:hover {
          background: #ffffff0b;
          color: #fff;
        }

        candidate-nav-link-active {
          border-color: #8c7dff24;
          background: linear-gradient(100deg, #7665e82b, #7665e80b);
          color: #fff;
        }

        candidate-nav-icon {
          display: grid;
          width: 23px;
          flex-shrink: 0;
          place-items: center;
          color: #9ca7bf;
          font-size: 21px;
        }

        candidate-nav-link-active candidate-nav-icon {
          color: #a99dff;
        }

        candidate-active-indicator {
          position: absolute;
          top: 11px;
          right: -17px;
          bottom: 11px;
          width: 3px;
          border-radius: 4px 0 0 4px;
          background: #9485ff;
        }

        candidate-sidebar-bottom {
          margin-top: auto;
          padding-top: 28px;
        }

        candidate-help-card {
          padding: 16px;
          border: 1px solid #ffffff12;
          border-radius: 12px;
          background: #ffffff06;
        }

        candidate-help-icon {
          display: grid;
          width: 27px;
          height: 27px;
          margin-bottom: 13px;
          place-items: center;
          border-radius: 8px;
          background: #7665e82b;
          color: #b7adff;
          font-size: 15px;
          font-weight: 700;
        }

        candidate-help-card strong {
          display: block;
          font-size: 12px;
        }

        candidate-help-card p {
          margin: 7px 0 13px;
          color: #929cb1;
          font-size: 11px;
          line-height: 17;
        }

        candidate-help-card a {
          color: #b5aaff;
          font-size: 11px;
          font-weight: 600;
          text-decoration: none;
        }

        candidate-sidebar-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 19px;
          padding: 0 3px;
          color: #929cb1;
          font-size: 10px;
        }

        candidate-status-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #72d6a0;
        }

        candidate-main {
          min-height: 100vh;
          margin-left: 258px;
        }

        candidate-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          display: flex;
          min-height: 76px;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 0 37px;
          border-bottom: 1px solid var(--hireuo-border);
          background: #ffffffed;
          backdrop-filter: blur(14px);
        }

        candidate-topbar-left,
        candidate-topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        candidate-breadcrumb {
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: 12px;
          font-weight: 600;
        }

        candidate-breadcrumb > span:first-child {
          color: #9299aa;
          font-weight: 500;
        }

        candidate-breadcrumb-divider {
          color: #c7cad5;
        }

        candidate-breadcrumb-current {
          color: #30394d;
        }

        candidate-topbar-caption {
          color: #9399a9;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 12px;
        }

        candidate-notification {
          position: relative;
          display: grid;
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid var(--hireuo-border);
          border-radius: 10px;
          background: #fff;
          color: #69748a;
          cursor: pointer;
        }

        candidate-notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 7px;
          height: 7px;
          border: 1px solid #fff;
          border-radius: 50%;
          background: #f18c9c;
        }

        candidate-user-avatar {
          display: grid;
          width: 37px;
          height: 37px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #e2ddff;
          border-radius: 50%;
          background: #f0edff;
          color: #6554ce;
          font-size: 13px;
          font-weight: 700;
        }

        candidate-page-content {
          width: 100%;
          max-width: 1600px;
          min-height: calc(100vh - 76px);
          margin: 0 auto;
          padding: 34px 37px 48px;
        }

        candidate-menu-toggle,
        candidate-overlay {
          display: none;
        }

        @media (min-width: 1600px) {
          candidate-page-content {
            padding-right: 48px;
            padding-left: 48px;
          }
        }

        @media (max-width: 1100px) {
          candidate-sidebar {
            width: 230px;
          }

          candidate-main {
            margin-left: 230px;
          }

          candidate-topbar {
            padding-right: 23px;
            padding-left: 23px;
          }

          candidate-page-content {
            padding: 28px 23px 40px;
          }

          candidate-topbar-caption {
            display: none;
          }
        }

        @media (max-width: 760px) {
          candidate-sidebar {
            z-index: 100;
            width: min(290px, 85vw);
            transform: translateX(-105%);
            transition: transform 220ms ease;
          }

          candidate-sidebar-open {
            transform: translateX(0);
          }

          candidate-overlay {
            position: fixed;
            inset: 0;
            z-index: 90;
            display: block;
            border: 0;
            background: #10152580;
            backdrop-filter: blur(2px);
          }

          candidate-main {
            margin-left: 0;
          }

          candidate-topbar {
            min-height: 65px;
            padding: 0 17px;
          }

          candidate-topbar-left {
            gap: 12px;
          }

          candidate-topbar-right {
            gap: 10px;
          }

          candidate-menu-toggle {
            display: flex;
            width: 36px;
            height: 36px;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
            border: 1px solid var(--hireuo-border);
            border-radius: 9px;
            background: #fff;
            cursor: pointer;
          }

          candidate-menu-toggle span {
            display: block;
            width: 15px;
            height: 15px;
            border-radius: 2px;
            background: #394258;
          }

          candidate-breadcrumb {
            gap: 7px;
            font-size: 11px;
          }

          candidate-notification {
            width: 35px;
            height: 35px;
          }

          candidate-user-avatar {
            width: 34px;
            height: 34px;
          }

          candidate-page-content {
            min-height: calc(100vh - 65px);
            padding: 24px 16px 36px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          candidate-sidebar,
          candidate-nav-link {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

function getPageTitle(pathname: string) {
  const titles: Record<string, string> = {
    "/candidate/dashboard": "Dashboard",
    "/candidate/applications": "My Applications",
    "/candidate/saved-jobs": "Saved Jobs",
    "/candidate/assessments": "Assessments",
    "/candidate/interviews": "Interviews",
    "/candidate/profile": "My Profile",
  };

  return titles[pathname] ?? "Candidate Workspace";
}
