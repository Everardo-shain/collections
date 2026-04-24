/**
 * SHARED COLLECTION UTILITIES
 * Tipos y funciones comunes a todas las colecciones (football, music, etc.)
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

export interface FilterState {
  [key: string]: string[];
}

export type CombinationPart = {
  text: string;
  fieldKey?: string;
};

export type CombinationResult = {
  parts: CombinationPart[];
  fullLink?: boolean;
};

export type CustomFilter = {
  label: string;
  filter: keyof CollectionItem;
  getValues: (item: CollectionItem, config: CustomFilter) => string[];
};

export type NavChild = { label: string } & Record<string, string>;
export type NavGroup = { label: string; children: NavChild[] };

export type SortOption = 'default' | 'newest' | 'oldest';

export interface SortConfig {
  label: string;
  compare: (a: CollectionItem, b: CollectionItem) => number;
}

// ==========================================
// CONSTANTES COMPARTIDAS
// ==========================================

export const VALUE_SEPARATOR = " | ";
export const NO_SPLIT_FIELDS = ["displayName", "id"];

// ==========================================
// HELPERS DE STRING / VALIDACIÓN
// ==========================================

export function valid(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v !== "-" && v !== "" && v !== "none" && v !== "n/a";
}

export function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, "-");
}

export function getDynamicValue(item: CollectionItem, key: string): string {
  let value = item[key as keyof CollectionItem];
  if (value === undefined) {
    const camelKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof CollectionItem;
    value = item[camelKey];
  }
  return typeof value === "string" ? value : "";
}

export function formatDisplayValue(key: string, value: string): string {
  const lowerKey = key.toLowerCase();
  if (NO_SPLIT_FIELDS.includes(lowerKey) || !valid(value)) return value;
  return value
    .split(VALUE_SEPARATOR)
    .map(part => part.trim())
    .filter(Boolean)
    .join(" · ");
}

// ==========================================
// HELPERS DE BÚSQUEDA (Levenshtein, etc.)
// ==========================================

export const cleanText = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

export const isMatch = (itemValue: string, searchWords: string[]) => {
  const normalizedValue = cleanText(itemValue);
  const itemParts = normalizedValue.split(" ");
  return searchWords.every(word => {
    if (normalizedValue.includes(word)) return true;
    return itemParts.some(part => {
      if (word.length <= 3) return part === word;
      const distance = getLevenshteinDistance(word, part);
      const maxErrors = word.length <= 6 ? 1 : 2;
      return distance <= maxErrors;
    });
  });
};

// ==========================================
// FACTORY: mapItem
// ==========================================

// Carga global de imágenes (todas las colecciones comparten la carpeta /images)
const allImages = import.meta.glob("@/assets/images/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: 'default'
});
const imagePaths = Object.values(allImages) as string[];

/**
 * Crea una función mapItem ligada a un FIELD_MAP específico de colección.
 */
export function createMapItem(FIELD_MAP: Record<string, string>) {
  return function mapItem(raw: Record<string, string>): CollectionItem {
    const idKeyInJSON = FIELD_MAP.id;
    const id = raw[idKeyInJSON]?.trim() || "";

    const fields: any = {};
    Object.entries(FIELD_MAP).forEach(([camelKey, jsonName]) => {
      fields[camelKey] = raw[jsonName]?.trim() || "";
    });

    const matchingImages = imagePaths
      .filter((path) => {
        const fileName = path.split('/').pop() || "";
        return fileName.startsWith(`${id}_`);
      })
      .sort();

    return {
      ...fields,
      id,
      image: matchingImages.length > 0 ? matchingImages[0] : "/src/assets/images/placeholder.jpg",
      images: matchingImages,
    };
  };
}

// ==========================================
// FACTORY: getIndex (para sort por listas ordenadas)
// ==========================================

export function createGetIndex(FIELD_MAP: Record<string, string>, listsData: Record<string, string[]>) {
  return function getIndex(value: string | undefined, fieldKey: string) {
    if (!valid(value)) return Infinity;
    const jsonColumnName = FIELD_MAP[fieldKey] || fieldKey;
    const orderArray = listsData[jsonColumnName] || [];
    const valToSearch = value?.toLowerCase() || "";
    const index = orderArray.findIndex(item => item.toLowerCase() === valToSearch);
    return index === -1 ? Infinity : index;
  };
}

// ==========================================
// FACTORY: SORT_CONFIG
// ==========================================

export function createSortConfig(getIndex: (v: string | undefined, k: string) => number): Record<SortOption, SortConfig> {
  const defaultCompare = (a: CollectionItem, b: CollectionItem) => a.id.localeCompare(b.id);
  return {
    default: { label: 'Default', compare: defaultCompare },
    newest: {
      label: 'Season Newest',
      compare: (a, b) => {
        const posA = getIndex(a.season, 'season');
        const posB = getIndex(b.season, 'season');
        if (posA === Infinity || posB === Infinity) return posA - posB;
        const diff = posA - posB;
        return diff !== 0 ? diff : defaultCompare(a, b);
      },
    },
    oldest: {
      label: 'Season Oldest',
      compare: (a, b) => {
        const posA = getIndex(a.season, 'season');
        const posB = getIndex(b.season, 'season');
        if (posA === Infinity || posB === Infinity) return posA - posB;
        const diff = posB - posA;
        return diff !== 0 ? diff : defaultCompare(a, b);
      },
    },
  };
}

// ==========================================
// FACTORY: generateNavGroups
// ==========================================

export function createGenerateNavGroups(
  hierarchy: readonly string[],
  getIndex: (v: string | undefined, k: string) => number
) {
  return (items: CollectionItem[]): NavGroup[] => {
    const [parentKey, childKey] = hierarchy;

    const map = items.reduce((acc, item) => {
      const parentVal = getDynamicValue(item, parentKey);
      const childVal = getDynamicValue(item, childKey);
      if (valid(parentVal) && valid(childVal)) {
        if (!acc[parentVal]) acc[parentVal] = new Set<string>();
        acc[parentVal].add(childVal);
      }
      return acc;
    }, {} as Record<string, Set<string>>);

    return Object.entries(map)
      .map(([parentLabel, childrenSet]) => ({
        label: parentLabel,
        children: Array.from(childrenSet)
          .sort((a, b) => {
            const posA = getIndex(a, childKey);
            const posB = getIndex(b, childKey);
            return posA === posB ? a.localeCompare(b) : posA - posB;
          })
          .map(childLabel => {
            const child: any = { label: childLabel };
            child[parentKey] = parentLabel;
            child[childKey] = childLabel;
            return child as NavChild;
          }),
      }))
      .sort((a, b) => {
        const posA = getIndex(a.label, parentKey);
        const posB = getIndex(b.label, parentKey);
        return posA === posB ? a.label.localeCompare(b.label) : posA - posB;
      });
  };
}
