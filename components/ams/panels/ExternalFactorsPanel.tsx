"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { panelCopy } from "@/components/ams/config/copy";
import { MetricCard, PanelIntro, type AmsLanguage } from "@/components/ams/ui/AmsUi";
import { DateSlicerField } from "@/components/ams/ui/DateSlicerField";

type AtlasTravelContext = {
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

type AtlasFixtureFeedItem = {
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

type EnvironmentWeatherPoint = {
  id: "academy" | "airport";
  label: string;
  city: string;
  altitudeMeters: number;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPercent: number | null;
  windKmh: number | null;
  condition: string;
  observedAt: string | null;
};

export function ExternalFactorsPanel({ language }: { language: AmsLanguage }) {
  const copy = panelCopy[language];
  const [fixtures, setFixtures] = useState<AtlasFixtureFeedItem[]>([]);
  const [weatherPoints, setWeatherPoints] = useState<EnvironmentWeatherPoint[]>([]);
  const [environmentStartDate, setEnvironmentStartDate] = useState("");
  const [environmentEndDate, setEnvironmentEndDate] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFixtures() {
      try {
        const response = await fetch("/api/atlas/fixtures", { cache: "no-store" });
        const payload = await response.json() as { fixtures?: AtlasFixtureFeedItem[] };
        if (isMounted) setFixtures(payload.fixtures ?? []);
      } catch {
        if (isMounted) setFixtures([]);
      }
    }

    async function loadWeather() {
      try {
        const response = await fetch("/api/ams/weather", { cache: "no-store" });
        const payload = await response.json() as { points?: EnvironmentWeatherPoint[] };
        if (isMounted) setWeatherPoints(payload.points ?? []);
      } catch {
        if (isMounted) setWeatherPoints([]);
      }
    }

    loadFixtures();
    loadWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  const awayFixtures = fixtures
    .filter((fixture) => fixture.travelContext && !fixture.travelContext.isHome)
    .sort((a, b) => a.date.localeCompare(b.date));
  const environmentFixtures = fixtures
    .filter((fixture) => fixture.travelContext)
    .sort((a, b) => a.date.localeCompare(b.date));
  const filteredEnvironmentFixtures = environmentFixtures.filter((fixture) =>
    (!environmentStartDate || fixture.date >= environmentStartDate)
    && (!environmentEndDate || fixture.date <= environmentEndDate),
  );
  const filteredAwayFixtures = filteredEnvironmentFixtures.filter((fixture) => fixture.travelContext && !fixture.travelContext.isHome);
  const firstFixtureDate = environmentFixtures[0]?.date ?? "";
  const lastFixtureDate = environmentFixtures.at(-1)?.date ?? "";
  const highestLoadFixture = filteredAwayFixtures.reduce<AtlasFixtureFeedItem | null>((current, fixture) => {
    if (!fixture.travelContext) return current;
    if (!current?.travelContext) return fixture;
    return travelLoadScore(fixture.travelContext.travelLoad) > travelLoadScore(current.travelContext.travelLoad) ? fixture : current;
  }, null);
  const maxDistance = Math.max(...filteredAwayFixtures.map((fixture) => fixture.travelContext?.distanceKm ?? 0), 0);
  const avgTravelHours = filteredAwayFixtures.length
    ? filteredAwayFixtures.reduce((total, fixture) => total + (fixture.travelContext?.estimatedTravelHours ?? 0), 0) / filteredAwayFixtures.length
    : 0;
  const academyWeather = weatherPoints.find((point) => point.id === "academy");
  const airportWeather = weatherPoints.find((point) => point.id === "airport");
  const hasDateFilter = Boolean(environmentStartDate || environmentEndDate);

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.external.kicker}
        title={copy.external.title}
        copy={copy.external.copy}
      />
      <section className="environment-overview-grid">
        <MetricCard
          label={language === "es" ? "Base diaria" : "Daily base"}
          value="Academia AGA"
          detail={environmentWeatherDetail(academyWeather, language, "Zapopan, Jalisco")}
        />
        <MetricCard
          label={language === "es" ? "Aeropuerto" : "Flight anchor"}
          value="GDL"
          detail={environmentWeatherDetail(
            airportWeather,
            language,
            language === "es" ? "Aeropuerto Internacional de Guadalajara" : "Guadalajara International Airport",
          )}
        />
        <MetricCard
          label={language === "es" ? "Viaje máximo" : "Max travel"}
          value={maxDistance ? `${maxDistance.toLocaleString()} km` : copy.common.noData}
          detail={highestLoadFixture ? `${highestLoadFixture.homeTeam} vs ${highestLoadFixture.awayTeam}` : copy.common.waitingForSource}
        />
        <MetricCard
          label={language === "es" ? "Promedio de viaje" : "Avg travel"}
          value={awayFixtures.length ? `${avgTravelHours.toFixed(1)} h` : copy.common.noData}
          detail={language === "es" ? "Estimación por partido fuera" : "Estimated per away match"}
        />
      </section>
      <section className="environment-filter-panel">
        <div>
          <span className="section-kicker">{language === "es" ? "Filtro de fechas" : "Date Slicer"}</span>
          <h3>{language === "es" ? "Partidos en vista" : "Games in view"}</h3>
          <p>
            {filteredEnvironmentFixtures.length} / {environmentFixtures.length}{" "}
            {language === "es" ? "partidos visibles" : "games visible"}
          </p>
        </div>
        <div className="environment-date-controls">
          <DateSlicerField
            emptyLabel={language === "es" ? "Sin fecha seleccionada" : "No date selected"}
            label={language === "es" ? "Desde" : "From"}
            language={language}
            max={environmentEndDate || lastFixtureDate}
            min={firstFixtureDate}
            tooltipDetail={language === "es" ? "Filtra viajes, sedes y carga ambiental." : "Filters travel, venues, and environment load."}
            tooltipTitle={language === "es" ? "Inicio del viaje" : "Travel window start"}
            value={environmentStartDate}
            onChange={setEnvironmentStartDate}
          />
          <DateSlicerField
            emptyLabel={language === "es" ? "Sin fecha seleccionada" : "No date selected"}
            label={language === "es" ? "Hasta" : "To"}
            language={language}
            max={lastFixtureDate}
            min={environmentStartDate || firstFixtureDate}
            tooltipDetail={language === "es" ? "Controla qué partidos aparecen abajo." : "Controls which matches appear below."}
            tooltipTitle={language === "es" ? "Fin del viaje" : "Travel window end"}
            value={environmentEndDate}
            onChange={setEnvironmentEndDate}
          />
          <button
            type="button"
            onClick={() => {
              setEnvironmentStartDate("");
              setEnvironmentEndDate("");
            }}
            disabled={!hasDateFilter}
          >
            {language === "es" ? "Ver todos" : "Show all"}
          </button>
        </div>
      </section>
      <section className="environment-fixture-grid">
        {filteredEnvironmentFixtures.length ? filteredEnvironmentFixtures.map((fixture) => (
          <EnvironmentFixtureCard fixture={fixture} language={language} key={fixture.id} />
        )) : (
          <p className="empty-profile">
            {language === "es"
              ? "No hay partidos en este rango de fechas."
              : "No games match this date range."}
          </p>
        )}
      </section>
    </div>
  );
}

