import { useRef, useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { FilterSidebar } from '@/components/collection/FilterSidebar';
import { ActiveFilters } from '@/components/collection/ActiveFilters';
import { ItemGrid } from '@/components/collection/ItemGrid';
import { useFilters, collectionItems } from '@/hooks/useFilters';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useElementSize } from '@/hooks/useElementSize';
import { 
  SIDEBAR_KEYS, 
  BREADCRUMB_RESOLVER, 
  NAVIGATION_BREADCRUMB, 
  SITE_METADATA, 
  generateNavGroups,
  SORT_CONFIG,
  SortOption,
  BREADCRUMB_LABELS,
} from '@/config/footballConfig';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

const NAV_HEIGHT = 56;

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  const scrollDir = useScrollDirection();
  const allFilters = useFilters();

  const { 
    filteredItems, 
    filterOptions, 
    sidebarState, 
    navState, 
    activeFilterChips, 
    searchQuery 
  } = allFilters;

  // --- LÓGICA DE ESTADO COMBINADO ---
  const combinedState = useMemo(() => ({ ...sidebarState, ...navState }), [sidebarState, navState]);

  // --- LÓGICA DE NAVEGACIÓN DINÁMICA ---
  const navGroups = useMemo(() => generateNavGroups(collectionItems), []);

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
    setSearchQuery: allFilters.setSearchQuery
  };

  // --- RESOLVER TÍTULO DINÁMICO (Contextual) ---
const getPageTitle = () => {
    if (searchQuery) return `Search: "${searchQuery}"`;

    // 1. Identificar la entidad actual para saber qué etiquetas usar
    const entityValue = combinedState.nav_entity?.[0] || combinedState.entity?.[0] || "";
    const activeHierarchy = BREADCRUMB_RESOLVER({ filtersState: combinedState }) || NAVIGATION_BREADCRUMB;
    
    const activeFilters = activeHierarchy
      .map(field => {
        const lowerField = field.toLowerCase();
        const value = combinedState[`nav_${lowerField}`]?.[0] || combinedState[lowerField]?.[0];
        
        if (!value) return null;

        // ⚡️ Lógica de sufijo personalizado
        const extraText = BREADCRUMB_LABELS[entityValue]?.[lowerField] || "";
        const finalLabel = `${value}${extraText}`;

        return { label: finalLabel, field: lowerField };
      })
      .filter(Boolean) as { label: string, field: string }[];

    if (activeFilters.length === 0) return 'All Items';

    const last = activeFilters[activeFilters.length - 1];

    // Si es nivel de Navbar (Entity/Product), solo mostramos el valor puro
    const isNavbarLevel = last.field === 'entity' || last.field === 'category' || last.field === 'product';
    if (activeFilters.length === 1 || isNavbarLevel) {
      return last.label;
    }

    const penultimate = activeFilters[activeFilters.length - 2];

    if (last.field === 'season') {
      return `${last.label} ${penultimate.label}`;
    }

    return `${last.label}`;
  };

  const pageTitle = getPageTitle();

  const headerRef = useRef<HTMLDivElement>(null);
  const { height: headerHeight } = useElementSize(headerRef);
  const stickyOffset = (isNavbarHidden ? 0 : NAV_HEIGHT) + headerHeight;

  // --- ORDENAMIENTO USANDO CONFIG ---
  const sortedItems = useMemo(() => {
    const config = SORT_CONFIG[sortBy];
    return [...filteredItems].sort(config.compare);
  }, [filteredItems, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle === 'All Items' ? SITE_METADATA.title : `${pageTitle} | ${SITE_METADATA.title}`}</title>
      </Helmet>

      <CollectionNavbar navGroups={navGroups} />

      <CollectionBreadcrumb
        filtersState={combinedState}
        searchQuery={searchQuery}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ZONA STICKY */}
        <div 
          ref={headerRef}
          style={{ top: isNavbarHidden ? 0 : NAV_HEIGHT }}
          className="sticky z-20 bg-background pt-2 transition-all duration-300 ease-in-out pb-3"
        >
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground tracking-tight">
                {pageTitle} ({filteredItems.length})
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                >
                  {SORT_CONFIG[sortBy].label}
                  <ChevronDown
                    className={cn("w-3.5 h-3.5 transition-transform", sortOpen && "rotate-180")}
                  />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-card border border-border rounded-lg shadow-lg py-1 z-30">
                    {(Object.keys(SORT_CONFIG) as SortOption[]).map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setSortOpen(false);
                        }}
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

              <button
                className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
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
            <ItemGrid items={sortedItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;