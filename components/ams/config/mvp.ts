import type { AmsSection } from "@/lib/ams/content";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

export const mvpVisibleSections = [
  "overview",
  "load",
  "injury",
  "development",
  "bodyComp",
  "recovery",
  "biography",
  "matchHistory",
  "calendar",
  "settings",
] as const satisfies readonly AmsSection[];

export const mvpSidebarSections = [
  "load",
  "injury",
  "development",
  "bodyComp",
  "recovery",
  "biography",
  "matchHistory",
] as const satisfies readonly AmsSection[];

export const mvpSourceKeys = [
  "currentRosterGps",
  "injuryHistory",
  "bodyComp",
  "fmsAssessments",
  "fmsExerciseScores",
  "yBalanceAssessments",
  "yBalanceMetrics",
  "valdNordbordTests",
  "valdNordbordMetrics",
  "rehabServices",
  "playerMaster",
  "playerSeasonHistory",
  "playerMatchHistory",
] as const;

export type MvpSourceCardId =
  | "gps"
  | "injury"
  | "bodyComp"
  | "testing"
  | "vald"
  | "rehab"
  | "players";

export const mvpSourceCards = [
  {
    id: "gps",
    asset: "/ams/assets/integrations/wimu.png",
    labels: { en: "WIMU/GPS", es: "WIMU/GPS" },
  },
  {
    id: "injury",
    asset: "/ams/assets/injuries/body-map.png",
    labels: { en: "Injury History", es: "Historial de lesiones" },
  },
  {
    id: "bodyComp",
    asset: "/ams/assets/integrations/playerdata.png",
    labels: { en: "Body Composition", es: "Composición corporal" },
  },
  {
    id: "testing",
    asset: "/ams/assets/integrations/fms.jpeg",
    labels: { en: "FMS / Y Balance", es: "FMS / Y Balance" },
  },
  {
    id: "vald",
    asset: "/ams/assets/integrations/vald.png",
    labels: { en: "VALD NordBord", es: "VALD NordBord" },
  },
  {
    id: "rehab",
    asset: "/ams/assets/resources-document.png",
    labels: { en: "Rehab Services", es: "Servicios rehab" },
  },
  {
    id: "players",
    asset: "/ams/assets/clubs/10445.png",
    labels: { en: "Player Master", es: "Maestro jugadores" },
  },
] as const satisfies readonly {
  id: MvpSourceCardId;
  asset: string;
  labels: Record<AmsLanguage, string>;
}[];

const mvpVisibleSectionSet = new Set<AmsSection>(mvpVisibleSections);
const mvpSidebarSectionSet = new Set<AmsSection>(mvpSidebarSections);
const mvpSourceKeySet = new Set<string>(mvpSourceKeys);

export function isMvpVisibleSection(section: AmsSection) {
  return mvpVisibleSectionSet.has(section);
}

export function isMvpSidebarSection(section: AmsSection) {
  return mvpSidebarSectionSet.has(section);
}

export function isMvpSourceKey(key: string) {
  return mvpSourceKeySet.has(key);
}

export function mvpSectionLabel(section: AmsSection, language: AmsLanguage) {
  const labels: Record<AmsLanguage, Partial<Record<AmsSection, string>>> = {
    en: {
      overview: "Command Center",
      bodyComp: "Body Composition",
      matchHistory: "Match History",
      settings: "Data Sources",
    },
    es: {
      overview: "Centro de mando",
      bodyComp: "Composición corporal",
      matchHistory: "Historial de partidos",
      settings: "Fuentes de datos",
    },
  };

  return labels[language][section];
}

export function demoSafeValue(value: string, language: AmsLanguage) {
  const replacement = language === "es" ? "No incluido en demo" : "Not in demo dataset";
  const text = String(value || "");

  if (!text || text === "-") return text || replacement;
  return text
    .replaceAll("Pending API", replacement)
    .replaceAll("Pending source merge", replacement)
    .replace(/^Pending$/, replacement);
}
