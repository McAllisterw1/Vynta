export const metadata = {
  title: "Privacy Policy — Vynta",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: "40px" }}>
    <h2
      className="font-display"
      style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "12px" }}
    >
      {title}
    </h2>
    <div style={{ fontSize: "15px", color: "#5C3A1E", lineHeight: 1.8 }}>{children}</div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div style={{ background: "#FAF5E8", minHeight: "100vh" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Back link */}
        <a
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "13px", color: "#2D9B8A", textDecoration: "none",
            fontWeight: 600, marginBottom: "40px",
          }}
        >
          ← Back to Vynta
        </a>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ height: "1px", width: "40px", background: "#2D9B8A" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "#2D9B8A" }}>
              Legal
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.1, marginBottom: "12px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "14px", color: "#A0856A" }}>Effective date: May 2026</p>
        </div>

        <p style={{ fontSize: "15px", color: "#5C3A1E", lineHeight: 1.8, marginBottom: "40px" }}>
          Vynta (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is a reputation management platform for local businesses. This Privacy Policy explains what data we collect, how we use it, and your rights around it. We keep this straightforward — no legal jargon walls.
        </p>

        <Section title="What We Collect">
          <p style={{ marginBottom: "12px" }}>We collect the following information when you use Vynta:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Account information</strong> — your name, email address, and password (managed via Clerk).</li>
            <li><strong>Business information</strong> — your business name, which you provide in the dashboard.</li>
            <li><strong>Review data</strong> — customer reviews you log in the app, including reviewer names, ratings, and review text.</li>
            <li><strong>Contact data</strong> — customer names, phone numbers, and email addresses you enter when sending review requests.</li>
            <li><strong>Usage data</strong> — how you use the app (features accessed, AI responses generated, campaigns sent), stored in your browser&apos;s localStorage and our database.</li>
            <li><strong>Payment information</strong> — billing details processed by Stripe. We never see or store your card numbers.</li>
          </ul>
        </Section>

        <Section title="How We Use Your Data">
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>To provide the Vynta service — dashboard, AI tools, and reporting features.</li>
            <li>To send SMS review requests to your customers via Twilio on your behalf.</li>
            <li>To process your subscription payments via Stripe.</li>
            <li>To authenticate your account securely via Clerk.</li>
            <li>To generate AI-powered insights and recommendations via Anthropic&apos;s Claude API.</li>
            <li>To improve the product and debug issues.</li>
          </ul>
          <p style={{ marginTop: "12px" }}>We do not sell your data. We do not use your review data to train AI models.</p>
        </Section>

        <Section title="Third-Party Services">
          <p style={{ marginBottom: "12px" }}>Vynta uses the following third-party services to operate:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Clerk</strong> — user authentication and account management.</li>
            <li><strong>Stripe</strong> — subscription billing and payment processing.</li>
            <li><strong>Twilio</strong> — sending SMS review request messages to your customers.</li>
            <li><strong>Neon</strong> — our PostgreSQL database host where reports and review requests are stored.</li>
            <li><strong>Vercel</strong> — application hosting and deployment.</li>
            <li><strong>Anthropic</strong> — AI language model (Claude) powering review responses, training modules, and insights.</li>
          </ul>
          <p style={{ marginTop: "12px" }}>Each of these providers has their own privacy policy. We only share data with them as necessary to operate the service.</p>
        </Section>

        <Section title="Data Storage & Retention">
          <p>
            Your account data is stored securely in our Neon database and Clerk. Review data and usage preferences are stored in your browser&apos;s localStorage and are not synced to a server unless explicitly saved (e.g. Monthly Reports). We retain your data for as long as your account is active.
          </p>
          <p style={{ marginTop: "12px" }}>
            If you cancel your account, we will delete your personal data within 30 days upon request.
          </p>
        </Section>

        <Section title="Your Rights">
          <p>You have the right to:</p>
          <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Access the data we hold about you.</li>
            <li>Request deletion of your account and data.</li>
            <li>Correct inaccurate information.</li>
            <li>Opt out of non-essential communications.</li>
          </ul>
        </Section>

        <Section title="Cookies">
          <p>
            Vynta uses essential cookies for authentication (via Clerk). We do not use tracking or advertising cookies.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy? Email us at{" "}
            <a href="mailto:privacy@vynta.co" style={{ color: "#2D9B8A", fontWeight: 600 }}>
              privacy@vynta.co
            </a>
            . We typically respond within 2 business days.
          </p>
        </Section>

      </div>
    </div>
  );
}
