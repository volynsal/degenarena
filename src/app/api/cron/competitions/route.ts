import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Competition management cron job
 * - Updates competition statuses (upcoming → active → completed)
 * - Links new token matches to competition entries
 * - Calculates results and rankings when competitions end
 * - Creates recurring competitions (daily, weekly)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const now = new Date()
  const results = {
    statusUpdates: { started: 0, ended: 0 },
    matchesLinked: 0,
    competitionsCreated: 0,
    errors: [] as string[],
  }
  
  try {
    console.log('🏆 Starting competition cron job...')
    
    // 1. Update competition statuses
    // Mark upcoming competitions as active
    const { data: toStart, error: startError } = await supabaseAdmin
      .from('competitions')
      .update({ status: 'active', updated_at: now.toISOString() })
      .eq('status', 'upcoming')
      .lte('starts_at', now.toISOString())
      .select('id, name')
    
    if (startError) {
      results.errors.push(`Start error: ${startError.message}`)
    } else if (toStart) {
      results.statusUpdates.started = toStart.length
      console.log(`▶️ Started ${toStart.length} competitions`)
    }
    
    // Get competitions that just ended
    const { data: toEnd, error: endFetchError } = await supabaseAdmin
      .from('competitions')
      .select('id, name')
      .eq('status', 'active')
      .lte('ends_at', now.toISOString())
    
    if (endFetchError) {
      results.errors.push(`End fetch error: ${endFetchError.message}`)
    }
    
    // 2. Link new token matches to active competition entries
    // Get all active competition entries
    const { data: activeEntries, error: entriesError } = await supabaseAdmin
      .from('competition_entries')
      .select(`
        id,
        competition_id,
        formula_id,
        competitions!inner(starts_at, ends_at, status)
      `)
      .eq('status', 'active')
      .eq('competitions.status', 'active')
    
    if (entriesError) {
      results.errors.push(`Entries error: ${entriesError.message}`)
    } else if (activeEntries) {
      // For each entry, find new token matches that occurred during the competition
      for (const entry of activeEntries) {
        const competition = entry.competitions as any
        
        // Get token matches for this formula that occurred during competition
        const { data: matches, error: matchError } = await supabaseAdmin
          .from('token_matches')
          .select('id, return_24h, is_win')
          .eq('formula_id', entry.formula_id)
          .gte('matched_at', competition.starts_at)
          .lte('matched_at', competition.ends_at)
        
        if (matchError) {
          results.errors.push(`Match error for entry ${entry.id}: ${matchError.message}`)
          continue
        }
        
        // Link any matches that aren't already linked
        for (const match of matches || []) {
          const { error: linkError } = await supabaseAdmin
            .from('competition_matches')
            .upsert({
              competition_id: entry.competition_id,
              entry_id: entry.id,
              token_match_id: match.id,
              return_24h: match.return_24h,
              is_win: match.is_win,
            }, {
              onConflict: 'entry_id,token_match_id',
              ignoreDuplicates: true,
            })
          
          if (!linkError) {
            results.matchesLinked++
          }
        }
      }
      
      console.log(`🔗 Linked ${results.matchesLinked} matches to competition entries`)
    }
    
    // 3. Finalize ended competitions
    if (toEnd && toEnd.length > 0) {
      for (const competition of toEnd) {
        console.log(`🏁 Finalizing competition: ${competition.name}`)
        
        // Call the finalize function for each competition
        const { error: finalizeError } = await supabaseAdmin.rpc(
          'finalize_competition',
          { p_competition_id: competition.id }
        )
        
        if (finalizeError) {
          results.errors.push(`Finalize error for ${competition.name}: ${finalizeError.message}`)
          
          // Fallback: just mark as completed
          await supabaseAdmin
            .from('competitions')
            .update({ status: 'completed', updated_at: now.toISOString() })
            .eq('id', competition.id)
        }
        
        results.statusUpdates.ended++
      }
      
      console.log(`✅ Ended ${results.statusUpdates.ended} competitions`)
    }
    
    // 4. Create recurring competitions if needed
    // Check if we need to create tomorrow's daily flip
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0) // 8am UTC
    
    const { data: existingDaily } = await supabaseAdmin
      .from('competitions')
      .select('id')
      .eq('type', 'daily_flip')
      .gte('starts_at', tomorrow.toISOString())
      .lt('starts_at', new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .single()
    
    if (!existingDaily) {
      const dayAfter = new Date(tomorrow)
      dayAfter.setDate(dayAfter.getDate() + 1)
      
      const { error: createDailyError } = await supabaseAdmin
        .from('competitions')
        .insert({
          name: '24-Hour Flip Challenge',
          description: 'Find the best performing token in 24 hours. Highest total return wins!',
          type: 'daily_flip',
          status: 'upcoming',
          starts_at: tomorrow.toISOString(),
          ends_at: dayAfter.toISOString(),
          prizes: { '1st': 'daily_champion', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
        })
      
      if (!createDailyError) {
        results.competitionsCreated++
        console.log('📅 Created tomorrow\'s daily flip competition')
      }
    }
    
    // Check if we need to create next week's weekly competition
    const nextMonday = new Date(now)
    nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7))
    nextMonday.setHours(8, 0, 0, 0)
    
    const { data: existingWeekly } = await supabaseAdmin
      .from('competitions')
      .select('id')
      .eq('type', 'weekly')
      .gte('starts_at', nextMonday.toISOString())
      .lt('starts_at', new Date(nextMonday.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .single()
    
    if (!existingWeekly) {
      const weekAfter = new Date(nextMonday)
      weekAfter.setDate(weekAfter.getDate() + 7)
      
      const { error: createWeeklyError } = await supabaseAdmin
        .from('competitions')
        .insert({
          name: 'Weekly Formula Showdown',
          description: 'A week-long battle of formulas. Consistency is key - accumulate the best returns over 7 days.',
          type: 'weekly',
          status: 'upcoming',
          starts_at: nextMonday.toISOString(),
          ends_at: weekAfter.toISOString(),
          min_participants: 5,
          prizes: { '1st': 'weekly_champion', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
        })
      
      if (!createWeeklyError) {
        results.competitionsCreated++
        console.log('📅 Created next week\'s weekly competition')
      }
    }
    
    console.log('🏆 Competition cron job complete:', results)
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    })
  } catch (error) {
    console.error('❌ Competition cron job error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...results,
    }, { status: 500 })
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
