export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function validatePhotoInput(input: { mimeType: string; size: number; catchId?: string; year?: number }) {
  if (!PHOTO_MIME_TYPES.includes(input.mimeType as (typeof PHOTO_MIME_TYPES)[number])) return "invalid_type" as const;
  if (input.size <= 0 || input.size > PHOTO_MAX_BYTES) return "invalid_size" as const;
  if (Boolean(input.catchId) === Boolean(input.year)) return "invalid_target" as const;
  if (input.year !== undefined && (!Number.isInteger(input.year) || input.year < 2011 || input.year > 2100)) return "invalid_year" as const;
  return null;
}
