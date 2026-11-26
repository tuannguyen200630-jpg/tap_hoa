import { createClient } from '@/lib/supabase/server'
import { toCsv } from '@/lib/csv'

const BACKUP_TABLES = [
  'invoice_sequences',
  'purchase_sequences',
  'categories',
  'products',
  'suppliers',
  'customers',
  'purchases',
  'purchase_items',
  'sales',
  'sale_items',
  'stock_movements',
  'price_history',
  'payments',
  'settings',
] as const

type BackupTable = (typeof BACKUP_TABLES)[number]

async function fetchAllRows(supabase: Awaited<ReturnType<typeof createClient>>, table: BackupTable) {
  const rows: unknown[] = []
  const pageSize = 1000
  let from = 0

  if (table === 'invoice_sequences') {
    while (true) {
      const { data, error } = await supabase
        .from('invoice_sequences')
        .select('*')
        .order('date_key', { ascending: true })
        .range(from, from + pageSize - 1)
      if (error) throw error
      const pageRows = data || []
      rows.push(...pageRows)
      if (pageRows.length < pageSize) return rows
      from += pageSize
    }
  }

  if (table === 'purchase_sequences') {
    while (true) {
      const { data, error } = await supabase
        .from('purchase_sequences')
        .select('*')
        .order('date_key', { ascending: true })
        .range(from, from + pageSize - 1)
      if (error) throw error
      const pageRows = data || []
      rows.push(...pageRows)
      if (pageRows.length < pageSize) return rows
      from += pageSize
    }
  }

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw error
    const pageRows = data || []
    rows.push(...pageRows)
    if (pageRows.length < pageSize) return rows
    from += pageSize
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Bạn cần đăng nhập để tải bản sao lưu.' }, { status: 401 })
  }

  try {
    const tables: Array<readonly [BackupTable, unknown[]]> = []
    for (const table of BACKUP_TABLES) {
      tables.push([table, await fetchAllRows(supabase, table)])
    }
    const rows: unknown[][] = [['Tên bảng', 'Dữ liệu JSON']]
    for (const [table, records] of tables) {
      for (const record of records) rows.push([table, JSON.stringify(record)])
    }

    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())

    return new Response(toCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sao-luu-tap-hoa-${date}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error: unknown) {
    console.error('Lỗi tạo bản sao lưu dữ liệu:', error)
    return Response.json({ error: 'Không tạo được bản sao lưu. Vui lòng thử lại.' }, { status: 500 })
  }
}
