import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
// 🔥 Importamos 'valid' desde el config
import { BREADCRUMB_RESOLVER, getDynamicValue, NAVIGATION_CONFIG, valid } from "@/config/footballConfig";
import { CollectionItem } from '@/types/collection';

interface BreadcrumbProps {
  filtersState?: Record<string, string[]>;
  searchQuery?: string;
  item?: CollectionItem; 
}

export function CollectionBreadcrumb({
  filtersState = {},
  searchQuery = "",
  item,
}: BreadcrumbProps) {
  const crumbs: { label: string; to?: string }[] = [];

  // ===== 0. HOME =====
  crumbs.push({ label: "Home", to: "/" });

  // ===== 1. VISTA DE DETALLE =====
  if (item) {
    const configKeys = BREADCRUMB_RESOLVER({ item });
    if (configKeys) {
      const currentParams = new URLSearchParams();
      if (item.entity) {
        currentParams.set(`nav_entity`, item.entity);
      }
      configKeys.forEach((key) => {
        const value = getDynamicValue(item, key);
        // 🔥 Aplicamos valid(value) para evitar "-" o vacíos
        if (valid(value)) {
          currentParams.set(`nav_${key.toLowerCase()}`, value);
          crumbs.push({
            label: value,
            to: `/?${currentParams.toString()}`,
          });
        }
      });
    }
    // crumbs.push({ label: item.displayName || item.id });
  }
  
  // ===== 2. BÚSQUEDA =====
  else if (searchQuery) {
    crumbs.push({ label: `Search: "${searchQuery}"` });
  }

  // ===== 3. NAVEGACIÓN DINÁMICA (Jerarquía + Navbar) =====
  else {
    const configKeys = BREADCRUMB_RESOLVER({ filtersState });
    const activeKeys = (configKeys && configKeys.length > 0) 
      ? configKeys 
      : NAVIGATION_CONFIG.hierarchy;

    const currentParams = new URLSearchParams();
    
    activeKeys.forEach((key) => {
      const lowerKey = key.toLowerCase();
      const values = filtersState[`nav_${lowerKey}`] || filtersState[lowerKey];
      
      if (values && values.length > 0) {
        const value = values[0];
        
        // 🔥 Aplicamos valid(value) aquí también
        if (valid(value)) {
          currentParams.set(`nav_${lowerKey}`, value);
          
          crumbs.push({
            label: value,
            to: `/?${currentParams.toString()}`,
          });
        }
      }
    });

    // ===== 4. CASO BASE =====
    if (crumbs.length === 1) {
      crumbs.push({ label: "All Items" });
    }
  }

  return (
  <div className="bg-secondary/50 border-b border-border relative">
    {/* Gradiente sutil para indicar que hay más contenido (solo visible en móvil) */}
    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-secondary/50 to-transparent z-10 pointer-events-none md:hidden" />

    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-10 
                    flex items-center gap-2 text-sm 
                    overflow-x-auto overflow-y-hidden flex-nowrap 
                    scrollbar-hide touch-pan-x">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        const showAsLink = item ? !!crumb.to : (!!crumb.to && !isLast);

        return (
          <span key={i} className="flex items-center gap-2 flex-shrink-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
            
            {showAsLink ? (
              <Link
                to={crumb.to!}
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                {i === 0 && <Home className="w-3.5 h-3.5" />}
                {crumb.label}
              </Link>
            ) : (
              <span className="text-primary font-medium whitespace-nowrap">
                {i === 0 && <Home className="w-3.5 h-3.5 inline mr-1" />}
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  </div>
  );
}