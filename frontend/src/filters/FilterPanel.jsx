import ChipsFilter from "./ChipsFilter.jsx";
import ToggleFilter from "./ToggleFilter.jsx";
import SelectFilter from "./SelectFilter.jsx";
import TreeFilter from "./TreeFilter.jsx";
import { countActive } from "./filterEngine.js";
import { TEXT } from "../config/texts.js";
import "./filters.css";

// Which component draws each filter "type" from config/filters.js.
// To add a new kind of control (e.g. a slider), make a component
// like ToggleFilter.jsx and register it here.
const COMPONENTS = {
  chips: ChipsFilter,
  toggle: ToggleFilter,
  select: SelectFilter,
  tree: TreeFilter,
};

export default function FilterPanel({ filters, values, onChange, onReset }) {
  // Put filters into sections: same "group" = same section
  const groups = [];
  for (const filter of filters) {
    const key = filter.group ?? filter.id;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, title: filter.groupLabel ?? filter.group ?? filter.label, items: [], collapsed: false };
      groups.push(group);
    }
    group.items.push(filter);
    if (filter.collapsed) group.collapsed = true;
  }

  const active = countActive(filters, values);

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h2>{TEXT.filtersTitle}</h2>
        {active > 0 && (
          <button type="button" className="filter-reset" onClick={onReset}>
            {TEXT.reset(active)}
          </button>
        )}
      </div>

      {groups.map((group) => {
        const groupActive = countActive(group.items, values);
        return (
          <details key={group.key} className="filter-group" open={!group.collapsed}>
            <summary>
              <span>{group.title}</span>
              {groupActive > 0 && <span className="filter-group-count">{groupActive}</span>}
            </summary>

            <div className="filter-group-body">
              {group.items.map((filter) => {
                const Control = COMPONENTS[filter.type];
                if (!Control) {
                  console.warn(`Unknown filter type "${filter.type}" for filter "${filter.id}"`);
                  return null;
                }
                // Inside a shared group, chips/selects get a small label of their own
                const needsLabel = filter.group && filter.type !== "toggle";
                return (
                  <div key={filter.id} className="filter-item">
                    {needsLabel && <span className="filter-sublabel">{filter.label}</span>}
                    <Control
                      filter={filter}
                      value={values[filter.id]}
                      onChange={(value) => onChange(filter.id, value)}
                    />
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
