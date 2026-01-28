import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

interface ShareData {
  formulaId: string
  formulaName: string
  username: string
  winRate: number
  totalMatches: number
  avgReturn: number
  shareUrl: string
  embedCode: string
  twitterShareUrl: string
  telegramShareUrl: string
}

// GET /api/formulas/[id]/share - Get share data for a public formula
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  // Get formula with profile
  const { data: formula, error } = await supabase
    .from('formulas')
    .select('*, profile:profiles(username)')
    .eq('id', params.id)
    .single()
  
  if (error || !formula) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Formula not found'
    }, { status: 404 })
  }
  
  if (!formula.is_public) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Formula is private'
    }, { status: 403 })
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://degenarena.com'
  const shareUrl = `${baseUrl}/f/${params.id}`
  const username = (formula.profile as any)?.username || 'Anonymous'
  
  // Create share text
  const shareText = `🎯 My "${formula.name}" formula on DegenArena HQ:\n\n` +
    `📊 Win Rate: ${formula.win_rate}%\n` +
    `🎲 Matches: ${formula.total_matches}\n` +
    `💰 Avg Return: ${formula.avg_return >= 0 ? '+' : ''}${formula.avg_return}%\n\n` +
    `Copy my formula and compete! 👇`
  
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(shareUrl)
  
  const shareData: ShareData = {
    formulaId: formula.id,
    formulaName: formula.name,
    username,
    winRate: formula.win_rate,
    totalMatches: formula.total_matches,
    avgReturn: formula.avg_return,
    shareUrl,
    embedCode: `<iframe src="${baseUrl}/embed/formula/${params.id}" width="400" height="200" frameborder="0"></iframe>`,
    twitterShareUrl: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    telegramShareUrl: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
  }
  
  return NextResponse.json<ApiResponse<ShareData>>({
    data: shareData
  })
}
