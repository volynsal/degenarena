'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  ArrowLeft,
  Users, 
  Trophy,
  Target,
  Shield,
  LogOut,
  Loader2,
  Crown,
  Star,
  Copy,
  Check,
  Trash2,
  UserMinus,
  Key,
  Edit2,
  Save,
  X,
  ChevronDown,
  Camera,
  Upload
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Telegram icon component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

// Twitch icon component
const TwitchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
)

interface ClanMember {
  user_id: string
  username: string
  avatar_url: string | null
  twitch_url: string | null
  wallet_verified: boolean
  role: string
  win_rate: number
  avg_return: number
  total_matches: number
}

interface ClanDetails {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  telegram_link: string | null
  owner_id: string
  is_public: boolean
  member_count: number
  total_matches: number
  avg_win_rate: number
  created_at: string
  owner: {
    username: string
    avatar_url: string | null
  }
  members: ClanMember[]
  is_member: boolean
  user_role: string | null
}

export default function ClanPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [clan, setClan] = useState<ClanDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    description: '',
    telegram_link: '',
  })
  
  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // Role dropdown state
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  
  useEffect(() => {
    fetchClan()
  }, [params.slug])
  
  const fetchClan = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/clans/${params.slug}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Clan not found')
      }
      
      setClan(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clan')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleJoin = async () => {
    setIsJoining(true)
    try {
      const res = await fetch(`/api/clans/${params.slug}/join`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join')
      }
      
      fetchClan()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join clan')
    } finally {
      setIsJoining(false)
    }
  }
  
  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this clan?')) return
    
    setIsJoining(true)
    try {
      const res = await fetch(`/api/clans/${params.slug}/join`, {
        method: 'DELETE',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to leave')
      }
      
      fetchClan()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to leave clan')
    } finally {
      setIsJoining(false)
    }
  }
  
  const generateInvite = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/clans/${params.slug}/invites`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invite')
      }
      
      setInviteCode(data.data.code)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate invite')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleDeleteClan = async () => {
    if (!confirm('Are you sure you want to delete this clan? This action cannot be undone.')) return
    
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/clans/${params.slug}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete clan')
      }
      
      router.push('/clans')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete clan')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleRemoveMember = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove @${username} from the clan?`)) return
    
    setRemovingMember(userId)
    try {
      const res = await fetch(`/api/clans/${params.slug}/members/${userId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member')
      }
      
      fetchClan()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setRemovingMember(null)
    }
  }
  
  const startEditing = () => {
    setEditForm({
      description: clan?.description || '',
      telegram_link: clan?.telegram_link || '',
    })
    setPreviewUrl(null)
    setIsEditing(true)
  }
  
  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm({
      description: '',
      telegram_link: '',
    })
    setPreviewUrl(null)
  }
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, GIF, WebP')
      return
    }
    
    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Maximum size is 2MB')
      return
    }
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    
    // Upload immediately
    uploadImage(file)
  }
  
  const uploadImage = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`/api/clans/${params.slug}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }
      
      // Update local state with new URL
      if (clan) {
        setClan({ ...clan, logo_url: data.data.logo_url })
      }
      setPreviewUrl(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload image')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  const saveChanges = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/clans/${params.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editForm.description || null,
          telegram_link: editForm.telegram_link || null,
        }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save changes')
      }
      
      setIsEditing(false)
      fetchClan()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId)
    setRoleDropdownOpen(null)
    
    try {
      const res = await fetch(`/api/clans/${params.slug}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role')
      }
      
      fetchClan()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setUpdatingRole(null)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  if (error || !clan) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h1 className="text-xl font-bold text-white mb-2">Clan Not Found</h1>
            <p className="text-gray-400 mb-6">{error || 'This clan does not exist.'}</p>
            <Link href="/clans">
              <Button variant="primary">Browse Clans</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clans">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
      </div>
      
      {/* Clan Header Card */}
      <Card>
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo */}
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
              />
              <div 
                className={`w-24 h-24 rounded-xl bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-3xl font-bold text-white overflow-hidden ${
                  isEditing ? 'cursor-pointer ring-2 ring-arena-purple ring-offset-2 ring-offset-arena-dark' : ''
                }`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : clan.logo_url ? (
                  <img src={clan.logo_url} alt={clan.name} className="w-full h-full object-cover" />
                ) : (
                  clan.name.charAt(0).toUpperCase()
                )}
              </div>
              {isEditing && !isUploading && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{clan.name}</h1>
                {!clan.is_public && (
                  <span className="px-2 py-1 rounded bg-arena-purple/20 text-arena-purple text-xs">
                    Private
                  </span>
                )}
                {clan.user_role === 'owner' && !isEditing && (
                  <button
                    onClick={startEditing}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit clan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your clan..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-arena-purple transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Telegram Group Link</label>
                    <div className="flex items-center gap-2">
                      <TelegramIcon className="w-5 h-5 text-[#0088cc]" />
                      <input
                        type="url"
                        value={editForm.telegram_link}
                        onChange={(e) => setEditForm(prev => ({ ...prev, telegram_link: e.target.value }))}
                        placeholder="https://t.me/yourgroup"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={saveChanges} loading={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="ghost" onClick={cancelEditing}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {clan.description && (
                    <p className="text-gray-400 mb-3">{clan.description}</p>
                  )}
                  
                  {/* Telegram link - visible to clan members */}
                  {clan.is_member && (
                    clan.telegram_link ? (
                      <a 
                        href={clan.telegram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0088cc]/20 to-[#0088cc]/10 hover:from-[#0088cc]/30 hover:to-[#0088cc]/20 border border-[#0088cc]/30 rounded-lg text-white text-sm font-medium transition-all mb-3 group"
                      >
                        <TelegramIcon className="w-5 h-5 text-[#0088cc] group-hover:scale-110 transition-transform" />
                        <span>Join Telegram Group</span>
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-500 text-sm mb-3">
                        <TelegramIcon className="w-5 h-5 opacity-40" />
                        <span>No Telegram group linked</span>
                      </div>
                    )
                  )}
                </>
              )}
              
              <p className="text-sm text-gray-500">
                Created by <Link href={`/u/${clan.owner.username}`} className="text-arena-cyan hover:underline">@{clan.owner.username}</Link>
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2">
              {clan.is_member && !isEditing && (
                <>
                  {inviteCode ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-400">Share this code:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inviteCode}
                          readOnly
                          className="w-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center text-sm font-mono tracking-widest"
                        />
                        <Button variant="secondary" onClick={copyInviteCode}>
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="secondary" onClick={generateInvite} loading={isGenerating}>
                      <Key className="w-4 h-4 mr-2" />
                      Generate Invite Code
                    </Button>
                  )}
                  {clan.user_role !== 'owner' && (
                    <Button variant="ghost" onClick={handleLeave} loading={isJoining}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Clan
                    </Button>
                  )}
                  {clan.user_role === 'owner' && (
                    <Button 
                      variant="ghost" 
                      onClick={handleDeleteClan} 
                      loading={isDeleting}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Clan
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Bar — compact horizontal strip */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-3 divide-x divide-white/5">
            <div className="px-4 py-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-white">{clan.member_count}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Members</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-arena-cyan">{clan.avg_win_rate}%</p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Win Rate</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-white">{clan.total_matches}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Matches</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Members */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 px-1">Members ({clan.members.length})</h3>
        <div className="space-y-2">
          {clan.members.map((member) => (
            <Card key={member.user_id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  {/* Avatar */}
                  <Link href={`/u/${member.username}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50 flex items-center justify-center text-white font-medium text-sm overflow-hidden">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                      ) : (
                        member.username.charAt(0).toUpperCase()
                      )}
                    </div>
                  </Link>
                  
                  {/* Name + badges + role */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/u/${member.username}`} className="text-white font-medium text-sm hover:text-arena-cyan transition-colors truncate">
                        @{member.username}
                      </Link>
                      {member.role === 'owner' && <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                      {member.role === 'admin' && <Star className="w-3.5 h-3.5 text-arena-purple flex-shrink-0" />}
                      {member.wallet_verified && (
                        <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      )}
                      {member.twitch_url && (
                        <a
                          href={member.twitch_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#9146FF] hover:text-[#772ce8] transition-colors flex-shrink-0"
                        >
                          <TwitchIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {/* Role (clickable for owners) */}
                    {clan.user_role === 'owner' ? (
                      <div className="relative">
                        <button
                          onClick={() => setRoleDropdownOpen(roleDropdownOpen === member.user_id ? null : member.user_id)}
                          disabled={updatingRole === member.user_id}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 mt-0.5"
                        >
                          {updatingRole === member.user_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <span className="capitalize">{member.role}</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                        {roleDropdownOpen === member.user_id && (
                          <div className="absolute left-0 top-full mt-1 w-28 bg-arena-dark border border-white/10 rounded-lg shadow-xl py-1 z-20">
                            {['owner', 'admin', 'member'].map((role) => (
                              <button
                                key={role}
                                onClick={() => {
                                  if (role !== member.role) {
                                    handleRoleChange(member.user_id, role)
                                  } else {
                                    setRoleDropdownOpen(null)
                                  }
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                                  role === member.role 
                                    ? 'text-arena-cyan bg-arena-cyan/10' 
                                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {role === 'owner' && <Crown className="w-3 h-3 text-yellow-500" />}
                                {role === 'admin' && <Star className="w-3 h-3 text-arena-purple" />}
                                {role === 'member' && <Users className="w-3 h-3 text-gray-400" />}
                                <span className="capitalize">{role}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 capitalize mt-0.5 block">{member.role}</span>
                    )}
                  </div>
                  
                  {/* Stats pills */}
                  <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    <div className="text-center px-2 py-1 rounded-md bg-white/[0.03]">
                      <p className="text-xs sm:text-sm font-semibold text-white leading-tight">{member.win_rate}%</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-600 leading-tight">WR</p>
                    </div>
                    <div className="text-center px-2 py-1 rounded-md bg-white/[0.03]">
                      <p className={`text-xs sm:text-sm font-semibold leading-tight ${member.avg_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {member.avg_return >= 0 ? '+' : ''}{member.avg_return}%
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-600 leading-tight">AVG</p>
                    </div>
                    <div className="text-center px-2 py-1 rounded-md bg-white/[0.03]">
                      <p className="text-xs sm:text-sm font-semibold text-white leading-tight">{member.total_matches}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-600 leading-tight">M</p>
                    </div>
                  </div>
                  
                  {/* Remove member - owner only */}
                  {clan.user_role === 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id, member.username)}
                      disabled={removingMember === member.user_id}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      title="Remove member"
                    >
                      {removingMember === member.user_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
