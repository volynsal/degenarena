import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { AlertSettings, UpdateAlertSettingsInput, ApiResponse } from '@/types/database'

// GET /api/user/alert-settings - Get current user's alert settings
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from('alert_settings')
    .select('*')
    .eq('user_id', session.user.id)
    .single()
  
  if (error && error.code !== 'PGRST116') { // Not found is ok
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  // Return default settings if none exist
  const settings: AlertSettings = data || {
    id: '',
    user_id: session.user.id,
    telegram_enabled: false,
    telegram_chat_id: null,
    discord_enabled: false,
    discord_webhook_url: null,
    email_enabled: true,
    min_interval_seconds: 60,
    daily_limit: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  return NextResponse.json<ApiResponse<AlertSettings>>({ 
    data: settings 
  })
}

// PUT /api/user/alert-settings - Create or update alert settings
export async function PUT(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  try {
    const body: UpdateAlertSettingsInput = await request.json()
    
    // Validate Telegram chat ID if enabling Telegram
    if (body.telegram_enabled && !body.telegram_chat_id) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'Telegram chat ID is required when enabling Telegram alerts' 
      }, { status: 400 })
    }
    
    // Validate Discord webhook URL if enabling Discord
    if (body.discord_enabled && !body.discord_webhook_url) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'Discord webhook URL is required when enabling Discord alerts' 
      }, { status: 400 })
    }
    
    // Validate webhook URL format
    if (body.discord_webhook_url && !body.discord_webhook_url.startsWith('https://discord.com/api/webhooks/')) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'Invalid Discord webhook URL' 
      }, { status: 400 })
    }
    
    const updateData = {
      user_id: session.user.id,
      telegram_enabled: body.telegram_enabled ?? false,
      telegram_chat_id: body.telegram_chat_id || null,
      discord_enabled: body.discord_enabled ?? false,
      discord_webhook_url: body.discord_webhook_url || null,
      email_enabled: body.email_enabled ?? true,
      min_interval_seconds: body.min_interval_seconds ?? 60,
      daily_limit: body.daily_limit ?? 100,
    }
    
    // Upsert alert settings
    const { data, error } = await supabase
      .from('alert_settings')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<AlertSettings>>({ 
      data: data as AlertSettings,
      message: 'Alert settings saved successfully'
    })
    
  } catch (e) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Invalid request body' 
    }, { status: 400 })
  }
}
