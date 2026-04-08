import {
  FILTER_KEYS,
  SIDEBAR_KEYS,
  SEARCH_KEYS,
  CUSTOM_FILTERS,
  DETAILS_FILTERS,
  VALUE_SEPARATOR,
  valid,
  normalizeKey, 
  FIELD_MAP     
} from "@/config/footballConfig";

import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import rawData from "@/data/json_files/football_collection.json";
import { mapItem } from "@/utils/mapItem";
import { CollectionItem } from "@/types/collection";

export const collectionItems: CollectionItem[] = rawData.map(mapItem);

// --- HELPERS ---
function getArrayParam(params: URLSearchParams, key: string): string[] {
  const val = params.get(key);
  if (!val) return [];
  return val.split(VALUE_SEPARATOR).map(v => v.trim()).filter(Boolean);
}

function getItemValues(value: string): string[] {
  if (!valid(value)) return [];
  return value.split(VALUE_SEPARATOR).map(v => v.trim());
}

// 🔥 CORRECCIÓN: Comparación insensible a mayúsculas para evitar fallos de matching
function matchField(itemValue: string, filters: string[]): boolean {
  if (!filters.length) return true;
  if (!itemValue) return false;
  const values = getItemValues(itemValue).map(v => v.toLowerCase());
  return filters.some(f => values.includes(f.toLowerCase()));
}

function getValue(item: CollectionItem, key: string): string {
  let value = item[key as keyof CollectionItem];
  if (value === undefined) {
    const camelKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof CollectionItem;
    value = item[camelKey];
  }
  return typeof value === "string" ? value : "";
}

function isSidebarKey(key: string): key is typeof SIDEBAR_KEYS[number] {
  return (SIDEBAR_KEYS as readonly string[]).includes(key);
}

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const navState = useMemo(() => {
    const state: Record<string, string[]> = {};
    
    FILTER_KEYS.forEach(key => {
      const norm = normalizeKey(key);
      
      // 🔥 Buscamos AMBOS: con prefijo nav_ y sin él (por si viene del Navbar)
      const withPrefix = getArrayParam(searchParams, "nav_" + norm);
      const withoutPrefix = getArrayParam(searchParams, norm);
      
      // Si la llave está en SIDEBAR_KEYS, priorizamos el prefijo para no chocar con el Sidebar
      // Si NO está en Sidebar (como 'category'), aceptamos la versión sin prefijo
      if (isSidebarKey(key)) {
        state[key] = withPrefix;
      } else {
        state[key] = withPrefix.length > 0 ? withPrefix : withoutPrefix;
      }
    });
    
    return state;
  }, [searchParams]);

  const sidebarState = useMemo(() => {
    const state: Record<string, string[]> = {};
    SIDEBAR_KEYS.forEach(key => {
      state[key] = getArrayParam(searchParams, normalizeKey(key));
    });
    return state;
  }, [searchParams]);

  // 3. Unimos ambos para el filtrado real de items
const combinedState = useMemo(() => {
  const combined: Record<string, string[]> = { ...sidebarState };
  
  Object.entries(navState).forEach(([key, values]) => {
    if (values.length > 0) {
      // Si el campo ya existe en sidebar, unimos (evitando duplicados)
      // Si no existe, lo creamos.
      combined[key] = Array.from(new Set([...(combined[key] || []), ...values]));
    }
  });
  return combined;
}, [sidebarState, navState]);

const filteredItems = useMemo(() => {
  return collectionItems.filter(item => {
    // 1. Unimos navState y sidebarState para tener todos los filtros activos
    const allActiveFilters = { ...combinedState };

    // 2. Verificamos cada filtro activo
    const matchesAll = Object.entries(allActiveFilters).every(([k, selectedValues]) => {
      if (!selectedValues.length) return true;

      // Normalizamos la llave (quitar nav_ si existe)
      const pureKey = k.startsWith('nav_') ? k.replace('nav_', '') : k;

      // CASO A: Es el filtro especial de "details"
      if (pureKey === "details") {
        return selectedValues.some(d => DETAILS_FILTERS[d]?.(item as any));
      }

      // CASO B: Es un Custom Filter (como Team Type)
      const custom = CUSTOM_FILTERS[pureKey];
      if (custom) {
        const itemValues = custom.getValues(item as any);
        return selectedValues.some(v => itemValues.includes(v));
      }

      // CASO C: Es un filtro estándar (Brand, Team, etc.)
      return matchField(getValue(item, pureKey), selectedValues);
    });

    if (!matchesAll) return false;

    // 3. Filtro de búsqueda (Search Bar)
    const words = searchQuery.toLowerCase().split(" ").filter(Boolean);
    const mSearch = words.length === 0 || words.every(w =>
      SEARCH_KEYS.some(k => getValue(item, k).toLowerCase().includes(w))
    );

    return mSearch;
  });
}, [combinedState, searchQuery]); // Quitamos sidebarState de aquí porque ya está dentro de combinedState

  // 4. 🔥 CORRECCIÓN CRÍTICA: filterOptions (Ignorar la propia categoría en Nav y Sidebar)
