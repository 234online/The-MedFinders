import { CategoryIcon } from "../components/MedIcon.jsx";
// A row of clickable pills. With multiple: true, several can be on at once.
// Options can have an icon (emoji) and a color.
export default function ChipsFilter({ filter, value, onChange }) {
  const isOn = (v) => (filter.multiple ? value.includes(v) : value === v);

  function toggle(v) {
    if (filter.multiple) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    } else {
      onChange(value === v ? filter.default : v);
    }
  }

  return (
    <div className="chips">
      {filter.options.map((option) => {
        const on = isOn(option.value);
        const color = option.color ?? "var(--accent)";
        return (
          <button
            key={option.value}
            type="button"
            className={"chip" + (on ? " active" : "")}
            style={on ? { background: color, borderColor: color } : undefined}
            onClick={() => toggle(option.value)}
          >
            {option.icon && (
              <span className="chip-icon">
                <CategoryIcon id={option.value} size={15} />
              </span>
            )}
            {!option.icon && option.color && !on && (
              <span className="chip-dot" style={{ background: option.color }} />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
