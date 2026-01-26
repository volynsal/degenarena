# DegenArena

**Build, Battle, Prove Your Alpha** — The competitive platform where you build memecoin formulas, battle other traders, and prove whose strategy actually works.

## Features

- **Formula Builder**: Create custom token-finding strategies with parameters like liquidity, volume, holders, token age, and security checks
- **Real-Time Monitoring**: Automatic scanning of new token launches on Solana using DexScreener API
- **Multi-Channel Alerts**: Instant notifications via Telegram, Discord, and email
- **Performance Tracking**: Automatic price tracking at 1h, 24h, and 7d intervals with win/loss calculation
- **Leaderboard**: Compete with other traders based on formula performance
- **Formula Sharing**: Make formulas public and let others copy your winning strategies

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **State Management**: Zustand
- **APIs**: DexScreener, Telegram Bot API, Discord Webhooks, Resend (email)
- **Deployment**: Vercel (with Cron Jobs)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/degenarena.git
   cd degenarena
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your credentials (see Configuration section below).

4. **Set up the database**
   
   Go to your Supabase project's SQL editor and run the migrations in order:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_community_upvotes.sql
   supabase/migrations/003_profiles_and_clans.sql
   supabase/migrations/004_clan_invites.sql
   supabase/migrations/005_badges.sql
   supabase/migrations/006_waitlist.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

## Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - anon/public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - service_role key (`SUPABASE_SERVICE_ROLE_KEY`)
3. Run the database migration in the SQL editor
4. Enable Google OAuth (optional):
   - Go to Authentication → Providers → Google
   - Configure with your Google Cloud credentials

### Telegram Bot Setup

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the bot token to `TELEGRAM_BOT_TOKEN`
4. Users can get their Chat ID from [@userinfobot](https://t.me/userinfobot)

### Email Setup (Resend)

1. Create an account at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key and add it to `RESEND_API_KEY`

### Cron Jobs

The app uses three cron jobs for automated tasks:

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/cron/monitor` | Daily 8am UTC | Scans for new tokens matching active formulas |
| `/api/cron/send-alerts` | Daily 9am UTC | Sends alerts for new matches |
| `/api/cron/update-returns` | Daily 10am UTC | Updates price returns for matches |

> Note: On Vercel Hobby tier, cron jobs are limited to once per day. Upgrade to Pro for more frequent scans.

**For Vercel**: Cron jobs are configured in `vercel.json` and run automatically on deployment.

**For self-hosting**: Set up your own cron scheduler (e.g., GitHub Actions, systemd timers) to call these endpoints with the `CRON_SECRET` in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/monitor
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes
│   └── auth/              # Auth callback handler
├── components/            # React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── landing/          # Landing page components
│   ├── providers/        # Context providers
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and services
│   ├── hooks/            # Custom React hooks
│   ├── services/         # External service integrations
│   ├── stores/           # Zustand stores
│   └── supabase/         # Supabase client setup
└── types/                # TypeScript type definitions
```

## API Routes

### Authentication
- `POST /auth/callback` - OAuth callback handler

### Formulas
- `GET /api/formulas` - List user's formulas
- `POST /api/formulas` - Create a new formula
- `GET /api/formulas/:id` - Get formula details
- `PATCH /api/formulas/:id` - Update a formula
- `DELETE /api/formulas/:id` - Delete a formula
- `POST /api/formulas/:id/copy` - Copy a public formula
- `GET /api/formulas/:id/matches` - Get matches for a formula

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `GET /api/user/stats` - Get user statistics
- `GET /api/user/alert-settings` - Get alert settings
- `PUT /api/user/alert-settings` - Update alert settings

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard rankings

### Matches
- `GET /api/matches/recent` - Get recent matches for user

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy!

Cron jobs will automatically start running after deployment.

### Self-Hosting

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Set up a reverse proxy (nginx, Caddy, etc.)

4. Configure cron jobs to call the `/api/cron/*` endpoints

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built by crypto fanatics.
