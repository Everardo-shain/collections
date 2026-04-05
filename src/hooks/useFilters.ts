import {
  FILTER_KEYS,
  SIDEBAR_KEYS,
  SEARCH_KEYS,
  CUSTOM_FILTERS,
  DETAILS_FILTERS,
  VALUE_SEPARATOR,
  valid,
  normalizeKey, // 🔥 Importado
  FIELD_MAP     // 🔥 Importado
} from "@/config/footballConfig";

import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import rawData from "@/data/json_files/football_collection.json";
import { mapItem } from "@/utils/mapItem";
import { CollectionItem } from "@/types/collection";

// ===== DATA =====
export const collectionItems: CollectionItem[] = rawData.map(mapItem);

// ===== HELPERS =====
function getArrayParam(params: URLSearchParams, key: string): string[] {
  // Usamos el VALUE_SEPARATOR ("/") para ser consistentes con tu config
  const val = params.get(key);
  if (!val) return [];
  return val.split(VALUE_SEPARATOR).map(v => v.trim()).filter(Boolean);
}

function getItemValues(value: string): string[] {
  if (!valid(value)) return [];
  return value.split(VALUE_SEPARATOR).map(v => v.trim());
}

function matchField(itemValue: string, filters: string[]): boolean {
  if (!filters.length) return true;
  if (!itemValue) return false;

  const values = getItemValues(itemValue);
  return filters.some(f => values.includes(f));
}


function getValue(item: CollectionItem, key: string): string {
  // 1. Intentar acceso directo (ej: item["brand"])
  let value = item[key as keyof CollectionItem];

  // 2. Si es undefined, intentar camelCase (ej: "Brand" -> "brand")
  if (value === undefined) {
    const camelKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof CollectionItem;
    value = item[camelKey];
  }

  return typeof value === "string" ? value : "";
}

