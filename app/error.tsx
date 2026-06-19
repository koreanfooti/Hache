"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="route-fallback">
      <section className="route-fallback-panel">
        <span className="section-kicker">Real AMS</span>
        <h1>Could not load this view</h1>
        <p>
          The dashboard hit an unexpected error. Try reloading the view, then check the health endpoint if it persists.
        </p>
        <code>{error.digest ? `Digest: ${error.digest}` : error.message || "Unknown application error"}</code>
        <div className="route-fallback-actions">
          <button className="primary-button" type="button" onClick={reset}>
            Try again
          </button>
          <a className="secondary-button" href="/api/health">
            Health
          </a>
        </div>
      </section>
    </main>
  );
}
