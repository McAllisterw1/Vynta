export const metadata = {
  title: "Terms of Service — Vynta",
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

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ fontSize: "14px", color: "#A0856A" }}>Effective date: May 2026</p>
        </div>

        <p style={{ fontSize: "15px", color: "#5C3A1E", lineHeight: 1.8, marginBottom: "40px" }}>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Vynta (&ldquo;the Service&rdquo;), operated by Vynta. By creating an account or using the Service, you agree to these Terms.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Vynta, you confirm that you are at least 18 years old and have the authority to enter into these Terms on behalf of yourself or your business. If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Vynta is a reputation management SaaS platform for local businesses. It enables you to log and manage customer reviews, send review requests via SMS and email, generate AI-powered review responses, track competitors, and receive monthly AI-generated reputation reports.
          </p>
          <p style={{ marginTop: "12px" }}>
            The Service is provided &ldquo;as is.&rdquo; We work hard to keep it running reliably, but we cannot guarantee 100% uptime.
          </p>
        </Section>

        <Section title="3. Subscription Plans & Billing">
          <p style={{ marginBottom: "12px" }}>Vynta offers the following subscription plans:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Starter</strong> — $49/month, billed monthly. Includes core review tools and up to 20 AI responses per month.</li>
            <li><strong>Professional</strong> — $990/year (equivalent to $83/month). Includes advanced features and up to 100 AI responses per month.</li>
            <li><strong>Agency</strong> — $1,990/year (equivalent to $166/month). Includes all features and unlimited AI responses.</li>
          </ul>
          <p style={{ marginTop: "12px" }}>
            Subscriptions renew automatically. You will be charged at the start of each billing cycle. Prices may change with 30 days&apos; notice.
          </p>
        </Section>

        <Section title="4. Refund Policy">
          <p>
            <strong>Monthly (Starter):</strong> You may cancel at any time. Your access continues until the end of the billing period. No partial refunds are issued for unused days.
          </p>
          <p style={{ marginTop: "12px" }}>
            <strong>Annual (Professional & Agency):</strong> Annual plans are non-refundable. If you cancel, you retain access until the end of your annual term. We do not issue prorated refunds for early cancellations of annual subscriptions.
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to use Vynta to:</p>
          <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Send unsolicited bulk messages (spam) to people who have not done business with you.</li>
            <li>Solicit, post, or facilitate fake, purchased, or incentivised reviews.</li>
            <li>Harass, threaten, or intimidate reviewers.</li>
            <li>Violate Google&apos;s, Yelp&apos;s, or any other review platform&apos;s terms of service.</li>
            <li>Attempt to reverse-engineer or misuse the Service.</li>
          </ul>
          <p style={{ marginTop: "12px" }}>
            Violation of these terms may result in immediate account suspension without refund.
          </p>
        </Section>

        <Section title="6. AI-Generated Content Disclaimer">
          <p>
            Vynta uses Anthropic&apos;s Claude AI to generate review responses, training content, and business recommendations. All AI-generated content is a suggestion only. You are solely responsible for reviewing, editing, and deciding whether to publish any AI-generated response.
          </p>
          <p style={{ marginTop: "12px" }}>
            Vynta does not guarantee that AI-generated content is accurate, appropriate, or compliant with any platform&apos;s policies. Do not post AI-generated responses without reviewing them first.
          </p>
        </Section>

        <Section title="7. SMS Review Requests">
          <p>
            When you use Vynta to send SMS review requests, you confirm that the recipients have an existing business relationship with you and have not opted out of communications. You are responsible for compliance with applicable messaging laws (including the TCPA in the United States). Vynta sends these messages via Twilio on your behalf.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            Vynta and its content are owned by Vynta. You retain ownership of any business data, reviews, and content you input into the Service. By using the Service, you grant Vynta a limited license to process your data solely to provide the Service.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Vynta shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to lost revenue, lost data, or reputational harm. Our total liability to you shall not exceed the amount you paid us in the three months prior to the claim.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            You may cancel your account at any time from the Settings page. We reserve the right to suspend or terminate accounts that violate these Terms, with or without notice.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>
            We may update these Terms from time to time. We will notify you of significant changes by email or in-app notice. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these Terms? Email us at{" "}
            <a href="mailto:legal@vynta.co" style={{ color: "#2D9B8A", fontWeight: 600 }}>
              legal@vynta.co
            </a>
            .
          </p>
        </Section>

      </div>
    </div>
  );
}
