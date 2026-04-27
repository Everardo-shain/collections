import { useMemo, useEffect } from 'react';
import { CollectionItem, valid, VALUE_SEPARATOR, normalizeKey } from '@/config';
import { cn } from '@/lib/utils';
import { useCollection } from '@/hooks/useCollection';

interface StatsViewProps {
  items: CollectionItem[];
  sidebarState: Record<string, string[]>;
  activeTable: string | null;
  onChangeTable: (key: string) => void;
  onSelectValue: (key: string, value: string) => void;
}

function getItemValuesForKey(item: CollectionItem, key: string, customFilters: Record<string, any>): string[] {
  const custom = customFilters[key];
  if (custom) return custom.getValues(item, custom).filter(Boolean);
  let raw = item[key as keyof CollectionItem];
  if (raw === undefined) {
    const camelKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof CollectionItem;
    raw = item[camelKey];
  }
  const value = typeof raw === 'string' ? raw : '';
  if (!valid(value)) return [];
  return value.split(VALUE_SEPARATOR).map(v => v.trim()).filter(Boolean);
}

function formatLabel(key: string, customFilters: Record<string, any>, fieldMap: Record<string, string>) {
  if (customFilters[key]?.label) return customFilters[key].label;
  return fieldMap[key] || key.replace(/_/g, ' ');
}

export function StatsView({
  items,
  sidebarState,
  activeTable,
  onChangeTable,
  onSelectValue,
}: StatsViewProps) {
  const { config } = useCollection();
  const { STATS_KEYS, CUSTOM_FILTERS, FIELD_MAP } = config as any;

  // Compute valid tables: have at least one value AND not currently filtered in sidebar
  const validTables = useMemo(() => {
    return (STATS_KEYS as readonly string[]).filter(key => {
      const normKey = normalizeKey(key);
      if ((sidebarState[normKey] || []).length > 0) return false;
      // at least one item with value
      return items.some(item => getItemValuesForKey(item, key, CUSTOM_FILTERS).length > 0);
    });
  }, [STATS_KEYS, items, sidebarState, CUSTOM_FILTERS]);

  // Auto-select / auto-jump
  useEffect(() => {
    if (validTables.length === 0) {
      if (activeTable !== null) onChangeTable('');
      return;
    }
    if (!activeTable || !validTables.includes(activeTable)) {
      onChangeTable(validTables[0]);
    }
  }, [validTables, activeTable, onChangeTable]);

  const rows = useMemo(() => {
    if (!activeTable) return [];
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const vals = getItemValuesForKey(item, activeTable, CUSTOM_FILTERS);
      const unique = Array.from(new Set(vals));
      unique.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    });
    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }, [items, activeTable, CUSTOM_FILTERS]);

  const total = items.length;

  if (validTables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground mb-1">No stats available</p>
        <p className="text-sm text-muted-foreground">Try removing some filters</p>
      </div>
    );
  }

  const activeLabel = activeTable ? formatLabel(activeTable, CUSTOM_FILTERS, FIELD_MAP) : '';

  return (
    <div className="space-y-4">
      {/* Segmented control: wraps to multiple rows, joined buttons, only outer block corners rounded */}
      <div className="flex flex-wrap -mt-px -ml-px overflow-hidden rounded-lg">
        {validTables.map(key => {
          const isActive = key === activeTable;
          return (
            <button
              key={key}
              onClick={() => onChangeTable(key)}
              className={cn(
                "flex-1 min-w-[120px] -mt-px -ml-px px-3 py-1.5 text-sm font-medium border border-border transition-colors capitalize",
                isActive
                  ? "text-primary-foreground border-transparent relative z-10"
                  : "bg-card text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
              style={isActive ? { backgroundColor: 'hsl(var(--accent-color))' } : undefined}
            >
              {formatLabel(key, CUSTOM_FILTERS, FIELD_MAP)}
            </button>
          );
        })}
      </div>

      {/* Count indicator */}
      {activeTable && (
        <p className="text-xs text-muted-foreground">
          Showing {rows.length} {activeLabel.toLowerCase()}{rows.length !== 1 ? (activeLabel.toLowerCase().endsWith('s') ? '' : 's') : ''}
        </p>
      )}

      {/* Table */}
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
                  onClick={() => activeTable && onSelectValue(activeTable, row.value)}
                  className="w-full grid grid-cols-[1fr_auto] gap-x-4 items-center px-4 py-3 text-left hover:bg-accent/30 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {row.value}
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
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
