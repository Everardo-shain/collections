import { FIELD_MAP, CUSTOM_FILTERS, SIDEBAR_KEYS, DETAILS_FILTERS } from '@/config/footballConfig';
import { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useEffect } from 'react'; // No olvides importar useEffect

interface FilterSidebarProps {
  filterOptions: Record<string, { value: string; count: number }[]>;
  selectedFilters: Record<string, string[]>;
  onToggleFilter: (key: string, value: string) => void;
  filterKeys: string[];
  isOpen: boolean;
  onClose: () => void;
  stickyOffset: number;
}


const SHOW_MORE_THRESHOLD = 10;

function getFilterLabel(key: string) {
  if (CUSTOM_FILTERS[key]) return CUSTOM_FILTERS[key].label;

  if (key === "details") return "Details"; // 👈 importante

  const mappedKey = FIELD_MAP[key];
  if (mappedKey) return mappedKey;

  return key.charAt(0).toUpperCase() + key.slice(1);
}

function FilterSection({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleOptions = showAll ? options : options.slice(0, SHOW_MORE_THRESHOLD);
  const hasMore = options.length > SHOW_MORE_THRESHOLD;

  return (
    <div className="border-b border-border py-1.5">
      <button
        className="w-full flex items-start justify-between py-1 text-sm font-semibold text-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        {label}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="mt-2 space-y-0">
          {visibleOptions.map(opt => (
            <label
              key={opt.value}
              className="flex items-start gap-2.5 py-1 cursor-pointer group"
            >
              <Checkbox
                checked={selected.includes(opt.value)}
                onCheckedChange={() => onToggle(opt.value)}
                className="h-4 w-4"
              />
              <span className="text-sm text-foreground group-hover:text-foreground flex-1">
                {opt.value}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">{opt.count}</span>
            </label>
          ))}
          {hasMore && (
            <button
              className="text-xs text-muted-foreground hover:text-primary mt-1 transition-colors"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show More (${options.length - SHOW_MORE_THRESHOLD})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function FilterSidebar({
  filterOptions,
  selectedFilters,
  onToggleFilter,
  filterKeys,
  isOpen,
  onClose,
  stickyOffset,
}: FilterSidebarProps) {
    
  // Bloquear scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    // Solo aplicamos el bloqueo si estamos en pantallas pequeñas (< 1024px)
    const isMobile = window.innerWidth < 1024;

    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // "Cleanup function": fundamental para devolver el scroll 
    // si el componente se desmonta inesperadamente
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden" 
          onClick={onClose} />
      )}

      <aside
      style={{ 
        top: isDesktop ? `${stickyOffset}px` : '0', 
        height: isDesktop ? `calc(100vh - ${stickyOffset}px)` : '100dvh'
      }}
      className={cn(
          "transition-all duration-300 ease-in-out",
          // 3. Mobile: z-[70] para estar sobre el overlay, fixed top-0
          "fixed left-0 top-0 w-80 bg-card z-[70] transform lg:translate-x-0",
          // 4. Desktop: Volvemos a comportamiento normal
          "lg:sticky lg:w-64 lg:shrink-0 lg:block lg:overflow-y-auto lg:bg-transparent lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      >
        {/* Contenedor interno con scroll para mobile */}
        <div className="p-4 lg:p-0 lg:pr-6 h-full overflow-y-auto lg:overflow-visible">
          <div className="flex items-start justify-between mb-4 lg:mb-0">
            <div className="flex items-start gap-2 text-sm font-semibold text-foreground py-1.5">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </div>
            {/* Botón X de cerrar más visible en mobile */}
            <button className="lg:hidden p-2 -mr-2 hover:bg-accent rounded-full transition-colors" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>


          {filterKeys.map(key => {
            const options = filterOptions[key] || [];
            const selected = selectedFilters[key] || [];

            // 🔥 Si no hay opciones (counts en 0) y no hay nada seleccionado, ocultamos toda la sección
            if (options.length === 0 && selected.length === 0) return null;

            return (
              <FilterSection
                key={key}
                label={getFilterLabel(key)}
                options={options}
                selected={selected}
                onToggle={(value) => onToggleFilter(key, value)}
              />
            );
          })}
        </div>
      </aside>
    </>
  );
}