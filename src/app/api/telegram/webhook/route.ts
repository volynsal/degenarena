import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client for updating user settings
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TelegramUpdate {
  message?: {
    chat: {
      id: number
      first_name?: string
      username?: string
    }
    text?: string
    from?: {
      id: number
      first_name?: string
      username?: string
    }
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return false
  
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })
  
  return true
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()
    
    if (!update.message?.text) {
      return NextResponse.json({ ok: true })
    }
    
    const chatId = update.message.chat.id
    const text = update.message.text.trim()
    const firstName = update.message.from?.first_name || 'there'
    
    // Handle /start command
    if (text === '/start') {
      await sendTelegramMessage(chatId, `
🎯 <b>Welcome to DegenArena Alerts!</b>

Hey ${firstName}! I'll send you instant alerts when your formulas find matching tokens.

<b>Your Chat ID:</b> <code>${chatId}</code>

<b>To connect your account:</b>
1. Go to your DegenArena dashboard
2. Navigate to Settings → Telegram Alerts
3. Paste your Chat ID above and enable alerts

That's it! You'll receive alerts here when your formulas match new tokens.

Questions? Visit <a href="https://degenarena.com">degenarena.com</a>
      `.trim())
      
      return NextResponse.json({ ok: true })
    }
    
    // Handle /mychatid command
    if (text === '/mychatid' || text === '/chatid') {
      await sendTelegramMessage(chatId, `
Your Chat ID is: <code>${chatId}</code>

Copy this and paste it in your DegenArena settings to receive alerts!
      `.trim())
      
      return NextResponse.json({ ok: true })
    }
    
    // Handle /help command
    if (text === '/help') {
      await sendTelegramMessage(chatId, `
🎯 <b>DegenArena Alerts Bot</b>

<b>Commands:</b>
/start - Get started and see your Chat ID
/mychatid - Show your Chat ID
/help - Show this help message

<b>How alerts work:</b>
When your formulas find tokens that match your criteria, I'll send you an instant alert with:
• Token name and symbol
• Current price and liquidity
• Direct link to DexScreener

<b>Need help?</b>
Visit <a href="https://degenarena.com">degenarena.com</a>
      `.trim())
      
      return NextResponse.json({ ok: true })
    }
    
    // Default response for unknown messages
    await sendTelegramMessage(chatId, `
I'm the DegenArena Alerts bot! 🎯

Send /start to get your Chat ID and connect your account.
Send /help for more info.
    `.trim())
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}

// Telegram sends GET to verify webhook is alive
export async function GET() {
  return NextResponse.json({ status: 'ok', bot: 'DegenArena Alerts' })
}
