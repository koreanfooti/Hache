"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AmsDashboard from "@/components/ams/AmsDashboard";
import { useAuth } from "@/components/ams/auth/AuthProvider";

export function ProtectedAmsApp() {
  const router = useRouter();
  const { status, user, signOut } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [router, status]);

  if (status === "loading" || !user) {
    return (
      <main className="route-fallback">
        <section className="route-fallback-panel">
          <span className="section-kicker">Real AMS</span>
          <h1>Checking access</h1>
          <p>Verifying your session and loading your staff workspace.</p>
          <div className="route-loading-bar" aria-hidden="true">
            <span />
          </div>
        </section>
      </main>
    );
  }

  return <AmsDashboard authUser={user} onSignOut={signOut} />;
}
