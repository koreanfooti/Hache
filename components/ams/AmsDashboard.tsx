"use client";

import Image from "next/image";
import { type CSSProperties, type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import {
  type AmsSection,
  dataSources,
  integrationCards,
  metricDefinitions,
  navItems,
  players,
  sampleGpsRows,
} from "@/lib/ams/content";
import { compactNumber, type GpsDailyRow, loadJson, numberValue } from "@/lib/ams/data";

type CleanGpsRow = GpsDailyRow & {
  amsId?: string;
  cleanPlayerName?: string;
  sourcePlayerName?: string;
  totalDistance?: string;
  hsrAbsDistance?: string;
  hsrRelDistance?: string;
  sprintDistance?: string;
  sprintCount?: string;
  maxSpeedKmh?: string;
  rollupSourceTask?: string;
  isMatch?: string;
};

type InjuryRow = {
  injuryId?: string;
  amsId?: string;
  playerName?: string;
  injuryType?: string;
  injury?: string;
  bodyRegion?: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  totalDaysLost?: number;
};

type BodyCompRow = {
  playerName?: string;
  category?: string;
  testDate?: string;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  muscleKg?: number;
  adiposeKg?: number;
  skinfold6?: number;
};

type FmsAssessmentRow = {
  assessmentId?: string;
  amsId?: string;
  matchedAthleteName?: string;
  dateIso?: string;
  totalScore?: number;
  scoreBand?: string;
  riskFlag?: string;
  primaryFinding1?: string;
  primaryFinding2?: string;
};

type YBalanceAssessmentRow = {
  assessmentId?: string;
  amsId?: string;
  matchedAthleteName?: string;
  dateIso?: string;
  testType?: string;
  compositeScore?: number;
  riskFlag?: string;
};

type LoadSummary = {
  rows: CleanGpsRow[];
  totalDistance: number;
  highIntensity: number;
  maxSpeed: number;
  sessions: number;
  status: string;
};

type SourceData = {
  injuries: InjuryRow[];
  bodyComp: BodyCompRow[];
  fms: FmsAssessmentRow[];
  yBalance: YBalanceAssessmentRow[];
  status: string;
};

type Language = "en" | "es";
type CalendarEventCategory = "match" | "training" | "testing" | "medical" | "rtp" | "travel" | "meeting";
type CalendarEventDepartment = "performance" | "medical" | "technical" | "nutrition" | "academy";
type CalendarTeam = "first-team" | "u21" | "u19" | "u17" | "u15";

type CalendarEvent = {
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
};

type CalendarFormState = Omit<CalendarEvent, "id"> & {
  id: string;
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
};

const sectionMap: Record<AmsSection, string> = Object.fromEntries(
  navItems.map((item) => [item.id, item.label]),
) as Record<AmsSection, string>;

const uiCopy = {
  en: {
    assistantKicker: "Private Performance Assistant",
    assistantPlaceholder: "Ask about a player, injury, session, test, or resource...",
    assistantPrompt: "How can H help you?",
    assistantStatus:
      "RAG-ready placeholder. Connect a private vector database and LLM endpoint when the backend is ready.",
    appEyebrow: "Atlas FC Performance Operations",
    appTitle: "Athlete Monitoring System",
    ask: "Ask",
    calendar: "Calendar",
    home: "Home",
    language: "Language",
    openSettings: "Open settings",
    playerCarousel: "Players currently in view",
    rtpPlanning: "RTP planning",
    showNextPlayer: "Show next player",
    showPreviousPlayer: "Show previous player",
    contextCopy:
      "Integrated staff view for daily load, medical risk, development, recovery, biography, and off-field context.",
    contextKicker: "First Team Monitoring",
    exportCsv: "Export CSV",
    playersInView: "Players in view",
    ragExampleLabel: "Example RAG",
    ragExamplePrompt: "Try: Show {player}'s hamstring RTP risk this week.",
    resources: "Resources",
    sections: {
      load: "Load Demand",
      injury: "Injury History",
      development: "Physical Development",
      recovery: "Recovery",
      biography: "Biography",
      external: "External Factors",
    },
  },
  es: {
    assistantKicker: "Asistente privado de rendimiento",
    assistantPlaceholder: "Pregunta sobre un jugador, lesión, sesión, prueba o recurso...",
    assistantPrompt: "¿Cómo puede ayudarte H?",
    assistantStatus:
      "Marcador listo para RAG. Conecta una base vectorial privada y un endpoint LLM cuando el backend esté listo.",
    appEyebrow: "Operaciones de rendimiento Atlas FC",
    appTitle: "Sistema de monitoreo de atletas",
    ask: "Preguntar",
    calendar: "Calendario",
    home: "Inicio",
    language: "Idioma",
    openSettings: "Abrir configuración",
    playerCarousel: "Jugadores actualmente en vista",
    rtpPlanning: "Planificación RTP",
    showNextPlayer: "Mostrar siguiente jugador",
    showPreviousPlayer: "Mostrar jugador anterior",
    contextCopy:
      "Vista integrada del staff para carga diaria, riesgo médico, desarrollo, recuperación, biografía y contexto externo.",
    contextKicker: "Monitoreo del primer equipo",
    exportCsv: "Exportar CSV",
    playersInView: "Jugadores en vista",
    ragExampleLabel: "Ejemplo RAG",
    ragExamplePrompt: "Prueba: muestra el riesgo RTP de isquios de {player} esta semana.",
    resources: "Recursos",
    sections: {
      load: "Carga",
      injury: "Historial de lesiones",
      development: "Desarrollo físico",
      recovery: "Recuperación",
      biography: "Biografía",
      external: "Factores externos",
    },
  },
} satisfies Record<Language, {
  appEyebrow: string;
  appTitle: string;
  assistantKicker: string;
  assistantPlaceholder: string;
  assistantPrompt: string;
  assistantStatus: string;
  ask: string;
  calendar: string;
  home: string;
  language: string;
  openSettings: string;
  playerCarousel: string;
  rtpPlanning: string;
  showNextPlayer: string;
  showPreviousPlayer: string;
  contextCopy: string;
  contextKicker: string;
  exportCsv: string;
  playersInView: string;
  ragExampleLabel: string;
  ragExamplePrompt: string;
  resources: string;
  sections: Partial<Record<AmsSection, string>>;
}>;

const calendarCopy = {
  en: {
    add: "Add",
    academy: "Academy",
    athlete: "Athlete",
    calendar: "Calendar",
    category: "Category",
    clear: "Clear",
    days: "days",
    department: "Department",
    editEvent: "Edit Event",
    editorSub: "Add matches, travel, testing, recovery blocks, or staff notes.",
    endDate: "End Date",
    endTime: "End Time",
    eventDetails: "Event Details",
    eventTitle: "Title",
    firstTeam: "First Team",
    hideEditor: "Hide Editor",
    match: "Match",
    matchFeed: "First team match feed",
    medical: "Medical",
    meeting: "Meeting",
    mild: "Mild (1-3d)",
    minor: "Minor (4-7d)",
    moderate: "Moderate (8-28d)",
    noNotes: "No notes.",
    noRtpEvents: "No RTP events for this view yet.",
    notes: "Notes",
    nutrition: "Nutrition",
    performance: "Performance",
    remove: "Remove",
    rtp: "RTP",
    rtpTimeline: "RTP Calendar",
    rtpTimelineSub: "Rehab and return-to-play windows created from RTP calendar events.",
    save: "Save",
    scheduleCalendar: "Schedule / Calendar",
    scheduleCalendarSub: "Year overview, monthly planning, match days, staff notes, and external factors.",
    selectCalendarEvent: "Hover or click a calendar event to view notes.",
    severe: "Severe (>28d)",
    showEditor: "Show Editor",
    startDate: "Start Date",
    startTime: "Start Time",
    team: "Team",
    technical: "Technical",
    testing: "Testing",
    training: "Training",
    travel: "Travel",
    yearView: "Year View",
  },
  es: {
    add: "Agregar",
    academy: "Academia",
    athlete: "Atleta",
    calendar: "Calendario",
    category: "Categoría",
    clear: "Limpiar",
    days: "días",
    department: "Departamento",
    editEvent: "Editar evento",
    editorSub: "Agrega partidos, viajes, pruebas, bloques de recuperación o notas del staff.",
    endDate: "Fecha final",
    endTime: "Hora final",
    eventDetails: "Detalles del evento",
    eventTitle: "Título",
    firstTeam: "Primer Equipo",
    hideEditor: "Ocultar editor",
    match: "Partido",
    matchFeed: "Feed de partidos del primer equipo",
    medical: "Médico",
    meeting: "Reunión",
    mild: "Leve (1-3d)",
    minor: "Menor (4-7d)",
    moderate: "Moderado (8-28d)",
    noNotes: "Sin notas.",
    noRtpEvents: "No hay eventos RTP para esta vista todavía.",
    notes: "Notas",
    nutrition: "Nutrición",
    performance: "Rendimiento",
    remove: "Eliminar",
    rtp: "RTP",
    rtpTimeline: "Calendario RTP",
    rtpTimelineSub: "Ventanas de rehabilitación y retorno creadas desde eventos RTP del calendario.",
    save: "Guardar",
    scheduleCalendar: "Calendario / Programación",
    scheduleCalendarSub: "Vista anual, planeación mensual, partidos, notas del staff y factores externos.",
    selectCalendarEvent: "Pasa encima o haz clic en un evento para ver notas.",
    severe: "Severo (>28d)",
    showEditor: "Mostrar editor",
    startDate: "Fecha inicial",
    startTime: "Hora inicial",
    team: "Equipo",
    technical: "Técnico",
    testing: "Pruebas",
    training: "Entrenamiento",
    travel: "Viaje",
    yearView: "Vista anual",
  },
} satisfies Record<Language, Record<string, string>>;

const defaultCalendarEvents: CalendarEvent[] = [
  {
    id: "rtp-example-gustavo-hamstring",
    title: "Gustavo Ferrareis RTP - Hamstring",
    startDate: "2026-06-08",
    startTime: "08:30",
    endDate: "2026-06-24",
    endTime: "12:00",
    category: "rtp",
    department: "performance",
    team: "first-team",
    notes: "Example RTP block: left biceps femoris rehab. Phase 1 pain-free isometrics, Phase 2 progressive running exposure, Phase 3 high-speed return and football-specific integration.",
  },
];

const calendarCategories: CalendarEventCategory[] = ["match", "training", "testing", "medical", "rtp", "travel", "meeting"];
const calendarDepartments: CalendarEventDepartment[] = ["performance", "medical", "technical", "nutrition", "academy"];
const calendarTeams: CalendarTeam[] = ["first-team", "u21", "u19", "u17", "u15"];
const calendarStorageKey = "atlasScheduleEvents";

const missingPhotoMarkers = ["example_", "download-removebg-preview", "prod-removebg-preview"];


const panelCopy = {
  en: {
    common: {
      records: "records",
      sessions: "sessions",
      injuries: "injuries",
      tests: "tests",
      pending: "Pending",
      noData: "No data",
      noDate: "No date",
      noFlag: "No flag",
      noGroup: "No group",
      noRegion: "No region",
      noRecords: "No records loaded yet",
      noScore: "No score",
      unclassified: "Unclassified",
      unknownPlayer: "Unknown player",
      waitingForSource: "Waiting for source",
      readyForComponentExtraction: "Ready for component extraction",
    },
    load: {
      kicker: "WIMU/GPS Physical Load",
      title: "Load Demand",
      copy: "Daily physical movement and workload metrics from the cleaned WIMU/GPS feed.",
      totalDistance: "Total Distance",
      highIntensity: "High Intensity",
      maxSpeed: "Max Speed",
      dataStatus: "Data Status",
      absoluteRelativeExposure: "Absolute + relative exposure",
      peakRecordedValue: "Peak recorded value",
      servedFromPublicData: "Served from public/ams/data",
      recentTrend: "Recent Load Trend",
      recentTrendSub: "Last 10 rows from GPS daily feed",
    },
    injury: {
      kicker: "Medical",
      title: "Injury History",
      copy: "Cleaned injury history rendered from the same source files used by the static prototype.",
      injuryEvents: "Injury events",
      cleanInjuryRecords: "Clean injury records",
      daysLost: "Days lost",
      totalUnavailableDays: "Total unavailable days",
      topRegion: "Top region",
      mostFrequentRegion: "Most frequent body region",
      latestRecord: "Latest record",
      latestRecords: "Latest Injury Records",
      recentMedicalEvents: "Recent cleaned medical events",
    },
    development: {
      kicker: "Physical Development",
      title: "VALD Testing Battery",
      copy: "Next-native rendering for FMS, Y Balance, VALD/NordBord, and future ForceFrame panels.",
      fmsAssessments: "FMS assessments",
      movementRecords: "Movement screen records",
      yBalanceTests: "Y Balance tests",
      reachRecords: "Reach and asymmetry records",
      latestFmsScore: "Latest FMS score",
      sourceStatus: "Source status",
      cleanJson: "Clean JSON",
      latestFmsAssessments: "Latest FMS Assessments",
      cleanedMovementResults: "Cleaned movement screen results",
      valdDevices: "VALD Devices",
      valdCopy: "Mapped NordBord tests and profile IDs.",
      nordbordCopy: "Force, impulse, asymmetry, and time-to-peak views.",
      fmsCopy: "Movement score cards and component images.",
      ybtTitle: "Y Balance Test",
      ybtCopy: "Composite reach scores and asymmetry flags.",
    },
    bodyComp: {
      kicker: "ISAK / Body Composition",
      title: "Body Composition Dashboard",
      copy: "Anthropometry and composition records loaded from the cleaned body composition source.",
      records: "Records",
      cleanRows: "Clean body comp rows",
      avgWeight: "Avg weight",
      acrossLoadedRecords: "Across loaded records",
      avgMuscle: "Avg muscle",
      muscleEstimate: "Muscle mass estimate",
      avgSkinfold: "Avg 6-site skinfold",
      skinfoldSum: "ISAK skinfold sum",
      latestRecords: "Latest Body Composition Records",
      recentDates: "Most recent test dates",
    },
    recovery: {
      kicker: "Recovery",
      title: "Recovery Services",
      copy: "Cleaned rehab-services data has been moved into the Next public data tree and can now be rendered as a proper panel.",
      items: ["Daily services", "Monthly summary", "Player usage", "Sync audit"],
    },
    biography: {
      kicker: "Player Biography",
      amsId: "AMS ID",
      primaryIdentity: "Primary app identity",
      age: "Age",
      profileData: "Profile data",
      heightWeight: "Height / Weight",
      biographySource: "Biography source",
      preferredFoot: "Preferred foot",
      pendingSourceMerge: "Pending source merge where needed",
    },
    external: {
      kicker: "External Context",
      title: "External Factors",
      copy: "Holding area for match context, travel, off-field availability, and future Opta/PlayerData integrations.",
      items: ["Match context", "Travel", "Availability", "Off-field notes"],
    },
    calendar: {
      kicker: "Planning",
      title: "Schedule / Calendar",
      copy: "The standalone calendar used localStorage for RTP and planning events; this panel is ready to become a typed React calendar.",
      items: ["Event editor", "RTP timeline", "Month detail", "Local storage migration"],
    },
    resources: {
      kicker: "Library",
      title: "Resources",
      copy: "Resources, PDFs, folders, and links should move from localStorage into an authenticated backend in the next pass.",
      items: ["Folders", "PDF preview", "Links", "File metadata"],
    },
    settings: {
      kicker: "Identity Map",
      title: "Player Registry",
      copy: "Source registry for API, CSV, WIMU/GPS, VALD, and manual data sync.",
    },
  },
  es: {
    common: {
      records: "registros",
      sessions: "sesiones",
      injuries: "lesiones",
      tests: "pruebas",
      pending: "Pendiente",
      noData: "Sin datos",
      noDate: "Sin fecha",
      noFlag: "Sin indicador",
      noGroup: "Sin grupo",
      noRegion: "Sin región",
      noRecords: "Aún no hay registros cargados",
      noScore: "Sin puntaje",
      unclassified: "Sin clasificar",
      unknownPlayer: "Jugador desconocido",
      waitingForSource: "Esperando fuente",
      readyForComponentExtraction: "Listo para extraer como componente",
    },
    load: {
      kicker: "Carga física WIMU/GPS",
      title: "Carga",
      copy: "Métricas diarias de movimiento físico y carga de trabajo desde el feed limpio de WIMU/GPS.",
      totalDistance: "Distancia total",
      highIntensity: "Alta intensidad",
      maxSpeed: "Velocidad máxima",
      dataStatus: "Estado de datos",
      absoluteRelativeExposure: "Exposición absoluta y relativa",
      peakRecordedValue: "Valor pico registrado",
      servedFromPublicData: "Servido desde public/ams/data",
      recentTrend: "Tendencia reciente de carga",
      recentTrendSub: "Últimas 10 filas del feed diario GPS",
    },
    injury: {
      kicker: "Médico",
      title: "Historial de lesiones",
      copy: "Historial limpio de lesiones renderizado desde los mismos archivos fuente usados por el prototipo estático.",
      injuryEvents: "Eventos de lesión",
      cleanInjuryRecords: "Registros limpios de lesión",
      daysLost: "Días perdidos",
      totalUnavailableDays: "Total de días no disponibles",
      topRegion: "Región principal",
      mostFrequentRegion: "Región corporal más frecuente",
      latestRecord: "Registro más reciente",
      latestRecords: "Registros recientes de lesiones",
      recentMedicalEvents: "Eventos médicos limpios recientes",
    },
    development: {
      kicker: "Desarrollo físico",
      title: "Batería de pruebas VALD",
      copy: "Renderizado nativo en Next para FMS, Y Balance, VALD/NordBord y futuros paneles ForceFrame.",
      fmsAssessments: "Evaluaciones FMS",
      movementRecords: "Registros de pantalla de movimiento",
      yBalanceTests: "Pruebas Y Balance",
      reachRecords: "Registros de alcance y asimetría",
      latestFmsScore: "Último puntaje FMS",
      sourceStatus: "Estado de fuente",
      cleanJson: "JSON limpio",
      latestFmsAssessments: "Evaluaciones FMS recientes",
      cleanedMovementResults: "Resultados limpios de pantalla de movimiento",
      valdDevices: "Dispositivos VALD",
      valdCopy: "Pruebas NordBord e IDs de perfil mapeados.",
      nordbordCopy: "Vistas de fuerza, impulso, asimetría y tiempo al pico.",
      fmsCopy: "Tarjetas de puntaje de movimiento e imágenes de componentes.",
      ybtTitle: "Prueba Y Balance",
      ybtCopy: "Puntajes compuestos de alcance e indicadores de asimetría.",
    },
    bodyComp: {
      kicker: "ISAK / Composición corporal",
      title: "Panel de composición corporal",
      copy: "Registros de antropometría y composición cargados desde la fuente limpia de composición corporal.",
      records: "Registros",
      cleanRows: "Filas limpias de composición corporal",
      avgWeight: "Peso promedio",
      acrossLoadedRecords: "En los registros cargados",
      avgMuscle: "Músculo promedio",
      muscleEstimate: "Estimación de masa muscular",
      avgSkinfold: "Promedio de 6 pliegues",
      skinfoldSum: "Suma de pliegues ISAK",
      latestRecords: "Registros recientes de composición corporal",
      recentDates: "Fechas de prueba más recientes",
    },
    recovery: {
      kicker: "Recuperación",
      title: "Servicios de recuperación",
      copy: "Los datos limpios de servicios de rehabilitación se movieron al árbol público de datos de Next y ya pueden renderizarse como un panel formal.",
      items: ["Servicios diarios", "Resumen mensual", "Uso por jugador", "Auditoría de sincronización"],
    },
    biography: {
      kicker: "Biografía del jugador",
      amsId: "ID AMS",
      primaryIdentity: "Identidad principal de la app",
      age: "Edad",
      profileData: "Datos de perfil",
      heightWeight: "Altura / peso",
      biographySource: "Fuente biográfica",
      preferredFoot: "Pierna dominante",
      pendingSourceMerge: "Pendiente de unir fuente cuando sea necesario",
    },
    external: {
      kicker: "Contexto externo",
      title: "Factores externos",
      copy: "Área para contexto de partido, viaje, disponibilidad fuera de cancha y futuras integraciones Opta/PlayerData.",
      items: ["Contexto de partido", "Viaje", "Disponibilidad", "Notas externas"],
    },
    calendar: {
      kicker: "Planificación",
      title: "Calendario / agenda",
      copy: "El calendario independiente usaba localStorage para eventos RTP y de planificación; este panel está listo para convertirse en un calendario React tipado.",
      items: ["Editor de eventos", "Cronología RTP", "Detalle mensual", "Migración de localStorage"],
    },
    resources: {
      kicker: "Biblioteca",
      title: "Recursos",
      copy: "Recursos, PDFs, carpetas y enlaces deben moverse de localStorage a un backend autenticado en el siguiente pase.",
      items: ["Carpetas", "Vista previa PDF", "Enlaces", "Metadatos de archivo"],
    },
    settings: {
      kicker: "Mapa de identidad",
      title: "Registro de jugadores",
      copy: "Registro fuente para API, CSV, WIMU/GPS, VALD y sincronización manual de datos.",
    },
  },
} as const;

function localizedValue(value: string | number | undefined, language: Language) {
  const text = String(value ?? "");
  if (language === "en") return text;
  return text
    .replaceAll("Pending API", "API pendiente")
    .replaceAll("Pending", "Pendiente")
    .replaceAll("Left Foot", "Pie izquierdo")
    .replaceAll("Right Foot", "Pie derecho")
    .replaceAll("Goalkeeper", "Portero")
    .replaceAll("Defender", "Defensa")
    .replaceAll("Midfielder", "Mediocampista")
    .replaceAll("Forward", "Delantero")
    .replaceAll("Unassigned", "Sin asignar")
    .replaceAll("Brazilian", "Brasileño")
    .replaceAll("Argentine", "Argentino")
    .replaceAll("Mexico", "México")
    .replaceAll("Spain", "España")
    .replaceAll("Pending source", "Fuente pendiente");
}

function localizedLoadStatus(status: string, language: Language) {
  if (language === "en") return status;
  if (status.startsWith("Loaded")) {
    return status
      .replace("Loaded", "Cargados")
      .replace("current-roster WIMU/GPS daily records", "registros diarios WIMU/GPS de plantilla actual")
      .replace("sample WIMU/GPS records", "registros de muestra WIMU/GPS")
      .replace("clean module records", "registros limpios de módulos");
  }
  return localizedValue(status, language)
    .replace("Using sample WIMU/GPS records.", "Usando registros de muestra WIMU/GPS.")
    .replace("Data feed unavailable", "Feed de datos no disponible");
}

function localizedMetricDefinition(label: string, description: string, unit: string, language: Language) {
  if (language === "en") return { label, description, unit };

  const definitions: Record<string, [string, string, string]> = {
    "Total distance": ["Distancia total", "Distancia total cubierta durante la sesión o ventana de fechas seleccionada.", "m"],
    "HSR absolute": ["HSR absoluto", "Distancia cubierta por encima del umbral absoluto HSR, por defecto 21 km/h.", "m"],
    "HSR relative": ["HSR relativo", "Distancia cubierta por encima del 75.5% de la velocidad máxima del jugador.", "m"],
    "Sprint absolute": ["Sprint absoluto", "Distancia cubierta por encima del umbral absoluto de sprint, por defecto 24 km/h.", "m"],
    "Sprint relative": ["Sprint relativo", "Distancia cubierta por encima del 95% de la velocidad máxima del jugador.", "m"],
    "High acceleration": ["Alta aceleración", "Conteo de aceleraciones de alta intensidad por encima de +3 m/s².", "conteo"],
    "High deceleration": ["Alta desaceleración", "Conteo de desaceleraciones de alta intensidad por debajo de -3 m/s².", "conteo"],
  };
  const translated = definitions[label];
  return translated ? { label: translated[0], description: translated[1], unit: translated[2] } : { label, description, unit };
}

function localizedIntegrationStatus(status: string, language: Language) {
  if (language === "en") return status;
  const statuses: Record<string, string> = {
    "Active cleaned feed": "Feed limpio activo",
    "NordBord mapped": "NordBord mapeado",
    "Testing battery": "Batería de pruebas",
    "Future API": "API futura",
    "Future match context": "Contexto futuro de partido",
    "Future source": "Fuente futura",
  };
  return statuses[status] ?? status;
}

function localizedSourceLabel(label: string, language: Language) {
  if (language === "en") return label;
  const labels: Record<string, string> = {
    "GPS daily rollup": "Resumen diario GPS",
    "Current roster GPS": "GPS de plantilla actual",
    "Injury history": "Historial de lesiones",
    "Body composition": "Composición corporal",
    "FMS assessments": "Evaluaciones FMS",
    "Y Balance assessments": "Evaluaciones Y Balance",
    "VALD NordBord tests": "Pruebas VALD NordBord",
    "Rehab services": "Servicios de rehabilitación",
  };
  return labels[label] ?? label;
}

function hasPlayerPhoto(player: (typeof players)[number]) {
  return Boolean(player.photo) && !missingPhotoMarkers.some((marker) => player.photo.includes(marker));
}

export default function AmsDashboard() {
  const [activeSection, setActiveSection] = useState<AmsSection>("overview");
  const [language, setLanguage] = useState<Language>("en");
  const [selectedPlayerId, setSelectedPlayerId] = useState("gustavo-ferrareis");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loadSummary, setLoadSummary] = useState<LoadSummary>({
    rows: [],
    totalDistance: 0,
    highIntensity: 0,
    maxSpeed: 0,
    sessions: 0,
    status: "Loading WIMU/GPS feed...",
  });
  const [sourceData, setSourceData] = useState<SourceData>({
    injuries: [],
    bodyComp: [],
    fms: [],
    yBalance: [],
    status: "Loading clean AMS modules...",
  });

  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? players[0];

  function rotateSelectedPlayer(direction: 1 | -1) {
    const currentIndex = Math.max(
      0,
      players.findIndex((player) => player.id === selectedPlayerId),
    );
    const nextIndex = (currentIndex + direction + players.length) % players.length;
    setSelectedPlayerId(players[nextIndex].id);
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSelectedPlayerId((currentPlayerId) => {
        const currentIndex = Math.max(
          0,
          players.findIndex((player) => player.id === currentPlayerId),
        );
        const nextIndex = (currentIndex + 1) % players.length;
        return players[nextIndex].id;
      });
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let rows = await loadJson<CleanGpsRow>("/ams/data/clean/gps/gps_player_daily_current_roster.json");
        let sourceLabel = "current-roster WIMU/GPS daily records";

        if (!rows.length) {
          rows = sampleGpsRows;
          sourceLabel = "sample WIMU/GPS records";
        }

        if (cancelled) return;

        const totalDistance = rows.reduce(
          (total, row) => total + numberValue(row.totalDistance ?? row.total_distance_m),
          0,
        );
        const highIntensity = rows.reduce(
          (total, row) =>
            total +
            numberValue(row.high_intensity_m ?? row.highIntensityDistance ?? row.hsrAbsDistance),
          0,
        );
        const maxSpeed = rows.reduce(
          (peak, row) => Math.max(peak, numberValue(row.maxSpeedKmh ?? row.max_speed_kmh ?? row.maxSpeed)),
          0,
        );

        setLoadSummary({
          rows,
          totalDistance,
          highIntensity,
          maxSpeed,
          sessions: rows.length,
          status: `Loaded ${compactNumber(rows.length)} ${sourceLabel}.`,
        });
      } catch (error) {
        const rows: CleanGpsRow[] = sampleGpsRows;
        const totalDistance = rows.reduce(
          (total, row) => total + numberValue(row.total_distance_m ?? row.totalDistance),
          0,
        );
        const highIntensity = rows.reduce(
          (total, row) => total + numberValue(row.high_intensity_m ?? row.highIntensityDistance),
          0,
        );
        const maxSpeed = rows.reduce(
          (peak, row) => Math.max(peak, numberValue(row.max_speed_kmh ?? row.maxSpeed)),
          0,
        );

        setLoadSummary((current) => ({
          ...current,
          rows,
          totalDistance,
          highIntensity,
          maxSpeed,
          sessions: rows.length,
          status:
            error instanceof Error
              ? `Using sample WIMU/GPS records. Data feed unavailable: ${error.message}`
              : "Using sample WIMU/GPS records.",
        }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadModules() {
      const [injuries, bodyComp, fms, yBalance] = await Promise.all([
        loadJson<InjuryRow>("/ams/data/clean/injuries/injury_history_clean.json").catch(() => []),
        loadJson<BodyCompRow>("/ams/data/clean/body_comp/body_comp_clean.json").catch(() => []),
        loadJson<FmsAssessmentRow>("/ams/data/clean/tests/fms_assessments_clean.json").catch(() => []),
        loadJson<YBalanceAssessmentRow>("/ams/data/clean/tests/y_balance_assessments_clean.json").catch(() => []),
      ]);

      if (cancelled) return;

      setSourceData({
        injuries,
        bodyComp,
        fms,
        yBalance,
        status: `Loaded ${compactNumber(injuries.length + bodyComp.length + fms.length + yBalance.length)} clean module records.`,
      });
    }

    loadModules();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="ams-app">
      <AppHeader
        activeLabel={sectionMap[activeSection]}
        language={language}
        onGoHome={() => setActiveSection("overview")}
        onLanguageChange={setLanguage}
        onOpenCalendar={() => setActiveSection("calendar")}
        onOpenResources={() => setActiveSection("resources")}
        onOpenSettings={() => setActiveSection("settings")}
      />
      <div className="ams-shell">
        <section className="ams-stage">
          <ContextStrip language={language} playerCount={players.length} />
          <PlayerStrip
            language={language}
            selectedPlayerId={selectedPlayerId}
            onNext={() => rotateSelectedPlayer(1)}
            onPrevious={() => rotateSelectedPlayer(-1)}
            onSelect={setSelectedPlayerId}
          />
          <Sidebar activeSection={activeSection} language={language} onSelect={setActiveSection} />
          {activeSection === "overview" && (
            <OverviewPanel
              currentTime={currentTime}
              language={language}
              loadSummary={loadSummary}
              sourceData={sourceData}
              selectedPlayer={selectedPlayer}
              onSelectSection={setActiveSection}
            />
          )}
          {activeSection === "load" && <LoadPanel language={language} loadSummary={loadSummary} />}
          {activeSection === "injury" && <InjuryPanel language={language} injuries={sourceData.injuries} />}
          {activeSection === "development" && (
            <DevelopmentPanel language={language} fms={sourceData.fms} yBalance={sourceData.yBalance} />
          )}
          {activeSection === "bodyComp" && <BodyCompositionPanel language={language} rows={sourceData.bodyComp} />}
          {activeSection === "recovery" && <RecoveryPanel language={language} />}
          {activeSection === "biography" && <BiographyPanel language={language} selectedPlayer={selectedPlayer} />}
          {activeSection === "external" && <ExternalFactorsPanel language={language} />}
          {activeSection === "calendar" && <CalendarPanel language={language} />}
          {activeSection === "resources" && <ResourcesPanel language={language} />}
          {activeSection === "settings" && <SettingsPanel language={language} />}
        </section>
      </div>
    </main>
  );
}

function AppHeader({
  activeLabel,
  language,
  onGoHome,
  onLanguageChange,
  onOpenCalendar,
  onOpenResources,
  onOpenSettings,
}: {
  activeLabel: string;
  language: Language;
  onGoHome: () => void;
  onLanguageChange: (language: Language) => void;
  onOpenCalendar: () => void;
  onOpenResources: () => void;
  onOpenSettings: () => void;
}) {
  const copy = uiCopy[language];

  return (
    <header className="ams-header">
      <button className="ams-brand" type="button" onClick={onGoHome} aria-label={copy.home}>
        <Image
          src="/ams/assets/clubs/10445.png"
          alt="Atlas FC crest"
          width={64}
          height={64}
          priority
        />
        <div>
          <p>{copy.appEyebrow}</p>
          <h1>{copy.appTitle}</h1>
        </div>
      </button>
      <div className="ams-header-actions">
        <button className="resources-action" type="button" onClick={onOpenResources}>
          <Image src="/ams/assets/resources-document.png" alt="" width={22} height={22} />
          {copy.resources}
        </button>
        <button className="calendar-button" type="button" onClick={onOpenCalendar} aria-label={copy.calendar}>
          <Image src="/ams/assets/calendar-clock.png" alt="" width={28} height={28} />
        </button>
        <span className="language-action" aria-label={copy.language}>
          <button
            className={language === "en" ? "is-active" : ""}
            type="button"
            onClick={() => onLanguageChange("en")}
            aria-label="Switch to English"
          >
            🇬🇧
          </button>
          <button
            className={language === "es" ? "is-active" : ""}
            type="button"
            onClick={() => onLanguageChange("es")}
            aria-label="Cambiar a español"
          >
            🇲🇽
          </button>
        </span>
        <button type="button" onClick={onOpenSettings} aria-label={copy.openSettings}>
          ⚙
        </button>
        <span className="active-section-pill">{activeLabel}</span>
        <button type="button">{copy.exportCsv}</button>
      </div>
    </header>
  );
}

function Sidebar({
  activeSection,
  language,
  onSelect,
}: {
  activeSection: AmsSection;
  language: Language;
  onSelect: (section: AmsSection) => void;
}) {
  const copy = uiCopy[language];
  const sectionLabels: Partial<Record<AmsSection, string>> = copy.sections;

  return (
    <nav className="ams-sidebar" aria-label="AMS sections">
      {navItems.filter((item) =>
        ["load", "injury", "development", "recovery", "biography", "external"].includes(item.id),
      ).map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === activeSection ? "is-active" : ""}
          onClick={() => onSelect(item.id)}
        >
          <small>{item.eyebrow}</small>
          <span>{sectionLabels[item.id] ?? item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ContextStrip({ language, playerCount }: { language: Language; playerCount: number }) {
  const copy = uiCopy[language];

  return (
    <section className="club-context">
      <div>
        <span className="section-kicker">{copy.contextKicker}</span>
        <p>{copy.contextCopy}</p>
      </div>
      <div className="context-stat">
        <strong>{playerCount}</strong>
        <span>{copy.playersInView}</span>
      </div>
    </section>
  );
}

function PlayerStrip({
  language,
  selectedPlayerId,
  onNext,
  onPrevious,
  onSelect,
}: {
  language: Language;
  selectedPlayerId: string;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (playerId: string) => void;
}) {
  const carouselPlayers = [...players, ...players];
  const copy = uiCopy[language];

  return (
    <section className="player-carousel-panel" aria-label={copy.playerCarousel}>
      <div className="player-carousel-header">
        <div>
          <span className="section-kicker">{copy.playerCarousel}</span>
          <strong>{copy.playerCarousel}</strong>
        </div>
        <div className="player-carousel-controls">
          <button type="button" onClick={onPrevious} aria-label={copy.showPreviousPlayer}>
            ‹
          </button>
          <button type="button" onClick={onNext} aria-label={copy.showNextPlayer}>
            ›
          </button>
        </div>
      </div>
      <div className="player-strip">
        <div className="player-strip-track">
          {carouselPlayers.map((player, index) => {
            const fallbackNumber = player.number && String(player.number) !== "-" ? String(player.number) : "";

            return (
              <button
                key={`${player.id}-${index}`}
                type="button"
                className={player.id === selectedPlayerId ? "player-pill is-active" : "player-pill"}
                onClick={() => onSelect(player.id)}
                tabIndex={index >= players.length ? -1 : 0}
                aria-hidden={index >= players.length}
              >
                <span className="player-photo">
                  {hasPlayerPhoto(player) ? (
                    <Image src={player.photo} alt="" width={72} height={72} />
                  ) : (
                    <span className="player-photo-fallback">{fallbackNumber}</span>
                  )}
                </span>
                <span>
                  <strong>{player.name}</strong>
                  <small>{player.amsId}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function OverviewPanel({
  currentTime,
  language,
  loadSummary,
  sourceData,
  selectedPlayer,
  onSelectSection,
}: {
  currentTime: Date | null;
  language: Language;
  loadSummary: LoadSummary;
  sourceData: SourceData;
  selectedPlayer: (typeof players)[number];
  onSelectSection: (section: AmsSection) => void;
}) {
  const copy = uiCopy[language];
  const sectionLabels: Partial<Record<AmsSection, string>> = copy.sections;
  const timeText = currentTime
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Mexico_City",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(currentTime)
    : "--:--:-- AM";
  const [timeValue, periodValue = ""] = timeText.split(" ");
  const dateLocale = language === "es" ? "es-MX" : "en-GB";
  const dateText = currentTime
    ? `${new Intl.DateTimeFormat(dateLocale, {
        timeZone: "America/Mexico_City",
        weekday: "long",
      }).format(currentTime)} · ${new Intl.DateTimeFormat(dateLocale, {
        timeZone: "America/Mexico_City",
        day: "2-digit",
        month: "long",
      }).format(currentTime)}`
    : "";

  return (
    <div className="panel-stack">
      <section className="hero-panel welcome-hero">
        <div className="welcome-clock"><span>{timeValue} <small>{periodValue}</small></span><strong>{dateText}</strong></div>
        <div className="home-assistant">
          <span>{copy.assistantKicker}</span>
          <h2>{copy.assistantPrompt}</h2>
          <div className="assistant-row assistant-search">
            <input
              autoFocus
              placeholder={copy.assistantPlaceholder}
            />
            <button type="button">{copy.ask}</button>
          </div>
          <p>{copy.assistantStatus}</p>
          <article className="rag-example">
            <span>{copy.ragExampleLabel}</span>
            <button className="rag-example-prompt" type="button">
              {copy.ragExamplePrompt.replace("{player}", selectedPlayer.name)}
            </button>
          </article>
        </div>
      </section>

      <section className="quick-grid welcome-grid">
        <QuickCard label={sectionLabels.load ?? "Load Demand"} value={`${compactNumber(loadSummary.sessions)} ${panelCopy[language].common.records}`} onClick={() => onSelectSection("load")} />
        <QuickCard label={sectionLabels.injury ?? "Injury History"} value={`${compactNumber(sourceData.injuries.length)} ${panelCopy[language].common.injuries}`} onClick={() => onSelectSection("injury")} />
        <QuickCard label={sectionLabels.development ?? "Physical Development"} value={`${compactNumber(sourceData.fms.length + sourceData.yBalance.length)} ${panelCopy[language].common.tests}`} onClick={() => onSelectSection("development")} />
        <QuickCard label={copy.calendar} value={copy.rtpPlanning} onClick={() => onSelectSection("calendar")} />
      </section>

      <section className="integration-grid">
        {integrationCards.map((item) => (
          <article key={item.label}>
            <Image src={item.asset} alt="" width={42} height={42} />
            <div>
              <strong>{item.label}</strong>
              <span>{localizedIntegrationStatus(item.status, language)}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function QuickCard({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" className="quick-card welcome-card" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function LoadPanel({ language, loadSummary }: { language: Language; loadSummary: LoadSummary }) {
  const copy = panelCopy[language];
  const recentRows = [...loadSummary.rows]
    .filter((row) => row.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-10);

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.load.kicker}
        title={copy.load.title}
        copy={copy.load.copy}
      />
      <section className="metric-grid">
        <MetricCard label={copy.load.totalDistance} value={`${compactNumber(loadSummary.totalDistance)} m`} detail={`${compactNumber(loadSummary.sessions)} ${copy.common.sessions}`} />
        <MetricCard label={copy.load.highIntensity} value={`${compactNumber(loadSummary.highIntensity)} m`} detail={copy.load.absoluteRelativeExposure} />
        <MetricCard label={copy.load.maxSpeed} value={`${compactNumber(loadSummary.maxSpeed, 1)} km/h`} detail={copy.load.peakRecordedValue} />
        <MetricCard label={copy.load.dataStatus} value={localizedLoadStatus(loadSummary.status, language)} detail={copy.load.servedFromPublicData} />
      </section>
      <section className="chart-panel">
        <div className="panel-heading">
          <h3>{copy.load.recentTrend}</h3>
          <span>{copy.load.recentTrendSub}</span>
        </div>
        <div className="bar-chart">
          {recentRows.map((row, index) => {
            const distance = numberValue(row.totalDistance ?? row.total_distance_m);
            const height = Math.max(8, Math.min(100, distance / 120));
            return (
              <div key={`${row.date}-${index}`} style={{ "--bar-height": `${height}%` } as CSSProperties}>
                <span />
                <small>{row.date?.slice(5) || index + 1}</small>
              </div>
            );
          })}
        </div>
      </section>
      <section className="definition-grid">
        {metricDefinitions.map(([label, description, unit]) => {
          const metric = localizedMetricDefinition(label, description, unit, language);

          return (
            <article key={label}>
              <strong>{metric.label}</strong>
              <p>{metric.description}</p>
              <span>{metric.unit}</span>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function InjuryPanel({ language, injuries }: { language: Language; injuries: InjuryRow[] }) {
  const copy = panelCopy[language];
  const totalDaysLost = injuries.reduce((total, injury) => total + numberValue(injury.totalDaysLost), 0);
  const latestInjuries = [...injuries]
    .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
    .slice(0, 8);
  const topRegion = mostCommon(injuries.map((injury) => injury.bodyRegion).filter(Boolean));

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.injury.kicker}
        title={copy.injury.title}
        copy={copy.injury.copy}
      />
      <section className="metric-grid">
        <MetricCard label={copy.injury.injuryEvents} value={compactNumber(injuries.length)} detail={copy.injury.cleanInjuryRecords} />
        <MetricCard label={copy.injury.daysLost} value={compactNumber(totalDaysLost)} detail={copy.injury.totalUnavailableDays} />
        <MetricCard label={copy.injury.topRegion} value={topRegion || copy.common.pending} detail={copy.injury.mostFrequentRegion} />
        <MetricCard label={copy.injury.latestRecord} value={latestInjuries[0]?.startDate || copy.common.noData} detail={latestInjuries[0]?.playerName || copy.common.waitingForSource} />
      </section>
      <DataList
        emptyLabel={copy.common.noRecords}
        language={language}
        title={copy.injury.latestRecords}
        subtitle={copy.injury.recentMedicalEvents}
        rows={latestInjuries.map((injury) => [
          injury.playerName || copy.common.unknownPlayer,
          injury.injuryType || copy.common.unclassified,
          injury.bodyRegion || copy.common.noRegion,
          injury.startDate || copy.common.noDate,
        ])}
      />
    </div>
  );
}

function DevelopmentPanel({
  language,
  fms,
  yBalance,
}: {
  language: Language;
  fms: FmsAssessmentRow[];
  yBalance: YBalanceAssessmentRow[];
}) {
  const copy = panelCopy[language];
  const latestFms = [...fms].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 6);

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.development.kicker}
        title={copy.development.title}
        copy={copy.development.copy}
      />
      <section className="metric-grid">
        <MetricCard label={copy.development.fmsAssessments} value={compactNumber(fms.length)} detail={copy.development.movementRecords} />
        <MetricCard label={copy.development.yBalanceTests} value={compactNumber(yBalance.length)} detail={copy.development.reachRecords} />
        <MetricCard label={copy.development.latestFmsScore} value={String(latestFms[0]?.totalScore ?? copy.common.noData)} detail={latestFms[0]?.matchedAthleteName || copy.common.waitingForSource} />
        <MetricCard label={copy.development.sourceStatus} value={copy.development.cleanJson} detail="/ams/data/clean/tests" />
      </section>
      <section className="testing-grid">
        <TestingCard image="/ams/assets/testing/vald-logo.png" title={copy.development.valdDevices} copy={copy.development.valdCopy} />
        <TestingCard image="/ams/assets/testing/nordbord-logo.png" title="NordBord" copy={copy.development.nordbordCopy} />
        <TestingCard image="/ams/assets/testing/fms-logo.jpeg" title="FMS" copy={copy.development.fmsCopy} />
        <TestingCard image="/ams/assets/testing/ybt-logo.svg" title={copy.development.ybtTitle} copy={copy.development.ybtCopy} />
      </section>
      <DataList
        emptyLabel={copy.common.noRecords}
        language={language}
        title={copy.development.latestFmsAssessments}
        subtitle={copy.development.cleanedMovementResults}
        rows={latestFms.map((row) => [
          row.matchedAthleteName || copy.common.unknownPlayer,
          row.dateIso || copy.common.noDate,
          String(row.totalScore ?? copy.common.noScore),
          row.scoreBand || row.riskFlag || copy.common.noFlag,
        ])}
      />
    </div>
  );
}

function BodyCompositionPanel({ language, rows }: { language: Language; rows: BodyCompRow[] }) {
  const copy = panelCopy[language];
  const latestRows = [...rows]
    .sort((a, b) => String(b.testDate).localeCompare(String(a.testDate)))
    .slice(0, 8);
  const avgWeight = average(rows.map((row) => row.weightKg));
  const avgMuscle = average(rows.map((row) => row.muscleKg));
  const avgSkinfold = average(rows.map((row) => row.skinfold6));

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.bodyComp.kicker}
        title={copy.bodyComp.title}
        copy={copy.bodyComp.copy}
      />
      <section className="metric-grid">
        <MetricCard label={copy.bodyComp.records} value={compactNumber(rows.length)} detail={copy.bodyComp.cleanRows} />
        <MetricCard label={copy.bodyComp.avgWeight} value={`${compactNumber(avgWeight, 1)} kg`} detail={copy.bodyComp.acrossLoadedRecords} />
        <MetricCard label={copy.bodyComp.avgMuscle} value={`${compactNumber(avgMuscle, 1)} kg`} detail={copy.bodyComp.muscleEstimate} />
        <MetricCard label={copy.bodyComp.avgSkinfold} value={`${compactNumber(avgSkinfold, 1)} mm`} detail={copy.bodyComp.skinfoldSum} />
      </section>
      <DataList
        emptyLabel={copy.common.noRecords}
        language={language}
        title={copy.bodyComp.latestRecords}
        subtitle={copy.bodyComp.recentDates}
        rows={latestRows.map((row) => [
          row.playerName || copy.common.unknownPlayer,
          row.category || copy.common.noGroup,
          row.testDate || copy.common.noDate,
          `${compactNumber(numberValue(row.weightKg), 1)} kg`,
        ])}
      />
    </div>
  );
}

function RecoveryPanel({ language }: { language: Language }) {
  const copy = panelCopy[language];

  return (
    <SectionPlaceholder
      emptyDetail={copy.common.readyForComponentExtraction}
      kicker={copy.recovery.kicker}
      title={copy.recovery.title}
      copy={copy.recovery.copy}
      items={[...copy.recovery.items]}
    />
  );
}

function BiographyPanel({ language, selectedPlayer }: { language: Language; selectedPlayer: (typeof players)[number] }) {
  const copy = panelCopy[language];

  return (
    <div className="profile-layout">
      <section className="profile-hero">
        <Image src={selectedPlayer.photo} alt="" width={260} height={260} />
        <div>
          <span className="section-kicker">{copy.biography.kicker}</span>
          <h2>{selectedPlayer.name}</h2>
          <p>
            #{selectedPlayer.number} · {localizedValue(selectedPlayer.position, language)} · {localizedValue(selectedPlayer.nationality, language)}
          </p>
        </div>
      </section>
      <section className="profile-details-grid">
        <MetricCard label={copy.biography.amsId} value={selectedPlayer.amsId} detail={copy.biography.primaryIdentity} />
        <MetricCard label={copy.biography.age} value={localizedValue(selectedPlayer.age, language)} detail={copy.biography.profileData} />
        <MetricCard label={copy.biography.heightWeight} value={`${localizedValue(selectedPlayer.height, language)} / ${localizedValue(selectedPlayer.weight, language)}`} detail={copy.biography.biographySource} />
        <MetricCard label={copy.biography.preferredFoot} value={localizedValue(selectedPlayer.foot, language)} detail={copy.biography.pendingSourceMerge} />
      </section>
    </div>
  );
}

function ExternalFactorsPanel({ language }: { language: Language }) {
  const copy = panelCopy[language];

  return (
    <SectionPlaceholder
      emptyDetail={copy.common.readyForComponentExtraction}
      kicker={copy.external.kicker}
      title={copy.external.title}
      copy={copy.external.copy}
      items={[...copy.external.items]}
    />
  );
}

function CalendarPanel({ language }: { language: Language }) {
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

function CalendarTextInput({
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

function CalendarMonthCard({
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

function CalendarMonthDetail({
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
                    <span key={event.id} role="button" tabIndex={0} onClick={(clickEvent) => { clickEvent.stopPropagation(); onSelectEvent(event); }} onKeyDown={(keyEvent) => { if (keyEvent.key === "Enter") onSelectEvent(event); }}>
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

function CalendarEventChip({ event }: { event: CalendarEvent }) {
  const tooltip = event.tooltip || event.notes || event.title;
  const tooltipLines = tooltip.split("\n").filter(Boolean);

  return (
    <span
      className={`calendar-event-chip ${event.category}${event.team === "first-team" ? " first-team" : ""}`}
      data-tooltip={tooltip}
      tabIndex={0}
      title={tooltip}
    >
      <span className="calendar-event-label">{event.title}</span>
      <span className="calendar-event-tooltip" aria-hidden="true">
        <strong>{tooltipLines[0] ?? event.title}</strong>
        {tooltipLines.slice(1).map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </span>
  );
}

function RtpTimeline({
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

function loadCalendarEvents() {
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

function atlasFixtureToCalendarEvent(fixture: AtlasFixtureFeedItem): CalendarEvent {
  const title = `${fixture.homeTeam} vs ${fixture.awayTeam}`;
  const scoreLine = fixture.score ? `Result: ${fixture.score}` : "Scheduled";
  const aggregateLine = fixture.aggregate ? ` · ${fixture.aggregate}` : "";
  const location = fixture.location || [fixture.city, fixture.country].filter(Boolean).join(", ");
  const venueLine = fixture.venue ? `Venue: ${fixture.venue}${location ? ` · ${location}` : ""}` : "";
  const notes = [
    `${fixture.competition} · ${fixture.round}`,
    scoreLine + aggregateLine,
    venueLine,
  ].filter(Boolean).join(" · ");
  const tooltip = [
    title,
    `${fixture.competition} · ${fixture.round}`,
    fixture.time ? `${fixture.date} ${fixture.time}` : fixture.date,
    scoreLine,
    venueLine,
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
  };
}

function mergeFixtureEvents(currentEvents: CalendarEvent[], fixtureEvents: CalendarEvent[]) {
  const fixtureIds = new Set(fixtureEvents.map((event) => event.id));
  const userEvents = currentEvents.filter(
    (event) => event.source !== "atlas-fixtures-api" && !fixtureIds.has(event.id) && !isLegacyAtlasFixture(event),
  );
  return sortCalendarEvents(userEvents.concat(fixtureEvents));
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
  };
}

function sortCalendarEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => `${a.startDate} ${a.startTime}`.localeCompare(`${b.startDate} ${b.startTime}`));
}

function emptyCalendarForm(year: number, month: number, date = calendarDate(year, month, 1)): CalendarFormState {
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

function calendarEventToForm(event: CalendarEvent): CalendarFormState {
  return { ...event };
}

function calendarDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventCoversDate(event: CalendarEvent, date: string) {
  return event.startDate <= date && (event.endDate || event.startDate) >= date;
}

function eventOverlapsRange(event: CalendarEvent, rangeStart: string, rangeEnd: string) {
  return event.startDate <= rangeEnd && (event.endDate || event.startDate) >= rangeStart;
}

function eventsForDate(events: CalendarEvent[], date: string) {
  return events.filter((event) => eventCoversDate(event, date));
}

function eventsForMonth(events: CalendarEvent[], year: number, month: number) {
  const monthStart = calendarDate(year, month, 1);
  const monthEnd = calendarDate(year, month, new Date(year, month + 1, 0).getDate());
  return events.filter((event) => eventOverlapsRange(event, monthStart, monthEnd));
}

function monthName(year: number, month: number, language: Language, style: "short" | "long") {
  return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", { month: style }).format(new Date(year, month, 1));
}

function dayNames(language: Language) {
  const baseSunday = new Date(2026, 0, 4);
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", { weekday: "short" }).format(
      new Date(baseSunday.getFullYear(), baseSunday.getMonth(), baseSunday.getDate() + index),
    ),
  );
}

function teamLabel(team: CalendarTeam, language: Language, copy: Record<string, string>) {
  if (team === "first-team") return copy.firstTeam;
  if (language === "es" && team === "u21") return "Sub 21";
  if (language === "es" && team === "u19") return "Sub 19";
  if (language === "es" && team === "u17") return "Sub 17";
  if (language === "es" && team === "u15") return "Sub 15";
  return team.toUpperCase();
}

function formatEventRange(event: CalendarEvent, language: Language) {
  const locale = language === "es" ? "es-MX" : "en-US";
  const startDate = formatCalendarDate(event.startDate, locale);
  const endDate = event.endDate && event.endDate !== event.startDate ? formatCalendarDate(event.endDate, locale) : "";
  const start = [startDate, event.startTime].filter(Boolean).join(" ");
  const end = [endDate, event.endTime && event.endTime !== event.startTime ? event.endTime : ""].filter(Boolean).join(" ");
  return end ? `${start} - ${end}` : start;
}

function formatCalendarDate(date: string, locale: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit" }).format(new Date(`${date}T00:00:00`));
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate || startDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

function rtpSeverityClass(days: number) {
  if (days <= 3) return "mild";
  if (days <= 7) return "minor";
  if (days <= 28) return "moderate";
  return "severe";
}

function clampMonth(month: number) {
  if (Number.isNaN(month)) return 0;
  return Math.min(11, Math.max(0, month));
}

function ResourcesPanel({ language }: { language: Language }) {
  const copy = panelCopy[language];

  return (
    <SectionPlaceholder
      emptyDetail={copy.common.readyForComponentExtraction}
      kicker={copy.resources.kicker}
      title={copy.resources.title}
      copy={copy.resources.copy}
      items={[...copy.resources.items]}
    />
  );
}

function SettingsPanel({ language }: { language: Language }) {
  const copy = panelCopy[language];

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.settings.kicker}
        title={copy.settings.title}
        copy={copy.settings.copy}
      />
      <section className="source-table">
        {dataSources.map((source) => (
          <div key={source.path}>
            <strong>{localizedSourceLabel(source.label, language)}</strong>
            <code>{source.path}</code>
          </div>
        ))}
      </section>
    </div>
  );
}

function DataList({
  title,
  subtitle,
  emptyLabel,
  language,
  rows,
}: {
  title: string;
  subtitle: string;
  emptyLabel: string;
  language: Language;
  rows: string[][];
}) {
  return (
    <section className="data-list">
      <div className="panel-heading">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div>
        {rows.length ? (
          rows.map((row, index) => (
            <article key={`${row.join("-")}-${index}`}>
              {row.map((cell, cellIndex) => (
                <span key={`${cell}-${cellIndex}`}>{localizedValue(cell, language)}</span>
              ))}
            </article>
          ))
        ) : (
          <article>
            <span>{emptyLabel}</span>
          </article>
        )}
      </div>
    </section>
  );
}

function PanelIntro({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <section className="panel-intro">
      <span className="section-kicker">{kicker}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </section>
  );
}

function average(values: unknown[]) {
  const numericValues = values.map(numberValue).filter((value) => Number.isFinite(value) && value > 0);
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

function mostCommon(values: unknown[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const key = String(value || "").trim();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function TestingCard({ image, title, copy }: { image: string; title: string; copy: string }) {
  return (
    <article className="testing-card">
      <Image src={image} alt="" width={72} height={72} />
      <strong>{title}</strong>
      <p>{copy}</p>
    </article>
  );
}

function SectionPlaceholder({
  kicker,
  title,
  copy,
  emptyDetail,
  items,
}: {
  kicker: string;
  title: string;
  copy: string;
  emptyDetail: string;
  items: string[];
}) {
  return (
    <div className="panel-stack">
      <PanelIntro kicker={kicker} title={title} copy={copy} />
      <section className="placeholder-grid">
        {items.map((item) => (
          <article key={item}>
            <span>{item}</span>
            <strong>{emptyDetail}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
