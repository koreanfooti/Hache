export function NordbordKpi({ label, tone = "neutral", value }: { label: string; tone?: string; value: string }) {
  return (
    <article className={`nordbord-kpi-card is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
