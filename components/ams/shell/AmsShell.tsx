"use client";

import Image from "next/image";
import type { AmsSection, Player } from "@/lib/ams/content";
import { integrationCards, navItems } from "@/lib/ams/content";
import { compactNumber } from "@/lib/ams/data";
import { hasPlayerPhoto } from "@/lib/ams/player-media";
import { panelCopy, uiCopy } from "@/components/ams/config/copy";
import { QuickCard, type AmsLanguage } from "@/components/ams/ui/AmsUi";
import type { LoadSummary, SourceData } from "@/lib/ams/source-types";

export function AppHeader({
  activeLabel,
  language,
  onGoHome,
  onLanguageChange,
  onOpenCalendar,
  onOpenResources,
  onOpenSettings,
}: {
  activeLabel: string;
  language: AmsLanguage;
  onGoHome: () => void;
  onLanguageChange: (language: AmsLanguage) => void;
  onOpenCalendar: () => void;
  onOpenResources: () => void;
  onOpenSettings: () => void;
}) {
  const copy = uiCopy[language];

  return (
    <header className="ams-header">
      <button className="ams-brand" type="button" onClick={onGoHome} aria-label={copy.home}>
        <Image
          src="/ams/assets/clubs/10445.png"
          alt="Atlas FC crest"
          width={64}
          height={64}
          priority
        />
        <div>
          <p>{copy.appEyebrow}</p>
          <h1>{copy.appTitle}</h1>
        </div>
      </button>
      <div className="ams-header-actions">
        <button className="resources-action" type="button" onClick={onOpenResources}>
          <Image src="/ams/assets/resources-document.png" alt="" width={22} height={22} />
          {copy.resources}
        </button>
        <button className="calendar-button" type="button" onClick={onOpenCalendar} aria-label={copy.calendar}>
          <Image src="/ams/assets/calendar-clock.png" alt="" width={28} height={28} />
        </button>
        <span className="language-action" aria-label={copy.language}>
          <button
            className={language === "en" ? "is-active" : ""}
            type="button"
            onClick={() => onLanguageChange("en")}
            aria-label="Switch to English"
          >
            🇬🇧
          </button>
          <button
            className={language === "es" ? "is-active" : ""}
            type="button"
            onClick={() => onLanguageChange("es")}
            aria-label="Cambiar a español"
          >
            🇲🇽
          </button>
        </span>
        <button type="button" onClick={onOpenSettings} aria-label={copy.openSettings}>
          ⚙
        </button>
        <span className="active-section-pill">{activeLabel}</span>
        <button type="button">{copy.exportCsv}</button>
      </div>
    </header>
  );
}

