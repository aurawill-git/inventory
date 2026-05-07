import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabase.from('Settings').select('*')
    if (error) throw error
    const result: Record<string, string> = {}
    for (const s of data || []) result[s.key] = s.value
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const results = []
    for (const [key, value] of Object.entries(body)) {
      const { data, error } = await supabase
        .from('Settings')
        .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' })
        .select()
        .single()
      if (error) throw error
      results.push(data)
    }
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
