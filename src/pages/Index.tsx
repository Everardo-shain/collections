import { useRef, useState,useEffect } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { FilterSidebar } from '@/components/collection/FilterSidebar';
import { ActiveFilters } from '@/components/collection/ActiveFilters';
import { ItemGrid } from '@/components/collection/ItemGrid';
import { useFilters, collectionItems } from '@/hooks/useFilters';
import { useScrollDirection} from '@/hooks/useScrollDirection';
import { useElementSize} from '@/hooks/useElementSize';
import { SIDEBAR_KEYS, BREADCRUMB_RESOLVER, NAVIGATION_BREADCRUMB, SITE_METADATA} from '@/config/footballConfig'; // 🔥 Importar esto
import { cn } from '@/lib/utils'; // Asegúrate de tener este import
import { Helmet } from 'react-helmet-async';

type SortOption = 'default' | 'name-asc' | 'newest' | 'oldest';

const SORT_LABELS: Record<SortOption, string> = {
  'default': 'Default',
  'name-asc': 'Name',
  'newest': 'Season Newest',
  'oldest': 'Season Oldest',
};

const NAV_HEIGHT = 56;

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0); // Movidizo adentro
  
  const scrollDir = useScrollDirection(); // Movidizo adentro
  

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isNavbarHidden = scrollDir === "down" && scrollY > 100;
  const allFilters = useFilters();

  const { 
    filteredItems, 
    filterOptions, 
    sidebarState, 
    navState, 
    activeFilterChips, 
    searchQuery 
  } = allFilters;

  // Y el resto de funciones las agrupamos manualmente si el "..." falla
  const filters = {
    toggleFilter: allFilters.toggleFilter,
    removeFilter: allFilters.removeFilter,
    clearAll: allFilters.clearAll,
    setSearchQuery: allFilters.setSearchQuery
  };

  // ... dentro del componente Index, después de obtener navState, sidebarState y searchQuery

// 1. Consolidamos todos los filtros activos
  const combinedState = { ...sidebarState, ...navState };

  // 2. Obtenemos la jerarquía que aplica (la de la Entidad o la del Navbar por defecto)
  const activeHierarchy = BREADCRUMB_RESOLVER({ filtersState: combinedState }) || NAVIGATION_BREADCRUMB;

  // 3. CASO ÚNICO: Encontrar el "último nivel"
  const getPageTitle = () => {
    // Si hay búsqueda, ella manda como nivel final
    if (searchQuery) return `Search: "${searchQuery}"`;

    // Filtramos la jerarquía para ver qué campos tienen valores seleccionados
    const activeValues = activeHierarchy
      .map(field => combinedState[field.toLowerCase()]?.[0])
      .filter(Boolean); // Quitamos los que están vacíos

    // El título es el último valor encontrado, o "All Items" si no hay nada
    return activeValues.length > 0 
      ? activeValues[activeValues.length - 1] 
      : 'All Items';
  };

  const pageTitle = getPageTitle();

  const headerRef = useRef<HTMLDivElement>(null);
  const { height: headerHeight } = useElementSize(headerRef);
  const stickyOffset = (isNavbarHidden ? 0 : NAV_HEIGHT) + headerHeight;

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'default':
        return a.id.localeCompare(b.id);
      case 'name-asc':
        return a.displayName.localeCompare(b.displayName);
      case 'newest':
        // Añadimos un fallback '' para evitar errores si season es undefined
        return (b.season || '').localeCompare(a.season || '');
      case 'oldest':
        return (a.season || '').localeCompare(b.season || '');
      default:
        return 0;
    }
  });

return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle === 'All Items' ? SITE_METADATA.title : `${pageTitle} | ${SITE_METADATA.title}`}</title>
      </Helmet>
      <CollectionNavbar />

      <CollectionBreadcrumb
        filtersState={{ ...sidebarState, ...navState }}
        searchQuery={searchQuery}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 🔥 INICIO DE ZONA STICKY */}
        {/* Usamos top-0 o la altura de tu navbar si es fijo. 
            bg-background es vital para que los items no se trasluzcan por debajo */}
        <div 
          ref={headerRef}
          style={{ top: isNavbarHidden ? 0 : NAV_HEIGHT }}
          className="sticky z-20 bg-background pt-2 transition-all duration-300 ease-in-out pb-3"
        >
          
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground tracking-tight">
                {pageTitle} ({filteredItems.length})
              </h1>
              {/* <p className="text-sm text-muted-foreground mt-1">
                {filters.filteredItems.length} items
              </p> */}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                >
                  {SORT_LABELS[sortBy]}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      sortOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-card border border-border rounded-lg shadow-lg py-1 z-30">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setSortOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-accent/50 ${
                          sortBy === opt
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {SORT_LABELS[opt]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile filters */}
              <button
                className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Active filters dentro de la zona sticky */}
          <ActiveFilters
            chips={activeFilterChips}
            onRemove={filters.removeFilter}
            onClearAll={filters.clearAll}
          />
          
        </div>
        {/* 🔥 FIN DE ZONA STICKY */}

        <div className="flex items-start gap-0 lg:gap-8 mt-4">
          <FilterSidebar
            filterOptions={filterOptions}
            // 3. El Sidebar solo necesita saber qué checkboxes marcar
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