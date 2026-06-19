import Link from "next/link";

export default function NotFound() {
  return (
    <main className="route-fallback">
      <section className="route-fallback-panel">
        <span className="section-kicker">Hache AMS</span>
        <h1>Page not found</h1>
        <p>The route you opened is not part of the athlete monitoring workspace.</p>
        <div className="route-fallback-actions">
          <Link className="primary-button" href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
