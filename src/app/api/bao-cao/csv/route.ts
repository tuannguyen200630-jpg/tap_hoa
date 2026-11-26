import { createClient } from '@/lib/supabase/server'
import { getCachedStoreReport, getReportDateRange, type ReportDateRange } from '@/lib/reporting'
import { formatDate } from '@/lib/codes'
import { toCsv } from '@/lib/csv'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Bạn cần đăng nhập để tải báo cáo.' }, { status: 401 })
  }
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session || session.user.id !== user.id) {
    return Response.json({ error: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
  }

  const url = new URL(request.url)
  let range: ReportDateRange
  try {
    range = getReportDateRange('custom', {
      from: url.searchParams.get('from') || undefined,
      to: url.searchParams.get('to') || undefined,
    })
  } catch (error: unknown) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Khoảng ngày không hợp lệ.',
    }, { status: 400 })
  }

  try {
    const report = await getCachedStoreReport({
      userId: user.id,
      accessToken: session.access_token,
    }, range)
    const rows: unknown[][] = [[
      'Loại dữ liệu',
      'Ngày hoặc khoảng ngày',
      'Mã hàng',
      'Tên hàng',
      'Đơn vị',
      'Số lượng',
      'Doanh thu',
      'Lãi gộp',
      'Số hóa đơn',
      'Còn trong kho',
      'Ngưỡng cảnh báo',
      'Hạn dùng',
    ]]

    rows.push([
      'Tổng hợp',
      `${formatDate(new Date(`${range.from}T12:00:00+07:00`))} - ${formatDate(new Date(`${range.to}T12:00:00+07:00`))}`,
      '',
      '',
      '',
      '',
      report.summary.revenue,
      report.summary.gross_profit,
      report.summary.invoice_count,
      '',
      '',
      '',
    ])
    report.daily.forEach((day) => rows.push([
      'Theo ngày',
      formatDate(new Date(`${day.date}T12:00:00+07:00`)),
      '',
      '',
      '',
      '',
      day.revenue,
      day.gross_profit,
      day.invoice_count,
      '',
      '',
      '',
    ]))
    report.top_products.forEach((product) => rows.push([
      'Hàng bán chạy',
      '',
      product.code,
      product.name,
      product.unit,
      product.quantity,
      product.revenue,
      '',
      '',
      '',
      '',
      '',
    ]))
    report.slow_products.forEach((product) => rows.push([
      'Hàng ít bán',
      '',
      product.code,
      product.name,
      product.unit,
      product.quantity,
      product.revenue,
      '',
      '',
      '',
      '',
      '',
    ]))
    rows.push(['Giá trị hàng còn trong kho', '', '', '', '', '', report.stock_value, '', '', '', '', ''])
    report.low_stock.forEach((product) => rows.push([
      'Hàng sắp hết',
      '',
      product.code,
      product.name,
      product.unit,
      '',
      '',
      '',
      '',
      product.stock,
      product.warning_threshold,
      '',
    ]))
    report.near_expiry.forEach((product) => rows.push([
      'Hàng sắp hết hạn',
      '',
      product.code,
      product.name,
      product.unit,
      '',
      '',
      '',
      '',
      product.stock,
      '',
      formatDate(new Date(`${product.expiry_date}T12:00:00+07:00`)),
    ]))

    const filename = `bao-cao-${range.from}-${range.to}.csv`
    return new Response(toCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error: unknown) {
    console.error('Lỗi xuất báo cáo CSV:', error)
    return Response.json({ error: 'Không xuất được báo cáo. Vui lòng thử lại.' }, { status: 500 })
  }
}
