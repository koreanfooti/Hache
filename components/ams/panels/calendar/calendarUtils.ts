import {
  calendarCategories,
  calendarDepartments,
  calendarStorageKey,
  calendarTeams,
  defaultCalendarEvents,
} from "@/components/ams/panels/calendar/calendarConfig";
import type {
  AtlasFixtureFeedItem,
  CalendarEvent,
  CalendarEventCategory,
  CalendarEventDepartment,
  CalendarFormState,
  CalendarTeam,
  Language,
} from "@/components/ams/panels/calendar/calendarTypes";

export function formatSignedHours(value: number) {
  if (value === 0) return "+0h";
  return `${value > 0 ? "+" : ""}${value}h`;
}

export function formatSignedMeters(value: number) {
  if (value === 0) return "+0m";
  return `${value > 0 ? "+" : ""}${value.toLocaleString()}m`;
}

export function competitionLogoPath(competition: string) {
  if (competition.includes("Leagues Cup")) return "/ams/assets/competitions/leagues-cup.png";
  if (competition.includes("Liga MX")) return "/ams/assets/competitions/liga-mx.png";
  return undefined;
}

export function loadCalendarEvents() {
  if (typeof window === "undefined") return defaultCalendarEvents;

  try {
    const stored = JSON.parse(window.localStorage.getItem(calendarStorageKey) || "null");
    if (Array.isArray(stored)) {
      const normalizedEvents = stored.map(normalizeCalendarEvent).filter(Boolean) as CalendarEvent[];
      const storedIds = new Set(normalizedEvents.map((event) => event.id));
      return sortCalendarEvents(normalizedEvents.concat(defaultCalendarEvents.filter((event) => !storedIds.has(event.id))));
    }
  } catch {
    // Ignore malformed local calendar storage and reseed defaults.
  }

  window.localStorage.setItem(calendarStorageKey, JSON.stringify(defaultCalendarEvents));
  return defaultCalendarEvents;
}

export function atlasFixtureToCalendarEvent(fixture: AtlasFixtureFeedItem): CalendarEvent {
  const title = `${fixture.homeTeam} vs ${fixture.awayTeam}`;
  const scoreLine = fixture.score ? `Result: ${fixture.score}` : "Scheduled";
  const aggregateLine = fixture.aggregate ? ` · ${fixture.aggregate}` : "";
  const location = fixture.location || [fixture.city, fixture.country].filter(Boolean).join(", ");
  const venueLine = fixture.venue ? `Venue: ${fixture.venue}${location ? ` · ${location}` : ""}` : "";
  const travelLines = fixture.travelContext ? [
    `Travel load: ${fixture.travelContext.travelLoad.toUpperCase()} · ${fixture.travelContext.distanceKm.toLocaleString()} km`,
    `Est. travel: ${fixture.travelContext.estimatedTravelHours.toFixed(1)}h${
      fixture.travelContext.estimatedFlightHours ? ` · flight ${fixture.travelContext.estimatedFlightHours.toFixed(1)}h` : ""
    }`,
    `TZ: ${formatSignedHours(fixture.travelContext.timezoneDifferenceHours)} · Altitude: ${fixture.travelContext.altitudeMeters.toLocaleString()}m (${formatSignedMeters(fixture.travelContext.altitudeDeltaMeters)} vs AGA)`,
  ] : [];
  const notes = [
    `${fixture.competition} · ${fixture.round}`,
    scoreLine + aggregateLine,
    venueLine,
    ...travelLines,
  ].filter(Boolean).join(" · ");
  const tooltip = [
    title,
    `${fixture.competition} · ${fixture.round}`,
    fixture.time ? `${fixture.date} ${fixture.time}` : fixture.date,
    scoreLine,
    venueLine,
    ...travelLines,
    "Team: First Team",
  ].filter(Boolean).join("\n");

  return {
    id: `atlas-fixture-${fixture.id}`,
    title,
    startDate: fixture.date,
    startTime: fixture.time,
    endDate: fixture.date,
    endTime: fixture.time,
    category: "match",
    department: "technical",
    team: "first-team",
    notes,
    source: "atlas-fixtures-api",
    sourceUrl: "/api/atlas/fixtures",
    tooltip,
    venue: fixture.venue,
    location,
    travelContext: fixture.travelContext,
    competition: fixture.competition,
  };
}

export function mergeFixtureEvents(currentEvents: CalendarEvent[], fixtureEvents: CalendarEvent[]) {
  const fixtureIds = new Set(fixtureEvents.map((event) => event.id));
  const userEvents = currentEvents.filter(
    (event) => event.source !== "atlas-fixtures-api" && !fixtureIds.has(event.id) && !isLegacyAtlasFixture(event),
  );
  return sortCalendarEvents(userEvents.concat(fixtureEvents));
}

