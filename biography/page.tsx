"use client";

import { useMemo, useState } from "react";
import { type TeamAthlete, type TeamSummary, useValdTeamRoster, useValdTeams } from "./api";

function formatDate(dateString: string) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
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

  return Number.isFinite(age) ? `${age} yrs` : "-";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function groupNames(groups: TeamAthlete["groups"]) {
  if (!groups.length) return "Not assigned";

  return groups.map((group) => group.name).join(", ");
}

function exportRoster(group: TeamSummary) {
  if (!group.athletes.length) return;

  const headers = ["profileId", "name", "dateOfBirth", "age", "externalId", "email", "loadedGroup"];
  const rows = group.athletes.map((athlete) =>
    [
      athlete.id,
      athlete.name,
      athlete.birthDate,
      calculateAge(athlete.birthDate),
      athlete.externalId ?? "",
      athlete.email ?? "",
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
  anchor.download = `${group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-profiles.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function copyProfileId(profileId: string) {
  void navigator.clipboard?.writeText(profileId);
}

function ProfilePanel({
  athlete,
  group,
  onClose,
}: {
  athlete: TeamAthlete | null;
  group: TeamSummary | null;
  onClose: () => void;
}) {
  if (!athlete) {
    return (
      <aside className="flex min-h-0 flex-col border-l border-zinc-800 bg-zinc-950/80">
        <div className="border-b border-zinc-800 px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-100">Player Profile</h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-zinc-500">
          Select a player to inspect their VALD profile fields.
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex min-h-0 flex-col border-l border-zinc-800 bg-zinc-950/80">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-100">Player Profile</h2>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-md border border-zinc-800 text-lg leading-none text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
          aria-label="Close player profile"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xl font-semibold text-zinc-400">
            {initials(athlete.name)}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-zinc-50">{athlete.name}</h3>
          <p className="mt-1 text-sm text-sky-300">{group?.name ?? groupNames(athlete.groups)}</p>
        </div>

        <dl className="mt-8 divide-y divide-zinc-800 text-sm">
          <div className="py-4">
            <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Age</dt>
            <dd className="mt-1 text-zinc-100">{calculateAge(athlete.birthDate)}</dd>
          </div>
          <div className="py-4">
            <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Date of Birth</dt>
            <dd className="mt-1 text-zinc-100">{formatDate(athlete.birthDate)}</dd>
          </div>
          <div className="py-4">
            <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">External ID</dt>
            <dd className="mt-1 break-all text-zinc-100">{athlete.externalId || "-"}</dd>
          </div>
          <div className="py-4">
            <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Email</dt>
            <dd className="mt-1 break-all text-zinc-100">{athlete.email || "-"}</dd>
          </div>
          <div className="py-4">
            <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Profile ID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-zinc-300">{athlete.id}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Loaded VALD Group</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {athlete.groups.map((item) => (
              <span
                key={item.id}
                className="rounded-md border border-sky-400/30 bg-sky-400/15 px-3 py-1 text-xs text-sky-200"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-zinc-800 p-6">
        <button
          type="button"
          onClick={() => copyProfileId(athlete.id)}
          className="h-11 w-full rounded-md border border-zinc-800 bg-zinc-900 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          Copy Profile ID
        </button>
      </div>
    </aside>
  );
}

export default function Biography() {
  const { data, loading, error } = useValdTeams();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const groups = useMemo(() => data?.teams ?? [], [data]);
  const selectedGroupSummary = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [selectedGroupId, groups],
  );
  const {
    team: loadedGroup,
    loading: rosterLoading,
    error: rosterError,
  } = useValdTeamRoster(selectedGroupId);
  const activeGroup = loadedGroup ?? selectedGroupSummary;
  const filteredAthletes = useMemo(() => {
    const athletes = activeGroup?.athletes ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return athletes;

    return athletes.filter((athlete) =>
      [athlete.name, athlete.id, athlete.externalId, athlete.email, groupNames(athlete.groups)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [activeGroup, query]);
  const selectedAthlete =
    filteredAthletes.find((athlete) => athlete.id === selectedAthleteId) ??
    activeGroup?.athletes.find((athlete) => athlete.id === selectedAthleteId) ??
    null;

  function selectGroup(groupId: string) {
    setSelectedGroupId(groupId);
    setSelectedAthleteId(null);
    setQuery("");
    setLastFetched(new Date());
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-8 text-zinc-100">
      <div className="mx-auto max-w-[1680px]">
        <h1 className="mb-5 text-xl font-semibold text-zinc-600">VALD Profile Dashboard</h1>

        <div className="grid min-h-[760px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl lg:grid-cols-[76px_minmax(0,1fr)_360px]">
          <nav className="flex flex-col items-center border-r border-zinc-800 bg-zinc-950 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-400 text-sm font-bold text-zinc-950">
              HP
            </div>
            <div className="mt-12 flex flex-col gap-3 text-zinc-500">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-sky-300">
                ◎
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md">≡</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md">⚙</div>
            </div>
          </nav>

          <section className="min-w-0">
            <header className="flex min-h-16 items-center justify-between border-b border-zinc-800 px-7">
              <div className="flex min-w-0 items-center gap-3 text-sm">
                <span className="text-zinc-500">Groups</span>
                <span className="text-zinc-600">›</span>
                <span className="truncate font-medium text-zinc-100">
                  {activeGroup?.name ?? data?.tenant?.name ?? "Select a VALD group"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  VALD fetch {lastFetched ? "just now" : "pending"}
                </span>
                <button
                  type="button"
                  onClick={() => activeGroup && exportRoster(activeGroup)}
                  disabled={!activeGroup?.athletes.length}
                  className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-600"
                >
                  Export Roster
                </button>
              </div>
            </header>

            <div className="border-b border-zinc-800 px-7 py-5">
              {loading && <p className="text-sm text-zinc-400">Loading VALD groups...</p>}

              {error && (
                <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <div className="grid gap-4">
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => selectGroup(group.id)}
                        className={`h-10 shrink-0 rounded-md border px-4 text-sm transition ${
                          group.id === selectedGroupId
                            ? "border-sky-400/50 bg-sky-400/15 text-sky-200"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100"
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-5">
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search players..."
                      className="h-11 w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-sky-400"
                    />
                    <p className="text-sm text-zinc-400">
                      Showing{" "}
                      <span className="font-semibold text-zinc-100">{filteredAthletes.length}</span>{" "}
                      of{" "}
                      <span className="font-semibold text-zinc-100">
                        {activeGroup?.athletes.length ?? 0}
                      </span>{" "}
                      players
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-zinc-900 text-xs uppercase tracking-[0.12em] text-zinc-500">
                  <tr>
                    <th className="px-7 py-3 font-medium">Player</th>
                    <th className="px-4 py-3 font-medium">Date of Birth</th>
                    <th className="px-4 py-3 font-medium">External ID</th>
                    <th className="px-4 py-3 font-medium">Loaded Group</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {rosterLoading && (
                    <tr>
                      <td colSpan={5} className="px-7 py-8 text-zinc-400">
                        Loading selected group roster...
                      </td>
                    </tr>
                  )}

                  {rosterError && (
                    <tr>
                      <td colSpan={5} className="px-7 py-8">
                        <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
                          {rosterError}
                        </div>
                      </td>
                    </tr>
                  )}

                  {!rosterLoading &&
                    !rosterError &&
                    filteredAthletes.map((athlete) => (
                      <tr
                        key={athlete.id}
                        onClick={() => setSelectedAthleteId(athlete.id)}
                        className={`cursor-pointer transition ${
                          athlete.id === selectedAthleteId
                            ? "bg-sky-400/10"
                            : "bg-zinc-950 hover:bg-zinc-900/70"
                        }`}
                      >
                        <td className="px-7 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-400">
                              {initials(athlete.name)}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-100">{athlete.name}</p>
                              <p className="mt-0.5 font-mono text-xs text-zinc-500">{athlete.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-zinc-100">{formatDate(athlete.birthDate)}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{calculateAge(athlete.birthDate)}</p>
                        </td>
                        <td className="px-4 py-4 text-zinc-400">{athlete.externalId || "-"}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {athlete.groups.map((group) => (
                              <span
                                key={group.id}
                                className="rounded-md border border-sky-400/30 bg-sky-400/15 px-2.5 py-1 text-xs text-sky-200"
                              >
                                {group.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-xl text-zinc-500">›</td>
                      </tr>
                    ))}

                  {!rosterLoading && !rosterError && selectedGroupId && !filteredAthletes.length && (
                    <tr>
                      <td colSpan={5} className="px-7 py-8 text-zinc-400">
                        No players found in this group.
                      </td>
                    </tr>
                  )}

                  {!selectedGroupId && !loading && !error && (
                    <tr>
                      <td colSpan={5} className="px-7 py-8 text-zinc-400">
                        Select a VALD group to load its roster.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <ProfilePanel
            athlete={selectedAthlete}
            group={activeGroup}
            onClose={() => setSelectedAthleteId(null)}
          />
        </div>
      </div>
    </main>
  );
}
