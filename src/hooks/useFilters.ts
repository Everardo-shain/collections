import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { CollectionItem, FilterKey, DetailFilterKey, getTeamType, deriveDetailFilter } from '@/types/collection';
import { collectionItems } from '@/data/mockData';

const FILTER_KEYS: FilterKey[] = [
  'teamType', 'confederation', 'country', 'competition', 'team',
  'season', 'style', 'release', 'brand', 'technology', 'size',
];

const DETAIL_FILTER_KEYS: DetailFilterKey[] = [
  'longSleeves', 'printed', 'withPatches', 'signed', 'inBox', 'collaboration',
];

function getFilterValue(item: CollectionItem, key: FilterKey): string {
  switch (key) {
    case 'teamType': return getTeamType(item.entity);
    case 'confederation': return item.confederation;
    case 'country': return item.country;
    case 'competition': return item.competition;
    case 'team': return item.team;
    case 'season': return item.season;
    case 'style': return item.style;
    case 'release': return item.release;
    case 'brand': return item.brand;
    case 'technology': return item.technology;
    case 'size': return item.size;
  }
}

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') || null;
  const activeProduct = searchParams.get('product') || null;

  const selectedFilters = useMemo(() => {
    const result: Record<string, string[]> = {};
    FILTER_KEYS.forEach(key => {
      const val = searchParams.get(key);
      if (val) result[key] = val.split(',');
    });
    return result;
  }, [searchParams]);

  const selectedDetailFilters = useMemo(() => {
    const result: Record<string, boolean> = {};
    DETAIL_FILTER_KEYS.forEach(key => {
      if (searchParams.get(key) === 'true') result[key] = true;
    });
    return result;
  }, [searchParams]);

  const baseItems = useMemo(() => {
    let items = collectionItems;
    if (activeCategory) items = items.filter(i => i.category === activeCategory);
    if (activeProduct) items = items.filter(i => i.product === activeProduct);
    return items;
  }, [activeCategory, activeProduct]);

  const filteredItems = useMemo(() => {
    return baseItems.filter(item => {
      for (const key of FILTER_KEYS) {
        const selected = selectedFilters[key];
        if (selected && selected.length > 0) {
          if (!selected.includes(getFilterValue(item, key))) return false;
        }
      }
      for (const key of DETAIL_FILTER_KEYS) {
        if (selectedDetailFilters[key]) {
          if (!deriveDetailFilter(item, key)) return false;
        }
      }
      return true;
    });
  }, [baseItems, selectedFilters, selectedDetailFilters]);

  const filterOptions = useMemo(() => {
    const options: Record<string, { value: string; count: number }[]> = {};
    FILTER_KEYS.forEach(key => {
      const counts: Record<string, number> = {};
      // Count based on items filtered by all OTHER filters
      baseItems.filter(item => {
        for (const k of FILTER_KEYS) {
          if (k === key) continue;
          const selected = selectedFilters[k];
          if (selected && selected.length > 0) {
            if (!selected.includes(getFilterValue(item, k))) return false;
          }
        }
        for (const k of DETAIL_FILTER_KEYS) {
          if (selectedDetailFilters[k]) {
            if (!deriveDetailFilter(item, k)) return false;
          }
        }
        return true;
      }).forEach(item => {
        const val = getFilterValue(item, key);
        counts[val] = (counts[val] || 0) + 1;
      });
      options[key] = Object.entries(counts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    });
    return options;
  }, [baseItems, selectedFilters, selectedDetailFilters]);

  const detailFilterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DETAIL_FILTER_KEYS.forEach(key => {
      counts[key] = baseItems.filter(item => {
        for (const k of FILTER_KEYS) {
          const selected = selectedFilters[k];
          if (selected && selected.length > 0) {
            if (!selected.includes(getFilterValue(item, k))) return false;
          }
        }
        for (const k of DETAIL_FILTER_KEYS) {
          if (k === key) continue;
          if (selectedDetailFilters[k]) {
            if (!deriveDetailFilter(item, k)) return false;
          }
        }
        return deriveDetailFilter(item, key);
      }).length;
    });
    return counts;
  }, [baseItems, selectedFilters, selectedDetailFilters]);

  const toggleFilter = useCallback((key: string, value: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      const current = params.get(key)?.split(',').filter(Boolean) || [];
      const idx = current.indexOf(value);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(value);
      }
      if (current.length === 0) {
        params.delete(key);
      } else {
        params.set(key, current.join(','));
      }
      return params;
    });
  }, [setSearchParams]);

  const toggleDetailFilter = useCallback((key: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (params.get(key) === 'true') {
        params.delete(key);
      } else {
        params.set(key, 'true');
      }
      return params;
    });
  }, [setSearchParams]);

  const removeFilter = useCallback((key: string, value?: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (value) {
        const current = params.get(key)?.split(',').filter(Boolean) || [];
        const filtered = current.filter(v => v !== value);
        if (filtered.length === 0) params.delete(key);
        else params.set(key, filtered.join(','));
      } else {
        params.delete(key);
      }
      return params;
    });
  }, [setSearchParams]);

  const clearAll = useCallback(() => {
    setSearchParams(prev => {
      const params = new URLSearchParams();
      const cat = prev.get('category');
      const prod = prev.get('product');
      if (cat) params.set('category', cat);
      if (prod) params.set('product', prod);
      return params;
    });
  }, [setSearchParams]);

  const setCategory = useCallback((cat: string | null) => {
    setSearchParams(prev => {
      const params = new URLSearchParams();
      if (cat) params.set('category', cat);
      return params;
    });
  }, [setSearchParams]);

  const setProduct = useCallback((prod: string | null) => {
    setSearchParams(prev => {
      const params = new URLSearchParams();
      const cat = prev.get('category');
      if (cat) params.set('category', cat);
      if (prod) params.set('product', prod);
      return params;
    });
  }, [setSearchParams]);

  const hasActiveFilters = Object.keys(selectedFilters).length > 0 || Object.keys(selectedDetailFilters).length > 0;

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; value: string; label: string }[] = [];
    Object.entries(selectedFilters).forEach(([key, values]) => {
      values.forEach(value => {
        chips.push({ key, value, label: value });
      });
    });
    Object.entries(selectedDetailFilters).forEach(([key]) => {
      const labels: Record<string, string> = {
        longSleeves: 'Long Sleeves',
        printed: 'Printed',
        withPatches: 'With Patches',
        signed: 'Signed',
        inBox: 'In Box',
        collaboration: 'Collaboration',
      };
      chips.push({ key, value: 'true', label: labels[key] || key });
    });
    return chips;
  }, [selectedFilters, selectedDetailFilters]);

  return {
    filteredItems,
    filterOptions,
    detailFilterCounts,
    selectedFilters,
    selectedDetailFilters,
    toggleFilter,
    toggleDetailFilter,
    removeFilter,
    clearAll,
    hasActiveFilters,
    activeFilterChips,
    activeCategory,
    activeProduct,
    setCategory,
    setProduct,
    totalItems: baseItems.length,
    FILTER_KEYS,
    DETAIL_FILTER_KEYS,
  };
}
