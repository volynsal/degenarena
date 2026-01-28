import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// Service role client to bypass RLS
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/clans/[slug]/upload - Upload clan logo
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient()
  const serviceClient = getServiceClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  // Get clan and verify user is an owner
  const { data: clan, error: fetchError } = await serviceClient
    .from('clans')
    .select('id')
    .eq('slug', params.slug)
    .single()
  
  if (fetchError || !clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  // Check if user is an owner
  const { data: membership } = await serviceClient
    .from('clan_members')
    .select('role')
    .eq('clan_id', clan.id)
    .eq('user_id', session.user.id)
    .single()
  
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Only clan owners can update the logo'
    }, { status: 403 })
  }
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'No file provided'
      }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP'
      }, { status: 400 })
    }
    
    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'File too large. Maximum size is 2MB'
      }, { status: 400 })
    }
    
    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png'
    const filename = `${clan.id}/${Date.now()}.${ext}`
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceClient
      .storage
      .from('clan-logos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json<ApiResponse<null>>({
        error: 'Failed to upload image: ' + uploadError.message
      }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = serviceClient
      .storage
      .from('clan-logos')
      .getPublicUrl(filename)
    
    // Update clan with new logo URL
    const { error: updateError } = await serviceClient
      .from('clans')
      .update({ 
        logo_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', clan.id)
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json<ApiResponse<null>>({
        error: 'Failed to update clan logo'
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<{ logo_url: string }>>({
      data: { logo_url: publicUrl },
      message: 'Logo uploaded successfully'
    })
    
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json<ApiResponse<null>>({
      error: error.message || 'Failed to upload image'
    }, { status: 500 })
  }
}
