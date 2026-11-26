"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

const WORKSPACE_API_PATH = "/api/v1/recruiter/workspace";

type WorkspaceApiResponse = {
  hasWorkspace?: boolean;
  error?: string;
};

async function readWorkspaceResponse(
  response: Response,
  stage: "workspace lookup" | "workspace creation",
): Promise<WorkspaceApiResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("json")) {
    console.error("Recruiter onboarding received a non-JSON API response", {
      stage,
      path: WORKSPACE_API_PATH,
      status: response.status,
      contentType: contentType.slice(0, 100) || null,
    });
    throw new Error("The server returned an unexpected response. Please try again");
  }

  try {
    return (await response.json()) as WorkspaceApiResponse;
  } catch {
    console.error("Recruiter onboarding received invalid JSON from its API", {
      stage,
      path: WORKSPACE_API_PATH,
      status: response.status,
      contentType: contentType.slice(0, 100),
    });
    throw new Error("The server returned an invalid response. Please try again");
  }
}

export default function RecruiterOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    let active = true;

    async function checkWorkspace() {
      try {
        const response = await fetch(WORKSPACE_API_PATH, {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!active) return;

        if (response.status === 401) {
          router.replace("/account?next=%2Frecruiter");
          return;
        }

        const payload = await readWorkspaceResponse(response, "workspace lookup");

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not check your recruiter workspace.");
        }

        if (payload.hasWorkspace) {
          router.replace("/recruiter/dashboard");
          return;
        }
      } catch (cause) {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not check your recruiter workspace.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void checkWorkspace();

    return () => {
      active = false;
    };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !businessEmail.trim() || !contactPhone.trim()) {
      setError("Company name, business email, and contact phone are required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(WORKSPACE_API_PATH, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          businessEmail: businessEmail.trim(),
          contactPhone: contactPhone.trim(),
          website: website.trim(),
          description: description.trim(),
        }),
      });

      if (response.status === 401) {
        router.replace("/account?next=%2Frecruiter");
        return;
      }

      const payload = await readWorkspaceResponse(response, "workspace creation");

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not create your recruiter workspace.");
      }

      router.push("/recruiter/dashboard");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not create your recruiter workspace.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAFF]">
        <p className="text-sm font-semibold text-[#64748B]">Loading your workspace…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F2F6FE] via-[#F8FAFF] to-[#EDF3FC] px-5 py-12 text-[#0B1B3D]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#1746D1] text-base font-black text-white">x</span>
            <span className="text-lg font-black tracking-tight text-[#0B1B3D]">
              xedruo <span className="font-semibold text-[#1746D1]">career</span>
            </span>
          </Link>
          <Link href="/start" className="text-xs font-bold text-[#64748B] hover:text-[#1746D1]">
            ← Choose another path
          </Link>
        </div>

        <div className="mt-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#1746D1]">
            <Building2 size={24} />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#1746D1]">
            EMPLOYER ONBOARDING
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D] sm:text-4xl">
            Set up your hiring workspace
          </h1>
          <p className="mt-1.5 text-sm text-[#64748B]">
            Provide your company details to begin recruiting and posting roles on Xedruo Career.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-8 space-y-5 rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8"
        >
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
            Organization or company name *
            <input
              required
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
            Website
            <input
              type="url"
              maxLength={300}
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
            About the organization
            <textarea
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
            Business email *
            <input
              required
              type="email"
              maxLength={254}
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
            Business contact phone *
            <input
              required
              type="tel"
              maxLength={30}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={saving}
            className="w-full rounded-2xl bg-[#1746D1] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition duration-200 hover:bg-[#1237a8] active:scale-[0.99] disabled:opacity-60"
          >
            {saving ? "Setting up…" : "Create workspace and continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
