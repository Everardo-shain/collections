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

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const filtersState = useMemo(() => {
    const state: Record<string, string[]> = {};
    FILTER_KEYS.forEach(key => {
      const norm = normalizeKey(key);
      let vals = getArrayParam(searchParams, "nav_" + norm);
      if (!vals.length) vals = getArrayParam(searchParams, norm);
      state[key] = vals;
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

  const filteredItems = useMemo(() => {
    return collectionItems.filter(item => {
      const mNav = Object.entries(filtersState).every(([k, v]) => matchField(getValue(item, k), v));
      
      const mSide = SIDEBAR_KEYS.every(sideKey => {
        const selected = sidebarState[sideKey] || [];
        if (!selected.length) return true;
        if (sideKey === "details") return selected.some(d => DETAILS_FILTERS[d]?.(item as any));
        const custom = CUSTOM_FILTERS[sideKey];
        if (custom) return selected.some(v => custom.getValues(item as any).includes(v));
        return matchField(getValue(item, sideKey), selected);
      });

      const words = searchQuery.toLowerCase().split(" ").filter(Boolean);
      const mSearch = words.length === 0 || words.every(w =>
        SEARCH_KEYS.some(k => getValue(item, k).toLowerCase().includes(w))
      );

      return mNav && mSide && mSearch;
    });
  }, [filtersState, sidebarState, searchQuery]);

  // 4. 🔥 CORRECCIÓN CRÍTICA: filterOptions (Ignorar la propia categoría en Nav y Sidebar)
  const filterOptions = useMemo(() => {
    const options: Record<string, { value: string; count: number }[]> = {};

    SIDEBAR_KEYS.forEach(key => {
      const normKey = normalizeKey(key);

      const itemsForThisSection = collectionItems.filter(item => {
        // Ignorar el filtro nav de la misma categoría
        const matchesNav = Object.entries(filtersState).every(([k, v]) => {
          if (normalizeKey(k) === normKey) return true; 
          return matchField(getValue(item, k), v);
        });
        if (!matchesNav) return false;

        // Ignorar el filtro sidebar de la misma categoría
        return SIDEBAR_KEYS.every(sideKey => {
          if (normalizeKey(sideKey) === normKey) return true; 
          const selected = sidebarState[sideKey] || [];
          if (!selected.length) return true;
          
          if (sideKey === "details") return selected.some(d => DETAILS_FILTERS[d]?.(item as any));
          const custom = CUSTOM_FILTERS[sideKey];
          if (custom) return selected.some(v => custom.getValues(item as any).includes(v));
          return matchField(getValue(item, sideKey), selected);
        });
      });

if (key === "details") {
        options[key] = Object.entries(DETAILS_FILTERS)
          .map(([label, fn]) => ({
            value: label, count: itemsForThisSection.filter(i => fn(i)).length
          }))
          .filter(opt => opt.count > 0); // 🔥 AÑADIDO: Filtramos para que no salgan los de count cero
      } else {
        const counts: Record<string, number> = {};
        const custom = CUSTOM_FILTERS[key];
        itemsForThisSection.forEach(item => {
          const vals = custom ? custom.getValues(item as any) : getItemValues(getValue(item, key));
          vals.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
        });
        options[key] = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([value, count]) => ({ value, count }));
      }
    });

    return options;
  }, [filtersState, sidebarState]);

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


  return {
    filteredItems, filterOptions, selectedFilters: sidebarState,
    toggleFilter, removeFilter, clearAll: () => setSearchParams(new URLSearchParams()),
    activeFilterChips, searchQuery,
    setSearchQuery: (q: string) => setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (q) p.set("q", q); else p.delete("q");
      return p;
    }, { replace: true })
  };
}