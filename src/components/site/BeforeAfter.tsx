import { useState } from "react";

export function BeforeAfter({
  before,
  after,
  label = "",
}: {
  before: string;
  after: string;
  label?: string;
}) {
  const [position, setPosition] = useState(50);
  return (
    <figure className="image-comparison">
      <div className="comparison-images">
        <img src={after} alt={label ? `${label}: after` : "After treatment"} loading="lazy" />
        <img
          src={before}
          alt={label ? `${label}: before` : "Before treatment"}
          loading="lazy"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        />
        <span className="comparison-before">Before</span>
        <span className="comparison-after">After</span>
        <span className="comparison-line" style={{ left: `${position}%` }} aria-hidden="true" />
      </div>
      <label className="comparison-control">
        {label || "Compare before and after"}
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label="Before and after image comparison"
          aria-valuetext={`${position}% before image visible`}
        />
      </label>
    </figure>
  );
}
