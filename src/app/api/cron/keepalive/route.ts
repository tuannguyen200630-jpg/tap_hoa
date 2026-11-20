import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.from('settings').select('id').limit(1)
    
    if (error) {
      // Table may not exist yet, that's ok - the connection itself keeps the DB alive
      console.log('Keepalive ping completed (table may not exist yet)')
    }

    return NextResponse.json({ 
      ok: true, 
      timestamp: new Date().toISOString() 
    })
  } catch (err) {
    console.error('Keepalive error:', err)
    return NextResponse.json({ error: 'Lỗi kết nối database' }, { status: 500 })
  }
}
