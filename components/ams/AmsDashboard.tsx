"use client";

import { useEffect, useMemo, useState } from "react";
import { type AmsSection, navItems, players as fallbackPlayers } from "@/lib/ams/content";
import { buildRosterPlayers } from "@/lib/ams/roster";
import { panelCopy } from "@/components/ams/config/copy";
import { useAmsSources } from "@/components/ams/hooks/useAmsSources";
import { AthleteProfilePanel } from "@/components/ams/panels/AthleteProfilePanel";
import { BiographyPanel } from "@/components/ams/panels/BiographyPanel";
import { CalendarPanel } from "@/components/ams/panels/CalendarPanel";
import {
  BodyCompositionPanel,
  DevelopmentPanel,
  InjuryPanel,
  LoadPanel,
  RecoveryPanel,
} from "@/components/ams/panels/DataPanels";
import { ExternalFactorsPanel } from "@/components/ams/panels/ExternalFactorsPanel";
import { ResourcesPanel } from "@/components/ams/panels/ResourcesPanel";
import { SettingsPanel } from "@/components/ams/panels/SettingsPanel";
import {
  AppHeader,
  ContextStrip,
  OverviewPanel,
  PlayerStrip,
  Sidebar,
} from "@/components/ams/shell/AmsShell";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

type Language = AmsLanguage;

const sectionMap: Record<AmsSection, string> = Object.fromEntries(
  navItems.map((item) => [item.id, item.label]),
) as Record<AmsSection, string>;

export default function AmsDashboard() {
  const [activeSection, setActiveSection] = useState<AmsSection>("overview");
  const [language, setLanguage] = useState<Language>("en");
  const [selectedPlayerId, setSelectedPlayerId] = useState("gustavo-ferrareis");
  const [visiblePlayerIds, setVisiblePlayerIds] = useState(() => fallbackPlayers.map((player) => player.id));
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { loadSummary, sourceData } = useAmsSources();
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
        activeLabel={sectionMap[activeSection]}
        language={language}
        onGoHome={() => setActiveSection("overview")}
        onLanguageChange={setLanguage}
        onOpenCalendar={() => setActiveSection("calendar")}
        onOpenResources={() => setActiveSection("resources")}
        onOpenSettings={() => setActiveSection("settings")}
      />
      <div className="ams-shell">
        <section className="ams-stage">
          <ContextStrip language={language} playerCount={visiblePlayers.length} />
          <PlayerStrip
            language={language}
            playersInView={visiblePlayers}
            selectedPlayerId={selectedPlayer.id}
            onNext={() => rotateSelectedPlayer(1)}
            onPrevious={() => rotateSelectedPlayer(-1)}
            onSelect={setSelectedPlayerId}
          />
          <Sidebar activeSection={activeSection} language={language} onSelect={setActiveSection} />
          {activeSection === "overview" && (
            <OverviewPanel
              currentTime={currentTime}
              language={language}
              loadSummary={loadSummary}
              sourceData={sourceData}
              selectedPlayer={selectedPlayer}
              onSelectSection={setActiveSection}
            />
          )}
          {activeSection === "load" && <LoadPanel copy={panelCopy[language]} language={language} loadSummary={loadSummary} />}
          {activeSection === "injury" && <InjuryPanel copy={panelCopy[language]} language={language} injuries={sourceData.injuries} />}
          {activeSection === "development" && (
            <DevelopmentPanel
              copy={panelCopy[language]}
              language={language}
              fms={sourceData.fms}
              fmsExerciseScores={sourceData.fmsExerciseScores}
              yBalance={sourceData.yBalance}
              yBalanceMetrics={sourceData.yBalanceMetrics}
              valdNordbordTests={sourceData.valdNordbordTests}
              valdNordbordMetrics={sourceData.valdNordbordMetrics}
            />
          )}
          {activeSection === "bodyComp" && <BodyCompositionPanel copy={panelCopy[language]} language={language} rows={sourceData.bodyComp} />}
          {activeSection === "recovery" && <RecoveryPanel copy={panelCopy[language]} language={language} rehabServices={sourceData.rehabServices} />}
          {activeSection === "biography" && (
            <BiographyPanel
              language={language}
              selectedPlayer={selectedPlayer}
              sourceData={sourceData}
              visiblePlayers={visiblePlayers}
              onSelectPlayer={setSelectedPlayerId}
            />
          )}
          {activeSection === "external" && <ExternalFactorsPanel language={language} />}
          {activeSection === "athleteProfile" && (
            <AthleteProfilePanel
              language={language}
              selectedPlayer={selectedPlayer}
              visiblePlayers={visiblePlayers}
              onSelectPlayer={setSelectedPlayerId}
            />
          )}
          {activeSection === "calendar" && <CalendarPanel language={language} />}
          {activeSection === "resources" && <ResourcesPanel language={language} />}
          {activeSection === "settings" && (
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
