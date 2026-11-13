import ChipsFilter from "./ChipsFilter.jsx";
import ToggleFilter from "./ToggleFilter.jsx";
import SelectFilter from "./SelectFilter.jsx";
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
};

export default function FilterPanel({ filters, values, onChange, onReset }) {
  // Put filters into sections: same "group" = same section
  const groups = [];
  for (const filter of filters) {
    const key = filter.group ?? filter.id;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, title: filter.group ?? filter.label, items: [] };
      groups.push(group);
    }
    group.items.push(filter);
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

      {groups.map((group) => (
        <section key={group.key} className="filter-group">
          <h3>{group.title}</h3>
          {group.items.map((filter) => {
            const Control = COMPONENTS[filter.type];
            if (!Control) {
              console.warn(`Unknown filter type "${filter.type}" for filter "${filter.id}"`);
              return null;
            }
            return (
              <Control
                key={filter.id}
                filter={filter}
                value={values[filter.id]}
                onChange={(value) => onChange(filter.id, value)}
              />
            );
          })}
        </section>
      ))}
    </div>
  );
}
