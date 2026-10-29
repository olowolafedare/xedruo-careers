import { Suspense } from "react";
import AccountForm from "./AccountForm";

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-rosybrown">
          Loading account details…
        </main>
      }
    >
      <AccountForm />
    </Suspense>
  );
}
