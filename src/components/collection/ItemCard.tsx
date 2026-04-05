import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CollectionItem } from '@/types/collection';

interface ItemCardProps {
  item: CollectionItem;
}

// Usamos forwardRef para pasar la referencia al motion.div
export const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(({ item }, ref) => {
  return (
    <motion.div
      ref={ref} // 🔥 Esta es la clave para eliminar el warning
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
    >
      <Link to={`/item/${item.id}`} className="group block">
        <div className="aspect-square overflow-hidden rounded-lg bg-secondary mb-3">
          <img
            src={item.image}
            alt={item.displayName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:underline underline-offset-2 group-hover:text-primary transition-colors">
            {item.displayName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {item.team} · {item.season}
          </p>
          <p className="text-xs text-muted-foreground">{item.brand}</p>
        </div>
      </Link>
    </motion.div>
  );
});

// Es buena práctica ponerle el nombre para que aparezca bien en las DevTools
ItemCard.displayName = 'ItemCard';