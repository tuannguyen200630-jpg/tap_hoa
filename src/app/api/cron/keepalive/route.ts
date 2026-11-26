import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!cronSecret || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Máy chủ chưa được cấu hình đầy đủ' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { error } = await supabase.from('settings').select('id').limit(1)
    if (error) {
      console.error('Tác vụ giữ kết nối cơ sở dữ liệu thất bại:', error)
      return NextResponse.json({ error: 'Không kết nối được cơ sở dữ liệu' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Lỗi trong tác vụ giữ kết nối cơ sở dữ liệu:', err)
    return NextResponse.json({ error: 'Lỗi kết nối cơ sở dữ liệu' }, { status: 500 })
  }
}
