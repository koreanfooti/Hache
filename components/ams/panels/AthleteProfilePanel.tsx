"use client";

import Image from "next/image";
import type { Player } from "@/lib/ams/content";
import { hasPlayerPhoto } from "@/lib/ams/player-media";
import { panelCopy } from "@/components/ams/config/copy";
import { localizedValue, type AmsLanguage } from "@/components/ams/ui/AmsUi";
import { PlayerRosterList } from "@/components/ams/ui/PlayerRosterList";

export function AthleteProfilePanel({
  language,
  selectedPlayer,
  visiblePlayers,
  onSelectPlayer,
}: {
  language: AmsLanguage;
  selectedPlayer: Player;
  visiblePlayers: Player[];
  onSelectPlayer: (playerId: string) => void;
}) {
  const copy = panelCopy[language];
  const actions = language === "es"
    ? ["Listo", "Monitorear", "Modificar", "Recuperar", "Investigar"]
    : ["Ready", "Monitor", "Modify", "Recover", "Investigate"];

  return (
    <div className="athlete-profile-browser">
      <PlayerRosterList
        className="biography-player-list athlete-profile-roster"
        language={language}
        players={visiblePlayers}
        selectedPlayerId={selectedPlayer.id}
        title={language === "es" ? "Perfiles de atletas" : "Athlete profiles"}
        onSelectPlayer={onSelectPlayer}
      />
      <div className="athlete-profile-panel">
        <section className="athlete-profile-hero">
          <div className="athlete-profile-photo">
            {hasPlayerPhoto(selectedPlayer) ? (
              <Image src={selectedPlayer.photo} alt="" width={240} height={240} />
            ) : (
              <span>{selectedPlayer.number || "-"}</span>
            )}
          </div>
          <div>
            <span className="section-kicker">{copy.athleteProfile.kicker}</span>
            <h2>{selectedPlayer.name}</h2>
            <p>
              #{selectedPlayer.number} · {selectedPlayer.amsId} · {localizedValue(selectedPlayer.position, language)}
            </p>
            <div className="readiness-command-grid">
              {actions.map((action, index) => (
                <article className={`readiness-command ${index === 0 ? "is-ready" : ""}`} key={action}>
                  <strong>{action}</strong>
                  <span>
                    {index === 0
                      ? language === "es" ? "Estado actual" : "Current call"
                      : language === "es" ? "Pendiente de datos" : "Awaiting source data"}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="athlete-profile-grid">
          <article>
            <span>{language === "es" ? "Pregunta central" : "Core Question"}</span>
            <strong>{language === "es" ? "¿Se adapta o acumula fatiga?" : "Adapting or accumulating fatigue?"}</strong>
            <p>{copy.athleteProfile.copy}</p>
          </article>
          {copy.athleteProfile.items.map((item) => (
            <article key={item}>
              <span>{language === "es" ? "Módulo próximo" : "Next module"}</span>
              <strong>{item}</strong>
              <p>
                {language === "es"
                  ? "Se conectará cuando las fuentes de bienestar, sueño, carga y pruebas estén completas."
                  : "Will connect once wellness, sleep, load, and testing sources are fully loaded."}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
