export type AmsSection =
  | "overview"
  | "load"
  | "injury"
  | "development"
  | "bodyComp"
  | "recovery"
  | "biography"
  | "external"
  | "calendar"
  | "resources"
  | "settings";

export type Player = {
  id: string;
  amsId: string;
  name: string;
  number: number;
  position: string;
  nationality: string;
  age: string;
  height: string;
  weight: string;
  foot: string;
  photo: string;
  status: "synced" | "review" | "pending";
};

export const navItems: { id: AmsSection; label: string; eyebrow: string }[] = [
  { id: "overview", label: "Home", eyebrow: "Command center" },
  { id: "load", label: "Load Demand", eyebrow: "WIMU / GPS" },
  { id: "injury", label: "Injury History", eyebrow: "Medical" },
  { id: "development", label: "Physical Development", eyebrow: "VALD / FMS / YBT" },
  { id: "bodyComp", label: "Body Composition", eyebrow: "ISAK" },
  { id: "recovery", label: "Recovery", eyebrow: "Services" },
  { id: "biography", label: "Biography", eyebrow: "Player profile" },
  { id: "external", label: "External Factors", eyebrow: "Context" },
  { id: "calendar", label: "Calendar", eyebrow: "Planning" },
  { id: "resources", label: "Resources", eyebrow: "Library" },
  { id: "settings", label: "Settings", eyebrow: "Registry" },
];

export const players: Player[] = [
  {
    id: "gustavo-ferrareis",
    amsId: "AMS-ATLAS-0006",
    name: "Gustavo Ferrareis",
    number: 3,
    position: "Defender",
    nationality: "Brazilian",
    age: "30 years",
    height: "1.77 m",
    weight: "70 kg",
    foot: "Pending API",
    photo: "/ams/assets/players/cutouts/Gustavo_Ferrareis-removebg-preview.png",
    status: "synced",
  },
  {
    id: "camilo-vargas",
    amsId: "AMS-ATLAS-0001",
    name: "Camilo Vargas",
    number: 12,
    position: "Goalkeeper",
    nationality: "Colombian",
    age: "37 years",
    height: "1.85 m",
    weight: "80 kg",
    foot: "Right",
    photo: "/ams/assets/players/cutouts/Camilo_Andres_Vargas_Gil-removebg-preview.png",
    status: "review",
  },
  {
    id: "aldo-rocha",
    amsId: "AMS-ATLAS-0011",
    name: "Aldo Rocha",
    number: 26,
    position: "Midfielder",
    nationality: "Mexican",
    age: "33 years",
    height: "1.67 m",
    weight: "69 kg",
    foot: "Right",
    photo: "/ams/assets/players/cutouts/Aldo_Rocha-removebg-preview.png",
    status: "synced",
  },
  {
    id: "mateo-garcia",
    amsId: "AMS-ATLAS-0018",
    name: "Mateo Garcia",
    number: 8,
    position: "Midfielder",
    nationality: "Argentinian",
    age: "29 years",
    height: "1.70 m",
    weight: "65 kg",
    foot: "Left",
    photo: "/ams/assets/players/cutouts/Mateo_García__8_Mediocampista-removebg-preview.png",
    status: "pending",
  },
];

export const metricDefinitions = [
  ["Total distance", "Total distance covered during the selected session/date window.", "m"],
  ["HSR absolute", "Distance covered above the absolute HSR threshold, default 21 km/h.", "m"],
  ["HSR relative", "Distance covered above 75.5% of the player's maximum speed.", "m"],
  ["Sprint absolute", "Distance covered above the absolute sprint threshold, default 24 km/h.", "m"],
  ["Sprint relative", "Distance covered above 95% of the player's maximum speed.", "m"],
  ["High acceleration", "High-intensity acceleration count above +3 m/s².", "count"],
  ["High deceleration", "High-intensity deceleration count below -3 m/s².", "count"],
];

export const integrationCards = [
  { label: "WIMU/GPS", asset: "/ams/assets/integrations/wimu.png", status: "Active cleaned feed" },
  { label: "VALD", asset: "/ams/assets/integrations/vald.png", status: "NordBord mapped" },
  { label: "FMS", asset: "/ams/assets/integrations/fms.jpeg", status: "Testing battery" },
  { label: "Catapult", asset: "/ams/assets/integrations/catapult.png", status: "Future API" },
  { label: "Opta", asset: "/ams/assets/integrations/opta.png", status: "Future match context" },
  { label: "PlayerData", asset: "/ams/assets/integrations/playerdata.png", status: "Future source" },
];

export const dataSources = [
  { label: "GPS daily rollup", path: "/ams/data/clean/gps/gps_player_daily.csv" },
  { label: "Current roster GPS", path: "/ams/data/clean/gps/gps_player_daily_current_roster.json" },
  { label: "Injury history", path: "/ams/data/clean/injuries/injury_history_clean.json" },
  { label: "Body composition", path: "/ams/data/clean/body_comp/body_comp_clean.json" },
  { label: "FMS assessments", path: "/ams/data/clean/tests/fms_assessments_clean.json" },
  { label: "Y Balance assessments", path: "/ams/data/clean/tests/y_balance_assessments_clean.json" },
  { label: "VALD NordBord tests", path: "/ams/data/clean/vald_nordbord_tests.json" },
  { label: "Rehab services", path: "/ams/data/clean/rehab_services/rehab_services_daily_clean.json" },
];

export const sampleGpsRows = [
  {
    date: "2026-05-01",
    athlete: "Gustavo Ferrareis",
    team: "Atlas Primer Equipo",
    session_type: "Training",
    total_distance_m: "6420",
    high_intensity_m: "760",
    max_speed_kmh: "31.2",
    minutes: "72",
  },
  {
    date: "2026-05-03",
    athlete: "Gustavo Ferrareis",
    team: "Atlas Primer Equipo",
    session_type: "Match",
    total_distance_m: "10680",
    high_intensity_m: "1340",
    max_speed_kmh: "33.8",
    minutes: "94",
  },
  {
    date: "2026-05-08",
    athlete: "Aldo Rocha",
    team: "Atlas Primer Equipo",
    session_type: "Training",
    total_distance_m: "8120",
    high_intensity_m: "820",
    max_speed_kmh: "29.6",
    minutes: "81",
  },
  {
    date: "2026-05-10",
    athlete: "Aldo Rocha",
    team: "Atlas Primer Equipo",
    session_type: "Match",
    total_distance_m: "11740",
    high_intensity_m: "1185",
    max_speed_kmh: "31.1",
    minutes: "96",
  },
  {
    date: "2026-05-17",
    athlete: "Camilo Vargas",
    team: "Atlas Primer Equipo",
    session_type: "Match",
    total_distance_m: "4820",
    high_intensity_m: "290",
    max_speed_kmh: "24.4",
    minutes: "93",
  },
  {
    date: "2026-05-24",
    athlete: "Mateo Garcia",
    team: "Atlas Primer Equipo",
    session_type: "Match",
    total_distance_m: "10420",
    high_intensity_m: "1420",
    max_speed_kmh: "34.3",
    minutes: "91",
  },
];
