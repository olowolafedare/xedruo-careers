import Link from "next/link";

const highlights = [
  {
    title: "Discover opportunities",
    description:
      "Explore roles that match your skills, experience, and career ambitions.",
    icon: "01",
  },
  {
    title: "Showcase your talent",
    description:
      "Build your professional profile and give employers a clearer picture of what you bring.",
    icon: "02",
  },
  {
    title: "Hire with confidence",
    description:
      "Help your organisation connect with qualified candidates and manage applications.",
    icon: "03",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="text-2xl font-extrabold tracking-tight">
           Careers <span className="text-blue-600"></span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex"
            >
              Browse jobs
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Applicant portal
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-32">
          <div>
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-blue-200">
              Your next opportunity starts here
            </span>

            <h1 className="mt-7 max-w-2xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Your talent.
              <br />
              Your future.
              <br />
              <span className="text-blue-400">Your next move.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Discover opportunities, connect with employers, and take the
              next step in your career with Xedruo Careers.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/jobs"
                className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-500"
              >
                Explore opportunities →
              </Link>
              <Link
                href="/recruiter"
                className="rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
               I'm hiring
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Built to bring talent and opportunity closer together.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-sm text-slate-400">Career discovery</p>
                <h2 className="mt-1 text-xl font-bold">
                  Make your next move count
                </h2>
              </div>
              <span className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-bold text-blue-300">
                X
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-sm text-blue-300">01 / Explore</p>
                <h3 className="mt-2 font-semibold">Find your next role</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Explore job listings and identify opportunities worth
                  pursuing.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-sm text-blue-300">02 / Connect</p>
                <h3 className="mt-2 font-semibold">
                  Put your experience forward
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Present your skills and make your application count.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-sm text-blue-300">03 / Progress</p>
                <h3 className="mt-2 font-semibold">Move your career forward</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Keep track of your journey as you pursue your next
                  opportunity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            One platform, more possibilities
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            A better starting point for your next chapter.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Whether you are building your career or growing a team, Xedruo
            Careers brings the essential steps into one place.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.icon}
              className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                {item.icon}
              </span>
              <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-blue-50 p-8 sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">
              Ready to take the next step?
            </h2>
            <p className="mt-2 leading-7 text-slate-600">
              Start exploring opportunities or prepare to build your team.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white hover:bg-blue-700"
          >
            Browse opportunities →
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© 2026 Xedruo Careers</p>
          <p>Connecting talent with opportunity.</p>
        </div>
      </footer>
    </main>
  );
}