function EnvironmentFixtureCard({ fixture, language }: { fixture: AtlasFixtureFeedItem; language: AmsLanguage }) {
  const context = fixture.travelContext;
  if (!context) return null;
  const homeLogo = clubLogoPath(fixture.homeTeam);
  const awayLogo = clubLogoPath(fixture.awayTeam);
  const competitionLogo = competitionLogoPath(fixture.competition);

  return (
    <article className={`environment-fixture-card ${context.travelLoad}`}>
      <div>
        <div className="environment-card-meta">
          <span>{fixture.date}{fixture.time ? ` · ${fixture.time}` : ""}</span>
          {competitionLogo ? (
            <span className={`environment-competition-badge ${competitionSlug(fixture.competition)}`}>
              <Image src={competitionLogo} alt={`${fixture.competition} logo`} width={74} height={26} />
            </span>
          ) : null}
        </div>
        <h3 className="environment-match-title">
          <ClubLogo team={fixture.homeTeam} logoPath={homeLogo} />
          <span>{fixture.homeTeam}</span>
          <small>vs</small>
          <ClubLogo team={fixture.awayTeam} logoPath={awayLogo} />
          <span>{fixture.awayTeam}</span>
        </h3>
        <p>{fixture.venue} · {fixture.city}, {fixture.country}</p>
      </div>
      <div className="environment-chip-row">
        <span className={`travel-load-chip ${context.travelLoad}`}>
          {language === "es" ? "Carga" : "Load"}: {localizedTravelLoad(context.travelLoad, language)}
        </span>
        <span>{context.distanceKm.toLocaleString()} km</span>
        <span>TZ {formatSignedHours(context.timezoneDifferenceHours)}</span>
        <span>{context.altitudeMeters.toLocaleString()} m</span>
      </div>
      <dl className="environment-detail-list">
        <div>
          <dt>{language === "es" ? "Origen mapa" : "Map origin"}</dt>
          <dd>{context.directionsOriginName}</dd>
        </div>
        <div>
          <dt>{language === "es" ? "Modo" : "Mode"}</dt>
          <dd>{localizedTravelMode(context.travelMode, language)}</dd>
        </div>
        <div>
          <dt>{language === "es" ? "Vuelo est." : "Est. flight"}</dt>
          <dd>{context.estimatedFlightHours ? `${context.estimatedFlightHours.toFixed(1)} h` : "-"}</dd>
        </div>
        <div>
          <dt>{language === "es" ? "Viaje total" : "Total travel"}</dt>
          <dd>{context.estimatedTravelHours.toFixed(1)} h</dd>
        </div>
        <div>
          <dt>{language === "es" ? "Altitud vs AGA" : "Altitude vs AGA"}</dt>
          <dd>{formatSignedMeters(context.altitudeDeltaMeters)}</dd>
        </div>
      </dl>
      <a
        className="environment-map-link"
        href={context.googleMapsDirectionsUrl}
        target="_blank"
        rel="noreferrer"
      >
        {language === "es"
          ? `Abrir Google Maps desde ${context.directionsOriginName}`
          : `Open Google Maps from ${context.directionsOriginName}`}
      </a>
    </article>
  );
}

