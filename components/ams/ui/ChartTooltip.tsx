"use client";

import type { CSSProperties, MouseEvent } from "react";

export type ChartTooltipRow = {
  label: string;
  tone?: "gold" | "green" | "red" | "blue";
  value: string;
};

export type ChartTooltipPayload = {
  kicker?: string;
  rows: ChartTooltipRow[];
  subtitle?: string;
  title: string;
};

export type ChartTooltipState = {
  payload: ChartTooltipPayload;
  x: number;
  y: number;
};

export function ChartTooltip({ tooltip }: { tooltip: ChartTooltipState | null }) {
  if (!tooltip) return null;

  return (
    <div
      className="ams-chart-tooltip"
      style={{ "--tooltip-x": `${tooltip.x}px`, "--tooltip-y": `${tooltip.y}px` } as CSSProperties}
    >
      {tooltip.payload.kicker ? <span>{tooltip.payload.kicker}</span> : null}
      <strong>{tooltip.payload.title}</strong>
      {tooltip.payload.subtitle ? <em>{tooltip.payload.subtitle}</em> : null}
      <dl>
        {tooltip.payload.rows.map((row) => (
          <div className={row.tone ? `is-${row.tone}` : ""} key={`${row.label}-${row.value}`}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function chartTooltipPosition(event: MouseEvent<Element>, containerSelector: string) {
  const target = event.currentTarget;
  const container = target.closest(containerSelector);
  const rect = (container ?? target).getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}
