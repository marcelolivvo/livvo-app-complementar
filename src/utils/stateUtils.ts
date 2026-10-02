export function cleanCityOnly(city?: string | null): string {
  if (!city) return 'Brasil';
  return city.trim().replace(/\s*-\s*[A-Z]{2}$/i, '');
}

export function getStateAbbreviation(state?: string | null): string {
  return normalizeStateUF(state);
}

const BRAZIL_STATES: Record<string, string> = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  distritofederal: 'DF',
  espiritosanto: 'ES',
  goias: 'GO',
  maranhao: 'MA',
  matogrosso: 'MT',
  matogrossodosul: 'MS',
  minasgerais: 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  riodejaneiro: 'RJ',
  riograndedonorte: 'RN',
  riograndedosul: 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  santacatarina: 'SC',
  saopaulo: 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
};

const VALID_UFS = new Set(Object.values(BRAZIL_STATES));

export function normalizeStateUF(state?: string | null): string {
  if (!state) return '';
  const trimmed = state.trim();
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && VALID_UFS.has(upper)) {
    return upper;
  }
  const clean = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');

  if (BRAZIL_STATES[clean]) {
    return BRAZIL_STATES[clean];
  }

  // Fallback to first two letters uppercase if it's 2 chars
  if (upper.length === 2) {
    return upper;
  }
  return upper.slice(0, 2);
}

export function isSameState(s1?: string | null, s2?: string | null): boolean {
  if (!s1 || !s2) return false;
  const u1 = normalizeStateUF(s1);
  const u2 = normalizeStateUF(s2);
  if (u1 && u2) return u1 === u2;
  return s1.trim().toLowerCase() === s2.trim().toLowerCase();
}
