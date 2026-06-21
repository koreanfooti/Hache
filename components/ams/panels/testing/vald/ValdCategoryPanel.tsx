import Image from "next/image";
import { compactNumber } from "@/lib/ams/data";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import type { ValdNordbordMetricRow, ValdNordbordTestRow } from "@/lib/ams/types";
import { TestingPlaceholderDashboard } from "@/components/ams/panels/testing/TestingPlaceholderDashboard";
import type { TestingLabels } from "@/components/ams/panels/testing/testingLabels";
import type {
  SelectedValdDevice,
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
  selectedValdDevice,
  setSelectedValdDevice,
  tests,
}: {
  copy: TestingBatteryCopy;
  language: AmsLanguage;
  labels: TestingLabels;
  metrics: ValdNordbordMetricRow[];
  selectedValdDevice: SelectedValdDevice;
  setSelectedValdDevice: (device: SelectedValdDevice) => void;
  tests: ValdNordbordTestRow[];
}) {
  const deviceCards: ValdDeviceCardData[] = [
    {
      copy: copy.development.nordbordCopy ?? labels.nordbordCopy,
      id: "nordbord",
      image: "/ams/assets/testing/nordbord-logo.png",
      stat: `${compactNumber(tests.length)} ${copy.common.tests}`,
      title: "NordBord",
    },
    {
      copy: copy.development.forceframeCopy ?? labels.forceframeCopy,
      id: "forceframe",
      label: "02",
      stat: copy.common.pending,
      title: "ForceFrame",
    },
    {
      copy: copy.development.forcedecksCopy ?? labels.forcedecksCopy,
      id: "forcedecks",
      label: "03",
      stat: copy.common.pending,
      title: "ForceDecks",
    },
  ];

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
        {deviceCards.map((device) => (
          <ValdDeviceCard
            device={device}
            isActive={selectedValdDevice === device.id}
            key={device.id}
            onClick={() => setSelectedValdDevice(selectedValdDevice === device.id ? "none" : device.id)}
          />
        ))}
      </section>

      {selectedValdDevice === "nordbord" ? (
        <NordbordDashboard
          copy={copy}
          language={language}
          metrics={metrics}
          tests={tests}
        />
      ) : null}

      {selectedValdDevice === "forceframe" ? (
        <TestingPlaceholderDashboard
          copy={copy}
          labels={labels}
          title="ForceFrame"
          subtitle={labels.isometricDashboard}
          body={copy.development.forceframeCopy ?? labels.forceframeCopy}
          chips={[labels.hipGroin, labels.shoulder, labels.trunk, labels.isometricPeak]}
        />
      ) : null}

      {selectedValdDevice === "forcedecks" ? (
        <TestingPlaceholderDashboard
          copy={copy}
          labels={labels}
          title="ForceDecks"
          subtitle={labels.forcePlateDashboard}
          body={copy.development.forcedecksCopy ?? labels.forcedecksCopy}
          chips={[labels.cmjTitle, labels.landing, labels.balance, labels.forceTime]}
        />
      ) : null}
    </section>
  );
}
