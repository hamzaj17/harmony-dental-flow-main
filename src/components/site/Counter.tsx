import { useEffect, useRef } from "react";

export function Counter({
  end,
  suffix = "",
  duration = 1200,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || preference.matches || duration <= 0 || !window.IntersectionObserver) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (time: number) => {
        const progress = Math.min(1, (time - start) / duration);
        node.textContent =
          Math.round((1 - (1 - progress) ** 3) * end).toLocaleString("en") + suffix;
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    const stop = () => {
      if (preference.matches) {
        cancelAnimationFrame(frame);
        observer.disconnect();
        node.textContent = end.toLocaleString("en") + suffix;
      }
    };
    preference.addEventListener("change", stop);
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      preference.removeEventListener("change", stop);
    };
  }, [end, suffix, duration]);
  return (
    <span aria-label={end.toLocaleString("en") + suffix}>
      <span ref={ref} aria-hidden="true">
        {end.toLocaleString("en")}
        {suffix}
      </span>
    </span>
  );
}
