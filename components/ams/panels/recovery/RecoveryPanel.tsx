import { compactNumber, numberValue } from "@/lib/ams/data";
import type { RehabServiceRow } from "@/lib/ams/types";
import type { DataPanelCopy } from "@/components/ams/panels/panelTypes";
import {
  DataList,
  MetricCard,
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
  const sourceUrl = activeRows.find((row) => row.sourceUrl)?.sourceUrl ?? rehabServices.find((row) => row.sourceUrl)?.sourceUrl;
  const dateRange = getDateRange(activeRows);
  const toolSummary = summarizeByService(activeRows);
  const monthSummary = summarizeByPeriod(activeRows, monthKeyForRow);
  const weekSummary = summarizeByPeriod(activeRows, weekKeyForRow);
  const latestRows = [...activeRows]
    .sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso)))
    .slice(0, 8);
  const topService = topBySummedCount(activeRows, (row) => row.serviceName);

  return (
    <div className="panel-stack">
      <section className="panel-intro recovery-intro">
        <div>
          <span className="section-kicker">{copy.recovery.kicker}</span>
          <h2>{copy.recovery.title}</h2>
          <p>{copy.recovery.copy}</p>
        </div>
        {sourceUrl ? (
          <a className="source-open-button" href={sourceUrl} target="_blank" rel="noopener noreferrer">
            {language === "es" ? "Abrir fuente" : "Open Source"}
          </a>
        ) : null}
      </section>
      <section className="metric-grid">
        <MetricCard label={language === "es" ? "Registros" : "Records"} value={compactNumber(rehabServices.length)} detail={language === "es" ? "Filas limpias de servicios" : "Clean service rows"} />
        <MetricCard label={language === "es" ? "Total servicios" : "Total services"} value={compactNumber(totalServices)} detail={language === "es" ? "Suma de conteos diarios" : "Sum of daily counts"} />
        <MetricCard label={language === "es" ? "Tipos de servicio" : "Service types"} value={compactNumber(serviceTypes)} detail={language === "es" ? "Categorías activas" : "Active categories"} />
        <MetricCard label={language === "es" ? "Servicio principal" : "Top service"} value={topService || copy.common.noData} detail={language === "es" ? "Por volumen total" : "By total volume"} />
        <MetricCard label={language === "es" ? "Rango de fechas" : "Date range"} value={dateRange.display} detail={language === "es" ? "Datos recolectados" : "Collected data"} />
      </section>

      <section className="recovery-summary-grid">
        <RecoveryTable
          title={language === "es" ? "Resumen por herramienta" : "Tool usage summary"}
          subtitle={language === "es" ? "Sumatoria total por herramienta de recuperación" : "Total daily usage summed by recovery tool"}
          headers={language === "es"
            ? ["Herramienta", "Total", "Días usados", "Día pico", "Uso pico"]
            : ["Tool", "Total", "Used days", "Peak day", "Peak usage"]}
          rows={toolSummary.map((row) => [
            row.label,
            compactNumber(row.total),
            compactNumber(row.usedDays),
            row.peakDate || copy.common.noDate,
            compactNumber(row.peakCount),
          ])}
        />
        <RecoveryTable
          title={language === "es" ? "Total mes" : "Monthly totals"}
          subtitle={language === "es" ? "Sumatoria por mes del periodo completo" : "Monthly sum across the full collection window"}
          headers={language === "es" ? ["Mes", "Total", "Servicio principal"] : ["Month", "Total", "Top service"]}
          rows={monthSummary.map((row) => [row.label, compactNumber(row.total), row.topService || copy.common.noData])}
        />
        <RecoveryTable
          title={language === "es" ? "Total semana" : "Weekly totals"}
          subtitle={language === "es" ? "Sumatoria semanal por fecha ISO" : "Weekly sum by ISO week"}
          headers={language === "es" ? ["Semana", "Total", "Servicio principal"] : ["Week", "Total", "Top service"]}
          rows={weekSummary.map((row) => [row.label, compactNumber(row.total), row.topService || copy.common.noData])}
        />
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

function RecoveryTable({
  headers,
  rows,
  subtitle,
  title,
}: {
  headers: string[];
  rows: string[][];
  subtitle: string;
  title: string;
}) {
  return (
    <article className="recovery-table-card">
      <div className="panel-heading">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div className="recovery-table-wrap">
        <table className="recovery-table">
          <thead>
            <tr>
              {headers.map((header) => <th key={header}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`}>{index === 0 ? <strong>{cell}</strong> : cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
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

function summarizeByService(rows: RehabServiceRow[]) {
  const summaries = new Map<string, { label: string; peakCount: number; peakDate: string; total: number; usedDays: number }>();

  rows.forEach((row) => {
    const label = row.serviceName || "Unclassified";
    const count = numberValue(row.count);
    const current = summaries.get(label) ?? { label, peakCount: 0, peakDate: "", total: 0, usedDays: 0 };
    current.total += count;
    if (count > 0) current.usedDays += 1;
    if (count > current.peakCount) {
      current.peakCount = count;
      current.peakDate = row.dateIso ?? "";
    }
    summaries.set(label, current);
  });

  return [...summaries.values()].sort((a, b) => b.total - a.total);
}

function summarizeByPeriod(rows: RehabServiceRow[], keyForRow: (row: RehabServiceRow) => string) {
  const summaries = new Map<string, { label: string; serviceTotals: Map<string, number>; total: number }>();

  rows.forEach((row) => {
    const label = keyForRow(row);
    if (!label) return;
    const serviceName = row.serviceName || "Unclassified";
    const count = numberValue(row.count);
    const current = summaries.get(label) ?? { label, serviceTotals: new Map<string, number>(), total: 0 };
    current.total += count;
    current.serviceTotals.set(serviceName, (current.serviceTotals.get(serviceName) ?? 0) + count);
    summaries.set(label, current);
  });

  return [...summaries.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((summary) => ({
      label: summary.label,
      total: summary.total,
      topService: [...summary.serviceTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "",
    }));
}

function getDateRange(rows: RehabServiceRow[]) {
  const dates = rows.map((row) => row.dateIso).filter(Boolean).sort();
  const start = dates[0] ?? "";
  const end = dates.at(-1) ?? "";

  return {
    display: start && end ? `${formatDisplayDate(start)} - ${formatDisplayDate(end)}` : "-",
    end,
    start,
  };
}

function monthKeyForRow(row: RehabServiceRow) {
  const date = dateFromIso(row.dateIso);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function weekKeyForRow(row: RehabServiceRow) {
  const date = dateFromIso(row.dateIso);
  if (!date) return "";
  const { week, year } = isoWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function formatDisplayDate(value: string) {
  const date = dateFromIso(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function dateFromIso(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoWeek(date: Date) {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((current.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return { week, year: current.getUTCFullYear() };
}
