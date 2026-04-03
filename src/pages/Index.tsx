import { useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { FilterSidebar } from '@/components/collection/FilterSidebar';
import { ActiveFilters } from '@/components/collection/ActiveFilters';
import { ItemGrid } from '@/components/collection/ItemGrid';
import { useFilters } from '@/hooks/useFilters';

type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest';

const SORT_LABELS: Record<SortOption, string> = {
  'name-asc': 'Name (A–Z)',
  'name-desc': 'Name (Z–A)',
  'newest': 'Newest',
  'oldest': 'Oldest',
};

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [sortOpen, setSortOpen] = useState(false);
  const filters = useFilters();

  const pageTitle = filters.activeProduct
    ? filters.activeProduct
    : filters.activeCategory
    ? filters.activeCategory
    : 'All Items';

  const sortedItems = [...filters.filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.displayName.localeCompare(b.displayName);
      case 'name-desc': return b.displayName.localeCompare(a.displayName);
      case 'newest': return b.season.localeCompare(a.season);
      case 'oldest': return a.season.localeCompare(b.season);
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <CollectionNavbar />
      <CollectionBreadcrumb category={filters.activeCategory} product={filters.activeProduct} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filters.filteredItems.length} of {filters.totalItems} items
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
              >
                {SORT_LABELS[sortBy]}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-card border border-border rounded-lg shadow-lg py-1 z-30">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setSortOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-accent/50 ${
                        sortBy === opt ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {SORT_LABELS[opt]}
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

        {/* Active filters ABOVE sidebar+grid */}
        <ActiveFilters
          chips={filters.activeFilterChips}
          onRemove={filters.removeFilter}
          onClearAll={filters.clearAll}
        />

        <div className="flex items-start gap-0 lg:gap-8">
          <FilterSidebar
            filterOptions={filters.filterOptions}
            selectedFilters={filters.selectedFilters}
            onToggleFilter={filters.toggleFilter}
            filterKeys={filters.FILTER_KEYS}
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
