import { useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CollectionItem, normalizeKey, shouldNoSplit} from '@/utils/collectionUtils'; // Importar de utils
import { cn } from '@/lib/utils';
import { useCollection } from '@/hooks/useCollection';

interface StatsViewProps {
  items: CollectionItem[];
  sidebarState: Record<string, string[]>;
  activeTable: string | null;
  onChangeTable: (key: string) => void;
  onSelectValue: (key: string, value: string) => void;
}

export function StatsView({
  items,
  sidebarState,
  activeTable,
  onChangeTable,
  onSelectValue,
}: StatsViewProps) {
  const { config } = useCollection();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Extraemos las herramientas específicas de la colección activa
  const { 
    SIDEBAR_KEYS, 
    CUSTOM_FILTERS, 
    FIELD_MAP, 
    valid, 
    VALUE_SEPARATOR,
    SPLIT_FIELDS = { mode: 'exclude', fields: [] },
  } = config;

  // --- HELPERS INTERNOS ---
  
  // Obtiene los valores de un item considerando filtros personalizados y separadores dinámicos
  const getItemValuesForKey = useCallback((item: CollectionItem, key: string): string[] => {
    const custom = CUSTOM_FILTERS[key];
    if (custom) return custom.getValues(item, custom).filter(Boolean);
    
    let raw = item[key];
    if (raw === undefined) {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      raw = item[camelKey];
    }
    
    const value = typeof raw === 'string' ? raw : '';
    if (!valid(value)) return [];

    if (shouldNoSplit(key, SPLIT_FIELDS)) {
      return [value.trim()].filter(Boolean);
    }

    return value.split(VALUE_SEPARATOR).map(v => v.trim()).filter(Boolean);
  }, [CUSTOM_FILTERS, valid, VALUE_SEPARATOR, SPLIT_FIELDS]); // <-- 3. Añadimos SPLIT_FIELDS a las dependencias

  // Formatea el label según el FIELD_MAP de la colección
  const formatLabel = useCallback((key: string) => {
    if (CUSTOM_FILTERS[key]?.label) return CUSTOM_FILTERS[key].label;
    return FIELD_MAP[key] || key.replace(/_/g, ' ');
  }, [CUSTOM_FILTERS, FIELD_MAP]);

  // --- LÓGICA DE COMPUTACIÓN ---

  // Tablas válidas (que no estén ya filtradas y tengan datos)
  const validTables = useMemo(() => {
    return (SIDEBAR_KEYS as readonly string[]).filter(key => {
      const normKey = normalizeKey(key);
      if ((sidebarState[normKey] || []).length > 0) return false;
      return items.some(item => getItemValuesForKey(item, key).length > 0);
    });
  }, [SIDEBAR_KEYS, items, sidebarState, getItemValuesForKey]);

  // Auto-selección de tabla activa
  useEffect(() => {
    if (validTables.length === 0) {
      if (activeTable !== null) onChangeTable('');
      return;
    }
    if (!activeTable || !validTables.includes(activeTable)) {
      onChangeTable(validTables[0]);
    }
  }, [validTables, activeTable, onChangeTable]);

  // Generación de filas (conteo de valores)
  const rows = useMemo(() => {
    if (!activeTable) return [];
    const counts: Record<string, number> = {};
    
    items.forEach(item => {
      const vals = getItemValuesForKey(item, activeTable);
      const unique = Array.from(new Set(vals));
      unique.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    });

    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }, [items, activeTable, getItemValuesForKey]);

  const total = items.length;

  // Manejo de clic en fila para filtrar y volver al Grid
  const handleRowClick = (value: string) => {
    if (!activeTable) return;

    onSelectValue(activeTable, value);

    const newParams = new URLSearchParams(searchParams);
    const filterKey = normalizeKey(activeTable);
    
    const existingValues = newParams.get(filterKey)?.split(VALUE_SEPARATOR) || [];
    if (!existingValues.includes(value)) {
      const updatedValues = [...existingValues, value];
      newParams.set(filterKey, updatedValues.join(VALUE_SEPARATOR));
    }

    newParams.delete('view'); 
    setSearchParams(newParams, { replace: true });
  };

  if (validTables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground mb-1">No stats available</p>
        <p className="text-sm text-muted-foreground">Try removing some filters</p>
      </div>
    );
  }

  const activeLabel = activeTable ? formatLabel(activeTable) : '';

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Selector de pestañas */}
      <div className="flex flex-wrap border-t border-l border-border rounded-lg overflow-hidden bg-card">
        {validTables.map(key => {
          const isActive = key === activeTable;
          return (
            <button
              key={key}
              onClick={() => onChangeTable(key)}
              className={cn(
                "flex-1 min-w-[120px] px-3 py-1.5 text-sm font-medium border-r border-b border-border transition-colors capitalize",
                isActive
                  ? "text-primary-foreground relative z-10 border-b-transparent"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
              style={isActive ? { backgroundColor: 'hsl(var(--accent-color))', borderColor: 'hsl(var(--accent-color))' } : undefined}
            >
              {formatLabel(key)}
            </button>
          );
        })}
      </div>

      {activeTable && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-bold text-foreground">{rows.length}</span> unique options for {activeLabel}
        </p>
      )}

      {/* Tabla de resultados */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/30">
          <span>{activeLabel}</span>
          <span>Count</span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map(row => {
            const pct = total > 0 ? (row.count / total) * 100 : 0;
            return (
              <li key={row.value}>
                <button
                  onClick={() => handleRowClick(row.value)}
                  className="w-full grid grid-cols-[1fr_auto] gap-x-4 items-center px-4 py-3 text-left hover:bg-accent/30 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {row.value}
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: 'hsl(var(--accent-color))',
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm tabular-nums text-muted-foreground">
                    <span className="font-medium text-foreground">{row.count}</span>
                    <span className="ml-1 text-xs">({pct.toFixed(0)}%)</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}