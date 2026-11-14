// A slider for a number. Uses from the filter definition:
//   min, max, step   the range (e.g. 0 to 5, step 0.5)
//   format(value)    text shown next to the slider (e.g. "4.0+ ★")
export default function SliderFilter({ filter, value, onChange }) {
  const percent = ((value - filter.min) / (filter.max - filter.min)) * 100;

  return (
    <div className="slider">
      <div className="slider-head">
        <span className={"slider-value" + (value === filter.default ? " is-default" : "")}>
          {filter.format ? filter.format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={filter.min}
        max={filter.max}
        step={filter.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={filter.label}
        style={{ "--fill": `${percent}%` }}
      />
      <div className="slider-scale" aria-hidden="true">
        <span>{filter.format ? filter.format(filter.min) : filter.min}</span>
        <span>{filter.max} ★</span>
      </div>
    </div>
  );
}
