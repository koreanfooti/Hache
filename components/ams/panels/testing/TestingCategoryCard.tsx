import Image from "next/image";
import type { TestingCategoryCardData } from "@/components/ams/panels/testing/testingTypes";

export function TestingCategoryCard({
  category,
  isActive,
  onClick,
}: {
  category: TestingCategoryCardData;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={isActive ? "testing-category-card is-active" : "testing-category-card"}
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
    >
      <span className="testing-category-media">
        {category.image ? (
          <Image src={category.image} alt={`${category.title} logo`} width={142} height={86} />
        ) : (
          <i>{category.label}</i>
        )}
      </span>
      <span className="testing-category-copy">
        <small>{category.eyebrow}</small>
        <strong>{category.title}</strong>
        <em>{category.stat}</em>
        <span>{category.copy}</span>
      </span>
    </button>
  );
}
