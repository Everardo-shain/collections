import { useRef, useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { FilterSidebar } from '@/components/collection/FilterSidebar';
import { ActiveFilters } from '@/components/collection/ActiveFilters';
import { ItemGrid } from '@/components/collection/ItemGrid';
import { useFilters } from '@/hooks/useFilters';
import { useCollection } from '@/hooks/useCollection';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useElementSize } from '@/hooks/useElementSize';
import { SITE_METADATA, valid, formatDisplayValue, VALUE_SEPARATOR, SortOption } from '@/config';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

const NAV_HEIGHT = 56;

const Index = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

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

    if (location.state?.customLabel && location.state?.filterKey) {
      const key = `nav_${location.state.filterKey.toLowerCase()}`;
      if (urlParams.has(key)) return location.state.customLabel;
    }

    const getNavVal = (k: string) => {
      const lowerK = k.toLowerCase();
      return urlParams.has(`nav_${lowerK}`) ? urlParams.get(`nav_${lowerK}`) : null;
    };

    let compositeKey = BREADCRUMB_KEYS
      .map(k => getNavVal(k))
      .filter(v => v !== null && valid(v))
      .join(VALUE_SEPARATOR);

    if (!compositeKey && filteredItems.length > 0) {
      const firstItem = filteredItems[0];
      compositeKey = BREADCRUMB_KEYS
        .map(k => firstItem[k as keyof typeof firstItem] as string)
        .filter(valid)
        .join(VALUE_SEPARATOR);
    }

    const firstKeyValue = getNavVal(BREADCRUMB_KEYS[0]) || (filteredItems[0]?.entity) || "";

    const activeHierarchy = BREADCRUMB_RESOLVER({ filtersState: navState }) || NAVIGATION_BREADCRUMB;
    const hierarchyKeysLower = activeHierarchy.map(k => k.toLowerCase());

    const activeFilters = Array.from(new Set([...activeHierarchy, ...LINK_FIELDS]))
      .map(field => {
        const lowerField = field.toLowerCase();
        const value = getNavVal(lowerField);
        if (!value) return null;

        const isHierarchyField = hierarchyKeysLower.includes(lowerField);
        const specificLabels = BREADCRUMB_LABELS[compositeKey] || BREADCRUMB_LABELS[firstKeyValue];
        const extraText = isHierarchyField ? (specificLabels?.[lowerField] || "") : "";

        const combinedLabel = `${value}${extraText}`;
        const formattedLabel = formatDisplayValue(lowerField, combinedLabel);

        return { label: formattedLabel, field: lowerField };
      })
      .filter(Boolean) as { label: string; field: string }[];

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
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={metadata?.description || SITE_METADATA.description} />
        <meta property="og:type" content="website" />
        {metadata?.ogImage && <meta property="og:image" content={metadata.ogImage} />}
      </Helmet>

      <CollectionNavbar navGroups={navGroups} />

      <CollectionBreadcrumb filtersState={navState} searchQuery={searchQuery} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
