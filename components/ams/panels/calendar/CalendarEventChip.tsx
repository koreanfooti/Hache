import Image from "next/image";
import type { CalendarEvent } from "@/components/ams/panels/calendar/calendarTypes";
import { competitionLogoPath } from "@/components/ams/panels/calendar/calendarUtils";

export function CalendarEventChip({ event }: { event: CalendarEvent }) {
  const tooltip = event.tooltip || event.notes || event.title;
  const tooltipLines = tooltip.split("\n").filter(Boolean);
  const competitionLogo = event.competition ? competitionLogoPath(event.competition) : undefined;

  return (
    <span
      className={`calendar-event-chip ${event.category}${event.team === "first-team" ? " first-team" : ""}`}
      data-tooltip={tooltip}
      tabIndex={0}
      title={tooltip}
    >
      <span className="calendar-event-label">
        {competitionLogo ? (
          <Image src={competitionLogo} alt="" width={22} height={12} />
        ) : null}
        <span>{event.title}</span>
      </span>
      <span className="calendar-event-tooltip" aria-hidden="true">
        <strong>{tooltipLines[0] ?? event.title}</strong>
        {tooltipLines.slice(1).map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </span>
  );
}