export function Sidebar({
  activeSection,
  language,
  onSelect,
}: {
  activeSection: AmsSection;
  language: AmsLanguage;
  onSelect: (section: AmsSection) => void;
}) {
  const copy = uiCopy[language];
  const sectionLabels: Partial<Record<AmsSection, string>> = copy.sections;

  return (
    <nav className="ams-sidebar" aria-label="AMS sections">
      {navItems.filter((item) =>
        ["load", "injury", "development", "recovery", "biography", "external", "athleteProfile"].includes(item.id),
      ).map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === activeSection ? "is-active" : ""}
          onClick={() => onSelect(item.id)}
        >
          <small>{item.eyebrow}</small>
          <span>{sectionLabels[item.id] ?? item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function ContextStrip({ language, playerCount }: { language: AmsLanguage; playerCount: number }) {
  const copy = uiCopy[language];

  return (
    <section className="club-context">
      <div>
        <span className="section-kicker">{copy.contextKicker}</span>
        <p>{copy.contextCopy}</p>
      </div>
      <div className="context-stat">
        <strong>{playerCount}</strong>
        <span>{copy.playersInView}</span>
      </div>
    </section>
  );
}

export function PlayerStrip({
  language,
  playersInView,
  selectedPlayerId,
  onNext,
  onPrevious,
  onSelect,
}: {
  language: AmsLanguage;
  playersInView: Player[];
  selectedPlayerId: string;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (playerId: string) => void;
}) {
  const carouselPlayers = [...playersInView, ...playersInView];
  const copy = uiCopy[language];

  return (
    <section className="player-carousel-panel" aria-label={copy.playerCarousel}>
      <div className="player-carousel-header">
        <div>
          <span className="section-kicker">{copy.playerCarousel}</span>
          <strong>{copy.playerCarousel}</strong>
        </div>
        <div className="player-carousel-controls">
          <button type="button" onClick={onPrevious} aria-label={copy.showPreviousPlayer}>
            ‹
          </button>
          <button type="button" onClick={onNext} aria-label={copy.showNextPlayer}>
            ›
          </button>
        </div>
      </div>
      <div className="player-strip">
        <div className="player-strip-track">
          {carouselPlayers.map((player, index) => {
            const fallbackNumber = player.number && String(player.number) !== "-" ? String(player.number) : "";

            return (
              <button
                key={`${player.id}-${index}`}
                type="button"
                className={player.id === selectedPlayerId ? "player-pill is-active" : "player-pill"}
                onClick={() => onSelect(player.id)}
                tabIndex={index >= playersInView.length ? -1 : 0}
                aria-hidden={index >= playersInView.length}
              >
                <span className="player-photo">
                  {hasPlayerPhoto(player) ? (
                    <Image src={player.photo} alt="" width={72} height={72} />
                  ) : (
                    <span className="player-photo-fallback">{fallbackNumber}</span>
                  )}
                </span>
                <span>
                  <strong>{player.name}</strong>
                  <small>{player.amsId}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function OverviewPanel({
  currentTime,
  language,
  loadSummary,
  sourceData,
  selectedPlayer,
  onSelectSection,
}: {
  currentTime: Date | null;
  language: AmsLanguage;
  loadSummary: LoadSummary;
  sourceData: SourceData;
  selectedPlayer: Player;
  onSelectSection: (section: AmsSection) => void;
}) {
  const copy = uiCopy[language];
  const sectionLabels: Partial<Record<AmsSection, string>> = copy.sections;
  const timeText = currentTime
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Mexico_City",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(currentTime)
    : "--:--:-- AM";
  const [timeValue, periodValue = ""] = timeText.split(" ");
  const dateLocale = language === "es" ? "es-MX" : "en-GB";
  const dateText = currentTime
    ? `${new Intl.DateTimeFormat(dateLocale, {
        timeZone: "America/Mexico_City",
        weekday: "long",
      }).format(currentTime)} · ${new Intl.DateTimeFormat(dateLocale, {
        timeZone: "America/Mexico_City",
        day: "2-digit",
        month: "long",
      }).format(currentTime)}`
    : "";

  return (
    <div className="panel-stack">
      <section className="hero-panel welcome-hero">
        <div className="welcome-clock"><span>{timeValue} <small>{periodValue}</small></span><strong>{dateText}</strong></div>
        <div className="home-assistant">
          <span>{copy.assistantKicker}</span>
          <h2>{copy.assistantPrompt}</h2>
          <div className="assistant-row assistant-search">
            <input
              autoFocus
              placeholder={copy.assistantPlaceholder}
            />
            <button type="button">{copy.ask}</button>
          </div>
          <p>{copy.assistantStatus}</p>
          <article className="rag-example">
            <span>{copy.ragExampleLabel}</span>
            <button className="rag-example-prompt" type="button">
              {copy.ragExamplePrompt.replace("{player}", selectedPlayer.name)}
            </button>
          </article>
        </div>
      </section>

      <section className="quick-grid welcome-grid">
        <QuickCard label={sectionLabels.load ?? "Load Demand"} value={`${compactNumber(loadSummary.sessions)} ${panelCopy[language].common.records}`} onClick={() => onSelectSection("load")} />
        <QuickCard label={sectionLabels.injury ?? "Injury History"} value={`${compactNumber(sourceData.injuries.length)} ${panelCopy[language].common.injuries}`} onClick={() => onSelectSection("injury")} />
        <QuickCard label={sectionLabels.development ?? "Physical Development"} value={`${compactNumber(sourceData.fms.length + sourceData.yBalance.length)} ${panelCopy[language].common.tests}`} onClick={() => onSelectSection("development")} />
        <QuickCard label={copy.calendar} value={copy.rtpPlanning} onClick={() => onSelectSection("calendar")} />
      </section>

      <section className="integration-grid">
        {integrationCards.map((item) => (
          <article key={item.label}>
            <Image src={item.asset} alt="" width={42} height={42} />
            <div>
              <strong>{item.label}</strong>
              <span>{localizedIntegrationStatus(item.status, language)}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function localizedIntegrationStatus(status: string, language: AmsLanguage) {
  if (language === "en") return status;
  const statuses: Record<string, string> = {
    "Active cleaned feed": "Feed limpio activo",
    "NordBord mapped": "NordBord mapeado",
    "Testing battery": "Bateria de pruebas",
    "Future API": "API futura",
    "Future match context": "Contexto futuro de partido",
    "Future source": "Fuente futura",
  };
  return statuses[status] ?? status;
}
