'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { FeatureGate } from '@/components/ui/FeatureGate'
import { useFeatureGate } from '@/lib/hooks/use-feature-gate'
import { Loader2, Users, Radio, ExternalLink } from 'lucide-react'

// Twitch icon component
const TwitchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
)

interface LiveUser {
  username: string
  avatar_url: string | null
  twitch_url: string
  twitch_username: string
  stream: {
    isLive: boolean
    title?: string
    viewerCount?: number
    gameName?: string
    thumbnailUrl?: string
    startedAt?: string
  }
}

function formatDuration(startedAt: string): string {
  const start = new Date(startedAt)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const hours = Math.floor(diffMs / 3600000)
  const mins = Math.floor((diffMs % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export default function LivePage() {
  const gateStatus = useFeatureGate('goLive')
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [userTwitchUrl, setUserTwitchUrl] = useState<string | null>(null)
  const [userIsLive, setUserIsLive] = useState(false)

  useEffect(() => {
    fetchLiveUsers()
    fetchUserProfile()
    // Refresh every 60 seconds
    const interval = setInterval(fetchLiveUsers, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      if (data.data?.twitch_url) {
        setUserTwitchUrl(data.data.twitch_url)
      }
    } catch {
      // Not critical
    }
  }

  const fetchLiveUsers = async () => {
    try {
      const res = await fetch('/api/twitch/live')
      const data = await res.json()
      if (data.data) {
        setLiveUsers(data.data)
        // Auto-select first stream if none selected
        if (!selectedStream && data.data.length > 0) {
          setSelectedStream(data.data[0].twitch_username)
        }
        // Check if current user is among the live users
        // We'll compare after profile loads
        setUserIsLive(false)
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false)
    }
  }

  // Check if current user is live whenever liveUsers or userTwitchUrl changes
  useEffect(() => {
    if (userTwitchUrl && liveUsers.length > 0) {
      const twitchUser = userTwitchUrl.replace(/https?:\/\/(www\.)?twitch\.tv\//i, '').split('/')[0].split('?')[0].toLowerCase()
      setUserIsLive(liveUsers.some(u => u.twitch_username === twitchUser))
    }
  }, [liveUsers, userTwitchUrl])

  const parentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const activeStream = liveUsers.find(u => u.twitch_username === selectedStream)

  // Feature gate — check prediction wins + verified PnL
  if (!gateStatus.isUnlocked) {
    return <FeatureGate status={gateStatus} featureName="Go Live" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold gradient-text flex items-center gap-3">
            <Radio className="w-7 h-7 text-red-500" />
            Live Now
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            Watch DegenArena traders streaming live
          </p>
        </div>
        <div className="flex items-center gap-3">
          {liveUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {liveUsers.length} live
            </div>
          )}
          {userTwitchUrl ? (
            userIsLive ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                You&apos;re Live
              </div>
            ) : (
              <a
                href="https://dashboard.twitch.tv/stream-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9146FF] hover:bg-[#7c3aed] text-white text-sm font-medium transition-colors"
              >
                <TwitchIcon className="w-4 h-4" />
                Go Live
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )
          ) : (
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 text-sm transition-colors"
            >
              <TwitchIcon className="w-4 h-4" />
              Connect Twitch
            </Link>
          )}
        </div>
      </div>

      {liveUsers.length === 0 ? (
        /* No streams */
        <Card>
          <CardContent className="p-12 text-center">
            <TwitchIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-bold text-white mb-2">No one is live right now</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              When DegenArena users go live on Twitch, their streams will appear here.
              Add your Twitch URL in Settings to be featured.
            </p>
            <Link
              href="/settings"
              className="inline-block px-4 py-2 bg-[#9146FF]/20 border border-[#9146FF]/30 text-[#9146FF] rounded-lg text-sm font-medium hover:bg-[#9146FF]/30 transition-colors"
            >
              Connect Your Twitch
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Player */}
          <div className="lg:col-span-2 space-y-4">
            {activeStream && (
              <Card className="overflow-hidden border-red-500/20">
                <CardContent className="p-0">
                  {/* Stream info bar */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border-b border-red-500/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <Link
                      href={`/u/${activeStream.username}`}
                      className="text-sm font-medium text-white hover:text-arena-cyan transition-colors"
                    >
                      @{activeStream.username}
                    </Link>
                    {activeStream.stream.title && (
                      <span className="text-sm text-gray-400 truncate flex-1">
                        &mdash; {activeStream.stream.title}
                      </span>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                      {activeStream.stream.viewerCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {activeStream.stream.viewerCount.toLocaleString()}
                        </span>
                      )}
                      <a
                        href={activeStream.twitch_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#9146FF] hover:text-[#a970ff]"
                      >
                        <TwitchIcon className="w-3 h-3" />
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  {/* Embed player */}
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={`https://player.twitch.tv/?channel=${activeStream.twitch_username}&parent=${parentDomain}&muted=true`}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stream list sidebar */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              Streams ({liveUsers.length})
            </h3>
            <div className="space-y-2">
              {liveUsers.map((user) => (
                <button
                  key={user.twitch_username}
                  onClick={() => setSelectedStream(user.twitch_username)}
                  className={`w-full text-left rounded-lg border transition-colors ${
                    selectedStream === user.twitch_username
                      ? 'bg-white/10 border-arena-cyan/30'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                          <span className="text-sm font-medium text-white truncate">
                            @{user.username}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {user.stream.title || 'Streaming'}
                        </p>
                      </div>
                      {/* Viewers */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>{user.stream.viewerCount?.toLocaleString() || 0}</span>
                        </div>
                        {user.stream.startedAt && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            {formatDuration(user.stream.startedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
