import Image from "next/image";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import type { Player } from "@/lib/ams/content";
import { hasPlayerPhoto } from "@/lib/ams/player-media";
import type { ValdForceFrameTestRow } from "@/lib/ams/types";
import type { ForceFrameLabels } from "@/components/ams/panels/testing/vald/forceframe/forceframeLabels";
import {
  fallbackPlayer,
  formatShortDate,
  positionLabel,
} from "@/components/ams/panels/testing/vald/forceframe/forceframeUtils";

export function ForceFramePlayerPanel({
  activePlayer,
  activePlayerId,
  copy,
  filteredPlayerIds,
  language,
  labels,
  latestTest,
  onSelectPlayer,
  playerById,
}: {
  activePlayer: Player;
  activePlayerId: string;
  copy: { common: Record<string, string> };
  filteredPlayerIds: string[];
  language: AmsLanguage;
  labels: ForceFrameLabels;
  latestTest?: ValdForceFrameTestRow;
  onSelectPlayer: (playerId: string) => void;
  playerById: Map<string, Player>;
}) {
  return (
    <aside className="nordbord-player-panel forceframe-player-panel">
      <div className="nordbord-player-photo-card">
        {hasPlayerPhoto(activePlayer) ? (
          <Image className="nordbord-player-photo" src={activePlayer.photo} alt="" width={240} height={240} />
        ) : (
          <span className="nordbord-player-photo-fallback">{activePlayer.number}</span>
        )}
      </div>
      <strong className="nordbord-player-title">{labels.player}</strong>
      <label className="nordbord-player-select">
        <span>{labels.player}</span>
        <select value={activePlayerId} onChange={(event) => onSelectPlayer(event.target.value)}>
          {filteredPlayerIds.map((id) => {
            const player = playerById.get(id) ?? fallbackPlayer(id, copy.common.unknownPlayer);
            return <option key={id} value={id}>{player.name}</option>;
          })}
        </select>
      </label>
      <div className="nordbord-info-card">
        <h4>{labels.info}</h4>
        <div>
          <span>{labels.number}</span>
          <strong>{activePlayer.number}</strong>
        </div>
        <div>
          <span>{labels.age}</span>
          <strong>{activePlayer.age}</strong>
        </div>
        <div>
          <span>{labels.height}</span>
          <strong>{activePlayer.height}</strong>
        </div>
        <div>
          <span>{labels.foot}</span>
          <strong>{activePlayer.foot}</strong>
        </div>
        <div className="nordbord-info-wide">
          <span>{labels.position}</span>
          <strong>{positionLabel(activePlayer.position, language)}</strong>
        </div>
        <div className="nordbord-info-wide">
          <span>{labels.latestTest}</span>
          <strong>{formatShortDate(latestTest?.testDateUtc) || copy.common.noDate}</strong>
        </div>
      </div>
    </aside>
  );
}
