export interface CollectionItem {
  id: string;
  displayName: string;
  category: string;
  product: string;
  entity: string;
  team: string;
  season: string;
  competition: string;
  country: string;
  confederation: string;
  brand: string;
  style: string;
  release: string;
  technology: string;
  size: string;
  sleeves: 'Short' | 'Long';
  print: string;
  nameset: string;
  patch: string;
  packaging: string;
  signature: string;
  collaboration: string;
  image: string;
  images?: string[];
}

export type FilterKey =
  | 'teamType'
  | 'confederation'
  | 'country'
  | 'competition'
  | 'team'
  | 'season'
  | 'style'
  | 'release'
  | 'brand'
  | 'technology'
  | 'size';

export type DetailFilterKey =
  | 'longSleeves'
  | 'printed'
  | 'withPatches'
  | 'signed'
  | 'inBox'
  | 'collaboration';

export interface FilterState {
  [key: string]: string[];
}

export interface DetailFilterState {
  [key: string]: boolean;
}

export function getTeamType(entity: string): string {
  const lower = entity.toLowerCase();
  if (lower.includes('national')) return 'National Team';
  if (lower.includes('collective')) return 'Collective';
  return 'Club';
}

export function deriveDetailFilter(item: CollectionItem, key: DetailFilterKey): boolean {
  switch (key) {
    case 'longSleeves': return item.sleeves === 'Long';
    case 'printed': return item.print !== '' && item.print !== 'None';
    case 'withPatches': return item.patch !== '' && item.patch !== 'None';
    case 'signed': return item.signature !== '' && item.signature !== 'None';
    case 'inBox': return item.packaging !== '' && item.packaging !== 'None';
    case 'collaboration': return item.collaboration !== '' && item.collaboration !== 'None';
  }
}
