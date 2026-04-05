import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

import { BREADCRUMB_RESOLVER } from "@/config/footballConfig";

import { CollectionItem } from '@/types/collection';

interface BreadcrumbProps {
  filtersState: Record<string, string[]>;
  searchQuery: string;
  data: CollectionItem[];
  matchField: (itemValue: string, filterArray: string[], key: string) => boolean;
}

export function CollectionBreadcrumb({
  filtersState,
  searchQuery,
  data,
  matchField,
}: BreadcrumbProps) {
  const crumbs: { label: string; to?: string }[] = [];

  // ===== HOME =====
  crumbs.push({ label: "Home", to: "/" });

  const hasSearch = !!searchQuery;
  const hasCategory = filtersState.category?.length > 0;
  const hasProduct = filtersState.product?.length > 0;

  const hasOtherFilters = Object.entries(filtersState).some(
    ([key, values]) =>
      !["category", "product"].includes(key) && values.length > 0
  );

  // ===== 1. SEARCH =====
  if (hasSearch) {
    crumbs.push({ label: `Search: "${searchQuery}"` });
  }

  // ===== 2. NAVIGATION =====
  else if (hasCategory) {
    const category = filtersState.category[0];

    crumbs.push({
      label: category,
      to: `/?category=${encodeURIComponent(category)}`,
    });

    if (hasProduct) {
      const product = filtersState.product[0];

      crumbs.push({
        label: product,
        to: `/?category=${encodeURIComponent(
          category
        )}&product=${encodeURIComponent(product)}`,
      });
    }
  }

  // ===== 3. FILTERS =====
  else if (hasOtherFilters) {
    const config = BREADCRUMB_RESOLVER({
      filtersState,
      data,
      matchField,
    });

    if (config) {
      const currentParams = new URLSearchParams();

      config.forEach((key) => {
        const lowerKey = key.toLowerCase();
        const values = filtersState[lowerKey];

        if (!values?.length) return;

        const value = values[0];

        currentParams.set(`nav_${lowerKey}`, value);

        crumbs.push({
          label: value,
          to: `/?${currentParams.toString()}`,
        });
      });
    }
  }

  // ===== 4. DEFAULT =====
  else {
    crumbs.push({ label: "All Items" });
  }

  return (
    <div className="bg-secondary/50 border-b border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}

            {crumb.to && i < crumbs.length - 1 ? (
              <Link
                to={crumb.to}
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                {i === 0 && <Home className="w-3.5 h-3.5" />}
                {crumb.label}
              </Link>
            ) : (
              <span className="text-primary font-medium">
                {i === 0 && <Home className="w-3.5 h-3.5 inline mr-1" />}
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}