import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | DegenArena HQ',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-arena-dark text-gray-300">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: February 9, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using DegenArena HQ (&quot;the Platform&quot;) at degenarenahq.com, you agree
              to be bound by these Terms of Service. If you do not agree to these terms, do not use
              the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              DegenArena HQ is a competitive platform for cryptocurrency analysis and prediction. The
              Platform provides tools including trading formulas, prediction markets (Galaxy), competitions,
              leaderboards, and live streaming integration. The Platform uses virtual points and does not
              facilitate real-money trading or gambling.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years old to use the Platform. By creating an account, you represent
              that you are at least 18 years of age and have the legal capacity to agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Account Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate information when creating your account.</li>
              <li>You may not share your account with others or create multiple accounts.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>Notify us immediately if you suspect unauthorized access to your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Use the Platform for any illegal purpose or in violation of any applicable laws.</li>
              <li>Manipulate leaderboards, competitions, or markets through bots, multiple accounts, or collusion.</li>
              <li>Attempt to exploit, hack, or reverse-engineer any part of the Platform.</li>
              <li>Harass, abuse, or threaten other users.</li>
              <li>Post or transmit harmful, offensive, or misleading content.</li>
              <li>Use automated scripts or bots to interact with the Platform without permission.</li>
              <li>Interfere with or disrupt the Platform&apos;s infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Virtual Points &amp; Galaxy Markets</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Galaxy markets use virtual points with no real monetary value.</li>
              <li>Points cannot be exchanged for real currency, cryptocurrency, or any other form of value.</li>
              <li>We reserve the right to adjust, reset, or modify point balances at any time.</li>
              <li>Market outcomes are determined by real-world data (e.g., DexScreener price feeds) and are resolved automatically.</li>
              <li>Markets may be cancelled if underlying data becomes unavailable or a token experiences extreme events (e.g., rug pull).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Competitions</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Competition rules, prizes, and eligibility requirements are specified on each competition page.</li>
              <li>We reserve the right to disqualify participants who violate the rules or these Terms.</li>
              <li>Competition results are final once determined by the Platform.</li>
              <li>Prize distribution is at our sole discretion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Not Financial Advice</h2>
            <p>
              <strong className="text-white">Nothing on this Platform constitutes financial, investment, or trading advice.</strong>{' '}
              All information, formulas, predictions, market data, and analytics are provided for
              educational and entertainment purposes only. Cryptocurrency markets are extremely volatile
              and carry significant risk. You should never make financial decisions based solely on
              information from this Platform. Always do your own research and consult a qualified
              financial advisor before making investment decisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Intellectual Property</h2>
            <p>
              The Platform, including its design, code, logos, and content, is owned by DegenArena HQ.
              You may not copy, modify, distribute, or create derivative works from any part of the
              Platform without our written permission. Formulas and strategies you create remain yours,
              but you grant us a license to use them within the Platform&apos;s features (e.g., leaderboards,
              shared formulas).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Third-Party Services</h2>
            <p>
              The Platform integrates with third-party services including DexScreener, Twitch, and others.
              Your use of these services is governed by their respective terms of service and privacy
              policies. We are not responsible for the availability, accuracy, or conduct of third-party
              services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, DegenArena HQ shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including but not limited to loss
              of profits, data, or other intangible losses, resulting from your use of or inability to
              use the Platform. The Platform is provided &quot;as is&quot; without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without
              notice, for conduct that we believe violates these Terms or is harmful to other users
              or the Platform. Upon termination, your right to use the Platform ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify you of material changes by posting
              a notice on the Platform. Your continued use of the Platform after changes constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              United States, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">15. Contact Us</h2>
            <p>
              If you have questions about these Terms of Service, contact us at{' '}
              <a href="mailto:degenarena101@gmail.com" className="text-arena-cyan hover:underline">
                degenarena101@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
