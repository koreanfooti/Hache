import type { AmsAuthRole } from "@/lib/ams/auth-rules";

export const authRoleCookieName = "real_ams_role";
export const authUsersStorageKey = "real-ams.auth.users.v1";
export const authSessionStorageKey = "real-ams.auth.session.v1";
export const demoPassword = "realams123";

export type RealAmsAuthUser = {
  id: string;
  name: string;
  email: string;
  role: AmsAuthRole;
};

export type StoredRealAmsAuthUser = RealAmsAuthUser & {
  password: string;
};

export type AuthRoleOption = {
  role: AmsAuthRole;
  label: string;
  description: string;
};

export const authRoleOptions: AuthRoleOption[] = [
  {
    role: "medicalPerformanceDirector",
    label: "Medical and Performance Director",
    description: "Director-level full access.",
  },
  {
    role: "technicalStaff",
    label: "Technical Staff",
    description: "Full football staff access.",
  },
  {
    role: "administration",
    label: "Administration",
    description: "Biography, financial biography fields, and player care management.",
  },
  {
    role: "medicalStaff",
    label: "Medical Staff",
    description: "Medical and care access with financial fields restricted.",
  },
  {
    role: "performanceStaff",
    label: "Performance Staff",
    description: "Performance and care access with financial fields restricted.",
  },
  {
    role: "medicalPerformanceStaff",
    label: "Medical and Performance Staff",
    description: "Medical/performance access with financial fields restricted.",
  },
];

export const demoAuthUsers: StoredRealAmsAuthUser[] = [
  {
    id: "demo-director",
    name: "Medical Performance Director Demo",
    email: "director@realams.local",
    role: "medicalPerformanceDirector",
    password: demoPassword,
  },
  {
    id: "demo-technical",
    name: "Technical Staff Demo",
    email: "technical@realams.local",
    role: "technicalStaff",
    password: demoPassword,
  },
  {
    id: "demo-admin",
    name: "Administration Demo",
    email: "admin@realams.local",
    role: "administration",
    password: demoPassword,
  },
  {
    id: "demo-medical",
    name: "Medical Staff Demo",
    email: "medical@realams.local",
    role: "medicalStaff",
    password: demoPassword,
  },
  {
    id: "demo-performance",
    name: "Performance Staff Demo",
    email: "performance@realams.local",
    role: "performanceStaff",
    password: demoPassword,
  },
];

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export function authRoleLabel(role: AmsAuthRole) {
  return authRoleOptions.find((option) => option.role === role)?.label ?? role;
}
