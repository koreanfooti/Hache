import { NextResponse } from "next/server";
import { atlasFirstTeamFixtures, atlasVenueByHomeTeam } from "@/lib/ams/atlasFixtures";

export function GET() {
  return NextResponse.json({
    source: "google-sports-panel-snapshot",
    team: "Atlas First Team",
    observedAt: "2026-06-15",
    fixtures: atlasFirstTeamFixtures.map((fixture) => {
      const venue = atlasVenueByHomeTeam[fixture.homeTeam];
      return {
        ...fixture,
        ...venue,
        location: venue ? `${venue.city}, ${venue.country}` : "",
      };
    }),
  });
}
