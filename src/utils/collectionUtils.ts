/**
 * SHARED COLLECTION UTILITIES
 */

// ==========================================
// TIPOS BASE
// ==========================================
export interface CollectionItem {
  id: string;
  displayName: string;
  image: string;
  images: string[];
  [key: string]: any;
}

export interface FilterState { [key: string]: string[]; }
export type CombinationPart = { text: string; fieldKey?: string; };
export type CombinationResult = { parts: CombinationPart[]; fullLink?: boolean; };
export type CustomFilter = { label: string; filter: keyof CollectionItem; getValues: (item: CollectionItem, config: CustomFilter) => string[]; };
export type NavChild = { label: string } & Record<string, string>;
export type NavGroup = { label: string; children: NavChild[] };
export type SortOption = 'default' | 'newest' | 'oldest';
export interface SortConfig { label: string; compare: (a: CollectionItem, b: CollectionItem) => number; }


// ==========================================
// HELPERS DE STRING / VALIDACIÓN
// ==========================================
export function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, "-");
}

export function getDynamicValue(item: CollectionItem, key: string): string {
  let value = item[key];
  if (value === undefined) {
    const camelKey = (key.charAt(0).toLowerCase() + key.slice(1));
    value = item[camelKey];
  }
  return typeof value === "string" ? value : "";
}

// ==========================================
// HELPERS DE BÚSQUEDA
// ==========================================
export const cleanText = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
};

export const isMatch = (itemValue: string, search: string | string[]): boolean => {
  const normalizedValue = cleanText(itemValue);
  const itemParts = normalizedValue.split(/\s+/).filter(Boolean);
  const searchWords = Array.isArray(search) ? search : cleanText(search).split(/\s+/).filter(Boolean);
  if (searchWords.length === 0) return true;
  return searchWords.every(word => {
    if (normalizedValue.includes(word)) return true;
    return itemParts.some(part => {
      if (word.length <= 3) return part === word;
      const distance = getLevenshteinDistance(word, part);
      return distance <= (word.length <= 6 ? 1 : 2);
    });
  });
};

// ==========================================
// FACTORIES (MOTOR DINÁMICO)
// ==========================================
const allImages = import.meta.glob("@/assets/images/*.{jpg,jpeg,png,webp}", { eager: true, import: 'default' });
const imagePaths = Object.values(allImages) as string[];

export function createMapItem(FIELD_MAP: Record<string, string>) {
  return function mapItem(raw: Record<string, string>): CollectionItem {
    const id = raw[FIELD_MAP.id]?.trim() || "";
    const fields: any = {};
    Object.entries(FIELD_MAP).forEach(([camelKey, jsonName]) => { fields[camelKey] = raw[jsonName]?.trim() || ""; });
    const images = imagePaths.filter(path => (path.split('/').pop() || "").startsWith(`${id}_`)).sort();
    return { ...fields, id, image: images[0] || "/src/assets/images/placeholder.jpg", images };
  };
}

export function createGetIndex(FIELD_MAP: Record<string, string>, listsData: Record<string, string[]>, validFn: (v: any) => boolean) {
  return function getIndex(value: string | undefined, fieldKey: string) {
    if (!validFn(value)) return Infinity;
    const orderArray = listsData[FIELD_MAP[fieldKey] || fieldKey] || [];
    const index = orderArray.findIndex(item => item.toLowerCase() === value?.toLowerCase());
    return index === -1 ? Infinity : index;
  };
}

export function createGenerateNavGroups(hierarchy: readonly string[], getIndex: (v: string | undefined, k: string) => number, validFn: (v: any) => boolean) {
  return (items: CollectionItem[]): NavGroup[] => {
    const [parentKey, childKey] = hierarchy;
    const map = items.reduce((acc, item) => {
      const pVal = getDynamicValue(item, parentKey);
      const cVal = getDynamicValue(item, childKey);
      if (validFn(pVal) && validFn(cVal)) {
        if (!acc[pVal]) acc[pVal] = new Set<string>();
        acc[pVal].add(cVal);
      }
      return acc;
    }, {} as Record<string, Set<string>>);

    return Object.entries(map).map(([pLabel, cSet]) => ({
      label: pLabel,
      children: Array.from(cSet).sort((a, b) => {
        const posA = getIndex(a, childKey); const posB = getIndex(b, childKey);
        return posA === posB ? a.localeCompare(b) : posA - posB;
      }).map(cLabel => {
        const child: any = { label: cLabel };
        child[parentKey] = pLabel; child[childKey] = cLabel;
        return child as NavChild;
      }),
    })).sort((a, b) => {
      const posA = getIndex(a.label, parentKey); const posB = getIndex(b.label, parentKey);
      return posA === posB ? a.label.localeCompare(b.label) : posA - posB;
    });
  };
}