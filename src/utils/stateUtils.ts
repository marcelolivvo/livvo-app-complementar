/**
 * Helper to normalize Brazilian states and consolidate full names into 2-letter UF codes.
 * e.g. "São Paulo", "SAO PAULO", "sao paulo", "SP" -> "SP"
 * "Rio de Janeiro", "RJ" -> "RJ"
 */

const STATE_MAPPING: Record<string, string> = {
  // SP
  'SP': 'SP',
  'SAO PAULO': 'SP',
  'SÃO PAULO': 'SP',
  'ESTADO DE SAO PAULO': 'SP',
  'ESTADO DE SÃO PAULO': 'SP',

  // RJ
  'RJ': 'RJ',
  'RIO DE JANEIRO': 'RJ',
  'ESTADO DO RIO DE JANEIRO': 'RJ',

  // MG
  'MG': 'MG',
  'MINAS GERAIS': 'MG',
  'MINAS': 'MG',

  // PR
  'PR': 'PR',
  'PARANA': 'PR',
  'PARANÁ': 'PR',

  // RS
  'RS': 'RS',
  'RIO GRANDE DO SUL': 'RS',

  // SC
  'SC': 'SC',
  'SANTA CATARINA': 'SC',

  // BA
  'BA': 'BA',
  'BAHIA': 'BA',

  // DF
  'DF': 'DF',
  'DISTRITO FEDERAL': 'DF',
  'BRASILIA': 'DF',
  'BRASÍLIA': 'DF',

  // GO
  'GO': 'GO',
  'GOIAS': 'GO',
  'GOIÁS': 'GO',

  // PE
  'PE': 'PE',
  'PERNAMBUCO': 'PE',

  // CE
  'CE': 'CE',
  'CEARA': 'CE',
  'CEARÁ': 'CE',

  // ES
  'ES': 'ES',
  'ESPIRITO SANTO': 'ES',
  'ESPÍRITO SANTO': 'ES',

  // PA
  'PA': 'PA',
  'PARA': 'PA',
  'PARÁ': 'PA',

  // AM
  'AM': 'AM',
  'AMAZONAS': 'AM',

  // MT
  'MT': 'MT',
  'MATO GROSSO': 'MT',

  // MS
  'MS': 'MS',
  'MATO GROSSO DO SUL': 'MS',

  // RN
  'RN': 'RN',
  'RIO GRANDE DO NORTE': 'RN',

  // PB
  'PB': 'PB',
  'PARAIBA': 'PB',
  'PARAÍBA': 'PB',

  // MA
  'MA': 'MA',
  'MARANHAO': 'MA',
  'MARANHÃO': 'MA',

  // AL
  'AL': 'AL',
  'ALAGOAS': 'AL',

  // PI
  'PI': 'PI',
  'PIAUI': 'PI',
  'PIAUÍ': 'PI',

  // SE
  'SE': 'SE',
  'SERGIPE': 'SE',

  // RO
  'RO': 'RO',
  'RONDONIA': 'RO',
  'RONDÔNIA': 'RO',

  // TO
  'TO': 'TO',
  'TOCANTINS': 'TO',

  // AC
  'AC': 'AC',
  'ACRE': 'AC',

  // AP
  'AP': 'AP',
  'AMAPA': 'AP',
  'AMAPÁ': 'AP',

  // RR
  'RR': 'RR',
  'RORAIMA': 'RR',
};

/**
 * Normalizes any Brazilian state name or UF code to the standard 2-letter uppercase UF.
 * If not recognized, strips accents and trims.
 */
export function normalizeStateUF(rawState?: string | null): string {
  if (!rawState) return '';
  const trimmed = rawState.trim();
  if (!trimmed) return '';

  // Direct lookup
  const upper = trimmed.toUpperCase();
  if (STATE_MAPPING[upper]) {
    return STATE_MAPPING[upper];
  }

  // Remove accents and check
  const noAccents = upper.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (STATE_MAPPING[noAccents]) {
    return STATE_MAPPING[noAccents];
  }

  // If already 2 letters
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }

  return upper;
}

/**
 * Checks if two state representations refer to the same state
 */
export function isSameState(stateA?: string | null, stateB?: string | null): boolean {
  const normA = normalizeStateUF(stateA);
  const normB = normalizeStateUF(stateB);
  if (!normA && !normB) return true;
  if (!normA || !normB) return false;
  return normA === normB;
}

/**
 * Cleans a city string by removing any state / UF suffix
 * e.g., "São Paulo/SP", "São Paulo - SP", "São Paulo (SP)", "Curitiba, PR" -> "São Paulo", "Curitiba"
 * Returns only the pure city name.
 */
export function cleanCityOnly(rawCity?: string | null): string {
  if (!rawCity) return '';
  let city = rawCity.trim();
  if (!city) return '';

  // Remove (UF), e.g., "São Paulo (SP)" or "Curitiba(PR)"
  city = city.replace(/\s*\([A-Za-z]{2}\)\s*$/i, '');

  // Remove /UF, - UF, , UF, e.g., "São Paulo/SP", "São Paulo - SP", "São Paulo, SP"
  city = city.replace(/[\s/,-]+[A-Za-z]{2}\s*$/i, '');

  // Remove trailing slashes, dashes, commas
  city = city.replace(/[\s/,-]+$/, '');

  return city.trim();
}
