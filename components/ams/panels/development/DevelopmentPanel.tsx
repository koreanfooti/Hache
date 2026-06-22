import type {
  FmsAssessmentRow,
  FmsExerciseScoreRow,
  ValdNordbordMetricRow,
  ValdNordbordTestRow,
  YBalanceAssessmentRow,
  YBalanceMetricRow,
} from "@/lib/ams/types";
import { TestingBatteryPanel } from "@/components/ams/panels/testing";
import type { DataPanelCopy } from "@/components/ams/panels/panelTypes";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

export function DevelopmentPanel({
  copy,
  language,
  fms,
  fmsExerciseScores,
  yBalance,
  yBalanceMetrics,
  valdNordbordTests,
  valdNordbordMetrics,
  onOpenBodyComposition,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  fms: FmsAssessmentRow[];
  fmsExerciseScores: FmsExerciseScoreRow[];
  yBalance: YBalanceAssessmentRow[];
  yBalanceMetrics: YBalanceMetricRow[];
  valdNordbordTests: ValdNordbordTestRow[];
  valdNordbordMetrics: ValdNordbordMetricRow[];
  onOpenBodyComposition: () => void;
}) {
  return (
    <div className="panel-stack development-panel">
      <section className="development-module-grid mvp-development-grid">
        <article className="development-module-card module-action is-active">
          <span>{copy.development.testing ?? "Testing"}</span>
          <strong>{copy.development.battery ?? "Battery"}</strong>
          <p>{copy.development.testingCopy ?? "FMS, Y Balance, and VALD NordBord source-backed testing inputs."}</p>
        </article>
        <button className="development-module-card" type="button" onClick={onOpenBodyComposition}>
          <span>{copy.development.anthropometric ?? "Anthropometric"}</span>
          <strong>{copy.development.bodyComp ?? "Body Comp"}</strong>
          <p>{copy.development.anthropometricCopy ?? "Body composition, ISAK skinfolds, girths, and longitudinal growth markers by player and category."}</p>
        </button>
      </section>

      <TestingBatteryPanel
        copy={copy}
        language={language}
        fms={fms}
        fmsExerciseScores={fmsExerciseScores}
        yBalance={yBalance}
        yBalanceMetrics={yBalanceMetrics}
        valdNordbordTests={valdNordbordTests}
        valdNordbordMetrics={valdNordbordMetrics}
      />
    </div>
  );
}
