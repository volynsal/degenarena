import { createClient } from '@supabase/supabase-js'
import type { TokenMatch, Formula, AlertSettings } from '@/types/database'

// Service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AlertPayload {
  userId: string
  formulaId: string
  formulaName: string
  matchId: string
  tokenSymbol: string
  tokenName: string
  tokenAddress: string
  chain: string
  price: number
  liquidity: number
  volume24h: number
  dexscreenerUrl: string
}

export interface DigestMatch {
  tokenSymbol: string
  tokenName: string
  tokenAddress: string
  chain: string
  price: number
  liquidity: number
  volume24h: number
  dexscreenerUrl: string
  matchId: string
  matchedAt: string
}

export interface DigestFormula {
  formulaId: string
  formulaName: string
  matches: DigestMatch[]
}

export interface DigestPayload {
  userId: string
  formulas: DigestFormula[]
  totalMatches: number
}

export class AlertService {
  
  /**
   * Get alert settings for a user
   */
  async getAlertSettings(userId: string): Promise<AlertSettings | null> {
    const { data } = await supabaseAdmin
      .from('alert_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return data as AlertSettings | null
  }
  
  /**
   * Check if user is within alert limits
   */
  async checkAlertLimits(userId: string, settings: AlertSettings): Promise<boolean> {
    // Check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count } = await supabaseAdmin
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
    
    if ((count || 0) >= settings.daily_limit) {
      console.log(`User ${userId} has reached daily alert limit`)
      return false
    }
    
    // Check minimum interval
    const { data: lastAlert } = await supabaseAdmin
      .from('alerts')
      .select('sent_at')
      .eq('user_id', userId)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single()
    
    if (lastAlert?.sent_at) {
      const lastSentTime = new Date(lastAlert.sent_at).getTime()
      const minInterval = settings.min_interval_seconds * 1000
      
      if (Date.now() - lastSentTime < minInterval) {
        console.log(`User ${userId} is within minimum interval`)
        return false
      }
    }
    
    return true
  }
  
  /**
   * Send alert via Telegram
   */
  async sendTelegramAlert(chatId: string, payload: AlertPayload): Promise<boolean> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('Telegram bot token not configured')
      return false
    }
    
