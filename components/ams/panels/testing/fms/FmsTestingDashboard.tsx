import Image from "next/image";
import { DataList, MetricCard, type AmsLanguage } from "@/components/ams/ui/AmsUi";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { FmsAssessmentRow, FmsExerciseScoreRow } from "@/lib/ams/types";
import type { TestingLabels } from "@/components/ams/panels/testing/testingLabels";
import type { TestingBatteryCopy } from "@/components/ams/panels/testing/testingTypes";
import { average, playerNameForAmsId } from "@/components/ams/panels/testing/testingUtils";

export function FmsTestingDashboard({
  copy,
  exercises,
  flaggedFmsExercises,
  labels,
  language,
  rows,
}: {
  copy: TestingBatteryCopy;
  exercises: FmsExerciseScoreRow[];
  flaggedFmsExercises: number;
  labels: TestingLabels;
  language: AmsLanguage;
  rows: FmsAssessmentRow[];
}) {
  const latestRows = [...rows].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 6);
  const latestExercises = [...exercises].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 8);
  const averageScore = average(rows.map((row) => row.totalScore));
  const flaggedAssessments = rows.filter((row) => Boolean(row.riskFlag) || numberValue(row.totalScore) < 15).length;

  return (
    <article className="testing-dashboard-panel">
      <div className="testing-dashboard-header">
        <div>
          <span>{labels.screening}</span>
          <h4>{labels.fmsDashboard}</h4>
          <p>{copy.development.fmsCopy ?? labels.fmsCopy}</p>
        </div>
        <Image src="/ams/assets/testing/fms-logo.jpeg" alt="FMS logo" width={112} height={84} />
      </div>

      <section className="metric-grid testing-summary-grid">
        <MetricCard label={copy.development.fmsAssessments ?? labels.assessments} value={compactNumber(rows.length)} detail={copy.development.movementRecords ?? labels.movementRecords} />
        <MetricCard label={labels.avgScore} value={compactNumber(averageScore, 1)} detail={labels.outOfTwentyOne} />
        <MetricCard label={labels.priorityFlags} value={compactNumber(flaggedFmsExercises)} detail={labels.exerciseRows} />
        <MetricCard label={labels.riskFlags} value={compactNumber(flaggedAssessments)} detail={labels.assessmentRows} />
      </section>

      <section className="testing-dashboard-lists">
        <DataList
          emptyLabel={copy.common.noRecords}
          language={language}
          title={copy.development.latestFmsAssessments ?? labels.latestFmsAssessments}
          subtitle={copy.development.cleanedMovementResults ?? labels.cleanedMovementResults}
          rows={latestRows.map((row) => [
            row.matchedAthleteName || copy.common.unknownPlayer,
            row.dateIso || copy.common.noDate,
            String(row.totalScore ?? copy.common.noScore),
            row.scoreBand || row.riskFlag || copy.common.noFlag,
          ])}
        />
        <DataList
          emptyLabel={copy.common.noRecords}
          language={language}
          title={labels.fmsExerciseRows}
          subtitle={labels.componentScores}
          rows={latestExercises.map((row) => [
            row.sourceAthleteName || playerNameForAmsId(row.amsId),
            row.exerciseName || copy.common.unclassified,
            String(row.pointScore ?? copy.common.noScore),
            row.asymmetryRaw || `${labels.priority} ${row.correctionPriorityRank ?? "-"}`,
          ])}
        />
      </section>
    </article>
  );
}
