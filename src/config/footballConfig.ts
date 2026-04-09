/**
 * FOOTBALL COLLECTION CONFIGURATION
 * Fuente de verdad única para tipos, navegación, filtros y constantes globales.
 */

// ==========================================
// 0. METADATOS DEL SITIO
// ==========================================

/** Información global para SEO y Branding */
export const SITE_METADATA = {
  title: "Everardo´s Football Collection",
  description: "Personal football collection showcase",
  author: "Everardo",
  url: "https://tu-sitio.com", // Útil para metas de Open Graph
  ogImage: "/og-image.png",      // Imagen por defecto para redes sociales
} as const;

// ==========================================
// 1. MAPEO DE CAMPOS Y TIPOS DE DATOS
// ==========================================

/** Mapa maestro que traduce las llaves técnicas del JSON a nombres legibles */
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

/** Genera automáticamente un tipo basado en las llaves de FIELD_MAP */
export type CollectionItemFields = {
  [K in keyof typeof FIELD_MAP]: string;
};

/** Interfaz principal de un Item de la colección */
export interface CollectionItem extends CollectionItemFields {
  image: string;
  images: string[];
}

/** Representa el estado de los filtros activos (URL Params) */
export interface FilterState {
  [key: string]: string[];
}

// ==========================================
// 2. CONFIGURACIÓN DE NAVEGACIÓN (Navbar)
// ==========================================

/** Define el orden jerárquico y la estructura de carpetas del sitio */
export const NAVIGATION_CONFIG = {
  hierarchy: ["Category", "Product"] as const, 
  structure: {
    Apparel: ["Jersey", "Hoodie", "Jacket", "Pants", "Headwear", "Scarf"],
    Equipment: ["Boots", "Ball"],
    Merchandise: ["Drinkware", "Display", "Accessory", "Stationery", "Currency", "Pass", "Photo"]
  }
} as const;

/** Tipos de utilidad para las llaves de navegación */
export type NavHierarchyKeys = typeof NAVIGATION_CONFIG.hierarchy[number] extends string 
  ? Lowercase<typeof NAVIGATION_CONFIG.hierarchy[number]> 
  : never;

/** Representa un elemento hijo en el menú de navegación */
export type NavChild = {
  label: string;
} & Record<NavHierarchyKeys, string> & {
  [key: string]: string; 
};

/** Grupo de elementos en el menú (ej. Apparel) */
export type NavGroup = {
  label: string;
  children: NavChild[];
};

/** Lista de strings basada en la jerarquía para Breadcrumbs globales */
export const NAVIGATION_BREADCRUMB = [...NAVIGATION_CONFIG.hierarchy] as string[];

/** Generación dinámica de los grupos de navegación para el componente Navbar */
export const NAV_GROUPS: NavGroup[] = Object.entries(NAVIGATION_CONFIG.structure).map(
  ([parentLabel, children]) => ({
    label: parentLabel,
    children: children.map(childLabel => {
      const child: any = { label: childLabel };
      NAVIGATION_CONFIG.hierarchy.forEach((key, index) => {
        const lowerKey = key.toLowerCase();
        child[lowerKey] = index === 0 ? parentLabel : childLabel;
      });
      return child as NavChild;
    })
  })
);

// ==========================================
// 3. CONFIGURACIÓN GENERAL Y VISIBILIDAD
// ==========================================

/** Separador utilizado en campos que contienen múltiples valores */
export const VALUE_SEPARATOR = "/";

/** Campos que NO deben ser divididos aunque contengan el separador (ej. ID) */
export const NO_SPLIT_FIELDS = ["Display Name", "ID", "Notes"];

/** Campos que se ocultan en la tabla de especificaciones del Item Detail */
export const HIDDEN_FIELDS = [
  "ID",
  "Display Name",
  "Variant",
  "Category",
  "Entity",
  "Nameset",
  "Sleeves",
  "Collaboration",
];

// ==========================================
// 4. CONFIGURACIÓN DE BREADCRUMBS (Detalle)
// ==========================================

/** Llave principal para determinar la ruta del breadcrumb */
export const BREADCRUMB_KEY = "entity";

/** Define qué campos mostrar en el breadcrumb según el tipo de entidad */
export const breadcrumbConfig: Record<string, string[]> = {
  "National Team": ["Entity", "Confederation", "Team", "Season"],
  "Collective": ["Entity","Confederation", "Country", "Competition", "Team", "Season"],
  "Club": ["Entity","Confederation", "Country", "Competition", "Team", "Season"],
  "Event": ["Entity","Confederation", "Country", "Competition", "Team", "Season"],
  "Brand": ["Entity","Brand", "Season"],
  "Person": ["Entity","Person", "Season"]
};

