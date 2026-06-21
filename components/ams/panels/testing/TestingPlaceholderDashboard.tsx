import type { TestingLabels } from "@/components/ams/panels/testing/testingLabels";
import type { TestingBatteryCopy } from "@/components/ams/panels/testing/testingTypes";

export function TestingPlaceholderDashboard({
  body,
  chips,
  copy,
  labels,
  subtitle,
  title,
}: {
  body: string;
  chips: string[];
  copy: TestingBatteryCopy;
  labels: TestingLabels;
  subtitle: string;
  title: string;
}) {
  return (
    <article className="testing-dashboard-panel testing-dashboard-placeholder">
      <div className="testing-dashboard-header">
        <div>
          <span>{subtitle}</span>
          <h4>{title}</h4>
          <p>{body}</p>
        </div>
        <strong>{copy.common.waitingForSource}</strong>
      </div>
      <div className="testing-placeholder-chip-row">
        {chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
      <p className="testing-placeholder-note">{labels.pendingSourceNote}</p>
    </article>
  );
}
