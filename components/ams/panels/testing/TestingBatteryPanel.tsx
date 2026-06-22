import { useState } from "react";
import { compactNumber, numberValue } from "@/lib/ams/data";
import { FmsTestingDashboard } from "@/components/ams/panels/testing/fms/FmsTestingDashboard";
import { TestingCategoryCard } from "@/components/ams/panels/testing/TestingCategoryCard";
import { testingLabels } from "@/components/ams/panels/testing/testingLabels";
import type {
  TestingBatteryPanelProps,
  TestingCategory,
  TestingCategoryCardData,
} from "@/components/ams/panels/testing/testingTypes";
import { ValdCategoryPanel } from "@/components/ams/panels/testing/vald/ValdCategoryPanel";
import { YBalanceTestingDashboard } from "@/components/ams/panels/testing/y-balance/YBalanceTestingDashboard";

export function TestingBatteryPanel({
  copy,
  language,
  fms,
  fmsExerciseScores,
  yBalance,
  yBalanceMetrics,
  valdNordbordTests,
  valdNordbordMetrics,
}: TestingBatteryPanelProps) {
  const labels = testingLabels(language);
  const [selectedCategory, setSelectedCategory] = useState<TestingCategory>("vald");
  const flaggedFmsExercises = fmsExerciseScores.filter((row) => numberValue(row.pointScore) <= 1 || Boolean(row.asymmetryRaw)).length;
  const categories: TestingCategoryCardData[] = [
    {
      copy: copy.development.valdCopy ?? labels.valdCopy,
      eyebrow: labels.deviceFamily,
      id: "vald",
      image: "/ams/assets/testing/vald-logo.png",
      stat: `${compactNumber(valdNordbordTests.length)} ${labels.mappedTests}`,
      title: "VALD",
    },
    {
      copy: copy.development.fmsCopy ?? labels.fmsCopy,
      eyebrow: labels.screening,
      id: "fms",
      image: "/ams/assets/testing/fms-logo.jpeg",
      stat: `${compactNumber(fms.length)} ${copy.common.records}`,
      title: "FMS",
    },
    {
      copy: copy.development.ybtCopy ?? labels.yBalanceCopy,
      eyebrow: labels.screening,
      id: "yBalance",
      image: "/ams/assets/testing/ybt-logo.svg",
      stat: `${compactNumber(yBalance.length)} ${copy.common.tests}`,
      title: labels.yBalanceTitle,
    },
  ];

  return (
    <section className="testing-battery-page">
      <div className="panel-heading">
        <div>
          <h3>{copy.development.valdTesting ?? labels.testingBattery}</h3>
          <span>{copy.development.valdTestingSub ?? labels.testingBatterySub}</span>
        </div>
      </div>

      <section className="testing-category-grid" aria-label={labels.testCategories}>
        {categories.map((category) => (
          <TestingCategoryCard
            isActive={selectedCategory === category.id}
            key={category.id}
            category={category}
            onClick={() => setSelectedCategory(category.id)}
          />
        ))}
      </section>

      {selectedCategory === "vald" ? (
        <ValdCategoryPanel
          copy={copy}
          language={language}
          labels={labels}
          metrics={valdNordbordMetrics}
          tests={valdNordbordTests}
        />
      ) : null}

      {selectedCategory === "fms" ? (
        <FmsTestingDashboard
          copy={copy}
          exercises={fmsExerciseScores}
          flaggedFmsExercises={flaggedFmsExercises}
          labels={labels}
          language={language}
          rows={fms}
        />
      ) : null}

      {selectedCategory === "yBalance" ? (
        <YBalanceTestingDashboard
          copy={copy}
          labels={labels}
          language={language}
          metrics={yBalanceMetrics}
          rows={yBalance}
        />
      ) : null}
    </section>
  );
}
