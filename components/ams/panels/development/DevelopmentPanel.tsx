import { useState } from "react";
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

type DevelopmentView = "idle" | "position" | "blocks" | "battery";

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
  const [developmentView, setDevelopmentView] = useState<DevelopmentView>("battery");

  return (
    <div className="panel-stack development-panel">
      <section className="development-module-grid">
        <button
          className={developmentView === "position" ? "development-module-card priority is-active" : "development-module-card priority"}
          type="button"
          onClick={() => setDevelopmentView("position")}
        >
          <span>{copy.development.physicalBenchmarking ?? "Physical Benchmarking"}</span>
          <strong>{copy.development.positionProfile ?? "Position Profile"}</strong>
          <p>{copy.development.physicalBenchmarkingCopy ?? "Speed, aerobic power, jump, strength, and asymmetry benchmarks against role demands."}</p>
        </button>
        <button
          className={developmentView === "blocks" ? "development-module-card is-active" : "development-module-card"}
          type="button"
          onClick={() => setDevelopmentView("blocks")}
        >
          <span>{copy.development.developmentPlan ?? "Development Plan"}</span>
          <strong>{copy.development.blocks ?? "Blocks"}</strong>
          <p>{copy.development.developmentPlanCopy ?? "Training objectives by player, phase, and staff owner."}</p>
        </button>
        <button className="development-module-card" type="button" onClick={onOpenBodyComposition}>
          <span>{copy.development.anthropometric ?? "Anthropometric"}</span>
          <strong>{copy.development.bodyComp ?? "Body Comp"}</strong>
          <p>{copy.development.anthropometricCopy ?? "Body composition, ISAK skinfolds, girths, and longitudinal growth markers by player and category."}</p>
        </button>
        <button
          className={developmentView === "battery" ? "development-module-card module-action is-active" : "development-module-card module-action"}
          type="button"
          aria-expanded={developmentView === "battery"}
          onClick={() => setDevelopmentView((currentView) => (currentView === "battery" ? "idle" : "battery"))}
        >
          <span>{copy.development.testing ?? "Testing"}</span>
          <strong>{copy.development.battery ?? "Battery"}</strong>
          <p>{copy.development.testingCopy ?? "CMJ, sprint splits, COD, Yo-Yo, force plate, and gym testing inputs."}</p>
        </button>
      </section>

      {developmentView === "battery" ? (
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
      ) : developmentView === "idle" ? null : (
        <section className="development-detail-panel">
          <span>{developmentView === "position" ? copy.development.physicalBenchmarking : copy.development.developmentPlan}</span>
          <h3>{developmentView === "position" ? copy.development.positionProfile : copy.development.blocks}</h3>
          <p>{developmentView === "position" ? copy.development.physicalBenchmarkingCopy : copy.development.developmentPlanCopy}</p>
        </section>
      )}
    </div>
  );
}
