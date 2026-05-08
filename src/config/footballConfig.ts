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
  createSortConfig,
  valid,
  VALUE_SEPARATOR,
} from "@/utils/collectionUtils";

export const rawData = rawDataJson as Record<string, string>[];
export const listsData = listsDataJson as Record<string, string[]>;

/** Metadatos específicos de la colección */
export const metadata = {
  id: "football",
  title: "Everardo´s Football Collection",
  description: `Personal football collection showcase featuring apparel, equipment, and memorabilia.`,
  ogImage: "/og-image.png",
  lightAccentColor: "142 71% 40%",
  darkAccentColor: "111 100% 51%",
  logo: "/src/assets/site/football-logo.svg",
} as const;

// ==========================================
// 1. MAPEO DE CAMPOS
// ==========================================
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

export const STATS_KEYS = [
  "team_type", "confederation", "country", "competition",
  "team", "season", "style", "release", "brand",
  "technology", "person", "size", "details",
] as const;

// ==========================================
// 2. NAVEGACIÓN
// ==========================================
export const NAVIGATION_CONFIG = {
  hierarchy: ["category", "product"] as const,
} as const;

export const NAVIGATION_BREADCRUMB = [...NAVIGATION_CONFIG.hierarchy] as string[];

// ==========================================
// 4. DETALLES DE ITEM
// ==========================================
export const VISIBLE_FIELDS = [
  "product", "team", "season", "style", "release", "competition", "country",
  "confederation", "technology", "brand", "size", "person", "print",
  "patch", "packaging", "signature", "numbered",
] as const;

export const SPECIAL_FIELDS = ["notes"] as const;

export const LINK_FIELDS = [
  "team", "season", "competition", "country", "confederation", "brand", "person", 
] as const;

export const FIELD_COMBINATIONS: Record<string, (item: CollectionItem, value: string) => CombinationResult> = {
  team: (item, value) => {
    const parts: CombinationPart[] = [{ text: value, fieldKey: "team" }];
    if (valid(item.team_type) && item.team_type === "National Team") {
      parts.push({ text: " " });
      parts.push({ text: item.team_type, fieldKey: "team_type" });
    }
    return { parts, fullLink: true };
  },
  brand: (item, value) => {
    const parts: CombinationPart[] = [{ text: value, fieldKey: "brand" }];
    if (valid(item.collaboration)) {
      parts.push({ text: " x " });
      parts.push({ text: item.collaboration, fieldKey: "collaboration" });
    }
    return { parts, fullLink: false };
  },
  style: (item, value) => {
    const parts: CombinationPart[] = [{ text: value, fieldKey: "style" }];
    if (valid(item.sleeves) && item.sleeves !== "Short") {
      parts.push({ text: " - " });
      parts.push({ text: `${item.sleeves} Sleeves`, fieldKey: "sleeves" });
    }
    return { parts, fullLink: false };
  },
  print: (item, value) => {
    const parts: CombinationPart[] = [{ text: value, fieldKey: "print" }];
    if (valid(item.nameset)) {
      parts.push({ text: " - " });
      parts.push({ text: `${item.nameset} Nameset`, fieldKey: "nameset" });
    }
    return { parts, fullLink: false };
  },
};

export const FIELD_VISIBILITY_RULES: Record<string, (item: CollectionItem, value: string) => boolean> = {};

export type VisibleField = typeof VISIBLE_FIELDS[number];
export type SpecialField = typeof SPECIAL_FIELDS[number];
export type LinkField = typeof LINK_FIELDS[number];

// ==========================================
// 5. BREADCRUMBS
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
    const firstKey = item[BREADCRUMB_KEYS[0]];
    return breadcrumbConfig[firstKey] || null;
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
// 6. FILTROS / SIDEBAR / BÚSQUEDA
// ==========================================
export const SIDEBAR_KEYS = [
  "team_type", "confederation", "country", "competition",
  "team", "season", "style", "release", "brand",
  "technology", "person", "size", "details",
] as const;

export const SEARCH_KEYS = [
  "displayName", "team", "person", "style", "team_type", "season",
  "competition", "country", "confederation", "brand",
  "product", "category", "release",
  "technology", "collaboration", "print", "patch",
] as const;

export const SUGGESTIONS_KEYS = [
  "team", "person", "style", "team_type", "season",
  "competition", "country", "confederation", "brand",
  "product", "category", "release",
  "technology", "collaboration", "print", "patch",
] as const;

export const CUSTOM_FILTERS: Record<string, CustomFilter> = {
  // team_test: {
  //   label: "Team Test",
  //   filter: "team",
  //   getValues: (item, config) => {
  //     const validValues = ["Deportivo Toluca", "Borussia Dortmund", "Germany"];
  //     const value = item[config.filter as keyof CollectionItem];
  //     if (typeof value === "string" && validValues.includes(value)) return [value];
  //     return [];
  //   },
  // },
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

export const FILTER_KEYS: string[] = Array.from(
  new Set([
    ...Object.values(breadcrumbConfig).flat(),
    ...NAVIGATION_CONFIG.hierarchy.map(k => k.toLowerCase()),
  ])
);

// ==========================================
// 7. FACTORIES (mapItem, sort, navGroups, getIndex)
// ==========================================
export const mapItem = createMapItem(FIELD_MAP);
export const getIndex = createGetIndex(FIELD_MAP, listsData);
export const SORT_CONFIG = createSortConfig(getIndex);
export const generateNavGroups = createGenerateNavGroups(NAVIGATION_CONFIG.hierarchy, getIndex);
