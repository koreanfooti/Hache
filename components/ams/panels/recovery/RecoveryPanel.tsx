import { compactNumber, numberValue } from "@/lib/ams/data";
import type { RehabServiceRow } from "@/lib/ams/types";
import type { DataPanelCopy } from "@/components/ams/panels/panelTypes";
import {
  DataList,
  MetricCard,
  PanelIntro,
  type AmsLanguage,
} from "@/components/ams/ui/AmsUi";

export function RecoveryPanel({
  copy,
  language,
  rehabServices,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  rehabServices: RehabServiceRow[];
}) {
  const activeRows = rehabServices.filter((row) => !row.isOffDay);
  const totalServices = activeRows.reduce((total, row) => total + numberValue(row.count), 0);
  const serviceTypes = new Set(activeRows.map((row) => row.serviceName).filter(Boolean)).size;
  const latestRows = [...activeRows]
    .sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso)))
    .slice(0, 8);
  const topService = topBySummedCount(activeRows, (row) => row.serviceName);

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.recovery.kicker}
        title={copy.recovery.title}
        copy={copy.recovery.copy}
      />
      <section className="metric-grid">
        <MetricCard label={language === "es" ? "Registros" : "Records"} value={compactNumber(rehabServices.length)} detail={language === "es" ? "Filas limpias de servicios" : "Clean service rows"} />
        <MetricCard label={language === "es" ? "Total servicios" : "Total services"} value={compactNumber(totalServices)} detail={language === "es" ? "Suma de conteos diarios" : "Sum of daily counts"} />
        <MetricCard label={language === "es" ? "Tipos de servicio" : "Service types"} value={compactNumber(serviceTypes)} detail={language === "es" ? "Categorías activas" : "Active categories"} />
        <MetricCard label={language === "es" ? "Servicio principal" : "Top service"} value={topService || copy.common.noData} detail={language === "es" ? "Por volumen total" : "By total volume"} />
      </section>
      <DataList
        emptyLabel={copy.common.noRecords}
        language={language}
        title={language === "es" ? "Servicios recientes" : "Recent Recovery Services"}
        subtitle={language === "es" ? "Últimas filas limpias de rehabilitación" : "Latest cleaned rehab-service rows"}
        rows={latestRows.map((row) => [
          row.serviceName || copy.common.unclassified,
          row.dateIso || copy.common.noDate,
          compactNumber(numberValue(row.count)),
          row.source || "cleaned-source",
        ])}
      />
    </div>
  );
}

function topBySummedCount<T>(rows: T[], labelForRow: (row: T) => string | undefined) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const label = String(labelForRow(row) ?? "").trim();
    if (!label) return;
    totals.set(label, (totals.get(label) ?? 0) + numberValue((row as { count?: unknown }).count));
  });

  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}
