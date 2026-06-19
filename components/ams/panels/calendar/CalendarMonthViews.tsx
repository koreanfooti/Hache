import { type ChangeEvent } from "react";
import { CalendarEventChip } from "@/components/ams/panels/calendar/CalendarEventChip";
import type { CalendarEvent, Language } from "@/components/ams/panels/calendar/calendarTypes";
import {
  calendarDate,
  dayNames,
  eventsForDate,
  eventsForMonth,
  monthName,
} from "@/components/ams/panels/calendar/calendarUtils";

export function CalendarTextInput({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} />
    </label>
  );
}

export function CalendarMonthCard({
  events,
  language,
  month,
  selectedMonth,
  selectedYear,
  onSelectDate,
  onSelectEvent,
  onSelectMonth,
}: {
  events: CalendarEvent[];
  language: Language;
  month: number;
  selectedMonth: number | null;
  selectedYear: number;
  onSelectDate: (date: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectMonth: (month: number) => void;
}) {
  const monthEvents = eventsForMonth(events, selectedYear, month);
  const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
  const firstDay = new Date(selectedYear, month, 1).getDay();

  return (
    <article className={`calendar-month-card${selectedMonth === month ? " is-active" : ""}`}>
      <button className="calendar-month-heading" type="button" onClick={() => onSelectMonth(month)}>
        <strong>{monthName(selectedYear, month, language, "short")}</strong>
        <span>{monthEvents.length} {language === "es" ? "eventos" : "events"}</span>
      </button>
      <div className="calendar-weekdays">
        {dayNames(language).map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-mini-grid">
        {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} className="calendar-day is-empty" />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = calendarDate(selectedYear, month, day);
          const dayEvents = eventsForDate(events, date);
          const intensity = Math.min(4, dayEvents.length);
          return (
            <button
              key={date}
              className={`calendar-day${dayEvents.length ? " has-events" : ""}${intensity ? ` intensity-${intensity}` : ""}`}
              type="button"
              title={dayEvents.map((event) => event.title).join(", ")}
              onClick={() => onSelectDate(date)}
            >
              <span>{day}</span>
              {dayEvents.length ? <small>{dayEvents.length}</small> : null}
            </button>
          );
        })}
      </div>
      {monthEvents.slice(0, 3).map((event) => (
        <button key={event.id} className="calendar-chip-button" type="button" onClick={() => onSelectEvent(event)}>
          <CalendarEventChip event={event} />
        </button>
      ))}
    </article>
  );
}

export function CalendarMonthDetail({
  copy,
  events,
  language,
  month,
  selectedYear,
  onSelectDate,
  onSelectEvent,
}: {
  copy: Record<string, string>;
  events: CalendarEvent[];
  language: Language;
  month: number | null;
  selectedYear: number;
  onSelectDate: (date: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  if (month === null) {
    return (
      <section className="calendar-month-detail">
        <p className="empty-profile">{language === "es" ? "Selecciona un mes o una fecha para ver el detalle." : "Select a month or date to open the planning detail."}</p>
      </section>
    );
  }

  const monthEvents = eventsForMonth(events, selectedYear, month);
  const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
  const firstDay = new Date(selectedYear, month, 1).getDay();

  return (
    <section className="calendar-month-detail">
      <div className="calendar-month-title">
        <h3>{monthName(selectedYear, month, language, "long")} {selectedYear}</h3>
        <span>{monthEvents.length} {language === "es" ? "eventos programados" : "scheduled events"}</span>
      </div>
      <div className="calendar-weekdays full">
        {dayNames(language).map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-month-grid">
        {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} className="calendar-date-card is-empty" />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = calendarDate(selectedYear, month, day);
          const dayEvents = eventsForDate(events, date);
          return (
            <button key={date} className="calendar-date-card" type="button" onClick={() => onSelectDate(date)}>
              <strong>{day}</strong>
              <div>
                {dayEvents.length
                  ? dayEvents.map((event) => (
                    <span
                      key={event.id}
                      role="button"
                      tabIndex={0}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onSelectEvent(event);
                      }}
                      onKeyDown={(keyEvent) => {
                        if (keyEvent.key === "Enter") onSelectEvent(event);
                      }}
                    >
                      <CalendarEventChip event={event} />
                    </span>
                  ))
                  : <span className="calendar-empty-day">{copy.add}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
