"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealAmsAuthUser } from "@/lib/ams/auth-session";
import { canAccessSection } from "@/lib/ams/auth-rules";
import { type AmsSection, navItems, players as fallbackPlayers } from "@/lib/ams/content";
import { buildRosterPlayers } from "@/lib/ams/roster";
import { localizedAuthRoleLabel } from "@/components/ams/auth/auth-copy";
import { panelCopy } from "@/components/ams/config/copy";
import { isMvpVisibleSection, mvpSectionLabel } from "@/components/ams/config/mvp";
import { useAmsLanguage, useAmsSources } from "@/components/ams/hooks/client";
import { BiographyPanel } from "@/components/ams/panels/BiographyPanel";
import { CalendarPanel } from "@/components/ams/panels/CalendarPanel";
import {
  BodyCompositionPanel,
  DevelopmentPanel,
  LoadPanel,
  RecoveryPanel,
} from "@/components/ams/panels/DataPanels";
import { InjuryPanel } from "@/components/ams/panels/InjuryPanel";
import { MatchHistoryPanel } from "@/components/ams/panels/MatchHistoryPanel";
import { SettingsPanel } from "@/components/ams/panels/SettingsPanel";
import {
  AppHeader,
  ContextStrip,
  ModuleNav,
  OverviewPanel,
  PlayerStrip,
} from "@/components/ams/shell/AmsShell";

const sectionMap: Record<AmsSection, string> = Object.fromEntries(
  navItems.map((item) => [item.id, item.label]),
) as Record<AmsSection, string>;

