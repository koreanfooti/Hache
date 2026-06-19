import Image from "next/image";

export type AmsLanguage = "en" | "es";

export function localizedValue(value: string | number | undefined, language: AmsLanguage) {
  const text = String(value ?? "");
  if (language === "en") return text;
  return text
    .replaceAll("Pending API", "API pendiente")
    .replaceAll("Pending", "Pendiente")
    .replaceAll("Left Foot", "Pie izquierdo")
    .replaceAll("Right Foot", "Pie derecho")
    .replaceAll("Goalkeeper", "Portero")
    .replaceAll("Defender", "Defensa")
    .replaceAll("Midfielder", "Mediocampista")
    .replaceAll("Forward", "Delantero")
    .replaceAll("Unassigned", "Sin asignar")
    .replaceAll("Brazilian", "Brasileño")
    .replaceAll("Argentine", "Argentino")
    .replaceAll("Mexico", "México")
    .replaceAll("Spain", "España")
    .replaceAll("Pending source", "Fuente pendiente");
}

export function QuickCard({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" className="quick-card welcome-card" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

export function DataList({
  title,
  subtitle,
  emptyLabel,
  language,
  rows,
}: {
  title: string;
  subtitle: string;
  emptyLabel: string;
  language: AmsLanguage;
  rows: string[][];
}) {
  return (
    <section className="data-list">
      <div className="panel-heading">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div>
        {rows.length ? (
          rows.map((row, index) => (
            <article key={`${row.join("-")}-${index}`}>
              {row.map((cell, cellIndex) => (
                <span key={`${cell}-${cellIndex}`}>{localizedValue(cell, language)}</span>
              ))}
            </article>
          ))
        ) : (
          <article>
            <span>{emptyLabel}</span>
          </article>
        )}
      </div>
    </section>
  );
}

export function PanelIntro({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <section className="panel-intro">
      <span className="section-kicker">{kicker}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </section>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function TestingCard({ image, title, copy }: { image: string; title: string; copy: string }) {
  return (
    <article className="testing-card">
      <Image src={image} alt="" width={72} height={72} />
      <strong>{title}</strong>
      <p>{copy}</p>
    </article>
  );
}
