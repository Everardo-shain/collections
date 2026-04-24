import { FIELD_MAP, CUSTOM_FILTERS, getIndex } from '@/config/footballConfig';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// 👇 Importamos el archivo JSON con el orden de las listas
import listsData from '@/data/json_files/football_collection - Lists.json';

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

  if (key === "details") return "Details";

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
  
  // 1. Verificamos si hay AL MENOS una opción para mostrar en cualquier categoría
  // O si hay filtros ya seleccionados (para no ocultar el sidebar si el usuario quiere desmarcarlos)
  const hasVisibleFilters = filterKeys.some(key => {
    const options = filterOptions[key] || [];
    const selected = selectedFilters[key] || [];
    return options.length > 0 || selected.length > 0;
  });

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
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
            "fixed left-0 top-0 w-80 bg-card z-[70] transform lg:translate-x-0",
            "lg:sticky lg:w-64 lg:shrink-0 lg:block lg:overflow-y-auto lg:bg-transparent lg:z-auto",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 lg:p-0 lg:pr-6 h-full overflow-y-auto lg:overflow-visible">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-2 text-sm font-semibold text-foreground py-1.5">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </div>
            <button className="lg:hidden p-2 -mr-2 hover:bg-accent rounded-full transition-colors" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. LÓGICA INFORMATIVA: Si no hay filtros, mostramos el mensaje */}
          {!hasVisibleFilters ? (
            <div className="mt-4 p-4 border border-dashed border-muted rounded-xl bg-muted/20">
              <p className="text-xs text-muted-foreground text-center italic leading-relaxed">
                No additional filters available for these results.
              </p>
            </div>
          ) : (
            // 3. RENDERIZADO NORMAL (Tu lógica de map actual)
            filterKeys.map(key => {
              const options = filterOptions[key] || [];
              const selected = selectedFilters[key] || [];

              if (options.length === 0 && selected.length === 0) return null;

              const label = getFilterLabel(key);
              const customConfig = CUSTOM_FILTERS[key];
              const fieldKeyForOrder = customConfig?.filter || key;

              let sortedOptions = [...options];

              if (listsData) {
                sortedOptions.sort((a, b) => {
                  const posA = getIndex(a.value, fieldKeyForOrder);
                  const posB = getIndex(b.value, fieldKeyForOrder);
                  if (posA === posB) return b.count - a.count;
                  return posA - posB;
                });
              }

              return (
                <FilterSection
                  key={key}
                  label={label}
                  options={sortedOptions}
                  selected={selected}
                  onToggle={(value) => onToggleFilter(key, value)}
                />
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}