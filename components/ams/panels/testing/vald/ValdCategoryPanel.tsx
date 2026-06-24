import { useState } from "react";
import Image from "next/image";
import { compactNumber } from "@/lib/ams/data";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import type { ValdNordbordMetricRow, ValdNordbordTestRow } from "@/lib/ams/types";
import type { TestingLabels } from "@/components/ams/panels/testing/testingLabels";
import type {
  TestingBatteryCopy,
  ValdDeviceCardData,
} from "@/components/ams/panels/testing/testingTypes";
import { NordbordDashboard } from "@/components/ams/panels/testing/vald/nordbord/NordbordDashboard";
import { ValdDeviceCard } from "@/components/ams/panels/testing/vald/ValdDeviceCard";

export function ValdCategoryPanel({
  copy,
  language,
  labels,
  metrics,
  tests,
}: {
  copy: TestingBatteryCopy;
  language: AmsLanguage;
  labels: TestingLabels;
  metrics: ValdNordbordMetricRow[];
  tests: ValdNordbordTestRow[];
}) {
  const [isNordbordOpen, setIsNordbordOpen] = useState(true);
  const deviceCard: ValdDeviceCardData = {
    copy: copy.development.nordbordCopy ?? labels.nordbordCopy,
    id: "nordbord",
    image: "/ams/assets/testing/nordbord-logo.png",
    stat: `${compactNumber(tests.length)} ${copy.common.tests}`,
    title: "NordBord",
  };

  return (
    <section className="testing-category-detail">
      <div className="testing-brand-card">
        <Image src="/ams/assets/testing/vald-logo.png" alt="VALD logo" width={190} height={86} />
        <div>
          <strong>VALD</strong>
          <p>{copy.development.valdCopy ?? labels.valdCopy}</p>
        </div>
      </div>

      <section className="vald-device-grid" aria-label={labels.valdDevices}>
        <ValdDeviceCard
          device={deviceCard}
          isActive={isNordbordOpen}
          onClick={() => setIsNordbordOpen((isOpen) => !isOpen)}
        />
      </section>

      {isNordbordOpen ? (
        <NordbordDashboard
          copy={copy}
          language={language}
          metrics={metrics}
          tests={tests}
        />
      ) : null}
    </section>
  );
}
