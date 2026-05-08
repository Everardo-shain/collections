import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { SlidersHorizontal, ChevronDown, LayoutGrid, BarChart3 } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // --- LÓGICA DE VISTA BASADA EN URL ---
  const viewMode = (searchParams.get('view') as 'gallery' | 'stats') || 'gallery';
  const activeStatsTable = searchParams.get('table') || null;

  const setViewMode = (mode: 'gallery' | 'stats') => {
    const newParams = new URLSearchParams(searchParams);
    if (mode === 'stats') {
      newParams.set('view', 'stats');
    } else {
      newParams.delete('view');
      newParams.delete('table'); // Limpiar tabla si volveмы al grid
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
    const urlParams = new URLSearchParams(window.location.search);

    // 1. Prioridad: Custom Label desde el state (para nav_ o attr_)
    if (location.state?.customLabel && location.state?.filterKey) {
      const lowKey = location.state.filterKey.toLowerCase();
      if (urlParams.has(`nav_${lowKey}`) || urlParams.has(`attr_${lowKey}`)) {
        return location.state.customLabel;
      }
    }

    // Helper para obtener valor de cualquier prefijo
    const getParamVal = (k: string) => {
      const lowerK = k.toLowerCase();
      return urlParams.get(`nav_${lowerK}`) || urlParams.get(`attr_${lowerK}`) || null;
    };

    // 2. Construcción de Composite Key (para Labels específicos/jerarquía)
    let compositeKey = BREADCRUMB_KEYS
      .map(k => getParamVal(k))
      .filter(v => v !== null && valid(v))
      .join(VALUE_SEPARATOR);

    if (!compositeKey && filteredItems.length > 0) {
      const firstItem = filteredItems[0];
      compositeKey = BREADCRUMB_KEYS
        .map(k => firstItem[k as keyof typeof firstItem] as string)
        .filter(valid)
        .join(VALUE_SEPARATOR);
    }

    const firstKeyValue = getParamVal(BREADCRUMB_KEYS[0]) || (filteredItems[0]?.entity) || "";
    const activeHierarchy = BREADCRUMB_RESOLVER({ filtersState: navState }) || NAVIGATION_BREADCRUMB;
    const hierarchyKeysLower = activeHierarchy.map(k => k.toLowerCase());

    // 3. Extraemos todas las llaves dinámicas de la URL (nav_ y attr_)
    const urlKeys = Array.from(urlParams.keys())
      .filter(k => k.startsWith('nav_') || k.startsWith('attr_'))
      .map(k => k.replace('nav_', '').replace('attr_', ''));

    const allActiveKeys = Array.from(new Set([...activeHierarchy, ...LINK_FIELDS, ...urlKeys]));

    const activeFilters = allActiveKeys
      .map(field => {
        const lowerField = field.toLowerCase();
        const value = getParamVal(lowerField);
        if (!value) return null;

        const isHierarchyField = hierarchyKeysLower.includes(lowerField);
        const specificLabels = BREADCRUMB_LABELS[compositeKey] || BREADCRUMB_LABELS[firstKeyValue];
        const extraText = isHierarchyField ? (specificLabels?.[lowerField] || "") : "";
        const combinedLabel = `${value}${extraText}`;
        
        // Formateo base (ej. limpieza de IDs o capitalización)
        let formattedLabel = formatDisplayValue(lowerField, combinedLabel);

        // --- LÓGICA DE PREFIJO PARA ATTR_ ---
        // Si el parámetro en la URL es attr_, le ponemos el nombre del campo
        if (urlParams.has(`attr_${lowerField}`)) {
          const fieldMap = (config.FIELD_MAP as any) || {};
          const fieldName = fieldMap[lowerField] || field.charAt(0).toUpperCase() + field.slice(1);
          formattedLabel = `${fieldName}: ${formattedLabel}`;
        }

        return { label: formattedLabel, field: lowerField };
      })
      .filter(Boolean) as { label: string; field: string }[];

    // 4. Retorno final
    if (activeFilters.length === 0) return 'All Items';
    
    const last = activeFilters[activeFilters.length - 1];
    const formatter = TITLE_FORMATTERS[last.field];
    
    return formatter ? formatter(last, activeFilters, compositeKey) : last.label;
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
        <meta name="description" content={metadata?.description || SITE_METADATA.description} />
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
            <div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground tracking-tight">
                {pageTitle} ({filteredItems.length})
              </h1>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3">
              <button
                className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground bg-card hover:bg-accent/50 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span> 
              </button>
              
              <div className="flex items-center gap-2 md:gap-3">
                <div className="inline-flex items-center rounded-lg border border-border p-0.5 bg-card">
                  <button
                    onClick={() => setViewMode('gallery')}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                      viewMode === 'gallery' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    style={viewMode === 'gallery' ? { backgroundColor: 'hsl(var(--accent-color))' } : undefined}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Gallery</span>
                  </button>
                  <button
                    onClick={() => setViewMode('stats')}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                      viewMode === 'stats' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    style={viewMode === 'stats' ? { backgroundColor: 'hsl(var(--accent-color))' } : undefined}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Stats</span>
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                  >
                    {SORT_CONFIG[sortBy].label}
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", sortOpen && "rotate-180")} />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-card border border-border rounded-lg shadow-lg py-1 z-30">
                      {(Object.keys(SORT_CONFIG) as SortOption[]).map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setSortBy(opt); setSortOpen(false); }}
                          className={cn(
                            "block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-accent/50",
                            sortBy === opt ? 'text-primary font-medium' : 'text-muted-foreground'
                          )}
                        >
                          {SORT_CONFIG[opt].label}
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

        <div className="flex items-start gap-0 lg:gap-8 mt-4">
          <FilterSidebar
            filterOptions={filterOptions}
            selectedFilters={sidebarState}
            onToggleFilter={filters.toggleFilter}
            filterKeys={[...SIDEBAR_KEYS]}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            stickyOffset={stickyOffset}
          />

          <div className="flex-1 min-w-0">
            {viewMode === 'gallery' ? (
              <ItemGrid items={sortedItems} />
            ) : (
              <StatsView
                items={sortedItems}
                sidebarState={sidebarState}
                activeTable={activeStatsTable}
                onChangeTable={handleStatsTableChange}
                onSelectValue={(key, value) => {
                  filters.toggleFilter(key, value);
                  // La navegación a 'gallery' ya ocurre dentro de StatsView 
                  // a través del handleRowClick que definimos anteriormente.
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;