import { X } from 'lucide-react';

interface ActiveFiltersProps {
  chips: { key: string; value: string; label: string; displayKey?: string }[];
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  chips,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip, i) => (
        <button
          key={`${chip.key}-${chip.value}-${i}`}
          onClick={() => onRemove(chip.key, chip.value)}
          className="filter-chip flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm hover:bg-secondary/80 transition-colors"
        >
          {/* 🔥 Usamos displayKey para que el label esté capitalizado/mapeado */}
          <span className="font-medium">{chip.displayKey || chip.key}:</span>
          <span>{chip.label}</span>
          <X className="w-3 h-3 ml-1" />
        </button>
      ))}

      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 ml-2"
      >
        Clear All
      </button>
    </div>
  );
}