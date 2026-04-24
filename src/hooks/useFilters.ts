import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import {
  VALUE_SEPARATOR,
  valid,
  normalizeKey,
  cleanText,
  isMatch,
  CollectionItem,
} from "@/config";
import { useCollection } from "@/hooks/useCollection";

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

  const { config } = useCollection();
  const {
    rawData,
    mapItem,
    FILTER_KEYS,
    SIDEBAR_KEYS,
    SEARCH_KEYS,
    LINK_FIELDS,
    CUSTOM_FILTERS,
    FIELD_MAP,
  } = config;

  const collectionItems: CollectionItem[] = useMemo(
    () => (rawData as Record<string, string>[]).map(mapItem),
    [rawData, mapItem]
  );

  // 1. ESTADOS DESDE URL
  const navState = useMemo(() => {
    const state: Record<string, string[]> = {};
    Array.from(new Set([...FILTER_KEYS, ...LINK_FIELDS])).forEach(key => {
      const norm = normalizeKey(key);
      const val = getArrayParam(searchParams, "nav_" + norm);
      if (val.length > 0) state[norm] = val;
    });
    return state;
  }, [searchParams, FILTER_KEYS, LINK_FIELDS]);

  const sidebarState = useMemo(() => {
    const state: Record<string, string[]> = {};
    SIDEBAR_KEYS.forEach(key => {
      const norm = normalizeKey(key);
      const val = getArrayParam(searchParams, norm);
      if (val.length > 0) state[norm] = val;
    });
    return state;
  }, [searchParams, SIDEBAR_KEYS]);

  const combinedState = useMemo(() => {
    const combined: Record<string, string[]> = { ...sidebarState };
    Object.entries(navState).forEach(([key, values]) => {
      combined[key] = Array.from(new Set([...(combined[key] || []), ...values]));
    });
    return combined;
  }, [sidebarState, navState]);

  // 2. FILTRADO
  const filteredItems = useMemo(() => {
    const searchWords = cleanText(searchQuery).split(" ").filter(Boolean);
    const isSearching = searchWords.length > 0;

    return collectionItems.filter(item => {
      if (isSearching) {
        const itemSearchText = SEARCH_KEYS.map(k => getValue(item, k)).join(" ");
        return isMatch(itemSearchText, searchWords);
      }
      return Object.entries(combinedState).every(([k, selectedValues]) => {
        if (!selectedValues.length) return true;
        const pureKey = k.replace('nav_', '');
        const custom = CUSTOM_FILTERS[pureKey];
        if (custom) return selectedValues.some(v => custom.getValues(item, custom).includes(v));
        return matchField(getValue(item, pureKey), selectedValues);
      });
    });
  }, [collectionItems, combinedState, searchQuery, SEARCH_KEYS, CUSTOM_FILTERS]);

  // 3. OPCIONES
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
        const matchesNav = Object.entries(navState).every(([k, v]) => matchField(getValue(item, k), v));
        if (!matchesNav) return false;

        return SIDEBAR_KEYS.every(sideKey => {
          const sKeyNorm = normalizeKey(sideKey);
          if (sKeyNorm === normKey) return true;
          const selected = sidebarState[sKeyNorm] || [];
          if (!selected.length) return true;
          const sideCustom = CUSTOM_FILTERS[sideKey];
          if (sideCustom) return selected.some(v => sideCustom.getValues(item, sideCustom).includes(v));
          return matchField(getValue(item, sKeyNorm), selected);
        });
      });

      const counts: Record<string, number> = {};
      itemsForThisSection.forEach(item => {
        const vals = custom ? custom.getValues(item, custom) : getItemValues(getValue(item, key));
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
  }, [collectionItems, navState, sidebarState, searchQuery, SIDEBAR_KEYS, SEARCH_KEYS, CUSTOM_FILTERS]);

  // 4. CHIPS
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
      next.length ? p.set(normKey, next.join(VALUE_SEPARATOR)) : p.delete(normKey);
      return p;
    }, { replace: true });
  }, [setSearchParams]);

  const clearAll = useCallback(() => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      Array.from(p.keys()).forEach(k => { if (!k.startsWith('nav_') && k !== 'q') p.delete(k); });
      return p;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    collectionItems,
    filteredItems, filterOptions, sidebarState, navState, activeFilterChips, searchQuery,
    toggleFilter, removeFilter, clearAll,
    setSearchQuery: (q: string) => setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      q ? p.set("q", q) : p.delete("q");
      return p;
    }, { replace: true }),
  };
}
