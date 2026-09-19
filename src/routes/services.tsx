import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/lib/appointments";
import aligner from "@/assets/aligner-editorial.jpg";
import instruments from "@/assets/instruments-editorial.jpg";
import { Reveal } from "@/components/site/Reveal";
export const Route = createFileRoute("/services")({
  component: Services,
  head: () => ({ meta: [{ title: "Our care | Multan Dental & Aesthetics" }] }),
});
const descriptions = [
  "Routine examinations, professional cleaning, and a conversation about your dental health.",
  "Discuss professional whitening options and whether they suit your teeth.",
  "An assessment of alignment, with braces and clear-aligner options to discuss.",
  "Explore options for replacing missing teeth and the planning involved.",
  "A consultation about the appearance of your teeth, restorations, and your smile goals.",
  "For urgent dental concerns, call the clinic directly to discuss the earliest available visit.",
  "Assessment and treatment planning for teeth that may need root canal care.",
  "Discuss replacement teeth, restorations, fit, and ongoing care.",
];
function Services() {
  return (
    <PageShell>
      <PageHero
        eyebrow="OUR CARE"
        title="The right care starts with you."
        subtitle="Tell us what you need. Your dentist will explain the options, timing, and costs before you decide on treatment."
      />
      <Reveal className="wrap care-editorial">
        <img
          src={instruments}
          alt="Dental examination mirror and probe"
          width={1536}
          height={1024}
          loading="lazy"
        />
        <div>
          <p className="eyebrow">PRECISE CARE. PERSONAL ATTENTION.</p>
          <h2>A considered approach to every smile.</h2>
          <p>From your first checkup to a longer treatment plan, we start by listening.</p>
        </div>
        <img
          src={aligner}
          alt="Clear dental aligner on frosted glass"
          width={1536}
          height={1024}
          loading="lazy"
        />
      </Reveal>
      <section className="wrap treatment-grid section-bottom">
        {services.map((s, i) => (
          <article className="treatment" key={s}>
            <span className="care-number">{String(i + 1).padStart(2, "0")}</span>
            <h2>{s}</h2>
            <p>{descriptions[i]}</p>
            <Link to="/booking" className="text-link">
              Arrange a consultation <ArrowUpRight size={17} />
            </Link>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
