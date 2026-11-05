"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route: platform URL-token handoffs are disabled. HIREUO owns its sign-in. */
export default function AuthBridge() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account");
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-rosybrown px-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">HIREUO sign in</h1>
        <p className="mt-3 text-sm text-slate-600">Opening HIREUO’s own sign-in page…</p>
      </section>
    </main>
  );
}