// ===== HOOK =====
export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  // ===== NAV FILTERS =====
  const filtersState = useMemo(() => {
    const state: Record<string, string[]> = {};
    FILTER_KEYS.forEach(key => {
      // Intentamos obtener con prefijo nav_ o directo
      let vals = getArrayParam(searchParams, "nav_" + normalizeKey(key));
      if (!vals.length) {
        vals = getArrayParam(searchParams, normalizeKey(key));
      }
      state[key] = vals;
    });
    return state;
  }, [searchParams]);

  const hasNavigationFilters = useMemo(() => {
    return Object.values(filtersState).some(vals => vals.length > 0);
  }, [filtersState]);

  // ===== SIDEBAR FILTERS =====
  const sidebarState = useMemo(() => {
    const state: Record<string, string[]> = {};
    SIDEBAR_KEYS.forEach(key => {
      state[key] = getArrayParam(searchParams, normalizeKey(key));
    });
    return state;
  }, [searchParams]);

  const baseItems = collectionItems;

  // ===== FILTERED ITEMS =====
  const filteredItems = useMemo(() => {
    return baseItems.filter(item => {
      // 1. NAV (AND entre categorías)
      const matchesFilters = Object.entries(filtersState).every(
        ([key, values]) => matchField(getValue(item, key), values)
      );

      // 2. SIDEBAR (Lógica dinámica por llave)
      const matchesSidebar = SIDEBAR_KEYS.every(sideKey => {
        const selected = sidebarState[sideKey] || [];
        if (!selected.length) return true;

        // Caso especial: Details (Lógica de funciones)
        if (sideKey === "details") {
          return selected.every(detail => {
            const fn = DETAILS_FILTERS[detail];
            return fn ? fn(item as any) : true;
          });
        }

        // Caso especial: Custom (Mapeos lógicos)
        const custom = CUSTOM_FILTERS[sideKey];
        if (custom) {
          const itemValues = custom.getValues(item as any);
          return selected.some(v => itemValues.includes(v));
        }

        // Caso Normal: Comparación dinámica OR
        const itemValue = getValue(item, sideKey);
        const itemValuesArray = getItemValues(itemValue);
        return selected.some(s => itemValuesArray.includes(s));
      });

      // 3. SEARCH (Dinámico usando SEARCH_KEYS)
      const words = searchQuery.toLowerCase().split(" ").filter(Boolean);
      const matchesSearch = words.length === 0 || words.every(word =>
        SEARCH_KEYS.some(key => getValue(item, key).toLowerCase().includes(word))
      );

      return matchesFilters && matchesSidebar && matchesSearch;
    });
  }, [baseItems, filtersState, sidebarState, searchQuery]);

  // ===== FILTER OPTIONS (Dinámico) =====
  const filterOptions = useMemo(() => {
    const options: Record<string, { value: string; count: number }[]> = {};

    SIDEBAR_KEYS.forEach(key => {
      // Filtrado previo para conteos (Excluyendo la sección actual)
      const itemsForThisSection = baseItems.filter(item => {
        const matchesNav = Object.entries(filtersState).every(
          ([fKey, values]) => matchField(getValue(item, fKey), values)
        );
        if (!matchesNav) return false;

        const matchesOthers = SIDEBAR_KEYS.every(sideKey => {
          if (sideKey === key) return true;
          const selected = sidebarState[sideKey] || [];
          if (!selected.length) return true;
          
          if (sideKey === "details") {
             return selected.every(d => DETAILS_FILTERS[d]?.(item as any));
          }
          
          const custom = CUSTOM_FILTERS[sideKey];
          if (custom) return selected.some(v => custom.getValues(item as any).includes(v));

          return matchField(getValue(item, sideKey), selected);
        });

        return matchesOthers;
      });

      // Generar opciones según tipo de llave
      if (key === "details") {
        options[key] = Object.entries(DETAILS_FILTERS).map(([label, fn]) => ({
          value: label, count: itemsForThisSection.filter(i => fn(i)).length
        }));
      } else {
        const counts: Record<string, number> = {};
        const custom = CUSTOM_FILTERS[key];

        itemsForThisSection.forEach(item => {
          const values = custom 
            ? custom.getValues(item as any) 
            : getItemValues(getValue(item, key));
          
          values.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
        });

        options[key] = Object.entries(counts).map(([value, count]) => ({ value, count }));
      }
    });

    return options;
  }, [baseItems, filtersState, sidebarState]);

  // ===== TOGGLE =====

  const toggleFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    const normalizedKey = normalizeKey(key);
    
    // Obtenemos los valores actuales (ej: ["club", "national-team"])
    const currentValues = searchParams.get(normalizedKey)?.split(VALUE_SEPARATOR).filter(Boolean) || [];
    
    let nextValues: string[];
    if (currentValues.includes(value)) {
      // Si ya existe, lo quitamos
      nextValues = currentValues.filter(v => v !== value);
    } else {
      // Si no existe, lo agregamos al array
      nextValues = [...currentValues, value];
    }

    if (nextValues.length > 0) {
      newParams.set(normalizedKey, nextValues.join(VALUE_SEPARATOR));
    } else {
      newParams.delete(normalizedKey);
    }

    // Mantenemos el scroll y navegamos
    setSearchParams(newParams, { replace: true });
  };

  // ===== REMOVE =====
  const removeFilter = useCallback((key: string, value?: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      const normKey = normalizeKey(key);

      if (!value) {
        params.delete(normKey);
        return params;
      }

      const current = getArrayParam(params, normKey);
      const newValues = current.filter(v => v !== value);

      if (newValues.length) params.set(normKey, newValues.join(","));
      else params.delete(normKey);
      return params;
    });
  }, [setSearchParams]);

  // ===== CLEAR =====
  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // ===== CHIPS =====
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; value: string; label: string; displayKey: string }[] = [];

    Object.entries(sidebarState).forEach(([key, values]) => {
      values.forEach(value => {
        // 🔥 Formateamos la llave para que se vea bien en el chip
        let displayKey = key;
        if (CUSTOM_FILTERS[key]) displayKey = CUSTOM_FILTERS[key].label;
        else if (key === "details") displayKey = "Details";
        else displayKey = FIELD_MAP[key as keyof typeof FIELD_MAP] || (key.charAt(0).toUpperCase() + key.slice(1));

        chips.push({ key, value, label: value, displayKey });
      });
    });

    return chips;
  }, [sidebarState]);

return {
    filteredItems,
    filterOptions,
    selectedFilters: sidebarState,
    toggleFilter,
    removeFilter,
    clearAll,
    activeFilterChips,
    searchQuery,
    hasNavigationFilters,
    setSearchQuery: (q: string) => {
      setSearchParams(prev => {
        const params = new URLSearchParams(prev);
        if (q) params.set("q", q); else params.delete("q");
        return params;
      }, { replace: true });
    }
  };
}