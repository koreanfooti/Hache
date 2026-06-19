import { panelCopy } from "@/components/ams/config/copy";
import { PanelIntro, type AmsLanguage } from "@/components/ams/ui/AmsUi";

export function ResourcesPanel({ language }: { language: AmsLanguage }) {
  const copy = panelCopy[language];

  return (
    <SectionPlaceholder
      emptyDetail={copy.common.readyForComponentExtraction}
      kicker={copy.resources.kicker}
      title={copy.resources.title}
      copy={copy.resources.copy}
      items={[...copy.resources.items]}
    />
  );
}

function SectionPlaceholder({
  kicker,
  title,
  copy,
  emptyDetail,
  items,
}: {
  kicker: string;
  title: string;
  copy: string;
  emptyDetail: string;
  items: string[];
}) {
  return (
    <div className="panel-stack">
      <PanelIntro kicker={kicker} title={title} copy={copy} />
      <section className="placeholder-grid">
        {items.map((item) => (
          <article key={item}>
            <span>{item}</span>
            <strong>{emptyDetail}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
