import {
  FILTER_KEYS,
  SIDEBAR_KEYS,
  SEARCH_KEYS,
  LINK_FIELDS,
  CUSTOM_FILTERS,
  DETAILS_FILTERS,
  VALUE_SEPARATOR,
  valid,
  normalizeKey, 
  FIELD_MAP,
  CollectionItem     
} from "@/config/footballConfig";

import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import rawData from "@/data/json_files/football_collection - Collection.json";
import { mapItem } from "@/utils/mapItem";

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

const cleanText = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .trim();
};

const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const isMatch = (itemValue: string, searchWords: string[]) => {
  const normalizedValue = cleanText(itemValue);
  const itemParts = normalizedValue.split(" ");
  return searchWords.every(word => {
    if (normalizedValue.includes(word)) return true;
    return itemParts.some(part => {
      if (word.length <= 3) return part === word;
      const distance = getLevenshteinDistance(word, part);
      const maxErrors = word.length <= 6 ? 1 : 2;
      return distance <= maxErrors;
    });
  });
};

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const navState = useMemo(() => {
    const state: Record<string, string[]> = {};
    const allNavigableKeys = Array.from(new Set([...FILTER_KEYS, ...LINK_FIELDS]));
    allNavigableKeys.forEach(key => {
      const norm = normalizeKey(key);
      const withPrefix = getArrayParam(searchParams, "nav_" + norm);
      if (withPrefix.length > 0) state[norm] = withPrefix;
    });
    return state;
  }, [searchParams]);

  const sidebarState = useMemo(() => {
    const state: Record<string, string[]> = {};
    SIDEBAR_KEYS.forEach(key => {
      const norm = normalizeKey(key);
      const val = getArrayParam(searchParams, norm);
      if (val.length > 0) state[norm] = val;
    });
    return state;
  }, [searchParams]);

  const combinedState = useMemo(() => {
    const combined: Record<string, string[]> = { ...sidebarState };
    Object.entries(navState).forEach(([key, values]) => {
      if (values.length > 0) {
        combined[key] = Array.from(new Set([...(combined[key] || []), ...values]));
      }
    });
    return combined;
  }, [sidebarState, navState]);

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
        const pureKey = k.startsWith('nav_') ? k.replace('nav_', '') : k;
        if (pureKey === "details") return selectedValues.some(d => DETAILS_FILTERS[d]?.(item as any));
        const custom = CUSTOM_FILTERS[pureKey];
        if (custom) return selectedValues.some(v => custom.getValues(item as any, custom).includes(v));
        return matchField(getValue(item, pureKey), selectedValues);
      });
    });
  }, [combinedState, searchQuery]);

  const filterOptions = useMemo(() => {
    const options: Record<string, { value: string; count: number }[]> = {};
    const searchWords = cleanText(searchQuery).split(" ").filter(Boolean);

    SIDEBAR_KEYS.forEach(key => {
      const normKey = normalizeKey(key);

      const itemsForThisSection = collectionItems.filter(item => {
        // A. Lógica con Búsqueda
        if (searchWords.length > 0) {
          const itemSearchText = SEARCH_KEYS.map(k => getValue(item, k)).join(" ");
          if (!isMatch(itemSearchText, searchWords)) return false;

          return SIDEBAR_KEYS.every(sideKey => {
            const sKeyNorm = normalizeKey(sideKey);
            if (sKeyNorm === normKey) return true;
            const selected = sidebarState[sKeyNorm] || [];
            if (!selected.length) return true;
            if (sKeyNorm === "details") return selected.some(d => DETAILS_FILTERS[d]?.(item as any));
            const custom = CUSTOM_FILTERS[sKeyNorm];
            if (custom) return selected.some(v => custom.getValues(item as any, custom).includes(v));
            return matchField(getValue(item, sKeyNorm), selected);
          });
        }

        // B. Lógica con Navegación
        const matchesNav = Object.entries(navState).every(([k, v]) => matchField(getValue(item, k), v));
        if (!matchesNav) return false;

        // C. Filtros del Sidebar
        return SIDEBAR_KEYS.every(sideKey => {
          const sKeyNorm = normalizeKey(sideKey);
          if (sKeyNorm === normKey) return true;
          const selected = sidebarState[sKeyNorm] || [];
          if (!selected.length) return true;
          if (sKeyNorm === "details") return selected.some(d => DETAILS_FILTERS[d]?.(item as any));
          const custom = CUSTOM_FILTERS[sKeyNorm];
          if (custom) return selected.some(v => custom.getValues(item as any, custom).includes(v));
          return matchField(getValue(item, sKeyNorm), selected);
        });
      });

      // --- CÁLCULO DE CONTEOS ---
      if (key === "details") {
        let detailsOpts = Object.entries(DETAILS_FILTERS)
          .map(([label, fn]) => ({
            value: label, 
            count: itemsForThisSection.filter(i => fn(i)).length
          }))
          .filter(opt => opt.count > 0 || sidebarState["details"]?.includes(opt.value));

        // 🔥 Lógica de ocultado para Details:
        // Si solo hay 1 opción y esa opción aplica a TODOS los items que estamos viendo,
        // no sirve de nada mostrarla (a menos que el usuario ya la haya marcado).
        if (detailsOpts.length === 1) {
          const isSelected = sidebarState["details"]?.includes(detailsOpts[0].value);
          const appliesToAll = detailsOpts[0].count === itemsForThisSection.length;
          
          if (!isSelected && appliesToAll) {
            detailsOpts = [];
          }
        }

        options[key] = detailsOpts;
      } else {
        const counts: Record<string, number> = {};
        const custom = CUSTOM_FILTERS[key];
        let totalValidsForThisSection = 0;

        itemsForThisSection.forEach(item => {
          const vals = custom ? custom.getValues(item as any, custom) : getItemValues(getValue(item, key));
          if (vals.length > 0) {
            totalValidsForThisSection++;
            vals.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
          }
        });

        // 🔥 CRÍTICO: Inyectar valores seleccionados con count 0 si no están en los resultados actuales
        const selectedValues = sidebarState[normKey] || [];
        selectedValues.forEach(val => {
          if (!(val in counts)) counts[val] = 0;
        });

        let finalOptions = Object.entries(counts)
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b[1] - a[1]);

        // Solo ocultar la sección si realmente no hay nada útil que mostrar Y nada seleccionado
        if (finalOptions.length === 1 && selectedValues.length === 0) {
            if (finalOptions[0].count === totalValidsForThisSection) {
                finalOptions = [];
            }
        }

        options[key] = finalOptions;
      }
    });

    return options;
  }, [navState, sidebarState, searchQuery]);

  const activeFilterChips = useMemo(() => {
    const chips: any[] = [];
    Object.entries(sidebarState).forEach(([key, values]) => {
      values.forEach(value => {
        let displayKey = CUSTOM_FILTERS[key]?.label || (key === "details" ? "Details" : (FIELD_MAP as any)[key]) || key;
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

  const clearAll = useCallback(() => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      Array.from(p.keys()).forEach(key => {
        if (!key.startsWith('nav_') && key !== 'q') p.delete(key);
      });
      return p;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    filteredItems, filterOptions, sidebarState, navState, activeFilterChips, searchQuery,
    toggleFilter, removeFilter, clearAll,
    setSearchQuery: (q: string) => setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (q) p.set("q", q); else p.delete("q");
      return p;
    }, { replace: true })
  };
}