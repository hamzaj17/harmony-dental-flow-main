import { useEffect, useRef, type ReactNode } from "react";

/** Visible before hydration, with reduced motion, and if observation is unavailable. */
export function Reveal({
  children,
  delay = 0,
  dir = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  dir?: "up" | "left" | "right" | "scale";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || preference.matches || !window.IntersectionObserver) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const transform = {
          up: "translateY(18px)",
          left: "translateX(-18px)",
          right: "translateX(18px)",
          scale: "scale(.98)",
        }[dir];
        animation = node.animate(
          [
            { opacity: 0.55, transform },
            { opacity: 1, transform: "none" },
          ],
          {
            duration: 600,
            delay: Math.min(Math.max(delay, 0), 0.3) * 1000,
            easing: "cubic-bezier(.2,.7,.2,1)",
          },
        );
        observer.disconnect();
      },
      { threshold: 0.08 },
    );
    const stop = () => {
      if (preference.matches) {
        animation?.cancel();
        observer.disconnect();
      }
    };
    preference.addEventListener("change", stop);
    observer.observe(node);
    return () => {
      observer.disconnect();
      animation?.cancel();
      preference.removeEventListener("change", stop);
    };
  }, [delay, dir]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
