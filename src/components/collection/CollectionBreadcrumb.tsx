import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  BREADCRUMB_RESOLVER, 
  getDynamicValue, 
  NAVIGATION_CONFIG, 
  valid, 
  CollectionItem,
  VALUE_SEPARATOR,
  NO_SPLIT_FIELDS,
  FIELD_MAP
} from "@/config/footballConfig";

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
  const crumbs: { label: React.ReactNode; to?: string }[] = [];

  // ===== HELPER: RENDERIZADO DE VALORES MÚLTIPLES =====
  const renderLabel = (key: string, fullValue: string, paramsBeforeThis: URLSearchParams) => {
    // 1. Normalizamos la llave a minúsculas para la comparación técnica
    const lowerKey = key.toLowerCase();

    // 2. Comparamos contra el array (que debe estar en minúsculas en el config)
    if (NO_SPLIT_FIELDS.includes(lowerKey) || !fullValue.includes(VALUE_SEPARATOR)) {
      return fullValue;
    }

    const parts = fullValue.split(VALUE_SEPARATOR).map(p => p.trim()).filter(Boolean);
    
    return (
      <span className="flex items-center">
        {parts.map((part, idx) => {
          // Mantenemos key.toLowerCase() para la URL (es estándar y más limpio)
          const individualParams = new URLSearchParams(paramsBeforeThis.toString());
          individualParams.set(`nav_${lowerKey}`, part); 
          
          return (
            <span key={idx} className="flex items-center">
              {idx > 0 && <span className="mx-1 opacity-50">·</span>}
              <Link 
                to={`/?${individualParams.toString()}`} 
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                {part}
              </Link>
            </span>
          );
        })}
      </span>
    );
  };

  crumbs.push({ label: "", to: "/" });

  // ===== 1. VISTA DE DETALLE =====
  if (item) {
    const configKeys = BREADCRUMB_RESOLVER({ item });
    if (configKeys) {
      const currentParams = new URLSearchParams();
      configKeys.forEach((key) => {
        const fullValue = getDynamicValue(item, key);
        
        if (valid(fullValue)) {
          // Generamos el label visual con sus links individuales
          const label = renderLabel(key, fullValue, currentParams);
          
          // El link "general" de este nivel DEBE contener el string completo
          const levelParams = new URLSearchParams(currentParams.toString());
          levelParams.set(`nav_${key.toLowerCase()}`, fullValue);
          
          crumbs.push({ 
            label, 
            to: `/?${levelParams.toString()}` 
          });

          // PERSISTENCIA: Seteamos el valor completo para que el siguiente nivel lo herede
          currentParams.set(`nav_${key.toLowerCase()}`, fullValue);
        }
      });
    }
  } 
  // ===== 2. BÚSQUEDA =====
  else if (searchQuery) {
    crumbs.push({ label: `Search: "${searchQuery}"` });
  } 

  // ===== 3. NAVEGACIÓN DINÁMICA =====
  else {
    const configKeys = BREADCRUMB_RESOLVER({ filtersState });
    const activeKeys = (configKeys && configKeys.length > 0) ? configKeys : NAVIGATION_CONFIG.hierarchy;
    const currentParams = new URLSearchParams();
    
    // 1. Procesamos la jerarquía estándar primero
    activeKeys.forEach((key, idx) => {
      const lowerKey = key.toLowerCase();
      const rawValues = filtersState[`nav_${lowerKey}`] || filtersState[lowerKey];
      
      if (rawValues && rawValues.length > 0) {
        const fullValue = rawValues.join(` ${VALUE_SEPARATOR} `); 
        if (valid(fullValue)) {
          const label = renderLabel(key, fullValue, currentParams);
          const linkParams = new URLSearchParams(currentParams.toString());
          linkParams.set(`nav_${lowerKey}`, fullValue);

          crumbs.push({ label, to: `/?${linkParams.toString()}` });
          currentParams.set(`nav_${lowerKey}`, fullValue);
        }
      }
    });

    // 2. 🔥 AQUÍ VA EL FALLBACK:
    // Procesamos cualquier otro filtro activo (como 'style') que NO esté en la jerarquía
    Object.entries(filtersState).forEach(([key, values]) => {
      const pureKey = key.startsWith('nav_') ? key.replace('nav_', '') : key;
      const isAlreadyInCrumbs = activeKeys.some(k => k.toLowerCase() === pureKey.toLowerCase());

      if (!isAlreadyInCrumbs && values && values.length > 0) {
        const fullValue = values.join(` ${VALUE_SEPARATOR} `);
        if (valid(fullValue)) {
          // Generamos el label para estos filtros "extra"
          const label = renderLabel(pureKey, fullValue, currentParams);
          
          // Creamos el link para que se mantenga en la URL
          const linkParams = new URLSearchParams(currentParams.toString());
          linkParams.set(`nav_${pureKey}`, fullValue);

          crumbs.push({ label, to: `/?${linkParams.toString()}` });
          
          // Actualizamos currentParams por si hubiera más filtros extra
          currentParams.set(`nav_${pureKey}`, fullValue);
        }
      }
    });

    if (crumbs.length === 1) crumbs.push({ label: "All Items" });
  }

  return (
    <div className="bg-secondary/50 border-b border-border relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-2 text-sm overflow-x-auto overflow-y-hidden flex-nowrap scrollbar-hide">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          const hasInternalLinks = typeof crumb.label !== 'string';
          
          // En detalle todos son links. En lista, el último nivel es solo texto.
          const isNavigable = item ? true : !isLast;
          // Solo usamos el Link global si el label NO tiene links internos (para evitar anidamiento <a><a>)
          const useWrapperLink = !hasInternalLinks && isNavigable && !!crumb.to;

          return (
            <span key={i} className="flex items-center gap-2 flex-shrink-0">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
              
              {useWrapperLink ? (
                <Link 
                  to={crumb.to!} 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center"
                >
                  {/* Si es el índice 0, solo renderizamos el icono */}
                  {i === 0 ? <Home className="w-4 h-4" /> : crumb.label}
                </Link>
              ) : (
                <span className={`${(isLast && !item) ? 'text-primary font-medium' : 'text-muted-foreground'} flex items-center`}>
                  {/* Si es el índice 0, solo renderizamos el icono */}
                  {i === 0 ? <Home className="w-4 h-4" /> : crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}