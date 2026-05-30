"use client";

import { useMemo, useState } from "react";
import { type TeamAthlete, type TeamSummary, useValdTeamRoster, useValdTeams } from "./api";

function formatDate(dateString: string) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

function calculateAge(dateString: string) {
  if (!dateString) return "-";

  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return Number.isFinite(age) ? String(age) : "-";
}

function groupNames(groups: TeamAthlete["groups"]) {
  if (!groups.length) return "Not assigned";

  return groups.map((group) => group.name).join(", ");
}

function exportTeam(team: TeamSummary) {
  if (!team.athletes.length) return;

  const headers = ["id", "name", "birthDate", "age", "positions", "teams", "groups"];
  const rows = team.athletes.map((athlete) =>
    [
      athlete.id,
      athlete.name,
      athlete.birthDate,
      calculateAge(athlete.birthDate),
      groupNames(athlete.positions),
      groupNames(athlete.teams),
      groupNames(athlete.groups),
    ]
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${team.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-roster.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function TeamCard({
  team,
  loadedTeam,
  selected,
  onSelect,
}: {
  team: TeamSummary;
  loadedTeam: TeamSummary | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const displayCount = loadedTeam?.athleteCount ?? team.athleteCount;
  const positionCount = new Set(
    (loadedTeam?.athletes ?? team.athletes).flatMap((athlete) =>
      athlete.positions.map((position) => position.id),
    ),
  ).size;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border p-5 text-left transition ${
        selected
          ? "border-sky-300 bg-sky-300/10"
          : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            {team.categoryName || "Team"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{team.name}</h2>
        </div>
        <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-sm font-medium text-sky-200">
          {displayCount ?? "Open"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-zinc-500">Athletes</p>
          <p className="mt-1 text-lg font-semibold text-zinc-100">{displayCount ?? "-"}</p>
        </div>
        <div>
          <p className="text-zinc-500">Positions</p>
          <p className="mt-1 text-lg font-semibold text-zinc-100">{positionCount || "-"}</p>
        </div>
      </div>
    </button>
  );
}

function PlayerDetail({
  athlete,
  onClose,
}: {
  athlete: TeamAthlete;
  onClose: () => void;
}) {
  return (
    <aside className="rounded-lg border border-sky-300/20 bg-sky-300/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-sky-200">Player details</p>
          <h3 className="mt-1 text-2xl font-semibold text-white">{athlete.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Position</dt>
          <dd className="mt-1 text-zinc-100">{groupNames(athlete.positions)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Team</dt>
          <dd className="mt-1 text-zinc-100">{groupNames(athlete.teams)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Birth date</dt>
          <dd className="mt-1 text-zinc-100">{formatDate(athlete.birthDate)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Age</dt>
          <dd className="mt-1 text-zinc-100">{calculateAge(athlete.birthDate)}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <p className="text-sm text-zinc-500">All VALD groups</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {athlete.groups.length ? (
            athlete.groups.map((group) => (
              <span
                key={group.id}
                className="rounded-full border border-white/10 bg-zinc-950 px-3 py-1 text-xs text-zinc-200"
              >
                {group.name}
              </span>
            ))
          ) : (
            <span className="text-sm text-zinc-400">No group memberships found.</span>
          )}
        </div>
      </div>

      <p className="mt-6 break-all text-xs text-zinc-500">Profile ID: {athlete.id}</p>
    </aside>
  );
}

export default function Biography() {
  const { data, loading, error } = useValdTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const teams = useMemo(() => data?.teams ?? [], [data]);
  const selectedTeamSummary = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? null,
    [selectedTeamId, teams],
  );
  const {
    team: loadedTeam,
    loading: rosterLoading,
    error: rosterError,
  } = useValdTeamRoster(selectedTeamId);
  const selectedTeam = loadedTeam ?? selectedTeamSummary;
  const filteredAthletes = useMemo(() => {
    const athletes = selectedTeam?.athletes ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return athletes;

    return athletes.filter((athlete) =>
      [athlete.name, athlete.id, groupNames(athlete.positions), groupNames(athlete.groups)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, selectedTeam]);
  const selectedAthlete =
    filteredAthletes.find((athlete) => athlete.id === selectedAthleteId) ??
    selectedTeam?.athletes.find((athlete) => athlete.id === selectedAthleteId) ??
    null;

  function selectTeam(teamId: string) {
    setSelectedTeamId(teamId);
    setSelectedAthleteId(null);
    setQuery("");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-300">
              Hache Performance
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {data?.tenant?.name || "VALD Teams"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              Choose a team, inspect its roster, and click any player to see their
              VALD team, position, and group memberships.
            </p>
          </div>

          {selectedTeam && (
            <button
              type="button"
              onClick={() => exportTeam(selectedTeam)}
              disabled={!selectedTeam.athletes.length}
              className="h-11 rounded-md bg-sky-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              Export team
            </button>
          )}
        </header>

        {loading && (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Loading VALD teams...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-zinc-400">Teams</p>
                <p className="mt-2 text-3xl font-semibold">{teams.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-zinc-400">Selected roster</p>
                <p className="mt-2 text-3xl font-semibold">
                  {loadedTeam?.athleteCount ?? "-"}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-zinc-400">VALD groups</p>
                <p className="mt-2 text-3xl font-semibold">{data?.groups.length ?? 0}</p>
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Teams</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    These come from VALD groups. Position labels appear when positions
                    are modeled as groups or categories.
                  </p>
                </div>
              </div>

              {teams.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {teams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      loadedTeam={loadedTeam?.id === team.id ? loadedTeam : null}
                      selected={team.id === selectedTeamId}
                      onSelect={() => selectTeam(team.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-zinc-400">
                  No VALD teams or groups were found for this tenant.
                </div>
              )}
            </section>

            {selectedTeamSummary && (
              <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="rounded-lg border border-white/10 bg-white/[0.04]">
                  <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Selected team</p>
                      <h2 className="mt-1 text-2xl font-semibold">{selectedTeamSummary.name}</h2>
                    </div>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search this roster"
                      className="h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-sky-300 md:w-72"
                    />
                  </div>

                  <div className="grid gap-3 p-5">
                    {rosterLoading && (
                      <p className="text-zinc-400">Loading team roster...</p>
                    )}

                    {rosterError && (
                      <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                        {rosterError}
                      </div>
                    )}

                    {!rosterLoading && !rosterError && filteredAthletes.length ? (
                      filteredAthletes.map((athlete) => (
                        <button
                          key={athlete.id}
                          type="button"
                          onClick={() => setSelectedAthleteId(athlete.id)}
                          className={`grid gap-4 rounded-lg border p-4 text-left transition md:grid-cols-[1fr_auto] ${
                            selectedAthleteId === athlete.id
                              ? "border-sky-300 bg-sky-300/10"
                              : "border-white/10 bg-zinc-950 hover:border-white/25"
                          }`}
                        >
                          <div>
                            <h3 className="text-lg font-semibold text-white">{athlete.name}</h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                                {groupNames(athlete.positions)}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                                {groupNames(athlete.teams)}
                              </span>
                            </div>
                          </div>

                          <div className="text-sm text-zinc-400 md:text-right">
                            <p>{formatDate(athlete.birthDate)}</p>
                            <p className="mt-1">Age {calculateAge(athlete.birthDate)}</p>
                          </div>
                        </button>
                      ))
                    ) : null}

                    {!rosterLoading && !rosterError && !filteredAthletes.length && (
                      <p className="text-zinc-400">No players found for this team.</p>
                    )}
                  </div>
                </div>

                {selectedAthlete ? (
                  <PlayerDetail athlete={selectedAthlete} onClose={() => setSelectedAthleteId(null)} />
                ) : (
                  <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-zinc-400">
                    Click a player to see their team, position, and full VALD group list.
                  </aside>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
