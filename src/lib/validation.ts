import { z } from 'zod'

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function uuidSchema(message?: string) {
  return z.string().regex(UUID_REGEX, message)
}

export const DatabaseNumberSchema = z
  .union([z.number(), z.string()])
  .pipe(z.coerce.number<string | number>().refine(Number.isFinite))
