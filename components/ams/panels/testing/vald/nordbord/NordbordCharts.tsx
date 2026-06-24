import { useState } from "react";
import { compactNumber } from "@/lib/ams/data";
import type { NordbordIsopronoReference } from "@/lib/ams/valdReferences";
import type { NordbordLabels } from "@/components/ams/panels/testing/vald/nordbord/nordbordLabels";
import type { ForceSeriesPoint } from "@/components/ams/panels/testing/vald/nordbord/nordbordTypes";
import { ChartTooltip, chartTooltipPosition, type ChartTooltipPayload, type ChartTooltipState } from "@/components/ams/ui/ChartTooltip";

export function ForceBarChart({
  labels,
  playerName,
  points,
  reference,
  referenceLabel,
}: {
  labels: NordbordLabels;
  playerName: string;
  points: ForceSeriesPoint[];
  reference?: NordbordIsopronoReference;
  referenceLabel: string;
}) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const width = 980;
  const height = 318;
  const padding = { bottom: 66, left: 42, right: 20, top: 30 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = points.flatMap((point) => [point.left, point.right]);
  const referenceValues = reference?.lines.map((line) => line.value) ?? [];
  const maxForce = Math.max(100, ...values, ...referenceValues) * 1.16;
  const slot = innerWidth / Math.max(1, points.length);
  const barWidth = Math.max(10, Math.min(24, slot * 0.23));
  const yFor = (value: number) => padding.top + innerHeight - (value / maxForce) * innerHeight;

  return (
    <section className="nordbord-chart-card" onMouseLeave={() => setTooltip(null)}>
      <div className="nordbord-chart-legend">
        <span><i className="is-left" />{labels.leftMaxForce}</span>
        <span><i className="is-right" />{labels.rightMaxForce}</span>
        {reference ? (
          <>
            <span className="nordbord-reference-name">{labels.isopronoReference}: {referenceLabel}</span>
            {reference.lines.map((line) => (
              <span key={line.key}><i className={`is-reference is-${line.key}`} />P{line.percentile} {compactNumber(line.value, 0)}</span>
            ))}
          </>
        ) : null}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.forceChart}>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padding.top + innerHeight - tick * innerHeight;
          return <line className="nordbord-grid-line" key={tick} x1={padding.left} x2={width - padding.right} y1={y} y2={y} />;
        })}
        {reference?.lines.map((line) => {
          const y = yFor(line.value);

          return (
            <g key={line.key}>
              <line className={`nordbord-reference-line is-${line.key}`} x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text className={`nordbord-reference-label is-${line.key}`} x={width - padding.right - 4} y={y - 5}>
                P{line.percentile} {compactNumber(line.value, 0)}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => {
          const centerX = padding.left + slot * index + slot / 2;
          const leftHeight = innerHeight - (yFor(point.left) - padding.top);
          const rightHeight = innerHeight - (yFor(point.right) - padding.top);

          return (
            <g
              key={point.testId}
              onMouseMove={(event) => setTooltip({ ...chartTooltipPosition(event, ".nordbord-chart-card"), payload: nordbordForceTooltip(playerName, labels, point) })}
            >
              <rect className="nordbord-force-bar is-left" x={centerX - barWidth - 2} y={yFor(point.left)} width={barWidth} height={Math.max(2, leftHeight)} rx="2" />
              <rect className="nordbord-force-bar is-right" x={centerX + 2} y={yFor(point.right)} width={barWidth} height={Math.max(2, rightHeight)} rx="2" />
              <text className="nordbord-bar-value" x={centerX - barWidth / 2 - 2} y={yFor(point.left) - 8}>{compactNumber(point.left, 0)}</text>
              <text className="nordbord-bar-value" x={centerX + barWidth / 2 + 2} y={yFor(point.right) - 8}>{compactNumber(point.right, 0)}</text>
              <text className="nordbord-axis-label" transform={`translate(${centerX - 18} ${height - 20}) rotate(-30)`}>{point.displayDate}</text>
            </g>
          );
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </section>
  );
}

export function AsymmetryLineChart({ labels, playerName, points }: { labels: NordbordLabels; playerName: string; points: ForceSeriesPoint[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const width = 980;
  const height = 214;
  const padding = { bottom: 54, left: 42, right: 20, top: 24 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = points.map((point) => point.asymmetry);
  const minValue = Math.min(-40, ...values) - 4;
  const maxValue = Math.max(20, ...values) + 4;
  const xFor = (index: number) => padding.left + (innerWidth / Math.max(1, points.length - 1)) * index;
  const yFor = (value: number) => padding.top + ((maxValue - value) / (maxValue - minValue)) * innerHeight;
  const polyline = points.map((point, index) => `${xFor(index)},${yFor(point.asymmetry)}`).join(" ");
  const zeroY = yFor(0);

  return (
    <section className="nordbord-chart-card nordbord-line-card" onMouseLeave={() => setTooltip(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.asymmetryChart}>
        <line className="nordbord-grid-line is-zero" x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} />
        <polyline className="nordbord-asymmetry-line" points={polyline} />
        {points.map((point, index) => {
          const x = xFor(index);
          const y = yFor(point.asymmetry);
          return (
            <g
              key={point.testId}
              onMouseMove={(event) => setTooltip({ ...chartTooltipPosition(event, ".nordbord-chart-card"), payload: nordbordAsymmetryTooltip(playerName, labels, point) })}
            >
              <circle className="load-athlete-line-hit" cx={x} cy={y} r="12" />
              <circle className="nordbord-asymmetry-dot" cx={x} cy={y} r="3.6" />
              <text className="nordbord-line-value" x={x} y={y - 10}>{compactNumber(point.asymmetry, 0)}</text>
              <text className="nordbord-axis-label" transform={`translate(${x - 18} ${height - 18}) rotate(-28)`}>{point.displayDate}</text>
            </g>
          );
        })}
        <text className="nordbord-y-label" transform={`translate(15 ${height / 2 + 30}) rotate(-90)`}>{labels.asymmetry}</text>
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </section>
  );
}

function nordbordForceTooltip(playerName: string, labels: NordbordLabels, point: ForceSeriesPoint): ChartTooltipPayload {
  return {
    kicker: point.type,
    rows: [
      { label: labels.leftMaxForce, value: `${compactNumber(point.left, 1)} N`, tone: "gold" },
      { label: labels.rightMaxForce, value: `${compactNumber(point.right, 1)} N`, tone: "blue" },
      { label: labels.asymmetry, value: `${compactNumber(point.asymmetry, 1)}%`, tone: Math.abs(point.asymmetry) > 10 ? "red" : "green" },
    ],
    subtitle: point.date,
    title: playerName,
  };
}

function nordbordAsymmetryTooltip(playerName: string, labels: NordbordLabels, point: ForceSeriesPoint): ChartTooltipPayload {
  return {
    kicker: labels.asymmetryChart,
    rows: [
      { label: labels.asymmetry, value: `${compactNumber(point.asymmetry, 1)}%`, tone: Math.abs(point.asymmetry) > 10 ? "red" : "green" },
      { label: labels.leftMaxForce, value: `${compactNumber(point.left, 1)} N`, tone: "gold" },
      { label: labels.rightMaxForce, value: `${compactNumber(point.right, 1)} N`, tone: "blue" },
    ],
    subtitle: point.type,
    title: `${playerName} · ${point.date}`,
  };
}
