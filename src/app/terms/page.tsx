import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-arena-darker text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            &larr; Back to DegenArena HQ
          </Link>
        </div>

        <h1 className="text-3xl font-bold gradient-text mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-12">Last updated: January 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using DegenArena HQ (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              DegenArena HQ is a competitive token discovery platform. Users create formulas to identify
              cryptocurrency tokens based on custom criteria. The Service provides tools for analysis,
              leaderboards, alerts, and community features. DegenArena HQ does not provide financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Not Financial Advice</h2>
            <p>
              Nothing on DegenArena HQ constitutes financial, investment, trading, or any other form of advice.
              Token matches, formula results, AI analysis (Arena Bots), leaderboard rankings, and all other
              information are for informational and entertainment purposes only. You are solely responsible
              for your own trading decisions. Cryptocurrency is extremely volatile and you may lose your
              entire investment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              You agree to provide accurate information and to notify us of any unauthorized use.
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious content or spam</li>
              <li>Manipulate leaderboards, competitions, or performance metrics</li>
              <li>Impersonate other users or entities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p>
              The Service and its content are owned by DegenArena HQ. Your formulas and configurations
              remain yours, but you grant us a license to use them for operating and improving the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. We are not liable for any
              losses, damages, or costs arising from your use of the Service, including but not limited to
              financial losses from trading decisions influenced by information on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Continued use of the Service after changes
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
            <p>
              For questions about these terms, contact us through our platform or community channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
