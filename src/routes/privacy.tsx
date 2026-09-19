import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({ meta: [{ title: "Your privacy | Multan Dental & Aesthetics" }] }),
});
function Privacy() {
  return (
    <PageShell>
      <PageHero
        eyebrow="YOUR INFORMATION"
        title="Care includes your privacy."
        subtitle="How this website uses the information you share."
      />
      <section className="wrap section-bottom">
        <div className="privacy-copy">
          <h2>When you book or contact us</h2>
          <p>
            We save your name, phone number, optional email, requested service, appointment time,
            and the message you choose to provide. The clinic uses this information to arrange and
            manage your visit or respond to your enquiry. Please avoid including detailed medical
            records in a website message.
          </p>
          <h2>Who can see it</h2>
          <p>
            Appointment and enquiry details are available through the password-protected clinic
            desk. Your private booking reference also gives access to that appointment, including
            the option to cancel an upcoming visit. Keep the reference private.
          </p>
          <h2>Storage and cookies</h2>
          <p>
            The website stores records in a database operated with the clinic’s website. Owner login
            uses a session cookie that expires after eight hours. The site does not use advertising
            trackers. Basic security counters help limit repeated submission attempts.
          </p>
          <h2>Your choices</h2>
          <p>
            You can cancel a future appointment using your reference. For help accessing,
            correcting, or removing your information, call 0311 7594193. Cancelling an appointment
            changes its status; it does not delete the record. Records are retained until the clinic
            removes them, including any backups it maintains.
          </p>
          <h2>Links to other services</h2>
          <p>
            WhatsApp and Google Maps open only when you choose their links. Those services have
            their own privacy practices. Messages submitted here appear in the clinic desk; they are
            not automatically sent by email or SMS.
          </p>
          <h2>Questions?</h2>
          <p>
            Contact Multan Dental & Aesthetics at Main Road, Shalimar Colony, Multan, or call{" "}
            <a className="text-link" href="tel:+923117594193">
              0311 7594193
            </a>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}
