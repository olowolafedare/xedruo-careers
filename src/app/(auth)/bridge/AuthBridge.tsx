"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route: platform URL-token handoffs are disabled. Xedruo Career owns its sign-in. */
export default function AuthBridge() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account");
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-[#F2F6FE] via-[#F8FAFF] to-[#EDF3FC] px-5">
      <section className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center shadow-xs">
        <h1 className="text-2xl font-bold text-[#0B1B3D]">Xedruo Career sign in</h1>
        <p className="mt-3 text-sm text-[#64748B]">Opening Xedruo Career’s own sign-in page…</p>
      </section>
    </main>
  );
}
