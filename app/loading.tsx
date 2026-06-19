export default function Loading() {
  return (
    <main className="route-fallback">
      <section className="route-fallback-panel">
        <span className="section-kicker">Real AMS</span>
        <h1>Loading workspace</h1>
        <p>Preparing the dashboard, source registry, and athlete context.</p>
        <div className="route-loading-bar" aria-hidden="true">
          <span />
        </div>
      </section>
    </main>
  );
}
