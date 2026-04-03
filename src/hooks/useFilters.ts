import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { CollectionItem, FilterKey, getTeamType } from '@/types/collection';
import { collectionItems } from '@/data/mockData';

const FILTER_KEYS: FilterKey[] = [
  'teamType', 'confederation', 'country', 'competition', 'team',
  'season', 'style', 'release', 'brand', 'technology', 'size',
];

const SEARCH_KEYS: (keyof CollectionItem)[] = [
  'displayName', 'team', 'competition', 'brand', 'country',
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

  const searchQuery = searchParams.get('q') || '';

  const baseItems = useMemo(() => {
    let items = collectionItems;
    if (activeCategory) items = items.filter(i => i.category === activeCategory);
    if (activeProduct) items = items.filter(i => i.product === activeProduct);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        SEARCH_KEYS.some(key => String(i[key]).toLowerCase().includes(q))
      );
    }
    return items;
  }, [activeCategory, activeProduct, searchQuery]);

  const filteredItems = useMemo(() => {
    return baseItems.filter(item => {
      for (const key of FILTER_KEYS) {
        const selected = selectedFilters[key];
        if (selected && selected.length > 0) {
          if (!selected.includes(getFilterValue(item, key))) return false;
        }
      }
      return true;
    });
  }, [baseItems, selectedFilters]);

  const filterOptions = useMemo(() => {
    const options: Record<string, { value: string; count: number }[]> = {};
    FILTER_KEYS.forEach(key => {
      const counts: Record<string, number> = {};
      baseItems.filter(item => {
        for (const k of FILTER_KEYS) {
          if (k === key) continue;
          const selected = selectedFilters[k];
          if (selected && selected.length > 0) {
            if (!selected.includes(getFilterValue(item, k))) return false;
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
  }, [baseItems, selectedFilters]);

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
    setSearchParams(() => {
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

  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; value: string; label: string }[] = [];
    Object.entries(selectedFilters).forEach(([key, values]) => {
      values.forEach(value => {
        chips.push({ key, value, label: value });
      });
    });
    return chips;
  }, [selectedFilters]);

  const setSearchQuery = useCallback((q: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (q) params.set('q', q);
      else params.delete('q');
      return params;
    });
  }, [setSearchParams]);

  return {
    filteredItems,
    filterOptions,
    selectedFilters,
    toggleFilter,
    removeFilter,
    clearAll,
    hasActiveFilters,
    activeFilterChips,
    activeCategory,
    activeProduct,
    setCategory,
    setProduct,
    searchQuery,
    setSearchQuery,
    totalItems: baseItems.length,
    FILTER_KEYS,
  };
}