/** Resuelve qué arreglo de breadcrumbs usar según si es un Item o un Filtro */
export const BREADCRUMB_RESOLVER = (context: any): string[] | null => {
  const { item, filtersState } = context;
  if (item) return breadcrumbConfig[item.entity] || null;
  if (filtersState) {
    const entityValue = filtersState.nav_entity?.[0] || filtersState.entity?.[0];
    if (entityValue && breadcrumbConfig[entityValue]) return breadcrumbConfig[entityValue];
  }
  return null;
};

// ==========================================
// 5. REGLAS DINÁMICAS Y COMBINACIONES
// ==========================================

/** Lógica para combinar valores de campos en la interfaz (ej. añadir Sleeves al Style) */
export const FIELD_COMBINATIONS: Record<string, (item: CollectionItem, value: string) => string> = {
  Print: (item, value) => {
    if (valid(item.nameset)) return `${value} (${item.nameset} Nameset)`;
    return value;
  },
  Style: (item, value) => {
    if (valid(item.sleeves) && item.sleeves !== "Short") return `${value} (${item.sleeves} Sleeves)`;
    return value;
  },
  Brand: (item, value) => {
    if (valid(item.collaboration)) return `${value} x ${item.collaboration}`;
    return value;
  }
};

/** Define si un campo debe mostrarse basado en su valor (ej. ocultar Release "Regular") */
export const FIELD_VISIBILITY_RULES: Record<string, (item: CollectionItem, value: string) => boolean> = {
  Release: (_item, value) => valid(value) && value !== "Regular"
};

// ==========================================
// 6. FILTROS, SIDEBAR Y BÚSQUEDA
// ==========================================

/** Llaves que aparecen en el Sidebar de filtros lateral */
export const SIDEBAR_KEYS = [
  "team-type", "confederation", "country", "competition", 
  "team", "season", "style", "release", "brand", 
  "technology", "size", "details"
] as const;

/** Campos que el buscador principal utiliza para filtrar resultados */
export const SEARCH_KEYS = [
  "displayName", "team", "person", "style", "season", 
  "competition", "country", "confederation", "brand", 
  "product", "entity", "category", "release", 
  "technology", "collaboration", "print", "patch"
] as const;

/** Filtros con lógica de extracción de valores personalizada */
type CustomFilter = { label: string; getValues: (item: CollectionItem) => string[]; };
export const CUSTOM_FILTERS: Record<string, CustomFilter> = {
  "team-type": {
    label: "Team Type",
    getValues: (item) => {
      const validEntities = ["Club", "National Team", "Collective"];
      if (item.entity && validEntities.includes(item.entity)) return [item.entity];
      return [];
    }
  }
};

/** Filtros rápidos (Checkboxes) basados en condiciones booleanas del Item */
type DetailsFilterFn = (item: CollectionItem) => boolean;
export const DETAILS_FILTERS: Record<string, DetailsFilterFn> = {
  "Long Sleeves": (item) => valid(item.sleeves) && item.sleeves === "Long",
  "Printed": (item) => valid(item.print),
  "With Patches": (item) => valid(item.patch),
  "Signed": (item) => valid(item.signature),
  "In Box": (item) => valid(item.packaging),
  "Collaboration": (item) => valid(item.collaboration)
};

/** Generación de todas las llaves de filtro únicas para el sistema de ruteo */
export const FILTER_KEYS: string[] = Array.from(
  new Set([
    ...Object.values(breadcrumbConfig).flat(),
    ...NAVIGATION_CONFIG.hierarchy 
  ].map(key => key.toLowerCase()))
);

// ==========================================
// 7. FUNCIONES HELPER (Utilidades)
// ==========================================

/** Transforma un texto en una llave válida para URL (slug) */
export function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, "-");
}

/** Comprueba si un valor es válido para visualización (evita "-", "n/a", etc.) */
export function valid(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v !== "-" && v !== "" && v !== "none" && v !== "n/a";
}

/** Obtiene el valor de una propiedad del Item manejando diferencias de Case (Pascal/Camel) */
export function getDynamicValue(item: CollectionItem, key: string): string {
  let value = item[key as keyof CollectionItem];
  if (value === undefined) {
    const camelKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof CollectionItem;
    value = item[camelKey];
  }
  return typeof value === "string" ? value : "";
}

/** Formatea un valor para su visualización, separando múltiples elementos si el campo lo permite. */
export function formatDisplayValue(label: string, value: string): string {
  if (NO_SPLIT_FIELDS.includes(label) || !valid(value)) return value;
  
  return value
    .split(VALUE_SEPARATOR)
    .map(part => part.trim())
    .filter(Boolean)
    .join(" · ");
}