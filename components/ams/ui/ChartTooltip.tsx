"use client";

import type { CSSProperties, MouseEvent } from "react";

export type ChartTooltipRow = {
  label: string;
  tone?: "gold" | "green" | "red" | "blue";
  value: string;
  wide?: boolean;
};

export type ChartTooltipPayload = {
  kicker?: string;
  rows: ChartTooltipRow[];
  subtitle?: string;
  title: string;
};

export type ChartTooltipState = {
  placement?: "left" | "right";
  payload: ChartTooltipPayload;
  vertical?: "above" | "below" | "middle";
  x: number;
  y: number;
};

type ChartTooltipPosition = Pick<ChartTooltipState, "placement" | "vertical" | "x" | "y">;
type ChartTooltipPlacement = NonNullable<ChartTooltipState["placement"]>;
type ChartTooltipVertical = NonNullable<ChartTooltipState["vertical"]>;

export function ChartTooltip({ tooltip }: { tooltip: ChartTooltipState | null }) {
  if (!tooltip) return null;

  return (
    <div
      className={`ams-chart-tooltip is-${tooltip.placement ?? "right"} is-${tooltip.vertical ?? "middle"}`}
      style={{ "--tooltip-x": `${tooltip.x}px`, "--tooltip-y": `${tooltip.y}px` } as CSSProperties}
    >
      {tooltip.payload.kicker ? <span>{tooltip.payload.kicker}</span> : null}
      <strong>{tooltip.payload.title}</strong>
      {tooltip.payload.subtitle ? <em>{tooltip.payload.subtitle}</em> : null}
      <dl>
        {tooltip.payload.rows.map((row) => (
          <div className={`${row.tone ? `is-${row.tone}` : ""}${row.wide ? " is-wide" : ""}`} key={`${row.label}-${row.value}`}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function chartTooltipPosition(event: MouseEvent<Element>, _containerSelector?: string): ChartTooltipPosition {
  void _containerSelector;

  const safeWindow = typeof window === "undefined" ? null : window;
  const viewportWidth = safeWindow?.innerWidth ?? 0;
  const viewportHeight = safeWindow?.innerHeight ?? 0;
  const placement: ChartTooltipPlacement = viewportWidth > 0 && event.clientX > viewportWidth - 340 ? "left" : "right";
  const vertical: ChartTooltipVertical = viewportHeight > 0 && event.clientY > viewportHeight - 260 ? "above" : event.clientY < 150 ? "below" : "middle";

  return {
    placement,
    vertical,
    x: event.clientX,
    y: event.clientY,
  };
}
