function csvCell(value: unknown): string {
  const text = value !== null && typeof value === 'object'
    ? JSON.stringify(value)
    : String(value ?? '')

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: readonly (readonly unknown[])[]): string {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}
