import Image from "next/image";
import { DataList, MetricCard, type AmsLanguage } from "@/components/ams/ui/AmsUi";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { YBalanceAssessmentRow, YBalanceMetricRow } from "@/lib/ams/types";
import type { TestingLabels } from "@/components/ams/panels/testing/testingLabels";
import type { TestingBatteryCopy } from "@/components/ams/panels/testing/testingTypes";
import { average, playerNameForAmsId, unique } from "@/components/ams/panels/testing/testingUtils";

export function YBalanceTestingDashboard({
  copy,
  labels,
  language,
  metrics,
  rows,
}: {
  copy: TestingBatteryCopy;
  labels: TestingLabels;
  language: AmsLanguage;
  metrics: YBalanceMetricRow[];
  rows: YBalanceAssessmentRow[];
}) {
  const latestRows = [...rows].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 6);
  const latestMetrics = [...metrics].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 8);
  const averageComposite = average(rows.map((row) => row.compositeScore));
  const riskFlags = rows.filter((row) => Boolean(row.riskFlag)).length;
  const testTypes = unique(rows.map((row) => row.testType));

  return (
    <article className="testing-dashboard-panel">
      <div className="testing-dashboard-header">
        <div>
          <span>{labels.screening}</span>
          <h4>{labels.yBalanceDashboard}</h4>
          <p>{copy.development.ybtCopy ?? labels.yBalanceCopy}</p>
        </div>
        <Image src="/ams/assets/testing/ybt-logo.svg" alt="Y Balance Test logo" width={126} height={72} />
      </div>

      <section className="metric-grid testing-summary-grid">
        <MetricCard label={copy.development.yBalanceTests ?? labels.yBalanceTests} value={compactNumber(rows.length)} detail={copy.development.reachRecords ?? labels.reachRecords} />
        <MetricCard label={labels.avgComposite} value={compactNumber(averageComposite, 1)} detail={labels.availableScores} />
        <MetricCard label={labels.riskFlags} value={compactNumber(riskFlags)} detail={labels.asymmetryFlags} />
        <MetricCard label={labels.testTypes} value={compactNumber(testTypes.length)} detail={testTypes.join(" · ") || copy.common.noData} />
      </section>

      <section className="testing-dashboard-lists">
        <DataList
          emptyLabel={copy.common.noRecords}
          language={language}
          title={labels.latestYBalanceTests}
          subtitle={labels.cleanedReachResults}
          rows={latestRows.map((row) => [
            row.matchedAthleteName || copy.common.unknownPlayer,
            row.dateIso || copy.common.noDate,
            row.testType || copy.common.unclassified,
            String(row.compositeScore ?? row.riskFlag ?? copy.common.noScore),
          ])}
        />
        <DataList
          emptyLabel={copy.common.noRecords}
          language={language}
          title={labels.yBalanceMetrics}
          subtitle={`${compactNumber(metrics.length)} ${labels.metricRows}`}
          rows={latestMetrics.map((row) => [
            row.sourceAthleteName || playerNameForAmsId(row.amsId),
            row.testType || copy.common.unclassified,
            `${row.side || "-"} · ${row.metric || "-"}`,
            `${compactNumber(numberValue(row.value), 1)} ${row.unit || ""}`,
          ])}
        />
      </section>
    </article>
  );
}
