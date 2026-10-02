export interface ShowItem {
  id: string; // Unique internal ID
  showCode: string; // Unique show code (e.g. COD_SHOW)
  artistCode: string; // Unique artist code (e.g. COD_ARTISTA)
  artistName: string;
  venue: string; // Local do show
  date: string; // Dia do show
  city: string; // Cidade
  state: string; // Estado (UF)
  posterUrl?: string; // Pôster / Flyer oficial do evento / turnê
  tourName?: string; // Nome da Turnê (ex: 'Turnê Tardezinha', 'Numanice Tour')
  photoUrl?: string;
}

export interface ArtistItem {
  artistCode: string;
  artistName: string;
  photoUrl?: string;
  photoSource?: 'upload' | 'url' | 'sample' | 'auto';
  featuredPosterUrl?: string;
  showsCount: number;
  updatedAt?: number;
  name?: string;
  code?: string;
}

export type CardTemplateId = 'modern-stage' | 'festival-bold' | 'minimal-editorial' | 'neon-tour' | 'ticket-pass';

export type AspectRatio = '9:16' | '1:1' | '4:5' | '16:9';

export type VisualMode = 'artist-photo' | 'show-poster';

export type CardFontSize = 'small' | 'medium' | 'large';
export type ArtistNamePosition = 'top' | 'middle' | 'bottom';
export type CardFontFamily = 'sans' | 'impact' | 'serif' | 'mono' | 'vintage';
export type CollectorRarity = 'classic' | 'gold' | 'platinum' | 'diamond' | 'legendary';

export interface CardTemplateConfig {
  templateId: CardTemplateId;
  aspectRatio: AspectRatio;
  visualMode?: VisualMode; // Toggle between artist portrait & official show poster/flyer
  fontSize?: CardFontSize; // 'small' | 'medium' | 'large' (default 'large')
  artistNamePosition?: ArtistNamePosition; // 'top' | 'middle' | 'bottom' (default 'bottom')
  fontFamily?: CardFontFamily; // 'sans' | 'impact' | 'serif' | 'mono' | 'vintage'
  accentColor: string; // e.g. #2FB8BA (Teal), #22E3E6 (Cyan)
  tagline: string; // e.g. "SHOW OFICIAL", "AO VIVO"
  showShowCode: boolean;
  showUserHandle: boolean; // Replaces Artist ID with @nomedousuario
  userHandle: string; // e.g. "@toboi"
  showLocationBadge: boolean;
  showVenueBadge?: boolean; // Box da Casa de Show com mesmo tamanho
  showDateHighlight: boolean;
  contrastOverlay: number; // 0 to 100
  customBadgeText: string; // e.g. "INGRESSO VERIFICADO" or "EU FUI"
  customLogoUrl?: string;
  // Novel visual effects & fan features
  photoFilter?: 'none' | 'noir' | 'duotone' | 'grain' | 'vibrant' | 'cyber';
  stampType?: 'none' | 'verified' | 'eu-fui' | 'countdown' | 'vip' | 'saudade' | 'historico';
  showHologram?: boolean;
  favoriteSong?: string;
  phoneMockup?: boolean;
  // Category 1: Gamificação & Colecionador
  showCollectorBadge?: boolean;
  collectorEdition?: string; // ex: '#042'
  collectorRarity?: CollectorRarity;
  // Category 3: Conteúdo & Memória do Show
  ticketSector?: string; // 'Pista Premium' | 'Grade' | 'Camarote VIP' | 'Pista' | 'Cadeira'
  companionHandle?: string; // ex: '@mariana'
  setlistHighlights?: string; // ex: 'Céu Azul • Zoio de Lula'
}

export interface ColumnMapping {
  showCode: string;
  artistCode: string;
  artistName: string;
  venue: string;
  date: string;
  city: string;
  state: string;
  photoUrl?: string;
  posterUrl?: string;
  tourName?: string;
}

export interface ParseProgress {
  totalRows: number;
  processedRows: number;
  status: 'idle' | 'parsing' | 'saving' | 'completed' | 'error';
  errorMessage?: string;
}

export interface ImageMatchResult {
  fileName: string;
  matchedBy: 'code' | 'name' | 'none';
  artistCode?: string;
  artistName?: string;
  status: 'success' | 'failed';
}
