import { Suspense } from "react";
import AccountForm from "./AccountForm";

export default function AccountPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-slate-50">Loading account details…</main>}>
      <AccountForm />
    </Suspense>
  );
}
