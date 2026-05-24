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
  replaceSeparators,
  SeparatorConfig,
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
  date: "Release Date",
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
// 2. CONSTANTES DE SEPARACIÓN Y FORMATEO MULTIPLEXADO
// ==========================================

export const SEPARATORS_CONFIG: SeparatorConfig[] = [
  {
    separator: " | ",
    replacementSymbol: " • ",
    splitFields: {
      mode: 'exclude',
      fields: ["displayName", "id", "notes"] // Estos NO se separan con " | "
    }
  },
  {
    separator: " & ",
    replacementSymbol: " & ", 
    splitFields: {
      mode: 'include',
      fields: ["color"] // SOLO estos campos se separan usando " / "
    }
  }
];

// Mantenemos una referencia por defecto para no romper código antiguo de golpe
export const DEFAULT_VALUE_SEPARATOR = " | ";

/** Define qué valores se consideran "vacíos" o "inválidos" para esta colección */
export function valid(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v !== "-" && v !== "" && v !== "none" && v !== "n/a";
}

/** Formateador visual para Breadcrumbs y Títulos */
export function formatDisplayValue(key: string, value: string): string {
  if (!valid(value)) return value;
  return replaceSeparators(key, value, SEPARATORS_CONFIG);
}

// ==========================================
// 3. ORDENAMIENTO (SORTING)
// ==========================================
const defaultCompare = (a: CollectionItem, b: CollectionItem) => a.id.localeCompare(b.id);

export const SORT_CONFIG: Record<SortOption, SortConfig> = {
  default: { label: 'Default', compare: defaultCompare },
  newest: {
    label: 'Newest Release',
    compare: (a, b) => {
      // Manejo de casos vacíos o indefinidos (enviarlos al final)
      if (!a.date) return 1;
      if (!b.date) return -1;
      
      // Para "Newest", comparamos B contra A (orden descendiente: 2026 antes que 2024)
      const diff = b.date.localeCompare(a.date);
      return diff !== 0 ? diff : defaultCompare(a, b);
    },
  },
  oldest: {
    label: 'Oldest Release',
    compare: (a, b) => {
      // Manejo de casos vacíos o indefinidos (enviarlos al final)
      if (!a.date) return 1;
      if (!b.date) return -1;

      // Para "Oldest", comparamos A contra B (orden ascendiente: 2024 antes que 2026)
      const diff = a.date.localeCompare(b.date);
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
  "default": ["label", "artist", "format"],
};

export const BREADCRUMB_LABELS: Record<string, Record<string, string>> = {
// "Team | National Team": { team: " National Team" },
// "Team | Club": { country: " Clubs" },
// "Team | Collective": { country: " Collective Teams" },
};

export const TITLE_FORMATTERS: Record<string, (last: any, all: any[], compositeKey?: string) => string> = {
format: (last, all) => {
if (all.length > 1) {
const penultimate = all[all.length - 2];
return `${penultimate.label} ${last.label}`;
}
return last.label;
},
};

export const BREADCRUMB_RESOLVER = (context: any): string[] | null => {
  const { item, filtersState } = context;
  const getCompositeKeys = (getData: (key: string) => string | undefined): string[] => {
    const activeValues = BREADCRUMB_KEYS.map(key => getData(key)).filter(valid);
    if (!activeValues.length) return [];
    return SEPARATORS_CONFIG.map(cfg => activeValues.join(cfg.separator));
  };
  if (item) {
    const compositeKeys = getCompositeKeys((k) => item[k] ?? item[k.charAt(0).toLowerCase() + k.slice(1)]);
    const matchedKey = compositeKeys.find(key => breadcrumbConfig[key]);
    if (matchedKey) return breadcrumbConfig[matchedKey];
    const firstLevel = item[BREADCRUMB_KEYS[0]];
    if (breadcrumbConfig[firstLevel]) return breadcrumbConfig[firstLevel];
  }
  if (filtersState) {
    const getFilterVal = (k: string) => filtersState[`nav_${k}`]?.[0] || filtersState[k]?.[0];
    const compositeKeys = getCompositeKeys(getFilterVal);
    const matchedKey = compositeKeys.find(key => breadcrumbConfig[key]);
    if (matchedKey) return breadcrumbConfig[matchedKey];
    const firstKey = getFilterVal(BREADCRUMB_KEYS[0]);
    if (firstKey && breadcrumbConfig[firstKey]) return breadcrumbConfig[firstKey];
  }
  return breadcrumbConfig["default"] || null;
};

// ==========================================
// 6. VISIBILIDAD Y FORMATEO DE CAMPOS
// ==========================================
export const VISIBLE_FIELDS = ["product", "format", "artist", "title", "label", "genre", "date", "style", "color", "configuration", "signedBy", "numbered", "discogs"] as const;
export const SPECIAL_FIELDS = ["notes"] as const;
export const LINK_FIELDS = ["product", "format", "artist", "label", "genre", "style","packaging"] as const;

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


export const formatIfLink = (text: string) => {
  if (typeof text === 'string' && (text.startsWith('http://') || text.startsWith('https://'))) {
    try {
      const url = new URL(text);
      if (url.hostname.includes('discogs.com')) return 'View on Discogs';
      if (url.hostname.includes('spotify.com')) return 'Listen on Spotify';
      return `Visit ${url.hostname.replace('www.', '')}`;
    } catch {
      return 'Open Link';
    }
  }
  return text;
};

// ==========================================
// 7. BÚSQUEDA Y FILTROS (SIDEBAR/STATS)
// ==========================================
export const STATS_KEYS = ["format", "artist", "label", "genre", "style", "color", "configuration", "packaging", "details"] as const;
export const SIDEBAR_KEYS = ["format", "artist", "label", "genre", "style", "color", "configuration", "packaging", "details"] as const;

export const SEARCH_KEYS = ["displayName", "category", "product", "format", "artist", "title", "label", "genre", "date", "style", "color", "configuration", "packaging", "details"] as const;
export const SUGGESTIONS_KEYS = [
"category", "product", "format", "artist", "title", "label", "genre", "date", "style", "color", "configuration", "packaging", "details"
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