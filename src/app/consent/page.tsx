export default function ConsentPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">SMS Consent Policy</h1>
        <p className="mb-10 text-sm text-gray-500">Last updated: May 2026</p>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-800">How We Collect Consent</h2>
          <p className="text-gray-600 leading-relaxed">
            We collect your consent to receive SMS messages verbally at the time of service. Before
            sending any message, a team member will confirm that you agree to receive a text message
            from our business. Consent is never required as a condition of receiving services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-800">What We Send</h2>
          <p className="text-gray-600 leading-relaxed">
            We send a single, one-time SMS message asking you to share feedback about your recent
            experience. We do not send marketing messages, promotional offers, or recurring
            communications of any kind. Message and data rates may apply.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-800">How to Opt Out</h2>
          <p className="text-gray-600 leading-relaxed">
            You can opt out at any time by replying <span className="font-medium text-gray-900">STOP</span> to
            any message you receive from us. After opting out, you will not receive any further SMS
            messages. Reply <span className="font-medium text-gray-900">HELP</span> for assistance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-800">Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have questions about this policy or your consent preferences, please contact us
            at{" "}
            <a
              href="mailto:support@vynta.app"
              className="text-blue-600 underline hover:text-blue-800"
            >
              support@vynta.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
