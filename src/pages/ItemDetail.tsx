import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import { ImageLightbox } from '@/components/collection/ImageLightbox';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { Helmet } from "react-helmet-async";

import rawData from '@/data/json_files/football_collection.json';
import { mapItem } from '@/utils/mapItem';
import { 
  FIELD_MAP, 
  HIDDEN_FIELDS, 
  FIELD_COMBINATIONS, 
  FIELD_VISIBILITY_RULES, 
  valid,
  CollectionItem,
  SITE_METADATA,
  formatDisplayValue,
  generateNavGroups 
} from '@/config/footballConfig';

const collectionItems: CollectionItem[] = (rawData as any[]).map(mapItem);

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const item = collectionItems.find(i => i.id === id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const navGroups = useMemo(() => generateNavGroups(collectionItems), []);

  if (!item) return null;

  const images = item.images?.length ? item.images : [item.image];
  const hasMultiple = images.length > 1;

  return (
    <>
      <Helmet>
        <title>{`${item.displayName} | ${SITE_METADATA.title}`}</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <CollectionNavbar navGroups={navGroups} />
        <CollectionBreadcrumb item={item} />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 
            Back to collection
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* IMAGES */}
            <div className="space-y-3">
              <div 
                className="relative aspect-square overflow-hidden rounded-xl bg-secondary cursor-pointer border border-border" 
                onClick={() => setLightboxOpen(true)}
              >
                <img src={images[activeImageIndex]} alt={item.displayName} className="w-full h-full object-cover" />
                {hasMultiple && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => (i - 1 + images.length) % images.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => (i + 1) % images.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </>
                )}
              </div>
              {hasMultiple && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === activeImageIndex ? 'border-primary' : 'border-border opacity-60'}`}><img src={img} className="w-full h-full object-cover" /></button>
                  ))}
                </div>
              )}
            </div>

            {/* DETAILS */}
            <div>
              <div className="mb-6">
                <h1 className="font-heading text-2xl md:text-3xl font-bold">{item.displayName}</h1>
              </div>

              <div className="border-t border-border divide-y divide-border">
                {Object.entries(FIELD_MAP).map(([camelKey, label]) => {
                  const rawValue = item[camelKey as keyof CollectionItem];

                  // 🔥 CAMBIO CLAVE: Ahora comparamos contra camelKey (llave interna)
                  if (HIDDEN_FIELDS.includes(camelKey) || camelKey === "notes") return null;
                  
                  if (typeof rawValue !== "string" || !valid(rawValue)) return null;

                  // Lógica de combinaciones y visibilidad (siguen usando el Label para facilidad de lectura en config)
                  let processedValue = rawValue;
                  const combinationFn = FIELD_COMBINATIONS[label];
                  if (combinationFn) processedValue = combinationFn(item, rawValue);

                  const visibilityFn = FIELD_VISIBILITY_RULES[label];
                  if (visibilityFn && !visibilityFn(item, processedValue)) return null;

                  const displayValue = formatDisplayValue(label, processedValue);

                  return (
                    <div key={camelKey} className="flex justify-between py-3">
                      <span className="text-sm font-bold text-foreground">{label}</span>
                      <span className="text-sm font-normal text-right ml-4">{displayValue}</span>
                    </div>
                  );
                })}
                <div className="border-b border-border w-full"></div>
              </div>

              {valid(item.notes) && (
                <div className="mt-5">
                  <p className="text-sm font-normal leading-relaxed text-foreground">{item.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ImageLightbox 
          images={images} 
          activeIndex={activeImageIndex} 
          open={lightboxOpen} 
          onOpenChange={setLightboxOpen} 
          onIndexChange={setActiveImageIndex} 
          alt={item.displayName} 
        />
      </div>
    </>
  );
}