function ClubLogo({ team, logoPath }: { team: string; logoPath?: string }) {
  if (logoPath) {
    return (
      <span className="environment-club-logo">
        <Image src={logoPath} alt={`${team} crest`} width={34} height={34} />
      </span>
    );
  }

  return (
    <span className="environment-club-logo is-placeholder" aria-label={`${team} crest placeholder`}>
      {teamInitials(team)}
    </span>
  );
}

function localizedTravelLoad(load: AtlasTravelContext["travelLoad"], language: AmsLanguage) {
  const labels = {
    en: { low: "Low", moderate: "Medium", high: "High" },
    es: { low: "Baja", moderate: "Media", high: "Alta" },
  };
  return labels[language][load];
}

function localizedTravelMode(mode: AtlasTravelContext["travelMode"], language: AmsLanguage) {
  const labels = {
    en: { home: "Home", road: "Road", air: "Air" },
    es: { home: "Local", road: "Carretera", air: "Aéreo" },
  };
  return labels[language][mode];
}

function travelLoadScore(load: AtlasTravelContext["travelLoad"]) {
  return { low: 1, moderate: 2, high: 3 }[load];
}

function formatSignedHours(value: number) {
  if (value === 0) return "+0h";
  return `${value > 0 ? "+" : ""}${value}h`;
}

