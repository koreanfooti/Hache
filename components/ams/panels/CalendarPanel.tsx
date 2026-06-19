"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  calendarCategories,
  calendarCopy,
  calendarDepartments,
  calendarStorageKey,
  calendarTeams,
} from "@/components/ams/panels/calendar/calendarConfig";
import {
  CalendarMonthCard,
  CalendarMonthDetail,
  CalendarTextInput,
} from "@/components/ams/panels/calendar/CalendarMonthViews";
import { RtpTimeline } from "@/components/ams/panels/calendar/RtpTimeline";
import type {
  AtlasFixtureFeedItem,
  CalendarEvent,
  CalendarEventCategory,
  CalendarEventDepartment,
  CalendarFormState,
  CalendarTeam,
  Language,
} from "@/components/ams/panels/calendar/calendarTypes";
import {
  atlasFixtureToCalendarEvent,
  calendarEventToForm,
  emptyCalendarForm,
  eventOverlapsRange,
  eventsForMonth,
  formatEventRange,
  loadCalendarEvents,
  mergeFixtureEvents,
  sortCalendarEvents,
  teamLabel,
} from "@/components/ams/panels/calendar/calendarUtils";

export function CalendarPanel({ language }: { language: Language }) {
  const copy = calendarCopy[language];
  const today = new Date();
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadCalendarEvents());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [previewEvent, setPreviewEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<CalendarFormState>(() => emptyCalendarForm(today.getFullYear(), today.getMonth()));

  useEffect(() => {
    let cancelled = false;

    async function loadFixtureFeed() {
      try {
        const response = await fetch("/api/atlas/fixtures", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json() as { fixtures?: AtlasFixtureFeedItem[] };
        const fixtureEvents = (payload.fixtures ?? []).map(atlasFixtureToCalendarEvent);

        if (!cancelled) {
          setEvents((currentEvents) => {
            const nextEvents = mergeFixtureEvents(currentEvents, fixtureEvents);
            window.localStorage.setItem(calendarStorageKey, JSON.stringify(nextEvents));
            return nextEvents;
          });
        }
      } catch {
        // Keep local calendar events available even if the fixture feed is offline.
      }
    }

    loadFixtureFeed();
    return () => {
      cancelled = true;
    };
  }, []);

  function persistEvents(nextEvents: CalendarEvent[]) {
    const sortedEvents = sortCalendarEvents(nextEvents);
    setEvents(sortedEvents);
    window.localStorage.setItem(calendarStorageKey, JSON.stringify(sortedEvents));
  }

  function selectEvent(event: CalendarEvent) {
    setPreviewEvent(event);
    setForm(calendarEventToForm(event));
    setSelectedYear(new Date(`${event.startDate}T00:00:00`).getFullYear());
    setSelectedMonth(new Date(`${event.startDate}T00:00:00`).getMonth());
  }

  function selectDate(date: string) {
    const nextDate = new Date(`${date}T00:00:00`);
    setSelectedYear(nextDate.getFullYear());
    setSelectedMonth(nextDate.getMonth());
    setPreviewEvent(null);
    setForm(emptyCalendarForm(nextDate.getFullYear(), nextDate.getMonth(), date));
  }

  function updateForm(field: keyof CalendarFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title || !form.startDate) return;

    const startDate = form.startDate;
    const endDate = form.endDate && form.endDate >= startDate ? form.endDate : startDate;
    const nextEvent: CalendarEvent = {
      ...form,
      id: form.id || `event-${Date.now()}`,
      title,
      startDate,
      endDate,
      notes: form.notes.trim(),
    };

    persistEvents(events.filter((item) => item.id !== nextEvent.id).concat(nextEvent));
    setSelectedYear(new Date(`${nextEvent.startDate}T00:00:00`).getFullYear());
    setSelectedMonth(new Date(`${nextEvent.startDate}T00:00:00`).getMonth());
    setPreviewEvent(nextEvent);
    setForm(calendarEventToForm(nextEvent));
  }

  function clearForm() {
    setPreviewEvent(null);
    setForm(emptyCalendarForm(selectedYear, selectedMonth ?? today.getMonth()));
  }

  function removeSelectedEvent() {
    if (!form.id) return;
    persistEvents(events.filter((event) => event.id !== form.id));
    clearForm();
  }

  const displayedEvents = selectedMonth === null
    ? events.filter((event) => eventOverlapsRange(event, `${selectedYear}-01-01`, `${selectedYear}-12-31`))
    : eventsForMonth(events, selectedYear, selectedMonth);

  return (
    <div className="panel-stack schedule-calendar">
      <section className="panel-intro calendar-intro">
        <div>
          <span>{copy.calendar}</span>
          <h2>{copy.scheduleCalendar}</h2>
          <p>{copy.scheduleCalendarSub}</p>
        </div>
        <div className="calendar-toolbar">
          <button className="icon-button" type="button" onClick={() => setSelectedYear((year) => year - 1)} aria-label="Previous year">
            ‹
          </button>
          <strong>{selectedYear}</strong>
          <button className="icon-button" type="button" onClick={() => setSelectedYear((year) => year + 1)} aria-label="Next year">
            ›
          </button>
          <button className="secondary-button" type="button" onClick={() => setIsEditorVisible((visible) => !visible)}>
            {isEditorVisible ? copy.hideEditor : copy.showEditor}
          </button>
          <button className="secondary-button" type="button" onClick={() => setSelectedMonth(null)}>
            {copy.yearView}
          </button>
        </div>
      </section>

      <section className={`calendar-layout${isEditorVisible ? "" : " editor-hidden"}`}>
        <div className="calendar-main">
          <div className={`calendar-year-grid${selectedMonth !== null ? " is-condensed" : ""}`}>
            {Array.from({ length: 12 }, (_, month) => (
              <CalendarMonthCard
                key={month}
                events={events}
                language={language}
                month={month}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onSelectDate={selectDate}
                onSelectEvent={selectEvent}
                onSelectMonth={setSelectedMonth}
              />
            ))}
          </div>

          <CalendarMonthDetail
            copy={copy}
            events={events}
            language={language}
            month={selectedMonth}
            selectedYear={selectedYear}
            onSelectDate={selectDate}
            onSelectEvent={selectEvent}
          />

          <RtpTimeline
            copy={copy}
            events={displayedEvents}
            language={language}
            selectedYear={selectedYear}
            onSelectEvent={selectEvent}
          />
        </div>

        {isEditorVisible && (
          <aside className="calendar-side-panel">
            <div className="panel-heading compact">
              <div>
                <h3>{copy.editEvent}</h3>
                <span>{copy.editorSub}</span>
              </div>
            </div>
            <form className="calendar-event-form" onSubmit={saveEvent}>
              <CalendarTextInput label={copy.eventTitle} value={form.title} placeholder="Atlas U21 vs Rival" onChange={(value) => updateForm("title", value)} />
              <CalendarTextInput label={copy.startDate} type="date" value={form.startDate} onChange={(value) => updateForm("startDate", value)} />
              <CalendarTextInput label={copy.startTime} type="time" value={form.startTime} onChange={(value) => updateForm("startTime", value)} />
              <CalendarTextInput label={copy.endDate} type="date" value={form.endDate} onChange={(value) => updateForm("endDate", value)} />
              <CalendarTextInput label={copy.endTime} type="time" value={form.endTime} onChange={(value) => updateForm("endTime", value)} />
              <label>
                <span>{copy.category}</span>
                <select value={form.category} onChange={(event) => updateForm("category", event.target.value as CalendarEventCategory)}>
                  {calendarCategories.map((category) => (
                    <option key={category} value={category}>{copy[category]}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{copy.department}</span>
                <select value={form.department} onChange={(event) => updateForm("department", event.target.value as CalendarEventDepartment)}>
                  {calendarDepartments.map((department) => (
                    <option key={department} value={department}>{copy[department]}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{copy.team}</span>
                <select value={form.team} onChange={(event) => updateForm("team", event.target.value as CalendarTeam)}>
                  {calendarTeams.map((team) => (
                    <option key={team} value={team}>{teamLabel(team, language, copy)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{copy.notes}</span>
                <textarea value={form.notes} rows={4} placeholder="Comments, travel notes, staff reminders" onChange={(event) => updateForm("notes", event.target.value)} />
              </label>
              <div className="calendar-form-actions">
                <button className="secondary-button" type="button" onClick={clearForm}>{copy.clear}</button>
                <button className="secondary-button danger" type="button" onClick={removeSelectedEvent} disabled={!form.id}>{copy.remove}</button>
                <button className="primary-button" type="submit">{copy.save}</button>
              </div>
            </form>
            <section className="calendar-event-preview">
              <span>{copy.eventDetails}</span>
              {previewEvent ? (
                <>
                  <h3>{previewEvent.title}</h3>
                  <p>{formatEventRange(previewEvent, language)} · {copy[previewEvent.category]} · {copy[previewEvent.department]} · {teamLabel(previewEvent.team, language, copy)}</p>
                  {previewEvent.venue ? <p>{previewEvent.venue}{previewEvent.location ? ` · ${previewEvent.location}` : ""}</p> : null}
                  <p>{previewEvent.notes || copy.noNotes}</p>
                </>
              ) : (
                <p>{copy.selectCalendarEvent}</p>
              )}
            </section>
          </aside>
        )}
      </section>
    </div>
  );
}
