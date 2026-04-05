import { useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { FilterSidebar } from '@/components/collection/FilterSidebar';
import { ActiveFilters } from '@/components/collection/ActiveFilters';
import { ItemGrid } from '@/components/collection/ItemGrid';
import { useFilters, collectionItems } from '@/hooks/useFilters';
import { SIDEBAR_KEYS } from '@/config/footballConfig'; // 🔥 Importar esto

type SortOption = 'default' | 'name-asc' | 'newest' | 'oldest';

const SORT_LABELS: Record<SortOption, string> = {
  'default': 'Default',
  'name-asc': 'Name',
  'newest': 'Season Newest',
  'oldest': 'Season Oldest',
};

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [sortOpen, setSortOpen] = useState(false);

  const filters = useFilters();
  const pageTitle = 'All Items';

  const sortedItems = [...filters.filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'default':
        return a.id.localeCompare(b.id);
      case 'name-asc':
        return a.displayName.localeCompare(b.displayName);
      case 'newest':
        return b.season.localeCompare(a.season);
      case 'oldest':
        return a.season.localeCompare(b.season);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <CollectionNavbar />

      <CollectionBreadcrumb
        filtersState={filters.selectedFilters}
        searchQuery={filters.searchQuery}
        data={collectionItems}
        matchField={(value, filtersArr) => {
          if (!filtersArr.length) return true;
          if (!value) return false;
          return filtersArr.includes(value);
        }}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filters.filteredItems.length} items
            </p>
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

        {/* 🔥 LÓGICA DE OCULTAR CHIPS (Active filters) */}
        {!filters.hasNavigationFilters && (
          <ActiveFilters
            chips={filters.activeFilterChips}
            onRemove={filters.removeFilter}
            onClearAll={filters.clearAll}
          />
        )}

        <div className="flex items-start gap-0 lg:gap-8">
          <FilterSidebar
            filterOptions={filters.filterOptions}
            selectedFilters={filters.selectedFilters}
            onToggleFilter={filters.toggleFilter}
            filterKeys={[...SIDEBAR_KEYS]} // 🔥 CORREGIDO: Antes tenías []
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
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