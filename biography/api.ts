"use client";

import { useEffect, useState } from "react";

export type ValdCategory = {
  id: string;
  name: string;
  syncId?: string;
};

export type ValdTenant = {
  id: string;
  name: string;
  sport?: string;
  league?: string;
  logoUri?: string;
};

export type ValdGroup = {
  id: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  syncId?: string;
  kind: "team" | "position" | "other";
};

export type ValdProfile = {
  profileId?: string;
  syncId?: string;
  givenName?: string;
  familyName?: string;
  dateOfBirth?: string;
  externalId?: string;
  email?: string;
};

export type TeamAthlete = {
  id: string;
  name: string;
  birthDate: string;
  externalId?: string;
  email?: string;
  positions: ValdGroup[];
  groups: ValdGroup[];
  teams: ValdGroup[];
};

export type TeamSummary = ValdGroup & {
  athleteCount: number | null;
  athletes: TeamAthlete[];
};

export type ValdTeamsPayload = {
  tenant: ValdTenant | null;
  categories: ValdCategory[];
  groups: ValdGroup[];
  teams: TeamSummary[];
};

type ApiResponse = ValdTeamsPayload & {
  error?: string;
};

type TeamRosterResponse = {
  team?: TeamSummary;
  error?: string;
};

export function useValdTeams() {
  const [data, setData] = useState<ValdTeamsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/vald/teams");
        const payload = (await res.json().catch(() => null)) as ApiResponse | null;

        if (!res.ok) {
          throw new Error(payload?.error || "Failed to load VALD teams");
        }

        if (!cancelled) {
          setData({
            tenant: payload?.tenant ?? null,
            categories: Array.isArray(payload?.categories) ? payload.categories : [],
            groups: Array.isArray(payload?.groups) ? payload.groups : [],
            teams: Array.isArray(payload?.teams) ? payload.teams : [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load VALD teams");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

export function useValdTeamRoster(teamId: string | null) {
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      return;
    }

    let cancelled = false;
    const activeTeamId = teamId;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/vald/team?teamId=${encodeURIComponent(activeTeamId)}`);
        const payload = (await res.json().catch(() => null)) as TeamRosterResponse | null;

        if (!res.ok) {
          throw new Error(payload?.error || "Failed to load team roster");
        }

        if (!cancelled) {
          setTeam(payload?.team ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load team roster");
          setTeam(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return {
    team: teamId ? team : null,
    loading: teamId ? loading : false,
    error: teamId ? error : null,
  };
}
