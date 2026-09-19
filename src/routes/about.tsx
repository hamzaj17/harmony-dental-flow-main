import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { ArrowUpRight } from "lucide-react";
import interior from "@/assets/clinic-interior.jpg";
export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "The clinic | Multan Dental & Aesthetics" }] }),
});
function About() {
  return (
    <PageShell>
      <PageHero
        eyebrow="THE CLINIC"
        title="Rooted in Multan. Focused on you."
        subtitle="Dental and aesthetic care with Dr. Alizay Gull Khan, on Main Road in Shalimar Colony."
      />
      <section className="wrap about-grid section-bottom">
        <div className="about-image">
          <img
            src={interior}
            alt="A light-filled dental treatment space"
            width={1600}
            height={1100}
          />
        </div>
        <div className="about-copy">
          <p className="eyebrow">MEET YOUR DENTIST</p>
          <h2>
            Dr. Alizay
            <br />
            <em>Gull Khan.</em>
          </h2>
          <p>
            A dental visit is personal. Whether you have a concern that needs attention or simply
            want to keep up with routine care, start with a conversation.
          </p>
          <p>
            At your appointment, we’ll discuss your concerns, assess what you need, and explain the
            next steps. You can ask about treatment choices, fees, and timing before making a
            decision.
          </p>
          <Link to="/booking" className="btn">
            Arrange your first visit <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="philosophy">
        <div className="wrap principles">
          <div>
            <span className="eyebrow">01</span>
            <h3>Time to talk.</h3>
            <p>Your concerns and questions belong in the conversation.</p>
          </div>
          <div>
            <span className="eyebrow">02</span>
            <h3>A clear next step.</h3>
            <p>Understand the options before deciding how to proceed.</p>
          </div>
          <div>
            <span className="eyebrow">03</span>
            <h3>Close to home.</h3>
            <p>Find the clinic in Shalimar Colony, right here in Multan.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
