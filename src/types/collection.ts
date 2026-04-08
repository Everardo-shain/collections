import { FIELD_MAP, NAVIGATION_CONFIG } from "@/config/footballConfig";

/**
 * 1. Mapeo Automático de campos del JSON
 * Extrae las llaves de FIELD_MAP (id, displayName, etc.) 
 * y les asigna el tipo string.
 */
export type CollectionItemFields = {
  [K in keyof typeof FIELD_MAP]: string;
};

/**
 * 2. Interfaz Principal
 * Combina los campos del JSON con las propiedades calculadas (imágenes).
 */
export interface CollectionItem extends CollectionItemFields {
  image: string;
  images: string[];
}

/**
 * 3. Tipos para el Estado de Filtros
 * Separamos conceptualmente qué es un filtro de navegación y qué es de sidebar
 */
export interface FilterState {
  // Filtros normales (Ej: brand, size, team)
  [key: string]: string[];
  // Filtros con prefijo (Ej: nav_category, nav_entity)
  // TypeScript ya lo cubre con la firma anterior, pero esto ayuda a la legibilidad
}

/**
 * 4. Tipos Auxiliares para Navegación
 */
export type NavHierarchyKeys = Lowercase<typeof NAVIGATION_CONFIG.hierarchy[number]>;

export type NavChild = {
  label: string;
} & Record<NavHierarchyKeys, string> & {
  [key: string]: string; 
};

export type NavGroup = {
  label: string;
  children: NavChild[];
};