import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { SlidersHorizontal, ChevronDown, LayoutGrid, BarChart3, ArrowDownWideNarrow} from 'lucide-react';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { FilterSidebar } from '@/components/collection/FilterSidebar';
import { ActiveFilters } from '@/components/collection/ActiveFilters';
import { ItemGrid } from '@/components/collection/ItemGrid';
import { StatsView } from '@/components/collection/StatsView';
import { useFilters } from '@/hooks/useFilters';
import { useCollection } from '@/hooks/useCollection';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useElementSize } from '@/hooks/useElementSize';
import { SITE_METADATA, SortOption } from '@/config';
import { useLocation, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

const NAV_HEIGHT = 56;

const Index = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const viewMode = (searchParams.get('view') as 'gallery' | 'stats') || 'gallery';
  const activeStatsTable = searchParams.get('table') || null;

  const setViewMode = (mode: 'gallery' | 'stats') => {
    const newParams = new URLSearchParams(searchParams);
    if (mode === 'stats') {
      newParams.set('view', 'stats');
    } else {
      newParams.delete('view');
      newParams.delete('table');
    }
    setSearchParams(newParams);
  };

  const handleStatsTableChange = useCallback((key: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (key) {
      newParams.set('table', key);
    } else {
      newParams.delete('table');
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const scrollDir = useScrollDirection();
  const { config } = useCollection();
  
  const {
    SIDEBAR_KEYS,
    BREADCRUMB_RESOLVER,
    NAVIGATION_BREADCRUMB,
    generateNavGroups,
    SORT_CONFIG,
    BREADCRUMB_LABELS,
    BREADCRUMB_KEYS,
    LINK_FIELDS,
    TITLE_FORMATTERS,
    metadata, 
    valid, 
    formatDisplayValue, 
    VALUE_SEPARATOR
  } = config;

  const allFilters = useFilters();
  const {
    collectionItems,
    filteredItems,
    filterOptions,
    sidebarState,
    navState,
    activeFilterChips,
    searchQuery,
  } = allFilters;

  const navGroups = useMemo(() => generateNavGroups(collectionItems), [generateNavGroups, collectionItems]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isNavbarHidden = scrollDir === "down" && scrollY > 100;

  const filters = {
    toggleFilter: allFilters.toggleFilter,
    removeFilter: allFilters.removeFilter,
    clearAll: allFilters.clearAll,
    setSearchQuery: allFilters.setSearchQuery,
  };

const getPageTitle = () => {
    if (searchQuery) return `Search: "${searchQuery}"`;

    const safeKeys = typeof BREADCRUMB_KEYS !== 'undefined' ? BREADCRUMB_KEYS : [];
    
    if (location.state?.customLabel && location.state?.filterKey) {
      const lowKey = location.state.filterKey.toLowerCase();
      if (searchParams.has(`nav_${lowKey}`) || searchParams.has(`attr_${lowKey}`)) {
        return location.state.customLabel;
      }
    }

    const getParamVal = (k: string) => {
      if (!k) return null;
      const lowerK = k.toLowerCase();
      return searchParams.get(`nav_${lowerK}`) || searchParams.get(`attr_${lowerK}`) || null;
    };

    const compositeKey = safeKeys
      .map(k => getParamVal(k))
      .filter(v => v !== null && valid(v))
      .join(VALUE_SEPARATOR);

    const activeHierarchy = BREADCRUMB_RESOLVER({ filtersState: navState }) || NAVIGATION_BREADCRUMB;
    const hierarchyKeysLower = activeHierarchy.map(k => k.toLowerCase());

    const urlKeys = Array.from(searchParams.keys())
      .filter(k => k.startsWith('nav_') || k.startsWith('attr_'))
      .map(k => k.replace('nav_', '').replace('attr_', '').toLowerCase());

    // ✨ EL CAMBIO MÁGICO ESTÁ AQUÍ ✨
    // Ponemos urlKeys ANTES que LINK_FIELDS. Esto respeta el orden natural (Category > Product)
    const linkFieldsLower = typeof LINK_FIELDS !== 'undefined' ? LINK_FIELDS.map(f => f.toLowerCase()) : [];
    const allActiveKeys = [...hierarchyKeysLower, ...urlKeys, ...linkFieldsLower];
    
    // El Set elimina duplicados, dejando la primera aparición (que ahora será la correcta)
    const uniqueKeys = Array.from(new Set(allActiveKeys));

    const firstKeyName = safeKeys.length > 0 ? safeKeys[0] : null;
    const firstKeyValue = (firstKeyName ? getParamVal(firstKeyName) : null) || (filteredItems[0]?.entity) || "";

    const activeFilters = uniqueKeys
      .map(field => {
        const lowerField = field.toLowerCase();
        const value = getParamVal(lowerField);
        if (!value) return null;

        const isHierarchyField = hierarchyKeysLower.includes(lowerField);
        const labelsSource = (typeof BREADCRUMB_LABELS !== 'undefined' ? BREADCRUMB_LABELS : {}) as Record<string, any>;
        
        const specificLabels = labelsSource[compositeKey] || labelsSource[firstKeyValue];
        const extraText = isHierarchyField ? (specificLabels?.[lowerField] || "") : "";
        
        let formattedLabel = formatDisplayValue(lowerField, `${value}${extraText}`);

        const isFromAttribute = searchParams.has(`attr_${lowerField}`);
        
        if (isFromAttribute) {
          const fieldMap = (config.FIELD_MAP as any) || {};
          const fieldName = fieldMap[lowerField] || field.charAt(0).toUpperCase() + field.slice(1);
          formattedLabel = `${fieldName}: ${formattedLabel}`;
        }

        return { label: formattedLabel, field: lowerField, isHierarchy: isHierarchyField };
      })
      .filter(Boolean) as { label: string; field: string, isHierarchy: boolean }[];

    if (activeFilters.length === 0) return 'All Items';
    
    const hierarchyOnly = activeFilters.filter(f => f.isHierarchy);
    const target = hierarchyOnly.length > 0 
      ? hierarchyOnly[hierarchyOnly.length - 1] 
      : activeFilters[activeFilters.length - 1];

    const formattersSource = (typeof TITLE_FORMATTERS !== 'undefined' ? TITLE_FORMATTERS : {}) as Record<string, any>;
    const formatter = formattersSource[target.field];
    
    return (typeof formatter === 'function') 
      ? formatter(target, activeFilters, compositeKey) 
      : target.label;
  };

  const pageTitle = getPageTitle();
  const headerRef = useRef<HTMLDivElement>(null);
  const { height: headerHeight } = useElementSize(headerRef);
  const stickyOffset = (isNavbarHidden ? 0 : NAV_HEIGHT) + headerHeight;

  const sortedItems = useMemo(() => {
    const sortConfig = SORT_CONFIG[sortBy];
    return [...filteredItems].sort(sortConfig.compare);
  }, [filteredItems, sortBy, SORT_CONFIG]);

  const collectionTitle = metadata?.title || SITE_METADATA.title;
  const seoTitle = pageTitle === 'All Items' ? collectionTitle : `${pageTitle} | ${collectionTitle}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{seoTitle}</title>
        <link rel="icon" type="image/png" href={metadata?.favIcon || SITE_METADATA.favIcon} />
      </Helmet>

      <CollectionNavbar navGroups={navGroups} />
      <CollectionBreadcrumb filtersState={navState} searchQuery={searchQuery} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div
          ref={headerRef}
          style={{ top: isNavbarHidden ? 0 : NAV_HEIGHT }}
          className="sticky z-20 bg-background pt-2 transition-all duration-300 ease-in-out pb-3"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            
            {/* GRUPO IZQUIERDO: Título con Count integrado */}
            <div className="space-y-3">
              <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-baseline gap-2">
                <span>{pageTitle}</span>
                <span className="text-sm md:text-base font-medium text-muted-foreground tabular-nums">
                  [{filteredItems.length}]
                </span>
              </h1>
              
              {/* Desktop: Filters Button */}
              <div className="hidden md:flex items-center">
                <button
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200",
                    "bg-card hover:bg-accent/50",
                    sidebarOpen 
                      ? "border-primary text-primary ring-1 ring-primary/20" 
                      : "border-border text-foreground"
                  )}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <SlidersHorizontal className={cn("w-3.5 h-3.5 transition-transform", sidebarOpen && "scale-110")} />
                  <span>Filters</span> 
                </button>
              </div>
            </div>

            {/* TOOLBAR DERECHA / MOBILE */}
            <div className="flex items-center justify-between md:justify-end gap-2">
              {/* Mobile: Filters Button (Texto siempre visible) */}
              <div className="flex md:hidden items-center">
                <button
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                    "bg-card",
                    sidebarOpen ? "border-primary text-primary" : "border-border text-foreground"
                  )}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              </div>

              {/* Acciones comunes: View Mode y Sort */}
              <div className="flex items-center gap-2">
                {/* Toggle de Vista */}
                <div className="inline-flex items-center rounded-lg border border-border p-0.5 bg-card">
                  <button
                    onClick={() => setViewMode('gallery')}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 rounded-md text-sm font-medium transition-colors",
                      viewMode === 'gallery' ? "text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    style={viewMode === 'gallery' ? { backgroundColor: 'hsl(var(--accent-color))' } : undefined}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden lg:inline">Gallery</span>
                  </button>
                  <button
                    onClick={() => setViewMode('stats')}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 rounded-md text-sm font-medium transition-colors",
                      viewMode === 'stats' ? "text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    style={viewMode === 'stats' ? { backgroundColor: 'hsl(var(--accent-color))' } : undefined}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden lg:inline">Stats</span>
                  </button>
                </div>

                {/* Botón de Sort (Texto siempre visible) */}
                <div className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                      "bg-card outline-none",
                      "md:hover:bg-accent/50 active:bg-accent/80", 
                      sortOpen 
                        ? "border-primary text-primary ring-1 ring-primary/20 bg-accent/30" 
                        : "border-border text-foreground"
                    )}
                  >
                    <ArrowDownWideNarrow className={cn("w-4 h-4", sortOpen ? "text-primary" : "text-foreground")} />
                    <span className="font-normal">Sort</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform opacity-50", sortOpen && "rotate-180")} />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1.5 min-w-[180px] bg-card border border-border rounded-xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Sort by
                      </div>
                      {(Object.keys(SORT_CONFIG) as SortOption[]).map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setSortBy(opt); setSortOpen(false); }}
                          className={cn(
                            "flex items-center justify-between w-full text-left px-4 py-2 text-sm transition-colors hover:bg-accent/50",
                            sortBy === opt ? 'text-primary bg-primary/5 font-semibold' : 'text-muted-foreground'
                          )}
                        >
                          {SORT_CONFIG[opt].label}
                          {sortBy === opt && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          <ActiveFilters
            chips={activeFilterChips}
            onRemove={filters.removeFilter}
            onClearAll={filters.clearAll}
          />
        </div>

        {/* Optimización de transiciones en el contenedor principal */}
        <div className={cn(
          "flex items-start mt-4 transition-[padding,gap] duration-300 ease-in-out", 
          sidebarOpen ? "gap-0 lg:gap-8" : "gap-0"
        )}>
          <FilterSidebar
            filterOptions={filterOptions}
            selectedFilters={sidebarState}
            onToggleFilter={filters.toggleFilter}
            filterKeys={[...SIDEBAR_KEYS]}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            stickyOffset={stickyOffset}
          />

          <div className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
            <div className="animate-in fade-in duration-500">
              {viewMode === 'gallery' ? (
                <ItemGrid items={sortedItems} />
              ) : (
                <StatsView
                  items={sortedItems}
                  sidebarState={sidebarState}
                  activeTable={activeStatsTable}
                  onChangeTable={handleStatsTableChange}
                  onSelectValue={(key, value) => { filters.toggleFilter(key, value); }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;