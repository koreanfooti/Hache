import { access } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { amsSourcePaths } from "@/lib/ams/source-registry";

export const dynamic = "force-dynamic";

const requiredDataFiles = [
  amsSourcePaths.currentRosterGps,
  amsSourcePaths.playerMaster,
  amsSourcePaths.bodyComp,
  amsSourcePaths.fmsAssessments,
  amsSourcePaths.yBalanceAssessments,
  amsSourcePaths.valdNordbordTests,
  amsSourcePaths.playerSeasonHistory,
  amsSourcePaths.playerMatchHistory,
];

export async function GET() {
  const checks = await Promise.all(requiredDataFiles.map(checkPublicDataFile));
  const missingFiles = checks.filter((check) => !check.available);
  const status = missingFiles.length ? "degraded" : "ok";

  return NextResponse.json(
    {
      service: "hache-ams",
      status,
      timestamp: new Date().toISOString(),
      checks: {
        cleanData: {
          status,
          required: checks.length,
          available: checks.length - missingFiles.length,
          missing: missingFiles.map((check) => check.path),
        },
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

async function checkPublicDataFile(publicPath: string) {
  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.resolve(publicDir, publicPath.replace(/^\/+/, ""));

  try {
    await access(filePath);
    return { path: publicPath, available: true };
  } catch {
    return { path: publicPath, available: false };
  }
}
