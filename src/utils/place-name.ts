/**
 * Normalize a place name for cross-provider matching: strip accents, case,
 * punctuation and whitespace ("Café de Flore" → "cafedeflore").
 */
export const normalizePlaceName = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
