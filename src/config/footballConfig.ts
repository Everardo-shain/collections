/**
 * FOOTBALL COLLECTION CONFIGURATION
 */
import rawDataJson from "@/data/json_files/football_collection - Collection.json";
import listsDataJson from '@/data/json_files/football_collection - Lists.json';
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
  id: "football",
  title: "Everardo´s Football Collection",
  description: `Personal football collection showcase featuring apparel, equipment, and memorabilia.`,
  ogImage: `${BASE_PATH}site/og-image.png`,
  lightAccentColor: "125 85% 32%",
  darkAccentColor: "125 100% 55%",
  logo: `${BASE_PATH}site/football-logo.svg`,
  favIcon: `${BASE_PATH}site/favicon.png`,
  itemCount: rawData.length,
  imageFolder: "football",
} as const;

export const FIELD_MAP = {
  id: "ID",
  displayName: "Display Name",
  category: "Category",
  product: "Product",
  entity: "Entity",
  team_type: "Team Type",
  team: "Team",
  season: "Season",
  style: "Style",
  variant: "Variant",
  release: "Release",
  competition: "Competition",
  country: "Country",
  confederation: "Confederation",
  technology: "Technology",
  brand: "Brand",
  collaboration: "Collaboration",
  size: "Size",
  sleeves: "Sleeves",
  person: "Person",
  print: "Print",
  nameset: "Nameset",
  patch: "Patch",
  packaging: "Packaging",
  signature: "Signature",
  numbered: "Numbered",
  notes: "Notes",
} as const;

// ==========================================
// 2. CONSTANTES DE FORMATO Y VALIDACIÓN
// ==========================================
export const VALUE_SEPARATOR = " | ";
export const NO_SPLIT_FIELDS = ["displayName", "id"];

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

// ==========================================
// 4. ESTRUCTURA DE NAVEGACIÓN
// ==========================================
export const NAVIGATION_CONFIG = { hierarchy: ["category", "product"] as const } as const;
export const NAVIGATION_BREADCRUMB = [...NAVIGATION_CONFIG.hierarchy] as string[];

// ==========================================
// 5. CONFIGURACIÓN DE BREADCRUMBS
// ==========================================
export const BREADCRUMB_KEYS = ["entity", "team_type"] as const;
export const BREADCRUMB_HIDDEN: readonly string[] = ["entity"];

export const breadcrumbConfig: Record<string, string[]> = {
"Team | National Team": ["entity", "team_type", "team", "season"],
"Team | Collective": ["entity", "team_type", "country", "team", "season"],
"Team | Club": ["entity", "team_type", "country", "team", "season"],
"Team": ["entity", "season"],
"Event": ["entity", "competition", "season"],
"Brand": ["entity", "brand", "season"],
"Person": ["entity", "person", "season"],
};

export const BREADCRUMB_LABELS: Record<string, Record<string, string>> = {
"Team | National Team": { team: " National Team" },
"Team | Club": { country: " Clubs" },
"Team | Collective": { country: " Collective Teams" },
};

export const TITLE_FORMATTERS: Record<string, (last: any, all: any[], compositeKey?: string) => string> = {
season: (last, all) => {
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
return breadcrumbConfig[item[BREADCRUMB_KEYS[0]]] || null;
}
if (filtersState) {
const getFilterVal = (k: string) => filtersState[`nav_${k}`]?.[0] || filtersState[k]?.[0];
const compositeKey = getCompositeKey(getFilterVal);
if (breadcrumbConfig[compositeKey]) return breadcrumbConfig[compositeKey];
const firstKey = getFilterVal(BREADCRUMB_KEYS[0]);
if (firstKey && breadcrumbConfig[firstKey]) return breadcrumbConfig[firstKey];
}
return null;
};

// ==========================================
// 6. VISIBILIDAD Y FORMATEO DE CAMPOS
// ==========================================
export const VISIBLE_FIELDS = ["product", "team", "season", "style", "release", "competition", "country", "confederation", "technology", "brand", "size", "person", "print", "patch", "packaging", "signature", "numbered"] as const;
export const SPECIAL_FIELDS = ["notes"] as const;
export const LINK_FIELDS = ["team", "season", "competition", "country", "confederation", "brand", "person"] as const;

export const FIELD_VISIBILITY_RULES: Record<string, (item: CollectionItem, value: string) => boolean> = {
// Release: (_item, value) => valid(value) && value !== "Regular"
};

export const FIELD_COMBINATIONS: Record<string, (item: CollectionItem, value: string) => CombinationResult> = {
team: (item, value) => {
const parts: CombinationPart[] = [{ text: value, fieldKey: "team" }];
if (valid(item.team_type) && item.team_type === "National Team") {
parts.push({ text: " " }, { text: item.team_type, fieldKey: "team_type" });
}
return { parts, fullLink: true };
},
brand: (item, value) => {
const parts: CombinationPart[] = [{ text: value, fieldKey: "brand" }];
if (valid(item.collaboration)) {
parts.push({ text: " x " }, { text: item.collaboration, fieldKey: "collaboration" });
}
return { parts, fullLink: false };
},
style: (item, value) => {
const parts: CombinationPart[] = [{ text: value, fieldKey: "style" }];
if (valid(item.sleeves) && item.sleeves !== "Short") {
parts.push({ text: " - " }, { text: `${item.sleeves} Sleeves`, fieldKey: "sleeves" });
}
return { parts, fullLink: false };
},
print: (item, value) => {
const parts: CombinationPart[] = [{ text: value, fieldKey: "print" }];
if (valid(item.nameset)) {
parts.push({ text: " - " }, { text: `${item.nameset} Nameset`, fieldKey: "nameset" });
}
return { parts, fullLink: false };
},
};

// ==========================================
// 7. BÚSQUEDA Y FILTROS (SIDEBAR/STATS)
// ==========================================
export const STATS_KEYS = ["team_type", "confederation", "country", "competition", "team", "season", "style", "release", "brand", "technology", "person", "size", "details"] as const;
export const SIDEBAR_KEYS = ["team_type", "confederation", "country", "competition", "team", "season", "style", "release", "brand", "technology", "person", "size", "details"] as const;

export const SEARCH_KEYS = ["displayName", "team", "person", "style", "team_type", "season", "competition", "country", "confederation", "brand", "product", "category", "release", "technology", "collaboration", "print", "patch"] as const;
export const SUGGESTIONS_KEYS = [
"team", "person", "style", "team_type", "season",
"competition", "country", "confederation", "brand",
"product", "category", "release",
"technology", "collaboration", "print", "patch",
] as const;

export const CUSTOM_FILTERS: Record<string, CustomFilter> = {
details: {
label: "Details",
filter: "id" as any,
getValues: (item) => {
const activeDetails: string[] = [];
if (valid(item.sleeves) && item.sleeves === "Long") activeDetails.push("Long Sleeves");
if (valid(item.print)) activeDetails.push("Printed");
if (valid(item.patch)) activeDetails.push("With Patches");
if (valid(item.signature)) activeDetails.push("Signed");
if (valid(item.packaging)) activeDetails.push("In Box");
if (valid(item.collaboration)) activeDetails.push("Collaboration");
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