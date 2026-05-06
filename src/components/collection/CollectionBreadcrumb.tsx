import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { valid, getDynamicValue, CollectionItem } from "@/config";
import { useCollection } from "@/hooks/useCollection";

interface BreadcrumbProps {
  filtersState?: Record<string, string[]>;
  searchQuery?: string;
  item?: CollectionItem;
  firstItem?: CollectionItem;
}

export function CollectionBreadcrumb({
  filtersState = {},
  searchQuery = "",
  item,
}: BreadcrumbProps) {
  const { search, state } = useLocation();
  const { collectionId, config } = useCollection();
  const { BREADCRUMB_RESOLVER, NAVIGATION_CONFIG, LINK_FIELDS } = config;
  const baseHref = `/view/${collectionId}`;

  const crumbs: { label: string; to?: string; key: string }[] = [];

  crumbs.push({ label: "", to: baseHref, key: "home" });

  if (item) {
    const configKeys = BREADCRUMB_RESOLVER({ item });
    if (configKeys) {
      const currentParams = new URLSearchParams();
      configKeys.forEach((key) => {
        const val = getDynamicValue(item, key);
        if (valid(val)) {
          const levelParams = new URLSearchParams(currentParams.toString());
          levelParams.set(`nav_${key.toLowerCase()}`, val);
          crumbs.push({ label: val, to: `${baseHref}?${levelParams.toString()}`, key: key.toLowerCase() });
          currentParams.set(`nav_${key.toLowerCase()}`, val);
        }
      });
    }
  } else if (searchQuery) {
    crumbs.push({ label: `Search: "${searchQuery}"`, key: "search" });
  } else {
    const urlParams = new URLSearchParams(search);
    const configKeys = BREADCRUMB_RESOLVER({ filtersState }) || [];
    const knownKeys = Array.from(new Set([...NAVIGATION_CONFIG.hierarchy, ...configKeys, ...LINK_FIELDS]));
    const currentParams = new URLSearchParams();
    const processedKeys = new Set<string>();

    // 1. Primero procesamos las llaves conocidas para mantener el orden jerárquico lógico
    knownKeys.forEach((key) => {
      const lowKey = key.toLowerCase();
      const navKey = `nav_${lowKey}`;
      if (urlParams.has(navKey)) {
        const val = urlParams.get(navKey) || "";
        if (valid(val)) {
          const linkParams = new URLSearchParams(currentParams.toString());
          linkParams.set(navKey, val);
          crumbs.push({ label: val, to: `${baseHref}?${linkParams.toString()}`, key: lowKey });
          currentParams.set(navKey, val);
          processedKeys.add(navKey);
        }
      }
    });

    // 2. Después procesamos CUALQUIER OTRA llave nav_ que no estuviera en la config
    Array.from(urlParams.keys()).forEach((paramKey) => {
      if (paramKey.startsWith('nav_') && !processedKeys.has(paramKey)) {
        const pureKey = paramKey.replace('nav_', '');
        const val = urlParams.get(paramKey) || "";
        if (valid(val)) {
          const linkParams = new URLSearchParams(currentParams.toString());
          linkParams.set(paramKey, val);
          crumbs.push({ label: val, to: `${baseHref}?${linkParams.toString()}`, key: pureKey });
          currentParams.set(paramKey, val);
        }
      }
    });

    if (crumbs.length === 1) crumbs.push({ label: "All Items", key: "all" });
  }
  return (
    <nav className="bg-secondary/50 border-b border-border relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-2 text-sm overflow-x-auto scrollbar-hide">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          const isHome = i === 0;

          let displayLabel = isHome ? "" : crumb.label;
          if (state?.customLabel && state?.filterKey === crumb.key) {
            displayLabel = state.customLabel;
          }

          return (
            <span key={i} className="flex items-center gap-2 flex-shrink-0">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              {!isLast || item ? (
                <Link to={crumb.to || baseHref} className="text-muted-foreground hover:text-primary transition-colors">
                  {isHome ? <Home className="w-4 h-4" /> : displayLabel}
                </Link>
              ) : (
                <span className="text-primary font-medium">
                  {displayLabel}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
