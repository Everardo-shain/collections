import { X } from 'lucide-react';

interface ActiveFiltersProps {
  chips: { key: string; value: string; label: string }[];
  onRemove: (key: string, value?: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ chips, onRemove, onClearAll }: ActiveFiltersProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip, i) => (
        <button
          key={`${chip.key}-${chip.value}-${i}`}
          onClick={() => onRemove(chip.key, chip.value === 'true' ? undefined : chip.value)}
          className="filter-chip"
        >
          {chip.label}
          <X className="w-3 h-3" />
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
      >
        Clear All
      </button>
    </div>
  );
}
