export function normalizeArtistKey(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function isDateString(val?: string | null): boolean {
  if (!val) return false;
  return /\b(19\d{2}|20\d{2})\b/.test(val) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(val);
}
