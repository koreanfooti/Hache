import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

export type Language = AmsLanguage;
export type CalendarEventCategory = "match" | "training" | "testing" | "medical" | "rtp" | "travel" | "meeting";
export type CalendarEventDepartment = "performance" | "medical" | "technical" | "nutrition" | "academy";
export type CalendarTeam = "first-team" | "u21" | "u19" | "u17" | "u15";

export type AtlasTravelContext = {
  isHome: boolean;
  baseName: string;
  airportName: string;
  directionsOriginName: string;
  directionsOriginAddress: string;
  directionsDestinationName: string;
  googleMapsDirectionsUrl: string;
  distanceKm: number;
  airDistanceKm: number;
  groundToAirportKm: number;
  estimatedTravelHours: number;
  estimatedFlightHours: number;
  timezoneDifferenceHours: number;
  altitudeMeters: number;
  altitudeDeltaMeters: number;
  travelMode: "home" | "road" | "air";
  travelLoad: "low" | "moderate" | "high";
};

export type CalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: CalendarEventCategory;
  department: CalendarEventDepartment;
  team: CalendarTeam;
  notes: string;
  source?: string;
  sourceUrl?: string;
  tooltip?: string;
  venue?: string;
  location?: string;
  travelContext?: AtlasTravelContext;
  competition?: string;
};

export type CalendarFormState = Omit<CalendarEvent, "id"> & {
  id: string;
};

export type AtlasFixtureFeedItem = {
  id: string;
  competition: string;
  round: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  status: "finished" | "scheduled";
  score?: string;
  aggregate?: string;
  venue?: string;
  city?: string;
  country?: string;
  location?: string;
  travelContext?: AtlasTravelContext;
};