    const message = this.formatTelegramMessage(payload)
    
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
          }),
        }
      )
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Telegram API error:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error sending Telegram alert:', error)
      return false
    }
  }
  
  /**
   * Send formula activation notification via Telegram
   */
  async sendFormulaActivationNotification(
    userId: string,
    formula: { id: string; name: string; liquidity_min?: number | null; liquidity_max?: number | null; volume_24h_min?: number | null; token_age_max_hours?: number | null }
  ): Promise<boolean> {
    console.log('🔔 sendFormulaActivationNotification called for user:', userId, 'formula:', formula.name)
    
    const settings = await this.getAlertSettings(userId)
    console.log('🔔 Alert settings:', settings ? { telegram_enabled: settings.telegram_enabled, has_chat_id: !!settings.telegram_chat_id } : 'NO SETTINGS')
    
    if (!settings?.telegram_enabled || !settings?.telegram_chat_id) {
      console.log('🔔 Telegram not configured for user:', userId)
      return false
    }
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('🔔 Telegram bot token not configured')
      return false
    }
    
    console.log('🔔 Sending Telegram message to chat:', settings.telegram_chat_id)
    
    // Format the message
    const params = []
    if (formula.liquidity_min) params.push(`💰 Liq Min: $${formula.liquidity_min.toLocaleString()}`)
    if (formula.liquidity_max) params.push(`💰 Liq Max: $${formula.liquidity_max.toLocaleString()}`)
    if (formula.volume_24h_min) params.push(`📊 Vol 24h: $${formula.volume_24h_min.toLocaleString()}+`)
    if (formula.token_age_max_hours) params.push(`⏱ Age: <${formula.token_age_max_hours}h`)
    
    const message = `✅ <b>Formula Activated!</b>

<b>${formula.name}</b>

${params.length > 0 ? params.join('\n') : 'Default parameters'}

🔍 Now scanning for matching tokens...
You'll receive alerts when matches are found.`
    
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.telegram_chat_id,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      )
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Telegram API error:', error)
        return false
      }
      
      console.log(`📨 Formula activation notification sent for "${formula.name}"`)
      return true
    } catch (error) {
      console.error('Error sending formula activation notification:', error)
      return false
    }
  }
  
  /**
   * Send alert via Discord webhook
   */
  async sendDiscordAlert(webhookUrl: string, payload: AlertPayload): Promise<boolean> {
    const embed = this.formatDiscordEmbed(payload)
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [embed],
        }),
      })
      
      if (!response.ok) {
        console.error('Discord webhook error:', response.status)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error sending Discord alert:', error)
      return false
    }
  }
  
  /**
   * Send alert via email (using Resend)
   */
  async sendEmailAlert(email: string, payload: AlertPayload): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('Resend API key not configured')
      return false
    }
    
    const html = this.formatEmailHtml(payload)
    
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'DegenArena HQ <onboarding@resend.dev>',
          to: email,
          subject: `🎯 New Match: ${payload.tokenSymbol} matched your "${payload.formulaName}" formula`,
          html,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Resend API error:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error sending email alert:', error)
      return false
    }
  }
  
  /**
   * Send digest email with multiple matches (using Resend)
   */
  async sendDigestEmail(email: string, payload: DigestPayload): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('Resend API key not configured')
      return false
    }
    
    const html = this.formatDigestEmailHtml(payload)
    
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'DegenArena HQ <onboarding@resend.dev>',
          to: email,
          subject: `🎯 DegenArena HQ Daily Report: ${payload.totalMatches} new match${payload.totalMatches === 1 ? '' : 'es'} found`,
          html,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Resend API error:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error sending digest email:', error)
      return false
    }
  }

  /**
   * Send digest alerts for a user (all matches in one email)
   */
  async sendDigestAlerts(payload: DigestPayload): Promise<{ email: boolean | null }> {
    const results = { email: null as boolean | null }
    
    if (payload.totalMatches === 0) {
      return results
    }
    
    // Get user's alert settings
    const settings = await this.getAlertSettings(payload.userId)
    if (!settings) {
      console.log(`No alert settings for user ${payload.userId}`)
      return results
    }
    
    // Get user email for email alerts
    if (settings.email_enabled) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', payload.userId)
        .single()
      
      if (profile?.email) {
        results.email = await this.sendDigestEmail(profile.email, payload)
        
        // Record one alert entry for the digest
        if (results.email) {
          await supabaseAdmin
            .from('alerts')
            .insert({
              user_id: payload.userId,
              formula_id: payload.formulas[0]?.formulaId || null,
              token_match_id: payload.formulas[0]?.matches[0]?.matchId || null,
              type: 'email',
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
        }
      }
    }
    
    return results
  }

  /**
   * Record an alert in the database
   */
  async recordAlert(
    userId: string,
    formulaId: string,
    matchId: string,
    type: 'telegram' | 'discord' | 'email',
    status: 'sent' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await supabaseAdmin
      .from('alerts')
      .insert({
        user_id: userId,
        formula_id: formulaId,
        token_match_id: matchId,
        type,
        status,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      })
  }
  
  /**
   * Send all configured alerts for a match
   */
  async sendMatchAlerts(payload: AlertPayload): Promise<{
    telegram: boolean | null
    discord: boolean | null
    email: boolean | null
  }> {
    const results = {
      telegram: null as boolean | null,
      discord: null as boolean | null,
      email: null as boolean | null,
    }
    
    // Get user's alert settings
    const settings = await this.getAlertSettings(payload.userId)
    if (!settings) {
      console.log(`No alert settings for user ${payload.userId}`)
      return results
    }
    
    // Check limits
    const withinLimits = await this.checkAlertLimits(payload.userId, settings)
    if (!withinLimits) {
      return results
    }
    
    // Send Telegram alert
    if (settings.telegram_enabled && settings.telegram_chat_id) {
      results.telegram = await this.sendTelegramAlert(settings.telegram_chat_id, payload)
      await this.recordAlert(
        payload.userId,
        payload.formulaId,
        payload.matchId,
        'telegram',
        results.telegram ? 'sent' : 'failed'
      )
    }
    
    // Send Discord alert
    if (settings.discord_enabled && settings.discord_webhook_url) {
      results.discord = await this.sendDiscordAlert(settings.discord_webhook_url, payload)
      await this.recordAlert(
        payload.userId,
        payload.formulaId,
        payload.matchId,
        'discord',
        results.discord ? 'sent' : 'failed'
      )
    }
    
    // Get user email for email alerts
    if (settings.email_enabled) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', payload.userId)
        .single()
      
      if (profile?.email) {
        results.email = await this.sendEmailAlert(profile.email, payload)
        await this.recordAlert(
          payload.userId,
          payload.formulaId,
          payload.matchId,
          'email',
          results.email ? 'sent' : 'failed'
        )
      }
    }
    
    return results
  }
  
  // ============ Message Formatting ============
  
  private formatTelegramMessage(payload: AlertPayload): string {
    const formatNumber = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    
    return `
🎯 <b>New Token Match!</b>

<b>Formula:</b> ${payload.formulaName}

<b>Token:</b> ${payload.tokenSymbol} (${payload.tokenName})
<b>Chain:</b> ${payload.chain.toUpperCase()}
<b>Price:</b> $${payload.price.toFixed(8)}
<b>Liquidity:</b> $${formatNumber(payload.liquidity)}
<b>24h Volume:</b> $${formatNumber(payload.volume24h)}

<b>Contract:</b>
<code>${payload.tokenAddress}</code>

🔗 <a href="${payload.dexscreenerUrl}">View on DexScreener</a>

<i>Powered by DegenArena HQ</i>
`.trim()
  }
  
  private formatDiscordEmbed(payload: AlertPayload): object {
    const formatNumber = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    
    return {
      title: `🎯 New Match: ${payload.tokenSymbol}`,
      description: `Your formula **"${payload.formulaName}"** found a new token!`,
      color: 0x00ff9d, // arena-cyan
      fields: [
        {
          name: 'Token',
          value: `${payload.tokenSymbol} (${payload.tokenName})`,
          inline: true,
        },
        {
          name: 'Chain',
          value: payload.chain.toUpperCase(),
          inline: true,
        },
        {
          name: 'Price',
          value: `$${payload.price.toFixed(8)}`,
          inline: true,
        },
        {
          name: 'Liquidity',
          value: `$${formatNumber(payload.liquidity)}`,
          inline: true,
        },
        {
          name: '24h Volume',
          value: `$${formatNumber(payload.volume24h)}`,
          inline: true,
        },
        {
          name: 'Contract',
          value: `\`${payload.tokenAddress}\``,
          inline: false,
        },
      ],
      url: payload.dexscreenerUrl,
      footer: {
        text: 'Powered by DegenArena HQ',
      },
      timestamp: new Date().toISOString(),
    }
  }
  
  private formatEmailHtml(payload: AlertPayload): string {
    const formatNumber = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d0d12; color: #fff; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #141419; border-radius: 12px; padding: 30px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; background: linear-gradient(to right, #a855f7, #00ff9d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h1 { font-size: 20px; margin: 0 0 10px 0; }
    .token-name { color: #a855f7; font-size: 18px; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; }
    .stat-label { color: #888; font-size: 12px; }
    .stat-value { font-size: 16px; font-weight: 600; margin-top: 5px; }
    .contract { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 12px; }
    .cta { display: block; background: linear-gradient(to right, #a855f7, #00ff9d); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; text-align: center; font-weight: 600; margin-top: 20px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">DegenArena HQ</div>
    </div>
    
    <h1>🎯 New Token Match!</h1>
    <p>Your formula <strong>"${payload.formulaName}"</strong> found a new token:</p>
    
    <p class="token-name">${payload.tokenSymbol} (${payload.tokenName})</p>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Chain</div>
        <div class="stat-value">${payload.chain.toUpperCase()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Price</div>
        <div class="stat-value">$${payload.price.toFixed(8)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Liquidity</div>
        <div class="stat-value">$${formatNumber(payload.liquidity)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">24h Volume</div>
        <div class="stat-value">$${formatNumber(payload.volume24h)}</div>
      </div>
    </div>
    
    <div class="contract">
      <div class="stat-label">Contract Address</div>
      ${payload.tokenAddress}
    </div>
    
    <a href="${payload.dexscreenerUrl}" class="cta">View on DexScreener →</a>
    
    <div class="footer">
      <p>You're receiving this because you have email alerts enabled for your DegenArena HQ formulas.</p>
      <p>Manage your alert settings in your dashboard.</p>
    </div>
  </div>
</body>
</html>
`.trim()
  }

  private formatDigestEmailHtml(payload: DigestPayload): string {
    const formatNumber = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    
    const formatTimeEST = (isoString: string) => {
      const date = new Date(isoString)
      return date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) + ' EST'
    }
    
    const formulaSections = payload.formulas.map(formula => {
      const matchRows = formula.matches.map(match => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <strong style="color: #a855f7;">${match.tokenSymbol}</strong>
            <div style="color: #888; font-size: 12px;">${match.tokenName}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: center; color: #888; font-size: 12px;">
            ${formatTimeEST(match.matchedAt)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
            $${formatNumber(match.liquidity)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
            $${formatNumber(match.volume24h)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <a href="${match.dexscreenerUrl}" style="color: #00ff9d; text-decoration: none;">View →</a>
          </td>
        </tr>
      `).join('')

      return `
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #fff; font-size: 16px;">
            📊 ${formula.formulaName}
            <span style="color: #00ff9d; font-size: 14px; font-weight: normal; margin-left: 10px;">
              ${formula.matches.length} match${formula.matches.length === 1 ? '' : 'es'}
            </span>
          </h3>
          <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.02); border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: rgba(255,255,255,0.05);">
                <th style="padding: 12px; text-align: left; color: #888; font-size: 12px; font-weight: 500;">Token</th>
                <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">Found At</th>
                <th style="padding: 12px; text-align: right; color: #888; font-size: 12px; font-weight: 500;">Liquidity</th>
                <th style="padding: 12px; text-align: right; color: #888; font-size: 12px; font-weight: 500;">24h Vol</th>
                <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; font-weight: 500;">Link</th>
              </tr>
            </thead>
            <tbody>
              ${matchRows}
            </tbody>
          </table>
        </div>
      `
    }).join('')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d0d12; color: #fff; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #141419; border-radius: 12px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 24px; font-weight: bold; background: linear-gradient(to right, #a855f7, #00ff9d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">DegenArena HQ</div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 28px; margin: 0 0 10px 0;">🎯 Daily Report</h1>
      <p style="color: #888; margin: 0;">
        Your formulas found <strong style="color: #00ff9d;">${payload.totalMatches} new token${payload.totalMatches === 1 ? '' : 's'}</strong> today
      </p>
    </div>
    
    ${formulaSections}
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://degenarena.com'}/dashboard" style="display: inline-block; background: linear-gradient(to right, #a855f7, #00ff9d); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600;">
        View Dashboard →
      </a>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
      <p>You're receiving this because you have email alerts enabled for your DegenArena HQ formulas.</p>
      <p>Manage your alert settings in your dashboard.</p>
    </div>
  </div>
</body>
</html>
`.trim()
  }
}

// Singleton instance
export const alertService = new AlertService()
