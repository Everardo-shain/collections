import { FIELD_MAP } from "@/config/footballConfig";

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
 * Usamos Record<string, string[]> para permitir cualquier llave 
 * dinámica que definas en el config.
 */
export interface FilterState {
  [key: string]: string[];
}

/**
 * 4. Tipos Auxiliares para Navegación
 */
export type NavChild = {
  label: string;
  category: string;
  product: string;
  [key: string]: string; // Permite las llaves dinámicas de NAVIGATION_CONFIG.hierarchy
};

export type NavGroup = {
  label: string;
  children: NavChild[];
};