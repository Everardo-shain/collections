/**
 * MUSIC COLLECTION CONFIGURATION
 */

import rawDataJson from "@/data/json_files/music_collection - Collection.json";
import listsDataJson from '@/data/json_files/music_collection - Lists.json';
import {
  CollectionItem,
  CombinationPart,
  CombinationResult,
  CustomFilter,
  createGenerateNavGroups,
  createGetIndex,
  createMapItem,
  SortOption,
  SortConfig,
} from "@/utils/collectionUtils";

export const rawData = rawDataJson as Record<string, string>[];
export const listsData = listsDataJson as Record<string, string[]>;
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/') 
  ? import.meta.env.BASE_URL 
  : `${import.meta.env.BASE_URL}/`;

// ==========================================
// 1. METADATOS Y MAPEO
// ==========================================

export const metadata = {
  id: "music",
  title: "Everardo´s Music Collection",
  description: `Personal music collection showcase featuring records, apparel, and memorabilia.`,
  ogImage: `${BASE_PATH}site/og-image.png`,
  lightAccentColor: "221 83% 45%",
  darkAccentColor: "200 95% 60%",
  logo: `${BASE_PATH}site/music-logo.svg`,
  favIcon: `${BASE_PATH}site/favicon.png`,
  itemCount: rawData.length,
  imageFolder: "music",
} as const;


export const FIELD_MAP = {
  id: "ID",
  displayName: "Display Name",
  category: "Category",
  product: "Product",
  format: "Format",
  artist: "Artist",
  title: "Title",
  label: "Label",
  genre: "Genre",
  year: "Year",
  style: "Style",
  color: "Color",
  configuration: "Configuration",
  packaging: "Packaging",
  signedBy: "Signed By",
  numbered: "Numbered",
  discogs: "Discogs",
  notes: "Notes",
} as const;

// ==========================================
// 2. CONSTANTES DE FORMATO Y VALIDACIÓN
// ==========================================
export const VALUE_SEPARATOR = " | ";
export const NO_SPLIT_FIELDS = ["displayName", "id", "notes"];

/** Define qué valores se consideran "vacíos" o "inválidos" para esta colección */
export function valid(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v !== "-" && v !== "" && v !== "none" && v !== "n/a";
}

/** Formateador visual para Breadcrumbs y Títulos */
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
// 3. ORDENAMIENTO (SORTING)
// ==========================================
const defaultCompare = (a: CollectionItem, b: CollectionItem) => a.id.localeCompare(b.id);

export const SORT_CONFIG: Record<SortOption, SortConfig> = {
  default: { label: 'Default', compare: defaultCompare },
  newest: {
    label: 'Year Newest',
    compare: (a, b) => {
      const posA = getIndex(a.year, 'year');
      const posB = getIndex(b.year, 'year');
      if (posA === Infinity || posB === Infinity) return posA - posB;
      const diff = posA - posB;
      return diff !== 0 ? diff : defaultCompare(a, b);
    },
  },
  oldest: {
    label: 'Year Oldest',
    compare: (a, b) => {
      const posA = getIndex(a.year, 'year');
      const posB = getIndex(b.year, 'year');
      if (posA === Infinity || posB === Infinity) return posA - posB;
      const diff = posB - posA;
      return diff !== 0 ? diff : defaultCompare(a, b);
    },
  },
};

// ==========================================
// 4. ESTRUCTURA DE NAVEGACIÓN
// ==========================================
export const NAVIGATION_CONFIG = { hierarchy: ["category", "product"] as const } as const;
export const NAVIGATION_BREADCRUMB = [...NAVIGATION_CONFIG.hierarchy] as string[];

// ==========================================
// 5. CONFIGURACIÓN DE BREADCRUMBS
// ==========================================
export const BREADCRUMB_KEYS: readonly string[] = []; 
export const BREADCRUMB_HIDDEN: readonly string[] = [];

export const breadcrumbConfig: Record<string, string[]> = {
  "default": ["label", "artist", "year"],
};

export const BREADCRUMB_LABELS: Record<string, Record<string, string>> = {
// "Team | National Team": { team: " National Team" },
// "Team | Club": { country: " Clubs" },
// "Team | Collective": { country: " Collective Teams" },
};

