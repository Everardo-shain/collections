import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ImageLightbox } from '@/components/collection/ImageLightbox';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { Helmet } from "react-helmet-async";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';

import { CollectionItem, SITE_METADATA, valid, CombinationResult } from '@/config';
import { useCollection } from '@/hooks/useCollection';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { collectionId, config } = useCollection();
  const {
    rawData,
    mapItem,
    FIELD_MAP,
    VISIBLE_FIELDS,
    SPECIAL_FIELDS,
    LINK_FIELDS,
    FIELD_COMBINATIONS,
    FIELD_VISIBILITY_RULES,
    generateNavGroups,
    metadata,
  } = config;

  const returnPath = useMemo(() => {
    const base = `/view/${collectionId}`;
    return `${base}${location.state?.returnSearch || ""}`;
  }, [collectionId, location.state]);

  const collectionItems: CollectionItem[] = useMemo(
    () => (rawData as Record<string, string>[]).map(mapItem),
    [rawData, mapItem]
  );

  const item = collectionItems.find(i => i.id === id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const navGroups = useMemo(() => generateNavGroups(collectionItems), [generateNavGroups, collectionItems]);

  if (!item) return null;

  const images = item.images?.length ? item.images : [item.image];
  const hasMultiple = images.length > 1;
  const baseHref = `/view/${collectionId}`;

  const renderValueParts = (camelKey: string, rawValue: string, combination: CombinationResult) => {
    const { parts, fullLink } = combination;
    const fullDisplayText = parts.map(p => p.text).join('');

    if (fullLink) {
      return (
        <Link
          to={`${baseHref}?nav_${camelKey.toLowerCase()}=${encodeURIComponent(rawValue)}`}
          state={{ customLabel: fullDisplayText, filterKey: camelKey.toLowerCase() }}
          className="underline underline-offset-4 decoration-primary decoration-1 hover:text-primary transition-colors"
        >
          {fullDisplayText}
        </Link>
      );
    }

    return (
      <span className="flex flex-wrap justify-end">
        {parts.map((part, idx) => {
          const isLinkable = part.fieldKey && (LINK_FIELDS as readonly string[]).includes(part.fieldKey);
          if (isLinkable && part.fieldKey) {
            const navValue = item[part.fieldKey as keyof CollectionItem] as string;
            return (
              <Link
                key={idx}
                to={`${baseHref}?nav_${part.fieldKey.toLowerCase()}=${encodeURIComponent(navValue)}`}
                state={{ customLabel: part.text, filterKey: part.fieldKey.toLowerCase() }}
                className="underline underline-offset-4 decoration-primary decoration-1 hover:text-primary transition-colors"
              >
                {part.text}
              </Link>
            );
          }
          return <span key={idx} className="whitespace-pre text-foreground">{part.text}</span>;
        })}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>{`${item.displayName} | ${metadata?.title || SITE_METADATA.title}`}</title>
      </Helmet>

      {/* Estilos inline para ocultar scrollbars en este componente */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-background">
        <CollectionNavbar navGroups={navGroups} />
        <CollectionBreadcrumb item={item} />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to={returnPath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {location.state?.returnSearch ? "Back to results" : "Back to collection"}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            
            {/* SECCIÓN VISUAL (Forzando 1:1 Aspect Ratio) */}
            <div className="flex flex-col-reverse lg:flex-row gap-4">
              
              {/* Miniaturas Cuadradas Verticales con Scroll Oculto (Desktop) */}
              {hasMultiple && (
                <div 
                  className="hidden lg:flex flex-col gap-2.5 w-16 shrink-0 overflow-y-auto no-scrollbar pr-1"
                  /* Explicación: 'aspect-square' del padre define la altura máxima de este contenedor. 
                     Ocultamos scrollbar con clase 'no-scrollbar' definida arriba. */
                >
                  {images.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImageIndex(idx)} 
                      /* aspect-square: Forzamos miniatura cuadrada */
                      className={cn(
                        "w-16 aspect-square rounded-md overflow-hidden border-2 bg-[hsl(var(--image-bg))] transition-all shrink-0",
                        idx === activeImageIndex ? 'border-primary' : 'border-border opacity-40 hover:opacity-100'
                      )}
                    >
                      <img src={img} className="w-full h-full object-contain" alt="" />
                    </button>
                  ))}
                </div>
              )}

              {/* Contenedor Principal Cuadrado Forzado */}
              <div className="relative flex-1 aspect-square overflow-hidden rounded-xl border border-border bg-[hsl(var(--image-bg))]">
                
                {/* VISTA MOBILE (Carrete) */}
                <div className="lg:hidden relative h-full touch-pan-y">
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    animate={{ x: `-${activeImageIndex * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onDragEnd={(_, info) => {
                      const threshold = 50;
                      if (info.offset.x < -threshold && activeImageIndex < images.length - 1) setActiveImageIndex(activeImageIndex + 1);
                      else if (info.offset.x > threshold && activeImageIndex > 0) setActiveImageIndex(activeImageIndex - 1);
                    }}
                    className="flex h-full cursor-grab active:cursor-grabbing"
                  >
                    {images.map((img, idx) => (
                      <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center p-6" onClick={() => setLightboxOpen(true)}>
                        <img src={img} className="max-w-full max-h-full object-contain pointer-events-none" alt="" />
                      </div>
                    ))}
                  </motion.div>

                  {/* Puntos Mobile */}
                  {hasMultiple && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                      {images.map((_, i) => (
                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", activeImageIndex === i ? "bg-primary w-4" : "bg-primary/20")} />
                      ))}
                    </div>
                  )}
                </div>

                {/* VISTA DESKTOP (Fade Refinado) */}
                <div className="hidden lg:flex w-full h-full items-center justify-center cursor-pointer p-12" onClick={() => setLightboxOpen(true)}>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImageIndex}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      src={images[activeImageIndex]}
                      className="max-w-full max-h-full object-contain"
                      alt={item.displayName}
                    />
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE TEXTO (Igual a la anterior) */}
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">{item.displayName}</h1>
              <div className="border-t border-border divide-y divide-border">
                {Object.entries(FIELD_MAP).map(([camelKey, label]) => {
                  const rawValue = item[camelKey as keyof CollectionItem];
                  if (!(VISIBLE_FIELDS as readonly string[]).includes(camelKey) || typeof rawValue !== "string" || !valid(rawValue)) return null;
                  
                  const combinationFn = FIELD_COMBINATIONS[camelKey];
                  const combination: CombinationResult = combinationFn ? combinationFn(item, rawValue) : { parts: [{ text: rawValue, fieldKey: camelKey }], fullLink: false };
                  const displayString = combination.parts.map(p => p.text).join('');
                  if (FIELD_VISIBILITY_RULES[camelKey] && !FIELD_VISIBILITY_RULES[camelKey](item, displayString)) return null;

                  return (
                    <div key={camelKey} className="flex justify-between py-4 items-start gap-4">
                      <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest pt-1 shrink-0">{label as string}</span>
                      <span className="text-sm font-medium text-right text-foreground">{renderValueParts(camelKey, rawValue, combination)}</span>
                    </div>
                  );
                })}
              </div>
              {SPECIAL_FIELDS.map((f) => {
                const content = item[f as keyof typeof item];
                const safe = Array.isArray(content) ? content.join(", ") : (content as string);
                return valid(safe) && (
                  <div key={f} className="mt-8 p-6 bg-secondary/5 rounded-2xl border border-border/50 text-sm italic text-muted-foreground whitespace-pre-line leading-relaxed">
                    {safe}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ImageLightbox images={images} activeIndex={activeImageIndex} open={lightboxOpen} onOpenChange={setLightboxOpen} onIndexChange={setActiveImageIndex} alt={item.displayName} />
      </div>
    </>
  );
}