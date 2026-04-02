import { useState } from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { FilterSidebar } from '@/components/collection/FilterSidebar';
import { ActiveFilters } from '@/components/collection/ActiveFilters';
import { ItemGrid } from '@/components/collection/ItemGrid';
import { useFilters } from '@/hooks/useFilters';
import { Input } from '@/components/ui/input';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const filters = useFilters();

  const pageTitle = filters.activeProduct
    ? filters.activeProduct
    : filters.activeCategory
    ? filters.activeCategory
    : 'All Items';

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
          <button
            className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, team, brand, country..."
            value={filters.searchQuery}
            onChange={(e) => filters.setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9 text-sm"
          />
          {filters.searchQuery && (
            <button
              onClick={() => filters.setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <ActiveFilters
          chips={filters.activeFilterChips}
          onRemove={filters.removeFilter}
          onClearAll={filters.clearAll}
        />

        <div className="flex gap-0 lg:gap-8">
          <FilterSidebar
            filterOptions={filters.filterOptions}
            selectedFilters={filters.selectedFilters}
            detailFilterCounts={filters.detailFilterCounts}
            selectedDetailFilters={filters.selectedDetailFilters}
            onToggleFilter={filters.toggleFilter}
            onToggleDetailFilter={filters.toggleDetailFilter}
            filterKeys={filters.FILTER_KEYS}
            detailFilterKeys={filters.DETAIL_FILTER_KEYS}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="flex-1 min-w-0">
            <ItemGrid items={filters.filteredItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
