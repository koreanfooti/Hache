"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

export function DateSlicerField({
  className = "",
  emptyLabel,
  label,
  language,
  max,
  min,
  onChange,
  value,
}: {
  className?: string;
  emptyLabel: string;
  label: string;
  language: AmsLanguage;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const labelId = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => monthStart(parseDate(value) ?? parseDate(min) ?? new Date()));
  const calendarDays = useMemo(() => calendarMonthDays(viewDate), [viewDate]);
  const monthLabel = new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(viewDate);
  const weekdayLabels = language === "es" ? ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const today = isoDate(new Date());

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutside(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function openCalendar() {
    setViewDate(monthStart(parseDate(value) ?? parseDate(min) ?? new Date()));
    setIsOpen((open) => !open);
  }

  function selectDate(date: string) {
    if (isDateDisabled(date, min, max)) return;
    onChange(date);
    setIsOpen(false);
  }

  return (
    <div ref={fieldRef} className={`ams-date-slicer-field ${isOpen ? "is-open" : ""} ${className}`.trim()}>
      <span className="ams-date-slicer-label" id={labelId}>{label}</span>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={labelId}
        className="ams-date-slicer-button"
        type="button"
        onClick={openCalendar}
      >
        <span>{dateControlDisplay(value, emptyLabel, language)}</span>
        <i aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="ams-date-calendar-popover" role="dialog" aria-modal="false" aria-labelledby={labelId}>
          <div className="ams-date-calendar-header">
            <button
              aria-label={language === "es" ? "Mes anterior" : "Previous month"}
              disabled={!canMoveMonth(viewDate, -1, min, max)}
              type="button"
              onClick={() => setViewDate((currentDate) => addMonths(currentDate, -1))}
            >
              ‹
            </button>
            <strong>{monthLabel}</strong>
            <button
              aria-label={language === "es" ? "Mes siguiente" : "Next month"}
              disabled={!canMoveMonth(viewDate, 1, min, max)}
              type="button"
              onClick={() => setViewDate((currentDate) => addMonths(currentDate, 1))}
            >
              ›
            </button>
          </div>
          <div className="ams-date-calendar-weekdays" aria-hidden="true">
            {weekdayLabels.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="ams-date-calendar-grid">
            {calendarDays.map((day) => {
              const disabled = isDateDisabled(day.date, min, max);
              const selected = value === day.date;
              return (
                <button
                  aria-label={dateDisplay(day.date, day.date, language)}
                  className={`${day.isCurrentMonth ? "" : "is-outside"}${selected ? " is-selected" : ""}${day.date === today ? " is-today" : ""}`.trim()}
                  disabled={disabled}
                  key={day.date}
                  type="button"
                  onClick={() => selectDate(day.date)}
                >
                  {day.day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
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

function dateControlDisplay(value: string, fallback: string, language: AmsLanguage) {
  const date = parseDate(value);
  if (!date) return fallback;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return language === "es" ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);
}

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarMonthDays(viewDate: Date) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1, 12);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 12).getDate();
  const leadingDays = firstDay.getDay();
  const previousMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0, 12).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    const dayOffset = index - leadingDays + 1;
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayOffset, 12);
    const isPreviousMonth = dayOffset < 1;
    const isNextMonth = dayOffset > daysInMonth;
    const displayDay = isPreviousMonth ? previousMonthDays + dayOffset : isNextMonth ? dayOffset - daysInMonth : dayOffset;

    return {
      date: isoDate(date),
      day: displayDay,
      isCurrentMonth: !isPreviousMonth && !isNextMonth,
    };
  });
}

function isDateDisabled(date: string, min?: string, max?: string) {
  return Boolean((min && date < min) || (max && date > max));
}

function canMoveMonth(viewDate: Date, offset: number, min?: string, max?: string) {
  const targetMonth = addMonths(viewDate, offset);
  const targetStart = isoDate(targetMonth);
  const targetEnd = isoDate(new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 12));

  if (min && targetEnd < min) return false;
  if (max && targetStart > max) return false;
  return true;
}
