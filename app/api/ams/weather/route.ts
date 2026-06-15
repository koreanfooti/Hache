import { NextResponse } from "next/server";
import { atlasTravelAirport, atlasTravelBase } from "@/lib/ams/atlasFixtures";

type WeatherPoint = {
  id: "academy" | "airport";
  label: string;
  city: string;
  altitudeMeters: number;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPercent: number | null;
  windKmh: number | null;
  weatherCode: number | null;
  condition: string;
  observedAt: string | null;
};

type OpenMeteoCurrent = {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
};

const weatherPoints = [
  {
    id: "academy" as const,
    label: atlasTravelBase.name,
    city: atlasTravelBase.city,
    latitude: atlasTravelBase.latitude,
    longitude: atlasTravelBase.longitude,
    altitudeMeters: atlasTravelBase.altitudeMeters,
  },
  {
    id: "airport" as const,
    label: `${atlasTravelAirport.name} (${atlasTravelAirport.iata})`,
    city: "Tlajomulco",
    latitude: atlasTravelAirport.latitude,
    longitude: atlasTravelAirport.longitude,
    altitudeMeters: atlasTravelAirport.altitudeMeters,
  },
];

export async function GET() {
  const points = await Promise.all(weatherPoints.map(fetchWeatherPoint));

  return NextResponse.json({
    source: "open-meteo",
    fetchedAt: new Date().toISOString(),
    points,
  });
}

async function fetchWeatherPoint(point: (typeof weatherPoints)[number]): Promise<WeatherPoint> {
  try {
    const params = new URLSearchParams({
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      timezone: "auto",
      forecast_days: "1",
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      next: { revalidate: 900 },
    });

    if (!response.ok) throw new Error("Weather feed unavailable");

    const payload = await response.json() as OpenMeteoCurrent;
    const current = payload.current;

    return {
      id: point.id,
      label: point.label,
      city: point.city,
      altitudeMeters: point.altitudeMeters,
      temperatureC: current?.temperature_2m ?? null,
      apparentTemperatureC: current?.apparent_temperature ?? null,
      humidityPercent: current?.relative_humidity_2m ?? null,
      windKmh: current?.wind_speed_10m ?? null,
      weatherCode: current?.weather_code ?? null,
      condition: weatherCondition(current?.weather_code),
      observedAt: current?.time ?? null,
    };
  } catch {
    return {
      id: point.id,
      label: point.label,
      city: point.city,
      altitudeMeters: point.altitudeMeters,
      temperatureC: null,
      apparentTemperatureC: null,
      humidityPercent: null,
      windKmh: null,
      weatherCode: null,
      condition: "Unavailable",
      observedAt: null,
    };
  }
}

function weatherCondition(code?: number) {
  if (code === undefined) return "Unavailable";
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Mixed";
}
