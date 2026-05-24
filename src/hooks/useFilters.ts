import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  normalizeKey,
  cleanText,
  isMatch,
  CollectionItem,
  splitValue,
  joinValues
} from "@/utils/collectionUtils";

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { config } = useCollection();

  // --- EXTRAEMOS TODO DEL CONFIG DINÁMICO ---
  const {
    rawData,
    mapItem,
    SIDEBAR_KEYS,
    SEARCH_KEYS,
    CUSTOM_FILTERS,
    FIELD_MAP,
    valid,
    SEPARATORS_CONFIG = [], // 🚀 Recuperamos los separadores dinámicos
  } = config;

  const searchQuery = searchParams.get("q") || "";

  // --- HELPERS DINÁMICOS (Acceden a las reglas de la colección actual) ---
  
  // Modificado: Ahora delega la segmentación a splitValue usando SEPARATORS_CONFIG
  const getArrayParam = useCallback((params: URLSearchParams, paramKey: string, fieldKey: string): string[] => {
    const val = params.get(paramKey);
    if (!val) return [];
    
    return splitValue(fieldKey, val, SEPARATORS_CONFIG);
  }, [SEPARATORS_CONFIG]);

  // Modificado: Ahora delega la extracción a splitValue usando SEPARATORS_CONFIG
  const getItemValues = useCallback((value: string, key: string): string[] => {
    if (!valid(value)) return [];
    
    return splitValue(key, value, SEPARATORS_CONFIG);
  }, [valid, SEPARATORS_CONFIG]);

  const getValue = useCallback((item: CollectionItem, key: string): string => {
    let value = item[key];
    if (value === undefined) {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      value = item[camelKey];
    }
    return typeof value === "string" ? value : "";
  }, []);

  const matchField = useCallback((itemValue: string, filters: string[], key: string): boolean => {
    if (!filters.length) return true;
    if (!itemValue) return false;
    const values = getItemValues(itemValue, key).map(v => v.toLowerCase());
    return filters.some(f => values.includes(f.toLowerCase()));
  }, [getItemValues]);

  // --- 1. PROCESAMIENTO DE ITEMS ---
  const collectionItems: CollectionItem[] = useMemo(
    () => (rawData as Record<string, string>[]).map(mapItem),
    [rawData, mapItem]
  );

  // --- 2. ESTADOS DE FILTRADO (Nav y Sidebar) ---
  const navState = useMemo(() => {
    const state: Record<string, string[]> = {};
    Array.from(searchParams.keys()).forEach(paramKey => {
      if (paramKey.startsWith('nav_') || paramKey.startsWith('attr_')) {
        const pureKey = paramKey.replace('nav_', '').replace('attr_', '');
        const val = getArrayParam(searchParams, paramKey, pureKey);
        if (val.length > 0) {
          state[pureKey] = Array.from(new Set([...(state[pureKey] || []), ...val]));
        }
      }
    });
    return state;
  }, [searchParams, getArrayParam]);

  const sidebarState = useMemo(() => {
    const state: Record<string, string[]> = {};
    SIDEBAR_KEYS.forEach(key => {
      const norm = normalizeKey(key);
      const val = getArrayParam(searchParams, norm, key);
      if (val.length > 0) state[norm] = val;
    });
    return state;
  }, [searchParams, SIDEBAR_KEYS, getArrayParam]);

  const combinedState = useMemo(() => {
    const combined: Record<string, string[]> = { ...sidebarState };
    Object.entries(navState).forEach(([key, values]) => {
      combined[key] = Array.from(new Set([...(combined[key] || []), ...values]));
    });
    return combined;
  }, [sidebarState, navState]);

  // --- 3. LÓGICA DE FILTRADO ---
  const filteredItems = useMemo(() => {
    const searchWords = cleanText(searchQuery).split(" ").filter(Boolean);
    const isSearching = searchWords.length > 0;

    return collectionItems.filter(item => {
      if (isSearching) {
        const itemSearchText = SEARCH_KEYS.map(k => getValue(item, k)).join(" ");
        if (!isMatch(itemSearchText, searchWords)) return false;
      }
      
      return Object.entries(combinedState).every(([k, selectedValues]) => {
        if (!selectedValues.length) return true;
        const custom = CUSTOM_FILTERS[k];
        if (custom) return selectedValues.some(v => custom.getValues(item, custom).includes(v));
        return matchField(getValue(item, k), selectedValues, k);
      });
    });
  }, [collectionItems, combinedState, searchQuery, SEARCH_KEYS, CUSTOM_FILTERS, matchField, getValue]);

  // --- 4. CÁLCULO DE OPCIONES PARA EL SIDEBAR ---
  const filterOptions = useMemo(() => {
    const options: Record<string, { value: string; count: number }[]> = {};
    const searchWords = cleanText(searchQuery).split(" ").filter(Boolean);

    SIDEBAR_KEYS.forEach(key => {
      const normKey = normalizeKey(key);
      const custom = CUSTOM_FILTERS[key];

      const itemsForThisSection = collectionItems.filter(item => {
        if (searchWords.length > 0) {
          const itemSearchText = SEARCH_KEYS.map(k => getValue(item, k)).join(" ");
          if (!isMatch(itemSearchText, searchWords)) return false;
        }
        
        const matchesNav = Object.entries(navState).every(([k, v]) => matchField(getValue(item, k), v, k));
        if (!matchesNav) return false;

        return SIDEBAR_KEYS.every(sideKey => {
          const sKeyNorm = normalizeKey(sideKey);
          if (sKeyNorm === normKey) return true;
          const selected = sidebarState[sKeyNorm] || [];
          if (!selected.length) return true;
          const sideCustom = CUSTOM_FILTERS[sideKey];
          if (sideCustom) return selected.some(v => sideCustom.getValues(item, sideCustom).includes(v));
          return matchField(getValue(item, sKeyNorm), selected, sideKey);
        });
      });

      const counts: Record<string, number> = {};
      itemsForThisSection.forEach(item => {
        const vals = custom ? custom.getValues(item, custom) : getItemValues(getValue(item, key), key);
        if (vals.length > 0) vals.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
      });

      const selectedValues = sidebarState[normKey] || [];
      selectedValues.forEach(val => { if (!(val in counts)) counts[val] = 0; });

      let finalOptions = Object.entries(counts).map(([value, count]) => ({ value, count }));
      if (finalOptions.length === 1 && selectedValues.length === 0) {
        if (finalOptions[0].count === itemsForThisSection.length) finalOptions = [];
      }
      options[key] = finalOptions;
    });

    return options;
  }, [collectionItems, navState, sidebarState, searchQuery, SIDEBAR_KEYS, SEARCH_KEYS, CUSTOM_FILTERS, matchField, getValue, getItemValues]);

  // --- 5. CHIPS ACTIVOS ---
  const activeFilterChips = useMemo(() => {
    const chips: any[] = [];
    Object.entries(sidebarState).forEach(([key, values]) => {
      values.forEach(value => {
        const displayKey = CUSTOM_FILTERS[key]?.label || (FIELD_MAP as any)[key] || key;
        chips.push({ key, value, label: value, displayKey });
      });
    });
    return chips;
  }, [sidebarState, CUSTOM_FILTERS, FIELD_MAP]);

  // --- 6. ACCIONES (Toggle, Remove, Clear) ---
  const toggleFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    const normKey = normalizeKey(key);
    const current = getArrayParam(searchParams, normKey, key);
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    
    // 🎯 Reemplazamos join(VALUE_SEPARATOR) por el unificador multiplexado
    if (next.length) newParams.set(normKey, joinValues(key, next, SEPARATORS_CONFIG));
    else newParams.delete(normKey);
    
    setSearchParams(newParams, { replace: true });
  };

  const removeFilter = useCallback((key: string, value?: string) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      const normKey = normalizeKey(key);
      if (!value) { p.delete(normKey); return p; }
      const current = getArrayParam(p, normKey, key);
      const next = current.filter(v => v !== value);
      
      // 🎯 Reemplazamos join(VALUE_SEPARATOR) por el unificador multiplexado
      next.length ? p.set(normKey, joinValues(key, next, SEPARATORS_CONFIG)) : p.delete(normKey);
      return p;
    }, { replace: true });
  }, [setSearchParams, getArrayParam, SEPARATORS_CONFIG]);

  const clearAll = useCallback(() => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      Array.from(p.keys()).forEach(k => { 
        if (!k.startsWith('nav_') && !k.startsWith('attr_') && k !== 'q') p.delete(k); 
      });
      return p;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearchQuery = useCallback((q: string) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      q ? p.set("q", q) : p.delete("q");
      return p;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    collectionItems,
    filteredItems,
    filterOptions,
    sidebarState,
    navState,
    activeFilterChips,
    searchQuery,
    toggleFilter,
    removeFilter,
    clearAll,
    setSearchQuery,
  };
}