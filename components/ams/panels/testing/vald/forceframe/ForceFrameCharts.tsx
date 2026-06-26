import { useState, type CSSProperties } from "react";
import { compactNumber } from "@/lib/ams/data";
import type { ForceFrameLabels } from "@/components/ams/panels/testing/vald/forceframe/forceframeLabels";
import type { ForceFrameSeriesPoint } from "@/components/ams/panels/testing/vald/forceframe/forceframeTypes";
import { median } from "@/components/ams/panels/testing/vald/forceframe/forceframeUtils";
import { ChartTooltip, chartTooltipPosition, type ChartTooltipPayload, type ChartTooltipState } from "@/components/ams/ui/ChartTooltip";

export function ForceFrameAsymmetryChart({
  labels,
  playerName,
  points,
}: {
  labels: ForceFrameLabels;
  playerName: string;
  points: ForceFrameSeriesPoint[];
}) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const width = 500;
  const rowHeight = 34;
  const height = Math.max(260, 76 + points.length * rowHeight);
  const padding = { bottom: 34, left: 104, right: 28, top: 28 };
  const innerWidth = width - padding.left - padding.right;
  const maxAsymmetry = Math.max(10, ...points.map((point) => Math.abs(point.asymmetry))) * 1.2;
  const yFor = (index: number) => padding.top + index * rowHeight;
  const widthFor = (value: number) => (Math.abs(value) / maxAsymmetry) * innerWidth;

  return (
    <section className="forceframe-chart-card forceframe-asymmetry-card" onMouseLeave={() => setTooltip(null)}>
      <div className="forceframe-chart-title">
        <strong>{labels.asymmetryBars}</strong>
        <span>{labels.direction}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.asymmetryBars}>
        <line className="forceframe-axis-line" x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} />
        <line className="forceframe-reference-line is-white" x1={padding.left} x2={padding.left} y1={padding.top - 8} y2={height - padding.bottom} />
        <text className="forceframe-axis-caption" x={padding.left} y={height - 8}>0</text>
        <text className="forceframe-axis-caption" x={width - padding.right} y={height - 8}>{compactNumber(maxAsymmetry, 0)}</text>
        {points.map((point, index) => {
          const y = yFor(index);
          const barWidth = widthFor(point.asymmetry);

          return (
            <g
              key={point.testId}
              onMouseMove={(event) => setTooltip({
                ...chartTooltipPosition(event, ".forceframe-chart-card"),
                payload: asymmetryTooltip(labels, playerName, point),
              })}
            >
              <text className="forceframe-row-date" x={padding.left - 16} y={y + 14}>{point.displayDate}</text>
              <rect className="forceframe-asymmetry-bar" x={padding.left} y={y} width={Math.max(2, barWidth)} height="20" rx="2" />
              <text className="forceframe-bar-label" x={padding.left + barWidth - 8} y={y + 14}>{compactNumber(Math.abs(point.asymmetry), 0)}</text>
            </g>
          );
        })}
        <text className="forceframe-axis-title" x={padding.left + innerWidth / 2} y={height - 7}>{labels.asymmetry}</text>
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </section>
  );
}

