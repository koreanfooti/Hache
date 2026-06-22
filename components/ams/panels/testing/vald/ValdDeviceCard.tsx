import Image from "next/image";
import type { ValdDeviceCardData } from "@/components/ams/panels/testing/testingTypes";

export function ValdDeviceCard({
  device,
  isActive,
  onClick,
}: {
  device: ValdDeviceCardData;
  isActive: boolean;
  onClick?: () => void;
}) {
  if (!onClick) {
    return (
      <article className={isActive ? "testing-device-card is-active" : "testing-device-card"}>
        {device.image ? <Image src={device.image} alt={`${device.title} logo`} width={124} height={84} /> : <span>{device.label}</span>}
        <div>
          <strong>{device.title}</strong>
          <p>{device.copy}</p>
          <small>{device.stat}</small>
        </div>
      </article>
    );
  }

  return (
    <button
      className={isActive ? "testing-device-card is-active" : "testing-device-card"}
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
    >
      {device.image ? <Image src={device.image} alt={`${device.title} logo`} width={124} height={84} /> : <span>{device.label}</span>}
      <div>
        <strong>{device.title}</strong>
        <p>{device.copy}</p>
        <small>{device.stat}</small>
      </div>
    </button>
  );
}
