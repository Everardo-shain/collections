import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import React from "react";
import { valid, getDynamicValue, CollectionItem, VALUE_SEPARATOR, NO_SPLIT_FIELDS, formatDisplayValue} from "@/config";
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
  const { 
    BREADCRUMB_RESOLVER, 
    NAVIGATION_CONFIG, 
    LINK_FIELDS,
    BREADCRUMB_HIDDEN = []
  } = config;
  const baseHref = `/view/${collectionId}`;

  const crumbs: { label: string; key: string; originalKey: string; prevParams: string }[] = [];

  crumbs.push({ label: "", key: "home", originalKey: "home", prevParams: "" });

  if (item) {
    const configKeys = BREADCRUMB_RESOLVER({ item });
    if (configKeys) {
      const currentParams = new URLSearchParams();
      configKeys.forEach((key) => {
        const val = getDynamicValue(item, key);
        if (valid(val)) {
          crumbs.push({ 
            label: val, 
            key: key.toLowerCase(), 
            originalKey: key, 
            prevParams: currentParams.toString() 
          });
          currentParams.set(`nav_${key.toLowerCase()}`, val);
        }
      });
    }
  } else if (searchQuery) {
    crumbs.push({ label: `Search: "${searchQuery}"`, key: "search", originalKey: "search", prevParams: "" });
  } else {
    const urlParams = new URLSearchParams(search);
    const configKeys = BREADCRUMB_RESOLVER({ filtersState }) || [];
    const knownKeys = Array.from(new Set([...NAVIGATION_CONFIG.hierarchy, ...configKeys, ...LINK_FIELDS]));
    const currentParams = new URLSearchParams();
    const processedKeys = new Set<string>();

    knownKeys.forEach((key) => {
      const lowKey = key.toLowerCase();
      const navKey = `nav_${lowKey}`;
      if (urlParams.has(navKey)) {
        const val = urlParams.get(navKey) || "";
        if (valid(val)) {
          crumbs.push({ label: val, key: lowKey, originalKey: key, prevParams: currentParams.toString() });
          currentParams.set(navKey, val);
          processedKeys.add(navKey);
        }
      }
    });

    Array.from(urlParams.keys()).forEach((paramKey) => {
      if (paramKey.startsWith('nav_') && !processedKeys.has(paramKey)) {
        const pureKey = paramKey.replace('nav_', '');
        const val = urlParams.get(paramKey) || "";
        if (valid(val)) {
          crumbs.push({ label: val, key: pureKey, originalKey: pureKey, prevParams: currentParams.toString() });
          currentParams.set(paramKey, val);
        }
      }
    });

    if (crumbs.length === 1) crumbs.push({ label: "All Items", key: "all", originalKey: "all", prevParams: "" });
  }

  const renderCrumbContent = (crumb: typeof crumbs[0], isLast: boolean) => {
    // Ajuste para el icono de Home con Link
    if (crumb.key === "home") {
      return (
        <Link 
          to={baseHref} 
          className="hover:text-primary transition-colors flex items-center"
        >
          <Home className="w-4 h-4" />
        </Link>
      );
    }

    if (crumb.key === "search" || crumb.key === "all") return crumb.label;

    if (state?.customLabel && state?.filterKey === crumb.key) {
      return isLast && !item ? (
        <span className="text-primary font-medium">{state.customLabel}</span>
      ) : (
        <Link to={`${baseHref}?${new URLSearchParams(crumb.prevParams).toString()}`} className="hover:text-primary transition-colors">
          {state.customLabel}
        </Link>
      );
    }

    const fieldKey = crumb.originalKey; 
    const rawValue = crumb.label;

    // Si el campo no se divide
    if (NO_SPLIT_FIELDS.includes(fieldKey) || !rawValue.includes(VALUE_SEPARATOR)) {
      // CORRECCIÓN AQUÍ: Orden de parámetros correcto (key, value)
      const display = formatDisplayValue ? formatDisplayValue(fieldKey, rawValue) : rawValue;
      const linkParams = new URLSearchParams(crumb.prevParams);
      linkParams.set(`nav_${crumb.key}`, rawValue);

      return (!isLast || item) ? (
        <Link to={`${baseHref}?${linkParams.toString()}`} className="hover:text-primary transition-colors">
          {display}
        </Link>
      ) : (
        <span className="text-primary font-medium">{display}</span>
      );
    }

    // Lógica para valores múltiples: "Mexico | USA"
    const parts = rawValue.split(VALUE_SEPARATOR).map(p => p.trim()).filter(Boolean);

    return (
      <div className="flex items-center">
        {parts.map((part, idx) => {
          // CORRECCIÓN AQUÍ TAMBIÉN: Orden de parámetros correcto (key, value)
          const display = formatDisplayValue ? formatDisplayValue(fieldKey, part) : part;
          const linkParams = new URLSearchParams(crumb.prevParams);
          linkParams.set(`nav_${crumb.key}`, part);

          const isLastPart = idx === parts.length - 1;

          return (
            <React.Fragment key={idx}>
              {(!isLast || item) ? (
                <Link to={`${baseHref}?${linkParams.toString()}`} className="hover:text-primary transition-colors">
                  {display}
                </Link>
              ) : (
                <span className="text-primary font-medium">{display}</span>
              )}
              {!isLastPart && <span className="mx-1.5 opacity-40 text-muted-foreground">·</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  const visibleCrumbs = crumbs.filter(crumb => !BREADCRUMB_HIDDEN.includes(crumb.originalKey));
return (
    <nav className="bg-secondary/50 border-b border-border relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-2 text-sm overflow-x-auto no-scrollbar">
        {visibleCrumbs.map((crumb, i) => {
          // Usamos visibleCrumbs para que el color de "isLast" sea correcto
          const isLast = i === visibleCrumbs.length - 1; 
          return (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
              <div className={isLast && !item ? "text-primary" : "text-muted-foreground"}>
                {renderCrumbContent(crumb, isLast)}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}