import { type ChangeEvent } from "react";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

export function DateSlicerField({
  className = "",
  emptyLabel,
  label,
  language,
  max,
  min,
  onChange,
  tooltipDetail,
  tooltipTitle,
  value,
}: {
  className?: string;
  emptyLabel: string;
  label: string;
  language: AmsLanguage;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  tooltipDetail?: string;
  tooltipTitle?: string;
  value: string;
}) {
  return (
    <label className={`ams-date-slicer-field ${className}`.trim()}>
      <span>{label}</span>
      <input
        max={max}
        min={min}
        type="date"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
      <span className="ams-date-slicer-tooltip" aria-hidden="true">
        <strong>{tooltipTitle ?? label}</strong>
        <em>{dateDisplay(value, emptyLabel, language)}</em>
        {tooltipDetail ? <small>{tooltipDetail}</small> : null}
      </span>
    </label>
  );
}

export function dateDisplay(value: string, fallback: string, language: AmsLanguage) {
  if (!value) return fallback;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
