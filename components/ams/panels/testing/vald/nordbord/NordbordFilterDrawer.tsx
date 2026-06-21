import type { Dispatch, SetStateAction } from "react";
import type { NordbordLabels } from "@/components/ams/panels/testing/vald/nordbord/nordbordLabels";
import type { NordbordTestFilterOption } from "@/components/ams/panels/testing/vald/nordbord/nordbordTypes";

export function NordbordFilterDrawer({
  hiddenTestIds,
  isOpen,
  labels,
  setHiddenTestIds,
  testFilterOptions,
  onClose,
}: {
  hiddenTestIds: string[];
  isOpen: boolean;
  labels: NordbordLabels;
  setHiddenTestIds: Dispatch<SetStateAction<string[]>>;
  testFilterOptions: NordbordTestFilterOption[];
  onClose: () => void;
}) {
  return (
    <aside className={isOpen ? "nordbord-filter-drawer is-open" : "nordbord-filter-drawer"} aria-label={labels.filters}>
      <div className="nordbord-filter-header">
        <strong>{labels.filters}</strong>
        <button type="button" onClick={onClose}>{labels.close}</button>
      </div>
      <div className="nordbord-filter-actions">
        <button type="button" onClick={() => setHiddenTestIds([])}>{labels.selectAll}</button>
        <button type="button" onClick={() => setHiddenTestIds(testFilterOptions.map((option) => option.id))}>{labels.clear}</button>
      </div>
      <div className="nordbord-filter-section">
        <span>{labels.testDates}</span>
        <div className="nordbord-date-checkboxes">
          {testFilterOptions.map((option) => {
            const isChecked = !hiddenTestIds.includes(option.id);

            return (
              <label key={option.id}>
                <input
                  checked={isChecked}
                  type="checkbox"
                  onChange={() => setHiddenTestIds((currentIds) => (
                    isChecked
                      ? [...currentIds, option.id]
                      : currentIds.filter((id) => id !== option.id)
                  ))}
                />
                <span>{option.label}</span>
                <small>{option.type}</small>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