export function sortCalendarEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => `${a.startDate} ${a.startTime}`.localeCompare(`${b.startDate} ${b.startTime}`));
}

export function emptyCalendarForm(year: number, month: number, date = calendarDate(year, month, 1)): CalendarFormState {
  return {
    id: "",
    title: "",
    startDate: date,
    startTime: "",
    endDate: date,
    endTime: "",
    category: "match",
    department: "performance",
    team: "first-team",
    notes: "",
  };
}

export function calendarEventToForm(event: CalendarEvent): CalendarFormState {
  return { ...event };
}

export function calendarDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function eventOverlapsRange(event: CalendarEvent, rangeStart: string, rangeEnd: string) {
  return event.startDate <= rangeEnd && (event.endDate || event.startDate) >= rangeStart;
}

export function eventsForDate(events: CalendarEvent[], date: string) {
  return events.filter((event) => eventCoversDate(event, date));
}

export function eventsForMonth(events: CalendarEvent[], year: number, month: number) {
  const monthStart = calendarDate(year, month, 1);
  const monthEnd = calendarDate(year, month, new Date(year, month + 1, 0).getDate());
  return events.filter((event) => eventOverlapsRange(event, monthStart, monthEnd));
}

export function monthName(year: number, month: number, language: Language, style: "short" | "long") {
  return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", { month: style }).format(new Date(year, month, 1));
}

export function dayNames(language: Language) {
  const baseSunday = new Date(2026, 0, 4);
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", { weekday: "short" }).format(
      new Date(baseSunday.getFullYear(), baseSunday.getMonth(), baseSunday.getDate() + index),
    ),
  );
}

export function teamLabel(team: CalendarTeam, language: Language, copy: Record<string, string>) {
  if (team === "first-team") return copy.firstTeam;
  if (language === "es" && team === "u21") return "Sub 21";
  if (language === "es" && team === "u19") return "Sub 19";
  if (language === "es" && team === "u17") return "Sub 17";
  if (language === "es" && team === "u15") return "Sub 15";
  return team.toUpperCase();
}

export function formatEventRange(event: CalendarEvent, language: Language) {
  const locale = language === "es" ? "es-MX" : "en-US";
  const startDate = formatCalendarDate(event.startDate, locale);
  const endDate = event.endDate && event.endDate !== event.startDate ? formatCalendarDate(event.endDate, locale) : "";
  const start = [startDate, event.startTime].filter(Boolean).join(" ");
  const end = [endDate, event.endTime && event.endTime !== event.startTime ? event.endTime : ""].filter(Boolean).join(" ");
  return end ? `${start} - ${end}` : start;
}

export function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate || startDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

export function rtpSeverityClass(days: number) {
  if (days <= 3) return "mild";
  if (days <= 7) return "minor";
  if (days <= 28) return "moderate";
  return "severe";
}

export function clampMonth(month: number) {
  if (Number.isNaN(month)) return 0;
  return Math.min(11, Math.max(0, month));
}

function isLegacyAtlasFixture(event: CalendarEvent) {
  return event.category === "match" && event.team === "first-team" && /^ligamx-\d+$/.test(event.id);
}

function normalizeCalendarEvent(event: Partial<CalendarEvent> & { date?: string }) {
  const startDate = event.startDate || event.date || "";
  if (!event.id || !event.title || !startDate) return null;

  return {
    id: event.id,
    title: event.title,
    startDate,
    startTime: event.startTime || "",
    endDate: event.endDate || startDate,
    endTime: event.endTime || event.startTime || "",
    category: calendarCategories.includes(event.category as CalendarEventCategory) ? event.category as CalendarEventCategory : "meeting",
    department: calendarDepartments.includes(event.department as CalendarEventDepartment) ? event.department as CalendarEventDepartment : "performance",
    team: calendarTeams.includes(event.team as CalendarTeam) ? event.team as CalendarTeam : "first-team",
    notes: event.notes || "",
    source: event.source,
    sourceUrl: event.sourceUrl,
    tooltip: event.tooltip,
    venue: event.venue,
    location: event.location,
    travelContext: event.travelContext,
    competition: event.competition,
  };
}

function eventCoversDate(event: CalendarEvent, date: string) {
  return event.startDate <= date && (event.endDate || event.startDate) >= date;
}

function formatCalendarDate(date: string, locale: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit" }).format(new Date(`${date}T00:00:00`));
}