export default function AmsDashboard({
  authUser,
  onSignOut,
}: {
  authUser: RealAmsAuthUser;
  onSignOut: () => void;
}) {
  const defaultSection = defaultSectionForRole(authUser.role);
  const [activeSection, setActiveSection] = useState<AmsSection>(defaultSection);
  const [language, setLanguage] = useAmsLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState("gustavo-ferrareis");
  const [visiblePlayerIds, setVisiblePlayerIds] = useState(() => fallbackPlayers.map((player) => player.id));
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { loadSummary, sourceData } = useAmsSources(authUser.role);
  const allowedSections = useMemo(
    () => navItems
      .map((item) => item.id)
      .filter((section) => canAccessSection(authUser.role, section) && isMvpVisibleSection(section)),
    [authUser.role],
  );
  const currentSection = allowedSections.includes(activeSection)
    ? activeSection
    : allowedSections[0] ?? "biography";
  const canOpenCalendar = allowedSections.includes("calendar");
  const canOpenSettings = allowedSections.includes("settings");
  const rosterPlayers = useMemo(
    () => buildRosterPlayers(sourceData.playerMaster),
    [sourceData.playerMaster],
  );

  const visiblePlayers = useMemo(
    () => rosterPlayers.filter((player) => visiblePlayerIds.includes(player.id)),
    [rosterPlayers, visiblePlayerIds],
  );
  const selectedPlayer = visiblePlayers.find((player) => player.id === selectedPlayerId)
    ?? visiblePlayers[0]
    ?? rosterPlayers[0]
    ?? fallbackPlayers[0];

  function selectAllowedSection(section: AmsSection) {
    if (allowedSections.includes(section)) {
      setActiveSection(section);
    }
  }

  function togglePlayerInView(playerId: string) {
    setVisiblePlayerIds((currentIds) => {
      if (currentIds.includes(playerId)) {
        return currentIds.length > 1 ? currentIds.filter((id) => id !== playerId) : currentIds;
      }

      return rosterPlayers.some((player) => player.id === playerId) ? [...currentIds, playerId] : currentIds;
    });
  }

  function setPlayersInView(playerIds: string[]) {
    const validIds = playerIds.filter((id) => rosterPlayers.some((player) => player.id === id));
    if (validIds.length) {
      setVisiblePlayerIds(Array.from(new Set(validIds)));
    }
  }

  function rotateSelectedPlayer(direction: 1 | -1) {
    const rotationPlayers = visiblePlayers.length ? visiblePlayers : rosterPlayers;
    const currentIndex = Math.max(
      0,
      rotationPlayers.findIndex((player) => player.id === selectedPlayerId),
    );
    const nextIndex = (currentIndex + direction + rotationPlayers.length) % rotationPlayers.length;
    setSelectedPlayerId(rotationPlayers[nextIndex].id);
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSelectedPlayerId((currentPlayerId) => {
        const rotationPlayers = visiblePlayers.length ? visiblePlayers : rosterPlayers;
        const currentIndex = Math.max(
          0,
          rotationPlayers.findIndex((player) => player.id === currentPlayerId),
        );
        const nextIndex = (currentIndex + 1) % rotationPlayers.length;
        return rotationPlayers[nextIndex].id;
      });
    }, 5200);

    return () => window.clearInterval(timer);
  }, [rosterPlayers, visiblePlayers]);

  useEffect(() => {
    const firstTick = window.setTimeout(() => setCurrentTime(new Date()), 0);
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main className="ams-app">
      <AppHeader
        activeLabel={mvpSectionLabel(currentSection, language) ?? sectionMap[currentSection]}
        canOpenCalendar={canOpenCalendar}
        canOpenSettings={canOpenSettings}
        language={language}
        roleLabel={localizedAuthRoleLabel(authUser.role, language)}
        userName={authUser.name}
        onGoHome={() => selectAllowedSection(defaultSectionForRole(authUser.role))}
        onLanguageChange={setLanguage}
        onOpenCalendar={() => selectAllowedSection("calendar")}
        onOpenSettings={() => selectAllowedSection("settings")}
        onSignOut={onSignOut}
      />
      <ModuleNav
        activeSection={currentSection}
        allowedSections={allowedSections}
        language={language}
        onSelect={selectAllowedSection}
      />
      <div className="ams-shell">
        <section className="ams-stage">
          {currentSection !== "overview" ? (
            <>
              <ContextStrip language={language} playerCount={visiblePlayers.length} />
              <PlayerStrip
                language={language}
                playersInView={visiblePlayers}
                selectedPlayerId={selectedPlayer.id}
                onNext={() => rotateSelectedPlayer(1)}
                onPrevious={() => rotateSelectedPlayer(-1)}
                onSelect={setSelectedPlayerId}
              />
            </>
          ) : null}
          {currentSection === "overview" && (
            <OverviewPanel
              currentTime={currentTime}
              language={language}
              loadSummary={loadSummary}
              sourceData={sourceData}
              selectedPlayer={selectedPlayer}
              visiblePlayers={visiblePlayers}
              allowedSections={allowedSections}
              onSelectPlayer={setSelectedPlayerId}
              onSelectSection={selectAllowedSection}
            />
          )}
          {currentSection === "load" && <LoadPanel copy={panelCopy[language]} language={language} loadSummary={loadSummary} />}
          {currentSection === "injury" && <InjuryPanel copy={panelCopy[language]} language={language} injuries={sourceData.injuries} />}
          {currentSection === "development" && (
            <DevelopmentPanel
              copy={panelCopy[language]}
              language={language}
              fms={sourceData.fms}
              fmsExerciseScores={sourceData.fmsExerciseScores}
              yBalance={sourceData.yBalance}
              yBalanceMetrics={sourceData.yBalanceMetrics}
              valdNordbordTests={sourceData.valdNordbordTests}
              valdNordbordMetrics={sourceData.valdNordbordMetrics}
              onOpenBodyComposition={() => selectAllowedSection("bodyComp")}
            />
          )}
          {currentSection === "bodyComp" && (
            <BodyCompositionPanel
              copy={panelCopy[language]}
              language={language}
              rows={sourceData.bodyComp}
              onBackToDevelopment={() => selectAllowedSection("development")}
            />
          )}
          {currentSection === "recovery" && <RecoveryPanel copy={panelCopy[language]} language={language} rehabServices={sourceData.rehabServices} />}
          {currentSection === "biography" && (
            <BiographyPanel
              language={language}
              selectedPlayer={selectedPlayer}
              sourceData={sourceData}
              visiblePlayers={visiblePlayers}
              onSelectPlayer={setSelectedPlayerId}
              role={authUser.role}
            />
          )}
          {currentSection === "matchHistory" && (
            <MatchHistoryPanel
              language={language}
              loadSummary={loadSummary}
              sourceData={sourceData}
            />
          )}
          {currentSection === "calendar" && <CalendarPanel language={language} />}
          {currentSection === "settings" && (
            <SettingsPanel
              language={language}
              loadSummary={loadSummary}
              sourceData={sourceData}
              rosterPlayers={rosterPlayers}
              visiblePlayerIds={visiblePlayerIds}
              onTogglePlayerInView={togglePlayerInView}
              onSetPlayersInView={setPlayersInView}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function defaultSectionForRole(role: RealAmsAuthUser["role"]): AmsSection {
  if (canAccessSection(role, "overview") && isMvpVisibleSection("overview")) return "overview";
  if (canAccessSection(role, "load") && isMvpVisibleSection("load")) return "load";
  if (canAccessSection(role, "injury") && isMvpVisibleSection("injury")) return "injury";
  if (canAccessSection(role, "biography") && isMvpVisibleSection("biography")) return "biography";
  return "calendar";
}
