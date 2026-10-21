
import Link from "next/link";

const stats = [
  {
    label: "Total applications",
    value: "12",
    note: "Across all opportunities",
    icon: "↗",
    tone: "purple",
  },
  {
    label: "In review",
    value: "05",
    note: "Being reviewed by employers",
    icon: "◷",
    tone: "blue",
  },
  {
    label: "Interviews",
    value: "03",
    note: "Your next career conversations",
    icon: "▦",
    tone: "orange",
  },
  {
    label: "Assessments",
    value: "02",
    note: "Awaiting your attention",
    icon: "✓",
    tone: "green",
  },
];

const applications = [
  {
    company: "Nexa Technologies",
    initials: "N",
    role: "Frontend Developer",
    type: "Full-time",
    date: "Oct 20, 2026",
    status: "Under review",
    tone: "review",
  },
  {
    company: "Vertex Digital",
    initials: "V",
    role: "Full Stack Engineer",
    type: "Remote",
    date: "Oct 18, 2026",
    status: "Shortlisted",
    tone: "shortlisted",
  },
  {
    company: "Cloudline Systems",
    initials: "C",
    role: "Backend Developer",
    type: "Full-time",
    date: "Oct 16, 2026",
    status: "Submitted",
    tone: "submitted",
  },
  {
    company: "Orbit Labs",
    initials: "O",
    role: "Software Engineer",
    type: "Hybrid",
    date: "Oct 14, 2026",
    status: "Not selected",
    tone: "rejected",
  },
];

const activities = [
  {
    icon: "✓",
    title: "Complete your profile",
    description: "Add your skills and work experience.",
    action: "Update profile",
    href: "/candidate/profile",
    tone: "purple",
  },
  {
    icon: "▤",
    title: "Explore more opportunities",
    description: "Discover roles that match your goals.",
    action: "View saved jobs",
    href: "/candidate/saved-jobs",
    tone: "blue",
  },
  {
    icon: "◷",
    title: "Check your assessments",
    description: "Review your outstanding assessments.",
    action: "View assessments",
    href: "/candidate/assessments",
    tone: "orange",
  },
];

