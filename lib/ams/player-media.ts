import type { Player } from "@/lib/ams/content";

const missingPhotoMarkers = ["example_", "download-removebg-preview", "prod-removebg-preview"];

export function hasPlayerPhoto(player: Pick<Player, "photo">) {
  return Boolean(player.photo) && !missingPhotoMarkers.some((marker) => player.photo.includes(marker));
}
