import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { 
  BREADCRUMB_RESOLVER, 
  getDynamicValue, 
  NAVIGATION_CONFIG, 
  valid, 
  CollectionItem,
  VALUE_SEPARATOR,
  LINK_FIELDS,
  FIELD_MAP, 
  FIELD_COMBINATIONS 
} from "@/config/footballConfig";

interface BreadcrumbProps {
  filtersState?: Record<string, string[]>;
  searchQuery?: string;
  item?: CollectionItem; 
  firstItem?: CollectionItem; // <-- 1. Añadimos firstItem aquí
}

// ... (mismos imports)

export function CollectionBreadcrumb({
  filtersState = {},
  searchQuery = "",
  item,
}: BreadcrumbProps) {
  const { search, state } = useLocation(); // 1. Extraemos 'state' de la ubicación
  const crumbs: { label: string; to?: string; key: string }[] = [];

  crumbs.push({ label: "", to: "/", key: "home" });

  if (item) {
    // --- LÓGICA PARA ITEM DETAIL ---
    const configKeys = BREADCRUMB_RESOLVER({ item });
    if (configKeys) {
      const currentParams = new URLSearchParams();
      configKeys.forEach((key) => {
        const val = getDynamicValue(item, key);
        if (valid(val)) {
          const levelParams = new URLSearchParams(currentParams.toString());
          levelParams.set(`nav_${key.toLowerCase()}`, val);
          // En el detalle, el label es el valor puro (sin combinaciones)
          crumbs.push({ label: val, to: `/?${levelParams.toString()}`, key: key.toLowerCase() });
          currentParams.set(`nav_${key.toLowerCase()}`, val);
        }
      });
    }
  } else if (searchQuery) {
    crumbs.push({ label: `Search: "${searchQuery}"`, key: "search" });
  } else {
    // --- LÓGICA PARA GALERÍA (FILTRADA) ---
    const urlParams = new URLSearchParams(search);
    const configKeys = BREADCRUMB_RESOLVER({ filtersState }) || [];
    const allKeys = Array.from(new Set([...NAVIGATION_CONFIG.hierarchy, ...configKeys, ...LINK_FIELDS]));
    const currentParams = new URLSearchParams();

    allKeys.forEach((key) => {
      const lowKey = key.toLowerCase();
      if (urlParams.has(`nav_${lowKey}`)) {
        const val = urlParams.get(`nav_${lowKey}`) || "";
        if (valid(val)) {
          const linkParams = new URLSearchParams(currentParams.toString());
          linkParams.set(`nav_${lowKey}`, val);
          crumbs.push({ label: val, to: `/?${linkParams.toString()}`, key: lowKey });
          currentParams.set(`nav_${lowKey}`, val);
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

          // 🔥 LA SOLUCIÓN DEFINITIVA:
          // Si el 'state' de la navegación coincide con la llave de este crumb, usamos el label que nos mandaron.
          if (state?.customLabel && state?.filterKey === crumb.key) {
            displayLabel = state.customLabel;
          }

          return (
            <span key={i} className="flex items-center gap-2 flex-shrink-0">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              {!isLast || item ? (
                <Link to={crumb.to || "/"} className="text-muted-foreground hover:text-primary transition-colors">
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