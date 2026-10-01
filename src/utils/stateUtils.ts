export function cleanCityOnly(city?: string | null): string {
  if (!city) return 'Brasil';
  return city.trim().replace(/\s*-\s*[A-Z]{2}$/i, '');
}

export function getStateAbbreviation(state?: string | null): string {
  if (!state) return '';
  return state.trim().toUpperCase().substring(0, 2);
}