export function ForceFrameSplitForceChart({
  labels,
  playerName,
  points,
}: {
  labels: ForceFrameLabels;
  playerName: string;
  points: ForceFrameSeriesPoint[];
}) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const width = Math.max(640, 600 + points.length * 8);
  const rowHeight = 34;
  const height = Math.max(260, 76 + points.length * rowHeight);
  const padding = { bottom: 40, left: 22, right: 36, top: 28 };
  const centerX = width / 2;
  const halfWidth = centerX - padding.left - 34;
  const maxForce = Math.max(100, ...points.flatMap((point) => [point.left, point.right])) * 1.12;
  const leftMedian = median(points.map((point) => point.left));
  const rightMedian = median(points.map((point) => point.right));
  const yFor = (index: number) => padding.top + index * rowHeight;
  const widthFor = (value: number) => (value / maxForce) * halfWidth;
  const leftMedianX = centerX - widthFor(leftMedian);
  const rightMedianX = centerX + widthFor(rightMedian);

  return (
    <section className="forceframe-chart-card forceframe-split-card" onMouseLeave={() => setTooltip(null)}>
      <div className="forceframe-chart-title">
        <strong>{labels.forceSplit}</strong>
        <span>{labels.leftMaxForce} / {labels.rightMaxForce}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={labels.forceSplit}
        style={{ minWidth: `${width}px` } as CSSProperties}
      >
        <line className="forceframe-center-line" x1={centerX} x2={centerX} y1={padding.top - 10} y2={height - padding.bottom} />
        <line className="forceframe-reference-line is-left" x1={leftMedianX} x2={leftMedianX} y1={padding.top - 8} y2={height - padding.bottom} />
        <line className="forceframe-reference-line is-right" x1={rightMedianX} x2={rightMedianX} y1={padding.top - 8} y2={height - padding.bottom} />
        <text className="forceframe-reference-caption is-left" x={leftMedianX - 6} y={height - 12}>{labels.medianLeft}: {compactNumber(leftMedian, 0)}</text>
        <text className="forceframe-reference-caption is-right" x={rightMedianX + 6} y={height - 12}>{labels.medianRight}: {compactNumber(rightMedian, 0)}</text>
        {points.map((point, index) => {
          const y = yFor(index);
          const leftWidth = widthFor(point.left);
          const rightWidth = widthFor(point.right);

          return (
            <g
              key={point.testId}
              onMouseMove={(event) => setTooltip({
                ...chartTooltipPosition(event, ".forceframe-chart-card"),
                payload: forceTooltip(labels, playerName, point),
              })}
            >
              <rect className="forceframe-force-bar is-left" x={centerX - leftWidth} y={y} width={Math.max(2, leftWidth)} height="20" rx="2" />
              <rect className="forceframe-force-bar is-right" x={centerX} y={y} width={Math.max(2, rightWidth)} height="20" rx="2" />
              <text className="forceframe-split-label is-left" x={centerX - leftWidth + 6} y={y + 14}>{compactNumber(point.left, 0)}</text>
              <text className="forceframe-split-label is-right" x={centerX + rightWidth - 6} y={y + 14}>{compactNumber(point.right, 0)}</text>
            </g>
          );
        })}
        <text className="forceframe-axis-title" x={centerX - halfWidth / 2} y={height - 7}>{labels.leftMaxForce}</text>
        <text className="forceframe-axis-title" x={centerX + halfWidth / 2} y={height - 7}>{labels.rightMaxForce}</text>
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </section>
  );
}

function forceTooltip(labels: ForceFrameLabels, playerName: string, point: ForceFrameSeriesPoint): ChartTooltipPayload {
  return {
    kicker: point.direction === "pull" ? labels.pull : labels.squeeze,
    rows: [
      { label: labels.leftMaxForce, value: `${compactNumber(point.left, 1)} N`, tone: "gold" },
      { label: labels.rightMaxForce, value: `${compactNumber(point.right, 1)} N`, tone: "blue" },
      { label: labels.asymmetry, value: `${compactNumber(point.asymmetry, 1)}%`, tone: Math.abs(point.asymmetry) > 10 ? "red" : "green" },
      { label: labels.testType, value: point.type, wide: true },
    ],
    subtitle: point.date,
    title: playerName,
  };
}

function asymmetryTooltip(labels: ForceFrameLabels, playerName: string, point: ForceFrameSeriesPoint): ChartTooltipPayload {
  return {
    kicker: labels.asymmetryBars,
    rows: [
      { label: labels.asymmetry, value: `${compactNumber(point.asymmetry, 1)}%`, tone: Math.abs(point.asymmetry) > 10 ? "red" : "green" },
      { label: labels.direction, value: point.direction === "pull" ? labels.pull : labels.squeeze },
      { label: labels.testType, value: point.type, wide: true },
    ],
    subtitle: point.position,
    title: `${playerName} · ${point.date}`,
  };
}