export const TITLE_FORMATTERS: Record<string, (last: any, all: any[], compositeKey?: string) => string> = {
year: (last, all) => {
if (all.length > 1) {
const penultimate = all[all.length - 2];
return `${last.label} ${penultimate.label}`;
}
return last.label;
},
};

export const BREADCRUMB_RESOLVER = (context: any): string[] | null => {
  const { item, filtersState } = context;
  const getCompositeKey = (getData: (key: string) => string | undefined) =>
    BREADCRUMB_KEYS.map(key => getData(key)).filter(valid).join(VALUE_SEPARATOR);
  if (item) {
    const compositeKey = getCompositeKey((k) => item[k] ?? item[k.charAt(0).toLowerCase() + k.slice(1)]);
    if (breadcrumbConfig[compositeKey]) return breadcrumbConfig[compositeKey];
    const firstLevel = item[BREADCRUMB_KEYS[0]];
    if (breadcrumbConfig[firstLevel]) return breadcrumbConfig[firstLevel];
  }

  if (filtersState) {
    const getFilterVal = (k: string) => filtersState[`nav_${k}`]?.[0] || filtersState[k]?.[0];
    const compositeKey = getCompositeKey(getFilterVal);
    if (breadcrumbConfig[compositeKey]) return breadcrumbConfig[compositeKey];
    const firstKey = getFilterVal(BREADCRUMB_KEYS[0]);
    if (firstKey && breadcrumbConfig[firstKey]) return breadcrumbConfig[firstKey];
  }
  return breadcrumbConfig["default"] || null;
};

// ==========================================
// 6. VISIBILIDAD Y FORMATEO DE CAMPOS
// ==========================================
export const VISIBLE_FIELDS = ["product", "format", "artist", "title", "label", "genre", "year", "style", "color", "configuration", "packaging", "signedBy", "numbered", "discogs"] as const;
export const SPECIAL_FIELDS = ["notes"] as const;
export const LINK_FIELDS = ["product", "format", "artist", "label", "genre", "year", "style", "color", "configuration", "packaging"] as const;

export const FIELD_VISIBILITY_RULES: Record<string, (item: CollectionItem, value: string) => boolean> = {
// Release: (_item, value) => valid(value) && value !== "Regular"
};

export const FIELD_COMBINATIONS: Record<string, (item: CollectionItem, value: string) => CombinationResult> = {
configuration: (item, value) => {
const parts: CombinationPart[] = [{ text: value, fieldKey: "configuration" }];
if (valid(item.packaging)) {
parts.push({ text: " (" }, { text: item.packaging, fieldKey: "packaging" },{ text: ")" });
}
return { parts, fullLink: false };
},
};

// ==========================================
// 7. BÚSQUEDA Y FILTROS (SIDEBAR/STATS)
// ==========================================
export const STATS_KEYS = ["format", "artist", "label", "genre", "year", "style", "color", "configuration", "packaging", "details"] as const;
export const SIDEBAR_KEYS = ["format", "artist", "label", "genre", "year", "style", "color", "configuration", "packaging", "details"] as const;

export const SEARCH_KEYS = ["displayName", "category", "product", "format", "artist", "title", "label", "genre", "year", "style", "color", "configuration", "packaging", "details"] as const;
export const SUGGESTIONS_KEYS = [
"category", "product", "format", "artist", "title", "label", "genre", "year", "style", "color", "configuration", "packaging", "details"
] as const;

export const CUSTOM_FILTERS: Record<string, CustomFilter> = {
details: {
label: "Details",
filter: "id" as any,
getValues: (item) => {
const activeDetails: string[] = [];
if (valid(item.signedBy)) activeDetails.push("Signed");
if (valid(item.numbered)) activeDetails.push("Numbered");
return activeDetails;
},
},
};

export const FILTER_KEYS: string[] = Array.from(new Set([...Object.values(breadcrumbConfig).flat(), ...NAVIGATION_CONFIG.hierarchy.map(k => k.toLowerCase())]));

// ==========================================
// 8. FACTORIES (INSTANCIAS)
// ==========================================
export const mapItem = createMapItem(FIELD_MAP, metadata.imageFolder);
export const getIndex = createGetIndex(FIELD_MAP, listsData, valid);
export const generateNavGroups = createGenerateNavGroups(["category", "product"], getIndex, valid);