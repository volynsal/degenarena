import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  improvement: 'Improvement',
  other: 'Other',
}

const CATEGORY_EMOJI: Record<string, string> = {
  bug: '🐛',
  feature: '💡',
  improvement: '🔧',
  other: '💬',
}

// POST /api/feedback - Submit feedback
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { category?: string; message?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { category, message } = body

  if (!category || !message?.trim()) {
    return NextResponse.json({ error: 'Category and message are required' }, { status: 400 })
  }

  if (!['bug', 'feature', 'improvement', 'other'].includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  if (message.trim().length > 5000) {
    return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
  }

  const serviceClient = getServiceClient()

  // Get username for the email notification
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  const username = profile?.username || 'Unknown User'

  // Insert into database
  const { data: feedback, error: insertError } = await serviceClient
    .from('feedback')
    .insert({
      user_id: user.id,
      category,
      message: message.trim(),
    })
    .select('id, created_at')
    .single()

  if (insertError) {
    console.error('Feedback insert error:', insertError)
    return NextResponse.json({ error: 'Failed to submit feedback. Please try again.' }, { status: 500 })
  }

  // Send email notification
  const resendApiKey = process.env.RESEND_API_KEY
  const feedbackEmail = process.env.FEEDBACK_EMAIL || 'degenarena101@gmail.com'
  let emailSent = false

  if (resendApiKey) {
    try {
      const emoji = CATEGORY_EMOJI[category] || '💬'
      const label = CATEGORY_LABELS[category] || category
      const timestamp = new Date(feedback.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })

      // Use verified custom domain if set, otherwise fall back to Resend's default sender
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'DegenArena HQ <alerts@degenarenahq.com>'

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: feedbackEmail,
          subject: `${emoji} ${label} from ${username}`,
          html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d0d12; color: #e0e0e0; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #141419; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 20px 24px;">
      <h1 style="margin: 0; font-size: 18px; color: white;">${emoji} New Feedback: ${label}</h1>
    </div>
    <div style="padding: 24px;">
      <table style="width: 100%; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="color: #888; padding: 4px 12px 4px 0; white-space: nowrap;">User</td>
          <td style="color: #fff; font-weight: 600;">${username}</td>
        </tr>
        <tr>
          <td style="color: #888; padding: 4px 12px 4px 0; white-space: nowrap;">Category</td>
          <td style="color: #fff;">${label}</td>
        </tr>
        <tr>
          <td style="color: #888; padding: 4px 12px 4px 0; white-space: nowrap;">Submitted</td>
          <td style="color: #fff;">${timestamp}</td>
        </tr>
        <tr>
          <td style="color: #888; padding: 4px 12px 4px 0; white-space: nowrap;">ID</td>
          <td style="color: #666; font-family: monospace; font-size: 12px;">${feedback.id}</td>
        </tr>
      </table>
      <div style="background: #1a1a22; border-radius: 8px; padding: 16px; border-left: 3px solid #7c3aed;">
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e0e0e0; white-space: pre-wrap;">${message.trim()}</p>
      </div>
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #222; text-align: center;">
      <span style="color: #555; font-size: 12px;">DegenArena HQ Feedback</span>
    </div>
  </div>
</body>
</html>`.trim(),
        }),
      })

      const resBody = await res.json()
      if (!res.ok) {
        console.error('Resend API error:', res.status, resBody)
      } else {
        emailSent = true
      }
    } catch (err) {
      console.error('Feedback email error:', err)
    }
  } else {
    console.warn('RESEND_API_KEY not set — skipping feedback email')
  }

  return NextResponse.json({
    success: true,
    message: emailSent
      ? 'Feedback submitted and notification sent!'
      : 'Feedback saved (email notification may be delayed).',
    id: feedback.id,
    emailSent,
  })
}
