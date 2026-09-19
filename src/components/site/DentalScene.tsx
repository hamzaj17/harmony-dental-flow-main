import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import aligner from "@/assets/aligner-editorial.jpg";

export function DentalScene() {
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scene.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
      element.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
      element.style.setProperty("--mx", `${(x * 10).toFixed(2)}px`);
      element.style.setProperty("--my", `${(y * 10).toFixed(2)}px`);
    };
    const reset = () => {
      element.style.setProperty("--rx", "0deg");
      element.style.setProperty("--ry", "0deg");
      element.style.setProperty("--mx", "0px");
      element.style.setProperty("--my", "0px");
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    return () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <div
      className="dental-scene hero-visual"
      ref={scene}
      aria-label="Clear aligner treatment visual"
    >
      <div className="scene-aura" aria-hidden="true" />
      <div className="scene-ring ring-one" aria-hidden="true" />
      <div className="scene-ring ring-two" aria-hidden="true" />
      <div className="scene-card">
        <img
          src={aligner}
          alt="Clear dental aligner presented on frosted glass"
          width={1536}
          height={1024}
          fetchPriority="high"
        />
        <div className="scene-card__label">
          <span>
            <Sparkles size={13} /> CONSIDERED DENTISTRY
          </span>
          <strong>Precision, made personal.</strong>
        </div>
      </div>
      <div className="scene-chip scene-chip--one">
        <span>01</span> Listen
      </div>
      <div className="scene-chip scene-chip--two">
        <span>02</span> Explain
      </div>
      <div className="scene-chip scene-chip--three">
        <span>03</span> Care
      </div>
    </div>
  );
}
