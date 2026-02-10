import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | DegenArena HQ',
}

export default function PrivacyPage() {
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

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: February 9, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              DegenArena HQ (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the DegenArena platform
              at degenarenahq.com. This Privacy Policy explains how we collect, use, and protect your
              information when you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Account Information:</span> Email address, username, and password when you create an account.</li>
              <li><span className="text-gray-300">Profile Information:</span> Optional details you provide such as display name, avatar, and connected Twitch account.</li>
              <li><span className="text-gray-300">Usage Data:</span> Information about how you interact with the platform, including formulas created, matches, competition entries, and Galaxy market activity.</li>
              <li><span className="text-gray-300">Device Information:</span> Browser type, IP address, and device identifiers collected automatically through cookies and similar technologies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>To provide, maintain, and improve our services.</li>
              <li>To process competition entries and maintain leaderboards.</li>
              <li>To send you notifications related to your account and activity.</li>
              <li>To detect and prevent fraud, abuse, or security issues.</li>
              <li>To communicate updates, features, or promotional information (you can opt out at any time).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Information Sharing</h2>
            <p className="mb-3">We do not sell your personal information. We may share information in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Public Profile:</span> Your username, rank, and competition results are visible to other users.</li>
              <li><span className="text-gray-300">Service Providers:</span> We use third-party services (e.g., Supabase for authentication, Resend for email) that process data on our behalf.</li>
              <li><span className="text-gray-300">Legal Requirements:</span> We may disclose information if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including
              encryption in transit (TLS), secure authentication, and row-level security on our database.
              However, no method of transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Third-Party Services</h2>
            <p className="mb-3">Our platform integrates with the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">DexScreener:</span> For real-time token price and market data.</li>
              <li><span className="text-gray-300">Twitch:</span> For live streaming integration (only if you choose to connect your account).</li>
              <li><span className="text-gray-300">Supabase:</span> For authentication and data storage.</li>
            </ul>
            <p className="mt-3">These services have their own privacy policies that govern their use of your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Access and download your personal data.</li>
              <li>Correct inaccurate information.</li>
              <li>Delete your account and associated data.</li>
              <li>Opt out of promotional communications.</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at <a href="mailto:degenarena101@gmail.com" className="text-arena-cyan hover:underline">degenarena101@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use
              third-party advertising cookies. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
            <p>
              DegenArena is not intended for users under the age of 18. We do not knowingly collect
              information from minors. If you believe a minor has provided us with personal information,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting a notice on the platform or sending an email. Your continued use of
              the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at{' '}
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
