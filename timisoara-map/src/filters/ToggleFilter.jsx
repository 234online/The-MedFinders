// An on/off switch
export default function ToggleFilter({ filter, value, onChange }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      {filter.label}
    </label>
  );
}
