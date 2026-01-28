'use client'

import { useState, useEffect } from 'react'
import { useAlertSettings } from '@/lib/hooks/use-alert-settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Bell, 
  MessageCircle, 
  Mail, 
  Save, 
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react'

export default function SettingsPage() {
  const { settings, isLoading, isSaving, error, saveSettings, clearError } = useAlertSettings()
  
  const [formData, setFormData] = useState({
    telegram_enabled: false,
    telegram_chat_id: '',
    discord_enabled: false,
    discord_webhook_url: '',
    email_enabled: true,
    min_interval_seconds: 60,
    daily_limit: 100,
  })
  
  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        telegram_enabled: settings.telegram_enabled,
        telegram_chat_id: settings.telegram_chat_id || '',
        discord_enabled: settings.discord_enabled,
        discord_webhook_url: settings.discord_webhook_url || '',
        email_enabled: settings.email_enabled,
        min_interval_seconds: settings.min_interval_seconds,
        daily_limit: settings.daily_limit,
      })
    }
  }, [settings])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    const success = await saveSettings(formData)
    if (success) {
      alert('Settings saved successfully!')
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Settings
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">Configure your alert preferences and notifications</p>
      </div>
      
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Telegram Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#0088cc]" />
              <CardTitle>Telegram Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="text-white font-medium">Enable Telegram Alerts</p>
                <p className="text-sm text-gray-400">Receive instant alerts via Telegram bot</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, telegram_enabled: !prev.telegram_enabled }))}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  formData.telegram_enabled ? 'bg-[#0088cc]' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  formData.telegram_enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            
            {formData.telegram_enabled && (
              <>
                <div className="p-4 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20">
                  <p className="text-white font-medium mb-2">Step 1: Get your Chat ID</p>
                  <a 
                    href="https://t.me/DegenArenaAlertsBot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Open @DegenArenaAlertsBot
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-sm text-gray-400 mt-2">
                    Send <code className="bg-white/10 px-1 rounded">/start</code> to the bot and it will show your Chat ID
                  </p>
                </div>
                
                <Input
                  label="Step 2: Paste your Chat ID"
                  placeholder="e.g., 123456789"
                  value={formData.telegram_chat_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                />
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Discord Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <CardTitle>Discord Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="text-white font-medium">Enable Discord Alerts</p>
                <p className="text-sm text-gray-400">Receive alerts via Discord webhook</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, discord_enabled: !prev.discord_enabled }))}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  formData.discord_enabled ? 'bg-[#5865F2]' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  formData.discord_enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            
            {formData.discord_enabled && (
              <>
                <Input
                  label="Discord Webhook URL"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={formData.discord_webhook_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, discord_webhook_url: e.target.value }))}
                />
                <div className="flex items-start gap-2 text-sm text-gray-400">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Create a webhook in your Discord server: Server Settings → Integrations → Webhooks → New Webhook
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-arena-cyan" />
              <CardTitle>Email Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="text-white font-medium">Enable Email Alerts</p>
                <p className="text-sm text-gray-400">Receive daily digest via email</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, email_enabled: !prev.email_enabled }))}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  formData.email_enabled ? 'bg-arena-cyan' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  formData.email_enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </CardContent>
        </Card>
        
        {/* Alert Throttling */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-arena-purple" />
              <CardTitle>Alert Limits</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Interval (seconds)
                </label>
                <input
                  type="number"
                  min="30"
                  max="3600"
                  value={formData.min_interval_seconds}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_interval_seconds: parseInt(e.target.value) || 60 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum time between alerts (30-3600 seconds)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Daily Limit
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={formData.daily_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, daily_limit: parseInt(e.target.value) || 100 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum alerts per day (10-1000)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
