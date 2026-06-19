import type { AmsSection } from "@/lib/ams/content";

export type AmsAuthRole =
  | "administration"
  | "technicalStaff"
  | "medicalPerformanceDirector"
  | "medicalStaff"
  | "performanceStaff"
  | "medicalPerformanceStaff";

export type AmsDataDomain =
  | "biography"
  | "playerCare"
  | "medical"
  | "performance"
  | "financial"
  | "technical"
  | "sourceRegistry"
  | "systemSettings";

export type AmsFinancialField =
  | "contractExpires"
  | "marketValue"
  | "contractProgress"
  | "salary"
  | "bonus"
  | "transferValue"
  | "agent";

export type AmsCalendarVisibility =
  | "all"
  | "careOnly"
  | "medicalAndCare"
  | "performanceAndCare"
  | "medicalPerformanceAndCare"
  | "none";

export type AmsRolePolicy = {
  label: string;
  description: string;
  allowedDomains: AmsDataDomain[];
  deniedDomains?: AmsDataDomain[];
  allowedSections: AmsSection[];
  maskedFinancialFields: AmsFinancialField[];
  calendarVisibility: AmsCalendarVisibility;
  canPreviewRawSources: boolean;
  canManageSettings: boolean;
};

const allDomains: AmsDataDomain[] = [
  "biography",
  "playerCare",
  "medical",
  "performance",
  "financial",
  "technical",
  "sourceRegistry",
  "systemSettings",
];

const allSections: AmsSection[] = [
  "overview",
  "load",
  "injury",
  "development",
  "bodyComp",
  "recovery",
  "biography",
  "external",
  "athleteProfile",
  "calendar",
  "resources",
  "settings",
];

export const amsFinancialFields: AmsFinancialField[] = [
  "contractExpires",
  "marketValue",
  "contractProgress",
  "salary",
  "bonus",
  "transferValue",
  "agent",
];

export const amsSectionDomains: Record<AmsSection, AmsDataDomain[]> = {
  overview: ["biography", "medical", "performance", "technical"],
  load: ["performance"],
  injury: ["medical"],
  development: ["performance"],
  bodyComp: ["medical", "performance"],
  recovery: ["medical", "performance", "playerCare"],
  biography: ["biography", "financial"],
  external: ["technical", "performance"],
  athleteProfile: ["medical", "performance"],
  calendar: ["technical", "medical", "performance", "playerCare"],
  resources: ["technical", "medical", "performance", "playerCare"],
  settings: ["sourceRegistry", "systemSettings"],
};

export const amsRolePolicies: Record<AmsAuthRole, AmsRolePolicy> = {
  administration: {
    label: "Administration",
    description: "Club operations access for player biography, financial biography fields, and non-clinical player care management.",
    allowedDomains: ["biography", "playerCare", "financial"],
    deniedDomains: ["medical", "performance", "sourceRegistry", "systemSettings"],
    allowedSections: ["biography", "calendar", "resources"],
    maskedFinancialFields: [],
    calendarVisibility: "careOnly",
    canPreviewRawSources: false,
    canManageSettings: false,
  },
  technicalStaff: {
    label: "Technical Staff",
    description: "Full football staff access across medical, performance, biography, care, financial, calendar, and source context.",
    allowedDomains: allDomains,
    allowedSections: allSections,
    maskedFinancialFields: [],
    calendarVisibility: "all",
    canPreviewRawSources: true,
    canManageSettings: true,
  },
  medicalPerformanceDirector: {
    label: "Medical and Performance Director",
    description: "Director-level full access across medical, performance, biography, care, financial, calendar, and source context.",
    allowedDomains: allDomains,
    allowedSections: allSections,
    maskedFinancialFields: [],
    calendarVisibility: "all",
    canPreviewRawSources: true,
    canManageSettings: true,
  },
  medicalStaff: {
    label: "Medical Staff",
    description: "Medical staff access to player biography, care, injuries, recovery, and medical context with financial fields masked.",
    allowedDomains: ["biography", "playerCare", "medical"],
    deniedDomains: ["financial", "sourceRegistry", "systemSettings"],
    allowedSections: ["injury", "bodyComp", "recovery", "biography", "calendar", "resources"],
    maskedFinancialFields: amsFinancialFields,
    calendarVisibility: "medicalAndCare",
    canPreviewRawSources: false,
    canManageSettings: false,
  },
  performanceStaff: {
    label: "Performance Staff",
    description: "Performance staff access to player biography, care, load, testing, body composition, and readiness context with financial fields masked.",
    allowedDomains: ["biography", "playerCare", "performance"],
    deniedDomains: ["financial", "sourceRegistry", "systemSettings"],
    allowedSections: ["load", "development", "bodyComp", "recovery", "biography", "external", "athleteProfile", "calendar", "resources"],
    maskedFinancialFields: amsFinancialFields,
    calendarVisibility: "performanceAndCare",
    canPreviewRawSources: false,
    canManageSettings: false,
  },
  medicalPerformanceStaff: {
    label: "Medical and Performance Staff",
    description: "Cross-functional medical/performance access with financial fields masked.",
    allowedDomains: ["biography", "playerCare", "medical", "performance"],
    deniedDomains: ["financial", "sourceRegistry", "systemSettings"],
    allowedSections: ["load", "injury", "development", "bodyComp", "recovery", "biography", "external", "athleteProfile", "calendar", "resources"],
    maskedFinancialFields: amsFinancialFields,
    calendarVisibility: "medicalPerformanceAndCare",
    canPreviewRawSources: false,
    canManageSettings: false,
  },
};

export function canAccessSection(role: AmsAuthRole, section: AmsSection) {
  return amsRolePolicies[role].allowedSections.includes(section);
}

export function canAccessDomain(role: AmsAuthRole, domain: AmsDataDomain) {
  return amsRolePolicies[role].allowedDomains.includes(domain);
}

export function shouldMaskFinancialField(role: AmsAuthRole, field: AmsFinancialField) {
  return amsRolePolicies[role].maskedFinancialFields.includes(field);
}

export function canAccessRawSources(role: AmsAuthRole) {
  return amsRolePolicies[role].canPreviewRawSources;
}

export function canManageAmsSettings(role: AmsAuthRole) {
  return amsRolePolicies[role].canManageSettings;
}
