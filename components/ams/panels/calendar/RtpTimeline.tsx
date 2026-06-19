import type { CalendarEvent, Language } from "@/components/ams/panels/calendar/calendarTypes";
import {
  clampMonth,
  daysBetween,
  formatEventRange,
  monthName,
  rtpSeverityClass,
  teamLabel,
} from "@/components/ams/panels/calendar/calendarUtils";

export function RtpTimeline({
  copy,
  events,
  language,
  selectedYear,
  onSelectEvent,
}: {
  copy: Record<string, string>;
  events: CalendarEvent[];
  language: Language;
  selectedYear: number;
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const rtpEvents = events.filter((event) => event.category === "rtp").sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <section className="rtp-timeline-panel">
      <div className="panel-heading compact">
        <div>
          <h3>{copy.rtpTimeline}</h3>
          <span>{copy.rtpTimelineSub}</span>
        </div>
      </div>
      <div className="rtp-legend">
        <span className="mild">{copy.mild}</span>
        <span className="minor">{copy.minor}</span>
        <span className="moderate">{copy.moderate}</span>
        <span className="severe">{copy.severe}</span>
      </div>
      <div className="rtp-timeline">
        <div className="rtp-months">
          <span>{copy.athlete}</span>
          {Array.from({ length: 12 }, (_, month) => (
            <span key={month}>{monthName(selectedYear, month, language, "short")}<small>{selectedYear}</small></span>
          ))}
        </div>
        {rtpEvents.length ? rtpEvents.map((event) => {
          const startMonth = clampMonth(new Date(`${event.startDate}T00:00:00`).getMonth());
          const endMonth = clampMonth(new Date(`${event.endDate || event.startDate}T00:00:00`).getMonth());
          const duration = daysBetween(event.startDate, event.endDate);
          const severity = rtpSeverityClass(duration);
          return (
            <div className="rtp-timeline-row" key={event.id}>
              <button className="rtp-athlete" type="button" onClick={() => onSelectEvent(event)}>
                {event.title}
                <small>{teamLabel(event.team, language, copy)}</small>
              </button>
              <button
                className={`rtp-tile ${severity}`}
                type="button"
                style={{ gridColumn: `${startMonth + 2} / ${endMonth + 3}` }}
                onClick={() => onSelectEvent(event)}
              >
                <span>{event.title}</span>
                <small>{formatEventRange(event, language)} · {duration} {copy.days}</small>
              </button>
            </div>
          );
        }) : <p className="empty-profile">{copy.noRtpEvents}</p>}
      </div>
    </section>
  );
}
