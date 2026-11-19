// JavaScript has no isLetter(), so Unicode classes are the reliable way to
// cover every script (not just a-z). \p{Mark} is the accent left over when
// "é" is split into "e" + "´".
const ACCENTS = /\p{Mark}/gu;
const NOT_LETTER_OR_NUMBER = /[^\p{Letter}\p{Number}]/gu;

/** "Café" → "Cafe": split letters from their accents, then drop the accents. */
export const removeAccents = (text: string) =>
  text.normalize("NFKD").replace(ACCENTS, "");

/** A name for matching across providers: "Café de Flore" → "cafedeflore". */
export const normalizePlaceName = (name: string) =>
  removeAccents(name).toLowerCase().replace(NOT_LETTER_OR_NUMBER, "");
