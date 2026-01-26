'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Shield, Globe, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CreateClanPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true,
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Clan name must be at least 3 characters')
      return
    }
    
    setIsCreating(true)
    setError(null)
    
    try {
      const res = await fetch('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create clan')
      }
      
      router.push(`/clans/${data.data.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clans">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create a Clan</h1>
          <p className="text-gray-400 mt-1">Start your own trading team</p>
        </div>
      </div>
      
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-arena-purple" />
              Clan Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Clan Name"
              placeholder="Enter clan name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                placeholder="Tell people what your clan is about..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arena-purple/50 focus:border-arena-purple transition-colors resize-none"
              />
            </div>
            
            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Clan Visibility
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-colors text-left',
                    formData.is_public
                      ? 'border-arena-cyan bg-arena-cyan/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  )}
                >
                  <Globe className={cn(
                    'w-6 h-6 mb-2',
                    formData.is_public ? 'text-arena-cyan' : 'text-gray-400'
                  )} />
                  <p className="font-medium text-white">Public</p>
                  <p className="text-sm text-gray-400">Anyone can find and join</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-colors text-left',
                    !formData.is_public
                      ? 'border-arena-purple bg-arena-purple/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  )}
                >
                  <Lock className={cn(
                    'w-6 h-6 mb-2',
                    !formData.is_public ? 'text-arena-purple' : 'text-gray-400'
                  )} />
                  <p className="font-medium text-white">Private</p>
                  <p className="text-sm text-gray-400">Invite code required</p>
                </button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isCreating}
              >
                <Shield className="w-4 h-4 mr-2" />
                Create Clan
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
