export function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function matchesSearch(
  query: string,
  ...fields: (string | null | undefined)[]
): boolean {
  const keywords = normalizeText(query).split(' ').filter(Boolean)
  if (keywords.length === 0) return true

  const normalizedFields = fields
    .filter((field): field is string => field != null)
    .map(normalizeText)

  return keywords.every((keyword) =>
    normalizedFields.some((field) => field.includes(keyword))
  )
}
