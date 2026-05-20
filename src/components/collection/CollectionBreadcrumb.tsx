import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import React from "react";
import { 
  getDynamicValue, 
  CollectionItem,
  shouldNoSplit, 
} from "@/config";
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
    BREADCRUMB_HIDDEN = [],
    FIELD_MAP = {},
    valid,
    SPLIT_FIELDS = { mode: 'exclude', fields: [] },
    formatDisplayValue,
    VALUE_SEPARATOR,  
  } = config;
  const baseHref = `/view/${collectionId}`;

  const crumbs: { 
    label: string; 
    key: string; 
    originalKey: string; 
    prevParams: string; 
    isAttribute?: boolean 
  }[] = [];

  // 1. Nodo Raíz (Home)
  crumbs.push({ label: "", key: "home", originalKey: "home", prevParams: "" });

  if (item) {
    // Escenario A: Vista de detalle de un Item
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
    // Escenario B: Búsqueda por texto libre
    crumbs.push({ label: `Search: "${searchQuery}"`, key: "search", originalKey: "search", prevParams: "" });
  } else {
    // Escenario C: Navegación por filtros (nav_ y attr_)
    const urlParams = new URLSearchParams(search);
    const configKeys = BREADCRUMB_RESOLVER({ filtersState }) || [];
    const knownKeys = Array.from(new Set([...NAVIGATION_CONFIG.hierarchy, ...configKeys, ...LINK_FIELDS]));
    const currentParams = new URLSearchParams();
    const processedKeys = new Set<string>();

    // Procesar primero las llaves conocidas por jerarquía (suelen ser nav_)
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

    // Procesar cualquier otro parámetro dinámico (nav_ o attr_)
    Array.from(urlParams.keys()).forEach((paramKey) => {
      if (processedKeys.has(paramKey)) return;

      const isNav = paramKey.startsWith('nav_');
      const isAttr = paramKey.startsWith('attr_');

      if (isNav || isAttr) {
        const pureKey = paramKey.replace('nav_', '').replace('attr_', '');
        const val = urlParams.get(paramKey) || "";
        if (valid(val)) {
          crumbs.push({ 
            label: val, 
            key: pureKey, 
            originalKey: pureKey, 
            prevParams: currentParams.toString(),
            isAttribute: isAttr 
          });
          currentParams.set(paramKey, val);
          processedKeys.add(paramKey);
        }
      }
    });

    if (crumbs.length === 1) crumbs.push({ label: "All Items", key: "all", originalKey: "all", prevParams: "" });
  }

  const renderCrumbContent = (crumb: typeof crumbs[0], isLast: boolean) => {
    // 1. Icono de Home
    if (crumb.key === "home") {
      return (
        <Link to={baseHref} className="hover:text-primary transition-colors flex items-center">
          <Home className="w-4 h-4" />
        </Link>
      );
    }

    // 2. Casos especiales de texto plano
    if (crumb.key === "search" || crumb.key === "all") return crumb.label;

    // 3. PRIORIDAD: State con label personalizado (tu corrección)
    if (state?.customLabel && state?.filterKey === crumb.key) {
      return (isLast && !item) ? (
        <span className="text-primary font-medium">{state.customLabel}</span>
      ) : (
        <Link to={`${baseHref}?${new URLSearchParams(crumb.prevParams).toString()}`} className="hover:text-primary transition-colors">
          {state.customLabel}
        </Link>
      );
    }

    // Helper para decidir si mostrar "Campo: Valor" o solo "Valor"
    const getFinalLabel = (key: string, value: string, isAttr?: boolean) => {
      const displayValue = formatDisplayValue ? formatDisplayValue(key, value) : value;
      if (isAttr) {
        const fieldName = (FIELD_MAP as any)[key] || key.charAt(0).toUpperCase() + key.slice(1);
        return `${fieldName}: ${displayValue}`;
      }
      return displayValue;
    };

    const fieldKey = crumb.originalKey; 
    const rawValue = crumb.label;
    const isAttribute = crumb.isAttribute;

    // ✨ Aplicamos el nuevo helper aquí también
    if (shouldNoSplit(fieldKey, SPLIT_FIELDS) || !rawValue.includes(VALUE_SEPARATOR)) {
      const display = getFinalLabel(fieldKey, rawValue, isAttribute);
      const linkParams = new URLSearchParams(crumb.prevParams);
      const prefix = isAttribute ? 'attr_' : 'nav_';
      linkParams.set(`${prefix}${crumb.key}`, rawValue);

      return (!isLast || item) ? (
        <Link to={`${baseHref}?${linkParams.toString()}`} className="hover:text-primary transition-colors">
          {display}
        </Link>
      ) : (
        <span className="text-primary font-medium">{display}</span>
      );
    }

    // 5. Soporte para múltiples valores (ej. Mexico | USA)
    const parts = rawValue.split(VALUE_SEPARATOR).map(p => p.trim()).filter(Boolean);

    return (
      <div className="flex items-center">
        {parts.map((part, idx) => {
          const display = getFinalLabel(fieldKey, part, isAttribute);
          const linkParams = new URLSearchParams(crumb.prevParams);
          const prefix = isAttribute ? 'attr_' : 'nav_';
          linkParams.set(`${prefix}${crumb.key}`, part);
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