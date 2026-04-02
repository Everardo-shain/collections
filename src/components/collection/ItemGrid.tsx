import { AnimatePresence } from 'framer-motion';
import { CollectionItem } from '@/types/collection';
import { ItemCard } from './ItemCard';

interface ItemGridProps {
  items: CollectionItem[];
}

export function ItemGrid({ items }: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground mb-1">No items found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      <AnimatePresence mode="popLayout">
        {items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}
