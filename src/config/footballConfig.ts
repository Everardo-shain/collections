import type { CollectionItem } from '@/types/collection';

// ===== TYPES =====
export type NavChild = {
  label: string;
  category: string;
  product: string;
  [key: string]: string;
};

export type NavGroup = {
  label: string;
  children: NavChild[];
};

type CustomFilter = {
  label: string;
  getValues: (item: CollectionItem) => string[];
};

type DetailsFilterFn = (item: CollectionItem) => boolean;

// ===== HELPERS =====
export function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, "-");
}

export function valid(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v !== "-" && v !== "" && v !== "none" && v !== "n/a";
}

export function getDynamicValue(item: CollectionItem, key: string): string {
  // Intentamos acceso directo (camelCase)
  let value = item[key as keyof CollectionItem];
  
  // Si no existe, intentamos convertir la primera letra a minúscula (PascalCase -> camelCase)
  if (value === undefined) {
    const camelKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof CollectionItem;
    value = item[camelKey];
  }
  
  return typeof value === "string" ? value : "";
}

// ===== FIELD MAP (La fuente de verdad absoluta) =====
export const FIELD_MAP = {
  id: "ID",
  displayName: "Display Name",
  category: "Category",
  product: "Product",
  entity: "Entity",
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
  notes: "Notes"
} as const;

// ===== NAVIGATION =====
export const NAVIGATION_CONFIG = {
  hierarchy: ["Category", "Product"], 
  structure: {
    Apparel: ["Jersey", "Hoodie", "Jacket", "Pants", "Headwear", "Scarf"],
    Equipment: ["Boots", "Ball"],
    Merchandise: ["Drinkware", "Display", "Accessory", "Stationery", "Currency", "Pass", "Photo"]
  }
} as const;

export const NAVIGATION_BREADCRUMB = [...NAVIGATION_CONFIG.hierarchy] as string[];

export const NAV_GROUPS: NavGroup[] = Object.entries(NAVIGATION_CONFIG.structure).map(
  ([parentLabel, children]) => ({
    label: parentLabel,
    children: children.map(childLabel => {
      const child = { label: childLabel } as any; 
      child[NAVIGATION_CONFIG.hierarchy[0].toLowerCase()] = parentLabel;
      child[NAVIGATION_CONFIG.hierarchy[1].toLowerCase()] = childLabel;
      return child as NavChild;
    })
  })
);

// ===== GENERAL CONFIG =====
export const VALUE_SEPARATOR = "/";
export const NO_SPLIT_FIELDS = ["Display Name", "ID", "Notes"];

// ===== VISIBILITY EN ITEM DETAIL =====
export const HIDDEN_FIELDS = [
  "ID",
  "Display Name",
  "Variant",
  "Category",
  "Entity",
  "Nameset",
  "Sleeves",
  "Collaboration",
  "image",
];

// ===== COMBINATIONS (Basadas en las etiquetas de FIELD_MAP) =====
export const FIELD_COMBINATIONS: Record<
  string,
  (item: CollectionItem, value: string) => string
> = {
  Print: (item, value) => {
    if (valid(item.nameset)) {
      return `${value} (${item.nameset} Nameset)`;
    }
    return value;
  },
  Style: (item, value) => {
    if (valid(item.sleeves) && item.sleeves !== "Short") {
      return `${value} (${item.sleeves} Sleeves)`;
    }
    return value;
  },
  Brand: (item, value) => {
    if (valid(item.collaboration)) {
      return `${value} x ${item.collaboration}`;
    }
    return value;
  }
};

export const FIELD_VISIBILITY_RULES: Record<
  string,
  (item: CollectionItem, value: string) => boolean
> = {
  Release: (_item, value) => valid(value) && value !== "Regular"
};

// ===== BREADCRUMBS CONFIG =====
export const BREADCRUMB_KEY = "entity";

export const breadcrumbConfig: Record<string, string[]> = {
  "National Team": ["Entity", "Confederation", "Team", "Season"],
  "Collective": ["Confederation", "Country", "Competition", "Team", "Season"],
  "Club": ["Confederation", "Country", "Competition", "Team", "Season"],
  "Event": ["Confederation", "Country", "Competition", "Team", "Season"],
  "Brand": ["Brand", "Season"],
  "Person": ["Team", "Person", "Season"]
};

// ===== BREADCRUMB RESOLVER =====
export const BREADCRUMB_RESOLVER = (context: any): string[] | null => {
  const { item, filtersState, sidebarState, data, matchField } = context;

  if (item) {
    const key = item.entity; 
    return breadcrumbConfig[key] || null;
  }

  const totalNavValues = Object.values(filtersState || {}).flat().length;
  const totalSidebarValues = Object.values(sidebarState || {}).flat().length;

  if (totalSidebarValues > 0 || totalNavValues > 1) {
    return null; 
  }

  if (filtersState) {
    const parentKey = NAVIGATION_CONFIG.hierarchy[0].toLowerCase();
    if (filtersState[parentKey]?.length === 1) {
      return NAVIGATION_BREADCRUMB;
    }

    if (filtersState.entity?.length === 1) {
      const entityName = filtersState.entity[0];
      return breadcrumbConfig[entityName] || null;
    }
  }

  return null;
};

// ===== FILTERS & SEARCH =====
export const SIDEBAR_KEYS = [
  "team-type", "confederation", "country", "competition", 
  "team", "season", "style", "release", "brand", 
  "technology", "size", "details"
] as const;

// ===== CUSTOM FILTERS =====
export const CUSTOM_FILTERS: Record<string, CustomFilter> = {
  "team-type": {
    label: "Team Type",
    getValues: (item) => {
      const validEntities = ["Club", "National Team", "Collective"];
      if (item.entity && validEntities.includes(item.entity)) {
        return [item.entity];
      }
      return [];
    }
  }
};

export const DETAILS_FILTERS: Record<string, DetailsFilterFn> = {
  "Long Sleeves": (item) => valid(item.sleeves) && item.sleeves === "Long",
  "Printed": (item) => valid(item.print),
  "With Patches": (item) => valid(item.patch),
  "Signed": (item) => valid(item.signature),
  "In Box": (item) => valid(item.packaging),
  "Collaboration": (item) => valid(item.collaboration)
};

export const SEARCH_KEYS = [
  "displayName", "team", "person", "style", "season", 
  "competition", "country", "confederation", "brand", 
  "product", "entity", "category", "release", 
  "technology", "collaboration", "print", "patch"
] as const;

// ===== FILTER KEYS (GENERACIÓN AUTOMÁTICA) =====
// Extraemos todas las llaves mencionadas en las configuraciones de breadcrumbs y jerarquía
const rawFilterKeys = [
  ...Object.values(breadcrumbConfig).flat(),
  ...NAVIGATION_CONFIG.hierarchy 
];

// Creamos un Set para evitar duplicados y lo exportamos en minúsculas
export const FILTER_KEYS: string[] = Array.from(
  new Set(rawFilterKeys.map(key => key.toLowerCase()))
);