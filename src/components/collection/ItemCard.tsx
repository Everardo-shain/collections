import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CollectionItem } from '@/config';
import { useCollection } from '@/hooks/useCollection';

interface ItemCardProps {
  item: CollectionItem;
}

export const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(({ item }, ref) => {
  const { collectionId } = useCollection();
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
    >
      <Link 
  to={`/view/${collectionId}/item/${item.id}`} 
  state={{ returnSearch: window.location.search }} // Guardamos la búsqueda aquí
 className="group block text-center">
        <div className="aspect-square overflow-hidden rounded-lg bg-secondary mb-3">
          <img
            src={item.image}
            alt={item.displayName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="space-y-0.5 px-2">
          <h3 className="text-sm font-medium text-foreground break-words group-hover:underline underline-offset-4 group-hover:text-primary transition-colors text-center">
            {item.displayName}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
});

ItemCard.displayName = 'ItemCard';
