import { NextRequest, NextResponse } from "next/server";
import type { AmsAuthRole } from "@/lib/ams/auth-rules";
import { canAccessDomain, canAccessRawSources } from "@/lib/ams/auth-rules";
import { authRoleCookieName } from "@/lib/ams/auth-session";

const protectedAppRoutes = new Set(["/"]);
const authRoutes = new Set(["/sign-in", "/sign-up"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = authRoleFromRequest(request);

  if (protectedAppRoutes.has(pathname) && !role) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (authRoutes.has(pathname) && role) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/api/ams/source-preview" && (!role || !canAccessRawSources(role))) {
    return forbiddenResponse();
  }

  if (pathname === "/api/ams/load" && (!role || !canAccessDomain(role, "performance"))) {
    return forbiddenResponse();
  }

  if (pathname === "/api/ams/testing" && (!role || !canAccessDomain(role, "performance"))) {
    return forbiddenResponse();
  }

  if (pathname === "/api/ams/vald-nordbord" && (!role || !canAccessDomain(role, "performance"))) {
    return forbiddenResponse();
  }

  if (pathname === "/api/ams/sync-audit" && (!role || !canAccessRawSources(role))) {
    return forbiddenResponse();
  }

  if (pathname === "/api/ams/injuries" && (!role || !canAccessDomain(role, "medical"))) {
    return forbiddenResponse();
  }

  if (
    pathname === "/api/ams/body-composition"
    && (!role || (!canAccessDomain(role, "medical") && !canAccessDomain(role, "performance")))
  ) {
    return forbiddenResponse();
  }

  if (pathname === "/api/ams/player-master" && (!role || !canAccessDomain(role, "biography"))) {
    return forbiddenResponse();
  }

  if (
    pathname === "/api/ams/rehab-services"
    && (!role || (
      !canAccessDomain(role, "medical")
      && !canAccessDomain(role, "performance")
      && !canAccessDomain(role, "playerCare")
    ))
  ) {
    return forbiddenResponse();
  }

  if (
    pathname === "/api/ams/player-history"
    && (!role || (
      !canAccessDomain(role, "biography")
      && !canAccessDomain(role, "performance")
      && !canAccessDomain(role, "technical")
    ))
  ) {
    return forbiddenResponse();
  }

  if (pathname === "/api/ams/weather" && !role) {
    return forbiddenResponse();
  }

  if (pathname === "/api/atlas/fixtures" && !role) {
    return forbiddenResponse();
  }

  if (pathname.startsWith("/api/vald/") && (!role || !canAccessDomain(role, "performance"))) {
    return forbiddenResponse();
  }

  if (pathname.startsWith("/ams/data/clean/") && (!role || !canAccessPublicCleanDataPath(role, pathname))) {
    return forbiddenResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/ams/source-preview",
    "/api/ams/load",
    "/api/ams/testing",
    "/api/ams/vald-nordbord",
    "/api/ams/sync-audit",
    "/api/ams/injuries",
    "/api/ams/body-composition",
    "/api/ams/player-master",
    "/api/ams/rehab-services",
    "/api/ams/player-history",
    "/api/ams/weather",
    "/api/atlas/fixtures",
    "/api/vald/:path*",
    "/ams/data/clean/:path*",
  ],
};

function authRoleFromRequest(request: NextRequest): AmsAuthRole | null {
  const value = request.cookies.get(authRoleCookieName)?.value;
  if (isAmsAuthRole(value)) return value;
  return null;
}

function isAmsAuthRole(value: string | undefined): value is AmsAuthRole {
  return [
    "administration",
    "technicalStaff",
    "medicalPerformanceDirector",
    "medicalStaff",
    "performanceStaff",
    "medicalPerformanceStaff",
  ].includes(value ?? "");
}

function canAccessPublicCleanDataPath(role: AmsAuthRole, pathname: string) {
  if (canAccessRawSources(role)) return true;

  if (pathname.includes("/sync_audit")) return false;
  if (pathname.includes("/injuries/")) return canAccessDomain(role, "medical");
  if (pathname.includes("/gps/")) return canAccessDomain(role, "performance");
  if (pathname.includes("/tests/")) return canAccessDomain(role, "performance");
  if (pathname.includes("/vald_")) return canAccessDomain(role, "performance");
  if (pathname.includes("/body_comp/")) return canAccessDomain(role, "medical") || canAccessDomain(role, "performance");
  if (pathname.includes("/rehab_services/")) return canAccessDomain(role, "medical") || canAccessDomain(role, "performance");

  return canAccessDomain(role, "biography") || canAccessDomain(role, "playerCare");
}

function forbiddenResponse() {
  return NextResponse.json(
    { error: "You do not have access to this AMS resource." },
    { status: 403 },
  );
}