export default function CandidateDashboard() {
  return (
    <div className="hd-dashboard">
      <section className="hd-welcome">
        <div className="hd-welcome-copy">
          <div className="hd-eyebrow">
            <span className="hd-eyebrow-dot" />
            YOUR CAREER JOURNEY
          </div>

          <h1>Every opportunity starts with a step.</h1>

          <p>
            Welcome to your workspace. Keep track of your applications,
            prepare for what's next, and move your career forward.
          </p>

          <div className="hd-welcome-actions">
            <Link href="/candidate/saved-jobs" className="hd-primary-button">
              Explore opportunities <span>↗</span>
            </Link>

            <Link href="/candidate/profile" className="hd-text-button">
              Complete your profile <span>→</span>
            </Link>
          </div>
        </div>

        <div className="hd-welcome-art" aria-hidden="true">
          <div className="hd-art-orbit hd-art-orbit-one" />
          <div className="hd-art-orbit hd-art-orbit-two" />

          <div className="hd-art-card">
            <div className="hd-art-card-top">
              <span className="hd-art-logo">H</span>
              <span className="hd-art-pill">YOUR NEXT CHAPTER</span>
            </div>

            <div className="hd-art-heading">
              <span>Build.</span>
              <span className="hd-art-highlight">Grow.</span>
              <span>Become.</span>
            </div>

            <div className="hd-art-divider" />

            <div className="hd-art-footer">
              <span>One step at a time.</span>
              <span className="hd-art-arrow">↗</span>
            </div>
          </div>

          <div className="hd-art-floating hd-art-floating-top">
            <span className="hd-floating-check">✓</span>
            <span>Keep moving forward</span>
          </div>

          <div className="hd-art-floating hd-art-floating-bottom">
            <span className="hd-floating-star">✳</span>
            <span>Made for your next move</span>
          </div>
        </div>
      </section>

      <section className="hd-stats-section">
        <div className="hd-section-heading">
          <div>
            <h2>Your overview</h2>
            <p>A snapshot of your recruitment journey.</p>
          </div>

          <span className="hd-updated-label">
            <span /> Workspace overview
          </span>
        </div>

        <div className="hd-stats-grid">
          {stats.map((stat) => (
            <article className="hd-stat-card" key={stat.label}>
              <div className="hd-stat-top">
                <span className="hd-stat-label">{stat.label}</span>
                <span className={`hd-stat-icon ${stat.tone}`}>
                  {stat.icon}
                </span>
              </div>

              <div className="hd-stat-value">{stat.value}</div>
              <p className="hd-stat-note">{stat.note}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="hd-content-grid">
        <section className="hd-panel hd-applications-panel">
          <div className="hd-panel-heading">
            <div>
              <h2>Recent applications</h2>
              <p>Keep an eye on where things stand.</p>
            </div>

            <Link
              href="/candidate/applications"
              className="hd-view-all"
            >
              View all <span>→</span>
            </Link>
          </div>

          <div className="hd-table-wrap">
            <table className="hd-applications-table">
              <thead>
                <tr>
                  <th>POSITION</th>
                  <th>DATE APPLIED</th>
                  <th>STATUS</th>
                  <th aria-label="Details" />
                </tr>
              </thead>

              <tbody>
                {applications.map((application) => (
                  <tr key={application.company}>
                    <td>
                      <div className="hd-position">
                        <div
                          className={`hd-company-logo logo-${application.initials.toLowerCase()}`}
                        >
                          {application.initials}
                        </div>

                        <div className="hd-position-copy">
                          <strong>{application.role}</strong>
                          <span>
                            {application.company} <i>·</i>{" "}
                            {application.type}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="hd-date-cell">{application.date}</td>

                    <td>
                      <span
                        className={`hd-status status-${application.tone}`}
                      >
                        <span />
                        {application.status}
                      </span>
                    </td>

                    <td>
                      <Link
                        href="/candidate/applications"
                        className="hd-row-action"
                        aria-label={`View ${application.role} application`}
                      >
                        →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Link
            href="/candidate/applications"
            className="hd-mobile-view-all"
          >
            View all applications →
          </Link>
        </section>

        <section className="hd-panel hd-journey-panel">
          <div className="hd-panel-heading">
            <div>
              <h2>Your next steps</h2>
              <p>Make your next move count.</p>
            </div>

            <span className="hd-steps-count">03</span>
          </div>

          <div className="hd-journey-list">
            {activities.map((activity, index) => (
              <article className="hd-journey-item" key={activity.title}>
                <div className={`hd-journey-icon ${activity.tone}`}>
                  {activity.icon}
                </div>

                <div className="hd-journey-copy">
                  <span className="hd-journey-number">
                    STEP 0{index + 1}
                  </span>
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>

                  <Link href={activity.href}>
                    {activity.action} <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="hd-bottom-banner">
        <div className="hd-bottom-icon">✳</div>

        <div className="hd-bottom-copy">
          <h2>Your next opportunity could be closer than you think.</h2>
          <p>
            Stay prepared, keep learning, and let your next move count.
          </p>
        </div>

        <Link href="/candidate/profile" className="hd-bottom-button">
          Review my profile <span>→</span>
        </Link>
      </section>

      <p className="hd-dashboard-footnote">
        HIREUO <span>·</span> Your career journey, all in one place.
      </p>

      <style jsx global>{`
        .hd-dashboard {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          color: #172033;
        }

        .hd-dashboard * {
          box-sizing: border-box;
        }

        .hd-welcome {
          position: relative;
          display: flex;
          min-height: 300px;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          overflow: hidden;
          padding: 36px 39px;
          border: 1px solid #e7e4ff;
          border-radius: 17px;
          background:
            radial-gradient(
              ellipse at 85% 10%,
              #dcd5ff 0,
              transparent 43%
            ),
            linear-gradient(115deg, #ffffff 10%, #f6f4ff 100%);
        }

        .hd-welcome-copy {
          position: relative;
          z-index: 2;
          width: 58%;
          max-width: 590px;
        }

        .hd-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #7767d9;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .hd-eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #8573f0;
        }

        .hd-welcome h1 {
          max-width: 510px;
          margin: 19px 0 12px;
          color: #1b2236;
          font-size: clamp(27px, 3vw, 39px);
          font-weight: 750;
          letter-spacing: -1.6px;
          line-height: 1.15;
        }

        .hd-welcome-copy > p {
          max-width: 460px;
          margin: 0;
          color: #747d91;
          font-size: 13px;
          line-height: 1.9;
        }

        .hd-welcome-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 20px;
          margin-top: 24px;
        }

        .hd-primary-button,
        .hd-bottom-button {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 0 17px;
          border: 1px solid #7462df;
          border-radius: 8px;
          background: #7665e8;
          box-shadow: 0 5px 12px #7665e81c;
          color: #fff;
          font-size: 12px;
          font-weight: 650;
          text-decoration: none;
          transition:
            background 150ms ease,
            transform 150ms ease;
        }

        .hd-primary-button:hover,
        .hd-bottom-button:hover {
          transform: translateY(-1px);
          background: #6251d0;
        }

        .hd-primary-button span,
        .hd-bottom-button span {
          font-size: 16px;
        }

        .hd-text-button {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #6556c5;
          font-size: 12px;
          font-weight: 650;
          text-decoration: none;
        }

        .hd-text-button:hover,
        .hd-view-all:hover {
          color: #4533b1;
        }

        .hd-welcome-art {
          position: relative;
          display: flex;
          width: 37%;
          min-width: 225px;
          max-width: 330px;
          min-height: 235px;
          align-items: center;
          justify-content: center;
        }

        .hd-art-orbit {
          position: absolute;
          width: 245px;
          height: 245px;
          border: 1px solid #bcb1ff70;
          border-radius: 50%;
        }

        .hd-art-orbit-two {
          width: 195px;
          height: 195px;
          border-color: #bcb1ff90;
        }

        .hd-art-card {
          position: relative;
          z-index: 1;
          width: 210px;
          padding: 19px;
          border: 1px solid #ffffff;
          border-radius: 12px;
          background: #ffffffed;
          box-shadow: 0 18px 48px #40328d1a;
          transform: rotate(-4deg);
        }

        .hd-art-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .hd-art-logo {
          display: grid;
          width: 27px;
          height: 27px;
          place-items: center;
          border-radius: 8px;
          background: #7665e8;
          color: #fff;
          font-size: 16px;
          font-weight: 800;
        }

        .hd-art-pill {
          padding: 5px 6px;
          border-radius: 5px;
          background: #f0edff;
          color: #7665d7;
          font-size: 6px;
          font-weight: 800;
          letter-spacing: 0.6px;
        }

        .hd-art-heading {
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin-top: 20px;
          color: #20243a;
          font-size: 29px;
          font-weight: 800;
          letter-spacing: -1.4px;
          line-height: 1.06;
        }

        .hd-art-highlight {
          color: #7968e8;
        }

        .hd-art-divider {
          height: 1px;
          margin: 16px 0 10px;
          background: #ebe9f4;
        }

        .hd-art-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #7b8295;
          font-size: 8px;
        }

        .hd-art-arrow {
          color: #7968e8;
          font-size: 17px;
        }

        .hd-art-floating {
          position: absolute;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border: 1px solid #ebe8ff;
          border-radius: 9px;
          background: #fff;
          box-shadow: 0 7px 22px #40328d12;
          color: #4c5569;
          font-size: 9px;
          font-weight: 650;
          white-space: nowrap;
        }

        .hd-art-floating-top {
          top: 22px;
          right: -2px;
        }

        .hd-art-floating-bottom {
          bottom: 19px;
          left: -12px;
        }

        .hd-floating-check,
        .hd-floating-star {
          display: grid;
          width: 20px;
          height: 20px;
          place-items: center;
          border-radius: 6px;
          background: #e6f8ef;
          color: #209a67;
          font-size: 12px;
        }

        .hd-floating-star {
          background: #f0edff;
          color: #7968e8;
        }

        .hd-stats-section {
          margin-top: 33px;
        }

        .hd-section-heading,
        .hd-panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .hd-section-heading h2,
        .hd-panel-heading h2 {
          margin: 0;
          color: #20283a;
          font-size: 16px;
          font-weight: 750;
          letter-spacing: -0.35px;
        }

        .hd-section-heading p,
        .hd-panel-heading p {
          margin: 6px 0 0;
          color: #858da0;
          font-size: 11px;
          line-height: 1.6;
        }

        .hd-updated-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #838b9d;
          font-size: 10px;
        }

        .hd-updated-label span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7665e8;
        }

        .hd-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-top: 17px;
        }

        .hd-stat-card {
          min-width: 0;
          padding: 19px;
          border: 1px solid #e9ebf2;
          border-radius: 12px;
          background: #fff;
          transition:
            border-color 150ms ease,
            transform 150ms ease;
        }

        .hd-stat-card:hover {
          transform: translateY(-2px);
          border-color: #d9d3ff;
        }

        .hd-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 7px;
        }

        .hd-stat-label {
          color: #6d768a;
          font-size: 11px;
          font-weight: 600;
        }

        .hd-stat-icon {
          display: grid;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 10px;
          font-size: 18px;
          font-weight: 700;
        }

        .hd-stat-icon.purple {
          background: #f0edff;
          color: #7665e8;
        }

        .hd-stat-icon.blue {
          background: #eaf3ff;
          color: #4885e6;
        }

        .hd-stat-icon.orange {
          background: #fff2e6;
          color: #e99447;
        }

        .hd-stat-icon.green {
          background: #e8f8ef;
          color: #2aab72;
        }

        .hd-stat-value {
          margin-top: 17px;
          color: #1d2639;
          font-size: 31px;
          font-weight: 750;
          letter-spacing: -1px;
          line-height: 1;
        }

        .hd-stat-note {
          margin: 9px 0 0;
          color: #949bad;
          font-size: 10px;
          line-height: 1.5;
        }

        .hd-content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(250px, 0.95fr);
          align-items: start;
          gap: 17px;
          margin-top: 29px;
        }

        .hd-panel {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #e9ebf2;
          border-radius: 13px;
          background: #fff;
        }

        .hd-panel-heading {
          min-height: 86px;
          padding: 18px 20px;
        }

        .hd-view-all {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 7px;
          color: #7463dc;
          font-size: 11px;
          font-weight: 650;
          text-decoration: none;
        }

        .hd-view-all span {
          font-size: 16px;
        }

        .hd-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .hd-applications-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .hd-applications-table thead {
          background: #fafbfe;
        }

        .hd-applications-table th {
          padding: 12px 14px;
          border-top: 1px solid #f0f1f6;
          border-bottom: 1px solid #f0f1f6;
          color: #9299aa;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 0.8px;
          white-space: nowrap;
        }

        .hd-applications-table th:first-child,
        .hd-applications-table td:first-child {
          padding-left: 20px;
        }

        .hd-applications-table th:last-child,
        .hd-applications-table td:last-child {
          padding-right: 15px;
        }

        .hd-applications-table td {
          padding: 15px 14px;
          border-bottom: 1px solid #f0f1f6;
          color: #6f788b;
          font-size: 10px;
          white-space: nowrap;
        }

        .hd-applications-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .hd-position {
          display: flex;
          min-width: 190px;
          align-items: center;
          gap: 11px;
        }

        .hd-company-logo {
          display: grid;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #ececf4;
          border-radius: 10px;
          background: #f7f5ff;
          color: #7968dc;
          font-size: 15px;
          font-weight: 800;
        }

        .logo-v {
          background: #eaf4ff;
          color: #4284cf;
        }

        .logo-c {
          background: #e8f7f1;
          color: #299b7c;
        }

        .logo-o {
          background: #fff2e7;
          color: #d98a48;
        }

        .hd-position-copy {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 5px;
        }

        .hd-position-copy strong {
          color: #30394c;
          font-size: 11px;
          font-weight: 700;
        }

        .hd-position-copy span {
          color: #8b93a4;
          font-size: 9px;
        }

        .hd-position-copy i {
          padding: 0 2px;
          color: #b8bdca;
          font-style: normal;
        }

        .hd-date-cell {
          font-size: 10px !important;
        }

        .hd-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 650;
        }

        .hd-status > span {
          width: 5px;
          height: 5px;
          flex-shrink: 0;
          border-radius: 50%;
          background: currentColor;
        }

        .status-review {
          background: #fff4df;
          color: #b17b20;
        }

        .status-shortlisted {
          background: #e6f7ef;
          color: #20845c;
        }

        .status-submitted {
          background: #edf2ff;
          color: #5773cf;
        }

        .status-rejected {
          background: #fff0f0;
          color: #c25b63;
        }

        .hd-row-action {
          display: grid;
          width: 27px;
          height: 27px;
          place-items: center;
          border: 1px solid #e9ebf2;
          border-radius: 7px;
          color: #6c7590;
          font-size: 16px;
          text-decoration: none;
        }

        .hd-row-action:hover {
          border-color: #d8d1ff;
          color: #7665e8;
        }

        .hd-mobile-view-all {
          display: none;
        }

        .hd-steps-count {
          display: grid;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 9px;
          background: #f0edff;
          color: #7463dc;
          font-size: 11px;
          font-weight: 750;
        }

        .hd-journey-list {
          padding: 0 20px 10px;
        }

        .hd-journey-item {
          display: flex;
          gap: 13px;
          padding: 16px 0;
          border-top: 1px solid #eff0f5;
        }

        .hd-journey-icon {
          display: grid;
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 10px;
          font-size: 17px;
          font-weight: 700;
        }

        .hd-journey-icon.purple {
          background: #f0edff;
          color: #7665e8;
        }

        .hd-journey-icon.blue {
          background: #eaf3ff;
          color: #4885e6;
        }

        .hd-journey-icon.orange {
          background: #fff2e6;
          color: #e99447;
        }

        .hd-journey-copy {
          min-width: 0;
          flex: 1;
        }

        .hd-journey-number {
          color: #989fb0;
          font-size: 8px;
          font-weight: 750;
          letter-spacing: 1px;
        }

        .hd-journey-copy h3 {
          margin: 6px 0;
          color: #31394c;
          font-size: 11px;
          font-weight: 750;
        }

        .hd-journey-copy p {
          margin: 0;
          color: #858da0;
          font-size: 10px;
          line-height: 1.6;
        }

        .hd-journey-copy a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          color: #7665e8;
          font-size: 10px;
          font-weight: 700;
          text-decoration: none;
        }

        .hd-bottom-banner {
          display: flex;
          align-items: center;
          gap: 17px;
          margin-top: 24px;
          padding: 22px 25px;
          border: 1px solid #e9e5ff;
          border-radius: 12px;
          background: linear-gradient(100deg, #f0edff, #faf9ff);
        }

        .hd-bottom-icon {
          display: grid;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #e1dbff;
          border-radius: 12px;
          background: #fff;
          color: #7968e8;
          font-size: 22px;
        }

        .hd-bottom-copy {
          min-width: 0;
          flex: 1;
        }

        .hd-bottom-copy h2 {
          margin: 0;
          color: #2d294b;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.6;
        }

        .hd-bottom-copy p {
          margin: 4px 0 0;
          color: #79758f;
          font-size: 10px;
          line-height: 1.7;
        }

        .hd-bottom-button {
          min-height: 39px;
          flex-shrink: 0;
          padding: 0 13px;
          font-size: 10px;
        }

        .hd-dashboard-footnote {
          margin: 22px 0 0;
          color: #9ba2b1;
          font-size: 10px;
          text-align: center;
        }

        .hd-dashboard-footnote span {
          padding: 0 5px;
          color: #c3baf9;
        }

        @media (min-width: 1500px) {
          .hd-welcome {
            padding-right: 55px;
            padding-left: 45px;
          }

          .hd-stat-card {
            padding: 22px;
          }
        }

        @media (max-width: 1250px) {
          .hd-welcome {
            padding: 30px;
          }

          .hd-welcome-art {
            width: 34%;
            min-width: 205px;
          }

          .hd-stats-grid {
            gap: 11px;
          }

          .hd-stat-card {
            padding: 15px;
          }

          .hd-content-grid {
            grid-template-columns: minmax(0, 1.5fr) minmax(240px, 0.9fr);
            gap: 12px;
          }

          .hd-applications-table th,
          .hd-applications-table td {
            padding-right: 9px;
            padding-left: 9px;
          }

          .hd-applications-table th:first-child,
          .hd-applications-table td:first-child {
            padding-left: 13px;
          }

          .hd-status {
            padding: 5px 6px;
            font-size: 8px;
          }
        }

        @media (max-width: 950px) {
          .hd-welcome-art {
            display: none;
          }

          .hd-welcome-copy {
            width: 100%;
            max-width: 650px;
          }

          .hd-content-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .hd-journey-list {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 15px;
          }

          .hd-journey-item {
            align-items: flex-start;
            border-top: 1px solid #eff0f5;
          }
        }

        @media (max-width: 650px) {
          .hd-welcome {
            min-height: auto;
            padding: 27px 21px;
            border-radius: 13px;
          }

          .hd-welcome h1 {
            margin-top: 17px;
            font-size: 30px;
            letter-spacing: -1.1px;
          }

          .hd-welcome-copy > p {
            font-size: 12px;
          }

          .hd-welcome-actions {
            align-items: flex-start;
            flex-direction: column;
            gap: 17px;
          }

          .hd-primary-button {
            min-height: 43px;
          }

          .hd-stats-section {
            margin-top: 27px;
          }

          .hd-section-heading h2,
          .hd-panel-heading h2 {
            font-size: 15px;
          }

          .hd-updated-label {
            display: none;
          }

          .hd-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .hd-stat-card {
            padding: 14px;
          }

          .hd-stat-label {
            font-size: 10px;
          }

          .hd-stat-icon {
            width: 30px;
            height: 30px;
          }

          .hd-stat-value {
            margin-top: 15px;
            font-size: 28px;
          }

          .hd-stat-note {
            min-height: 27px;
            font-size: 9px;
          }

          .hd-content-grid {
            margin-top: 24px;
          }

          .hd-panel-heading {
            min-height: 77px;
            padding: 16px;
          }

          .hd-applications-table {
            min-width: 630px;
          }

          .hd-mobile-view-all {
            display: flex;
            justify-content: center;
            padding: 15px;
            border-top: 1px solid #eff0f5;
            color: #7665e8;
            font-size: 11px;
            font-weight: 700;
            text-decoration: none;
          }

          .hd-journey-list {
            grid-template-columns: minmax(0, 1fr);
            gap: 0;
            padding: 0 16px 9px;
          }

          .hd-journey-item {
            padding: 16px 0;
          }

          .hd-bottom-banner {
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 13px;
            margin-top: 19px;
            padding: 18px;
          }

          .hd-bottom-icon {
            width: 37px;
            height: 37px;
          }

          .hd-bottom-copy {
            flex-basis: calc(100% - 55px);
          }

          .hd-bottom-copy h2 {
            font-size: 12px;
          }

          .hd-bottom-button {
            margin-left: 50px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hd-stat-card,
          .hd-primary-button,
          .hd-bottom-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