function formatSignedMeters(value: number) {
  if (value === 0) return "+0m";
  return `${value > 0 ? "+" : ""}${value.toLocaleString()}m`;
}

function environmentWeatherDetail(point: EnvironmentWeatherPoint | undefined, language: AmsLanguage, fallback: string) {
  if (!point) return `${fallback} · ${language === "es" ? "Clima pendiente" : "Weather pending"}`;

  const altitude = `${point.altitudeMeters.toLocaleString()}m`;
  if (point.temperatureC === null) {
    return `${point.city} · ${altitude} · ${language === "es" ? "Clima no disponible" : "Weather unavailable"}`;
  }

  return [
    point.city,
    altitude,
    `${Math.round(point.temperatureC)}°C`,
    localizedWeatherCondition(point.condition, language),
    point.humidityPercent !== null ? `${point.humidityPercent}% RH` : "",
  ].filter(Boolean).join(" · ");
}

function localizedWeatherCondition(condition: string, language: AmsLanguage) {
  if (language === "en") return condition;
  const conditions: Record<string, string> = {
    Clear: "Despejado",
    "Partly cloudy": "Parcialmente nublado",
    Cloudy: "Nublado",
    Fog: "Niebla",
    Drizzle: "Llovizna",
    Rain: "Lluvia",
    Snow: "Nieve",
    Thunderstorm: "Tormenta",
    Mixed: "Mixto",
    Unavailable: "No disponible",
  };
  return conditions[condition] ?? condition;
}

function clubLogoPath(team: string) {
  const logos: Record<string, string> = {
    "America": "/ams/assets/clubs/1.png",
    "América": "/ams/assets/clubs/1.png",
    "Atlas": "/ams/assets/clubs/10445.png",
    "Pachuca": "/ams/assets/clubs/11.png",
    "Atl. San Luis": "/ams/assets/clubs/11220.svg",
    "Puebla": "/ams/assets/clubs/11550.png",
    "Juarez": "/ams/assets/clubs/11790.png",
    "Juárez": "/ams/assets/clubs/11790.png",
    "Mazatlan": "/ams/assets/clubs/12043.png",
    "Mazatlán": "/ams/assets/clubs/12043.png",
    "Cruz Azul": "/ams/assets/clubs/12566.svg",
    "Queretaro": "/ams/assets/clubs/13668.png",
    "Querétaro": "/ams/assets/clubs/13668.png",
    "Monterrey": "/ams/assets/clubs/14.png",
    "Santos": "/ams/assets/clubs/14102.png",
    "Tigres": "/ams/assets/clubs/16.svg",
    "Toluca": "/ams/assets/clubs/17.png",
    "Pumas": "/ams/assets/clubs/18.png",
    "Necaxa": "/ams/assets/clubs/29.png",
    "Tijuana": "/ams/assets/clubs/5.png",
    "Guadalajara": "/ams/assets/clubs/7.png",
    "Leon": "/ams/assets/clubs/9.png",
    "León": "/ams/assets/clubs/9.png",
    "Charlotte FC": "/ams/assets/clubs/charlotte-fc.svg",
    "Cincinnati": "/ams/assets/clubs/fc-cincinnati.png",
    "Columbus Crew": "/ams/assets/clubs/columbus-crew.png",
  };
  return logos[team];
}

function competitionLogoPath(competition: string) {
  if (competition.includes("Leagues Cup")) return "/ams/assets/competitions/leagues-cup.png";
  if (competition.includes("Liga MX")) return "/ams/assets/competitions/liga-mx.png";
  return undefined;
}

function competitionSlug(competition: string) {
  if (competition.includes("Leagues Cup")) return "leagues-cup";
  if (competition.includes("Liga MX")) return "liga-mx";
  return "competition";
}

function teamInitials(team: string) {
  return team
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
