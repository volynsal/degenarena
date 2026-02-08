import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-arena-darker text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            &larr; Back to DegenArena HQ
          </Link>
        </div>

        <h1 className="text-3xl font-bold gradient-text mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-12">Last updated: January 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>Account information (email, username)</li>
              <li>Profile data (bio, avatar, Twitch URL)</li>
              <li>Formula configurations and parameters</li>
              <li>Alert settings (Telegram chat ID, Discord webhook URL)</li>
            </ul>
            <p className="mt-3">We also collect automatically:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>Usage data (pages visited, features used)</li>
              <li>Device and browser information</li>
              <li>IP address for security purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>To provide and operate the Service</li>
              <li>To send alerts via your configured channels (Telegram, Discord, email)</li>
              <li>To display your profile and leaderboard rankings</li>
              <li>To improve the Service and develop new features</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share data with:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>Service providers (hosting, analytics, email delivery)</li>
              <li>Third-party APIs (DexScreener, RugCheck, Twitch) to provide features</li>
              <li>Law enforcement when legally required</li>
            </ul>
            <p className="mt-3">
              Public formulas, leaderboard entries, and profile information are visible to other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage</h2>
            <p>
              Your data is stored securely using Supabase (PostgreSQL). We use industry-standard
              security measures including encryption in transit and at rest. Authentication is handled
              by Supabase Auth with secure session management.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>Access your personal data</li>
              <li>Update or correct your information</li>
              <li>Delete your account and associated data</li>
              <li>Export your formula data</li>
              <li>Disable alert channels at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management.
              We may use analytics cookies to understand how the Service is used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Third-Party Services</h2>
            <p>
              The Service integrates with third-party services including DexScreener, RugCheck,
              LunarCrush, Twitch, Telegram, and Discord. These services have their own privacy
              policies. We only share the minimum data necessary for each integration to function.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Changes</h2>
            <p>
              We may update this policy. We will notify users of material changes through
              the Service or via email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
            <p>
              For privacy-related inquiries, contact us through our platform or community channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