const filterOptions = useMemo(() => {
    const options: Record<string, { value: string; count: number }[]> = {};

    SIDEBAR_KEYS.forEach(key => {
      const normKey = normalizeKey(key);

      const itemsForThisSection = collectionItems.filter(item => {
        if (searchQuery) {
          const words = searchQuery.toLowerCase().split(" ").filter(Boolean);
          const matchesSearch = words.every(w =>
            SEARCH_KEYS.some(k => getValue(item, k).toLowerCase().includes(w))
          );
          if (!matchesSearch) return false;
        }
        // 1. Filtros de Navegación (Breadcrumb) - Siempre deben aplicar
        const matchesNav = Object.entries(navState).every(([k, v]) => 
          matchField(getValue(item, k), v)
        );
        if (!matchesNav) return false;

        // 2. Filtros de Sidebar - Aplicar todos menos el actual (para ver opciones disponibles)
        return SIDEBAR_KEYS.every(sideKey => {
          if (normalizeKey(sideKey) === normKey) return true; // Ignorar si es la misma categoría
          
          const selected = sidebarState[sideKey] || [];
          if (!selected.length) return true;
          
          // Lógica especial para 'details'
          if (sideKey === "details") {
            return selected.some(d => DETAILS_FILTERS[d]?.(item as any));
          }
          
          // Lógica para Custom Filters
          const custom = CUSTOM_FILTERS[sideKey];
          if (custom) {
            return selected.some(v => custom.getValues(item as any).includes(v));
          }
          
          // Filtro estándar
          return matchField(getValue(item, sideKey), selected);
        });
      });

      // --- CÁLCULO DE CONTEOS ---
      if (key === "details") {
        options[key] = Object.entries(DETAILS_FILTERS)
          .map(([label, fn]) => ({
            value: label, 
            count: itemsForThisSection.filter(i => fn(i)).length
          }))
          .filter(opt => opt.count > 0);
      } else {
        const counts: Record<string, number> = {};
        const custom = CUSTOM_FILTERS[key];
        
        itemsForThisSection.forEach(item => {
          // Si es custom usamos su getValues, si no, el helper estándar
          const vals = custom 
            ? custom.getValues(item as any) 
            : getItemValues(getValue(item, key));
            
          vals.forEach(v => { 
            if (v) counts[v] = (counts[v] || 0) + 1; 
          });
        });

        options[key] = Object.entries(counts)
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b[1] - a[1]);
      }
    });

    return options;
  }, [navState, sidebarState, searchQuery]);


// 5. DEBUGGING & CHIPS
  const activeFilterChips = useMemo(() => {
    const chips: any[] = [];
    Object.entries(sidebarState).forEach(([key, values]) => {
      values.forEach(value => {
        let displayKey = key;
        
        if (CUSTOM_FILTERS[key]) {
          displayKey = CUSTOM_FILTERS[key].label;
        } 
        else if (key === "details") {
          displayKey = "Details";
        } 
        else {
          displayKey = (FIELD_MAP as any)[key];
        }

        chips.push({ key, value, label: value, displayKey });
      });
    });

    
    return chips;
  }, [sidebarState]);

  const toggleFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    const normKey = normalizeKey(key);
    const current = getArrayParam(searchParams, normKey);
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    if (next.length) newParams.set(normKey, next.join(VALUE_SEPARATOR));
    else newParams.delete(normKey);
    setSearchParams(newParams, { replace: true });
  };

  const removeFilter = useCallback((key: string, value?: string) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      const normKey = normalizeKey(key);
      if (!value) { p.delete(normKey); return p; }
      const current = getArrayParam(p, normKey);
      const next = current.filter(v => v !== value);
      if (next.length) p.set(normKey, next.join(VALUE_SEPARATOR));
      else p.delete(normKey);
      return p;
    }, { replace: true });
  }, [setSearchParams]);



// --- Añade esto antes del return { ... } ---
const clearAll = useCallback(() => {
  setSearchParams(prev => {
    const p = new URLSearchParams(prev);
    const keys = Array.from(p.keys());
    
    keys.forEach(key => {
      // SOLO eliminamos si NO empieza con nav_ y NO es la búsqueda 'q'
      if (!key.startsWith('nav_') && key !== 'q') {
        p.delete(key);
      }
    });
    return p;
  }, { replace: true });
}, [setSearchParams]);

// --- Modifica el return para usar la nueva función ---
return {
  filteredItems,
  filterOptions,
  sidebarState,
  navState,
  activeFilterChips,
  searchQuery,
  toggleFilter,
  removeFilter,
  clearAll, // <--- Ahora apunta a la función de arriba
  setSearchQuery: (q: string) => setSearchParams(prev => {
    const p = new URLSearchParams(prev);
    if (q) p.set("q", q); else p.delete("q");
    return p;
  }, { replace: true })
};
}