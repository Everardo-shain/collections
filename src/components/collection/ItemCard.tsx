import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CollectionItem } from '@/config';
import { useCollection } from '@/hooks/useCollection';

interface ItemCardProps {
  item: CollectionItem;
}

// ItemCard.tsx - Cambios en la imagen
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
        state={{ returnSearch: window.location.search }} 
        className="group block text-center cursor-pointer"
      >
        {/* Contenedor Cuadrado */}
        <div className="aspect-square overflow-hidden rounded-lg bg-[hsl(var(--image-bg))] mb-3 flex items-center justify-center">
          <img
            src={item.image}
            alt={item.displayName}
            /* Eliminamos 'group-hover:scale-105' para que la imagen se quede quieta */
            className="w-full h-full object-contain scale-[1.01] transition-opacity duration-300"
            loading="lazy"
          />
        </div>
        
        <div className="space-y-0.5 px-2">
          {/* El texto seguirá reaccionando (underline y color) para indicar que es un link */}
          <h3 className="text-sm font-medium text-foreground break-words group-hover:underline underline-offset-4 group-hover:text-primary transition-colors text-center">
            {item.displayName}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
});

ItemCard.displayName = 'ItemCard';
