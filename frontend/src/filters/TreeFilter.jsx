import { useState } from "react";
import { TEXT } from "../config/texts.js";
import { normalize } from "./filterEngine.js";

// Two-level filter: domains (groups) that open to show their items.
//   filter.groups: [{ id, label, icon, items: ["...", ...] }]
//   value: list of selected items
// Tick a domain's box to select/unselect all its items,
// click its name to open/close it. The search box finds items directly.
export default function TreeFilter({ filter, value, onChange }) {
  const labelOf = (item) => filter.itemLabel?.(item) ?? item;
  const [openIds, setOpenIds] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const selected = new Set(value);

  function toggleOpen(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleItem(item) {
    onChange(selected.has(item) ? value.filter((v) => v !== item) : [...value, item]);
  }

  function toggleGroup(group) {
    const allOn = group.items.every((i) => selected.has(i));
    onChange(
      allOn
        ? value.filter((v) => !group.items.includes(v))
        : [...new Set([...value, ...group.items])]
    );
  }

  // While searching: show matching items from all groups, groups opened
  const q = normalize(search.trim());
  const groups = q
    ? filter.groups
        .map((g) => ({
          id: g.id,
          label: g.label,
          icon: g.icon,
          items: g.items.filter((i) => normalize(`${i} ${labelOf(i)}`).includes(q)),
        }))
        .filter((g) => g.items.length > 0)
    : filter.groups;

  return (
    <div className="tree">
      <input
        className="tree-search"
        type="text"
        value={search}
        placeholder={TEXT.specialtySearch}
        onChange={(e) => setSearch(e.target.value)}
      />

      {value.length > 0 && (
        <div className="tree-selected">
          {value.map((item) => (
            <button key={item} type="button" className="tree-pill" onClick={() => toggleItem(item)}>
              {labelOf(item)} ×
            </button>
          ))}
        </div>
      )}

      {groups.length === 0 && <p className="tree-empty">{TEXT.specialtyNoMatch}</p>}

      {groups.map((group) => {
        const fullGroup = filter.groups.find((g) => g.id === group.id);
        const count = fullGroup.items.filter((i) => selected.has(i)).length;
        const state = count === 0 ? "none" : count === fullGroup.items.length ? "all" : "some";
        const isOpen = q !== "" || openIds.has(group.id);

        return (
          <div key={group.id} className={"tree-group" + (isOpen ? " open" : "")}>
            <div className="tree-row">
              <button
                type="button"
                className={`tree-check ${state}`}
                onClick={() => toggleGroup(fullGroup)}
                aria-label={group.label}
                title={state === "all" ? TEXT.unselectAll : TEXT.selectAll}
              >
                {state === "all" ? "✓" : state === "some" ? "–" : ""}
              </button>
              <button type="button" className="tree-label" onClick={() => toggleOpen(group.id)}>
                <span className="tree-icon">{group.icon}</span>
                <span className="tree-name">{group.label}</span>
                {count > 0 && <span className="tree-selected-count">{count}</span>}
                {filter.groupCounts && (
                  <span className="tree-count" title={TEXT.clinicsCount(filter.groupCounts[group.id] ?? 0)}>
                    {TEXT.clinicsCount(filter.groupCounts[group.id] ?? 0)}
                  </span>
                )}
                <span className="tree-chevron">▸</span>
              </button>
            </div>

            {isOpen && (
              <div className="tree-items">
                {group.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={"chip" + (selected.has(item) ? " active tree-chip-on" : "")}
                    onClick={() => toggleItem(item)}
                  >
                    {labelOf(item)}
                    {filter.itemCounts && (
                      <span className="tree-item-count">{filter.itemCounts[item] ?? 0}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
