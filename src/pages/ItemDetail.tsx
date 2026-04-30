import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageLightbox } from '@/components/collection/ImageLightbox';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { Helmet } from "react-helmet-async";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion';

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

  const thumbScrollRef = useRef<HTMLDivElement>(null);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);

  const checkThumbScroll = useCallback(() => {
    if (thumbScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = thumbScrollRef.current;
      setShowUpArrow(scrollTop > 10);
      setShowDownArrow(scrollTop + clientHeight < scrollHeight - 10);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkThumbScroll, 500);
    window.addEventListener('resize', checkThumbScroll);
    return () => {
      window.removeEventListener('resize', checkThumbScroll);
      clearTimeout(timer);
    };
  }, [checkThumbScroll, item?.images]);

  const scrollThumbs = (direction: 'up' | 'down') => {
    if (thumbScrollRef.current) {
      const amount = direction === 'up' ? -200 : 200;
      thumbScrollRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

  const navGroups = useMemo(() => generateNavGroups(collectionItems), [generateNavGroups, collectionItems]);

  if (!item) return null;

  const images = item.images?.length ? item.images : [item.image];
  const hasMultiple = images.length > 1;
  const baseHref = `/view/${collectionId}`;

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => Math.min(images.length - 1, prev + 1));
  };

  const renderValueParts = (camelKey: string, rawValue: string, combination: CombinationResult) => {
    const { parts, fullLink } = combination;
    const fullDisplayText = parts.map(p => p.text).join('');

    if (fullLink) {
      return (
        <Link
          to={`${baseHref}?nav_${camelKey.toLowerCase()}=${encodeURIComponent(rawValue)}`}
          state={{ customLabel: fullDisplayText, filterKey: camelKey.toLowerCase() }}
          className="underline underline-offset-4 decoration-primary decoration-1 hover:text-primary transition-colors break-words inline-block max-w-full text-right"
        >
          {fullDisplayText}
        </Link>
      );
    }

    return (
      <span className="flex flex-wrap justify-end w-full">
        {parts.map((part, idx) => {
          const isLinkable = part.fieldKey && (LINK_FIELDS as readonly string[]).includes(part.fieldKey);
          if (isLinkable && part.fieldKey) {
            const navValue = item[part.fieldKey as keyof CollectionItem] as string;
            return (
              <Link
                key={idx}
                to={`${baseHref}?nav_${part.fieldKey.toLowerCase()}=${encodeURIComponent(navValue)}`}
                state={{ customLabel: part.text, filterKey: part.fieldKey.toLowerCase() }}
                className="underline underline-offset-4 decoration-primary decoration-1 hover:text-primary transition-colors break-words max-w-full"
              >
                {part.text}
              </Link>
            );
          }
          return (
            <span key={idx} className="whitespace-pre-wrap break-words text-foreground max-w-full text-right">
              {part.text}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>{`${item.displayName} | ${metadata?.title || SITE_METADATA.title}`}</title>
      </Helmet>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-background">
        <CollectionNavbar navGroups={navGroups} />
        <CollectionBreadcrumb item={item} />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to={returnPath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {location.state?.returnSearch ? "Back to results" : "Back to collection"}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-6 h-fit">
              {hasMultiple && (
                <div className="hidden lg:flex flex-col relative w-16 shrink-0 h-full self-start">
                  <AnimatePresence>
                    {showUpArrow && (
                      <motion.button
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => scrollThumbs('up')}
                        className="absolute top-0 left-0 right-0 flex justify-center py-4 z-20 text-primary hover:scale-110 transition-transform bg-gradient-to-b from-background via-background/80 to-transparent"
                      >
                        <ChevronUp className="w-6 h-6 stroke-[3px]" />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <div 
                    ref={thumbScrollRef}
                    onScroll={checkThumbScroll}
                    className="flex flex-col gap-3 overflow-y-auto no-scrollbar scroll-smooth h-full max-h-[500px] xl:max-h-[600px] pb-4"
                  >
                    {images.map((img, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setActiveImageIndex(idx)} 
                        className={cn(
                          "w-16 aspect-square rounded overflow-hidden border-2 bg-[hsl(var(--image-bg))] transition-all shrink-0",
                          idx === activeImageIndex ? 'border-primary' : 'border-transparent hover:border-border'
                        )}
                      >
                        <img src={img} className="w-full h-full object-contain" alt="" />
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {showDownArrow && (
                      <motion.button
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => scrollThumbs('down')}
                        className="absolute bottom-0 left-0 right-0 flex justify-center py-4 z-20 text-primary hover:scale-110 transition-transform bg-gradient-to-t from-background via-background/80 to-transparent"
                      >
                        <ChevronDown className="w-6 h-6 stroke-[3px] animate-bounce" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center w-full">
                  {hasMultiple && (
                    <button 
                      onClick={handlePrevImage} 
                      disabled={activeImageIndex === 0}
                      className={cn(
                        "p-1 lg:p-2 shrink-0 transition-all group",
                        activeImageIndex === 0 ? "opacity-40 cursor-not-allowed" : "text-primary hover:scale-110"
                      )}
                    >
                      <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
                    </button>
                  )}

                  <div className="relative flex-1 aspect-square w-full overflow-hidden rounded-lg border border-border bg-[hsl(var(--image-bg))] shadow-sm">
                    <div className="absolute inset-0">
                      <ImageCarousel
                        images={images}
                        activeIndex={activeImageIndex}
                        onIndexChange={setActiveImageIndex}
                        onTap={() => setLightboxOpen(true)}
                      />
                    </div>
                  </div>

                  {hasMultiple && (
                    <button 
                      onClick={handleNextImage} 
                      disabled={activeImageIndex === images.length - 1}
                      className={cn(
                        "p-1 lg:p-2 shrink-0 transition-all group",
                        activeImageIndex === images.length - 1 ? "opacity-40 cursor-not-allowed" : "text-primary hover:scale-110"
                      )}
                    >
                      <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
                    </button>
                  )}
                </div>

                {hasMultiple && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          idx === activeImageIndex 
                            ? "bg-primary w-6" 
                            : "bg-muted-foreground opacity-40 hover:opacity-100"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col pt-2">
              <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">{item.displayName}</h1>
              
              {/* LA SOLUCIÓN: grid-cols-[auto_1fr] en el padre compartido */}
              <div className="border-t border-border divide-y divide-border grid grid-cols-[auto_1fr]">
                {Object.entries(FIELD_MAP).map(([camelKey, label]) => {
                  const rawValue = item[camelKey as keyof CollectionItem];
                  if (!(VISIBLE_FIELDS as readonly string[]).includes(camelKey) || typeof rawValue !== "string" || !valid(rawValue)) return null;
                  
                  const combinationFn = FIELD_COMBINATIONS[camelKey];
                  const combination: CombinationResult = combinationFn ? combinationFn(item, rawValue) : { parts: [{ text: rawValue, fieldKey: camelKey }], fullLink: false };
                  const displayString = combination.parts.map(p => p.text).join('');
                  if (FIELD_VISIBILITY_RULES[camelKey] && !FIELD_VISIBILITY_RULES[camelKey](item, displayString)) return null;

                  return (
                    /* 'contents' hace que los hijos directos actúen como si fueran hijos del grid padre */
                    <div key={camelKey} className="contents">
                      <span className="text-[10px] font-black text-foreground uppercase tracking-[0.25em] py-5 pr-8 shrink-0 border-b border-border">
                        {label as string}
                      </span>
                      <div className="text-sm text-right text-foreground flex-1 min-w-0 flex justify-end py-4 border-b border-border">
                        {renderValueParts(camelKey, rawValue, combination)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Los SPECIAL_FIELDS fuera del grid ya que suelen ser bloques de texto largos */}
              <div className="divide-y divide-border">
                {SPECIAL_FIELDS.map((f) => {
                  const content = item[f as keyof typeof item];
                  const safe = Array.isArray(content) ? content.join(", ") : (content as string);
                  
                  return valid(safe) && (
                    <div key={f} className="py-6 w-full min-w-0"> 
                      <p className="text-sm italic text-foreground whitespace-pre-line leading-relaxed break-words">
                        {safe}
                      </p>
                    </div>
                  );
                })}
              </div>
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

function ImageCarousel({
  images,
  activeIndex,
  onIndexChange,
  onTap,
}: {
  images: string[];
  activeIndex: number;
  onIndexChange: (i: number) => void;
  onTap?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const isDraggingRef = useRef(false);
  const initializedRef = useRef(false);
  
  const hasMultiple = images.length > 1;

  const transitionConfig = {
    type: 'spring' as const,
    stiffness: 220, 
    damping: 35,    
    mass: 0.8,
    restDelta: 0.001
  };

  // Efecto 1: SOLO medir el ancho. No se vuelve a ejecutar si cambia el activeIndex.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    
    const measure = () => {
      setWidth(el.offsetWidth);
    };
    
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    
    return () => ro.disconnect();
  }, []);

  // Efecto 2: Controlar la posición. La primera vez aplica sin animación (.set), 
  // las siguientes veces usa el desplazamiento suave (animate).
  useEffect(() => {
    if (width === 0) return;
    
    if (!initializedRef.current) {
      x.set(-(activeIndex * width));
      initializedRef.current = true;
    } else if (!isDraggingRef.current) {
      animate(x, -(activeIndex * width), transitionConfig);
    }
  }, [activeIndex, width, x]);

  if (!hasMultiple) {
    return (
      <div 
        ref={containerRef} 
        className="w-full h-full flex items-center justify-center p-0 cursor-pointer" 
        onClick={onTap}
      >
        <img src={images[0]} className="w-full h-full object-contain pointer-events-none" alt="" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      {width > 0 && (
        <motion.div
          className="flex h-full cursor-grab active:cursor-grabbing"
          style={{ x, width: width * images.length }}
          drag="x"
          dragConstraints={{ left: -((images.length - 1) * width), right: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          onTap={() => {
            if (!isDraggingRef.current && onTap) {
              onTap();
            }
          }}
          onDragStart={() => {
            isDraggingRef.current = true;
          }}
          onDragEnd={(_, info) => {
            setTimeout(() => {
              isDraggingRef.current = false;
            }, 50);

            const offset = info.offset.x;
            const velocity = info.velocity.x;
            let next = activeIndex;
            const threshold = width * 0.15;
            
            if (offset < -threshold || velocity < -300) next = activeIndex + 1;
            else if (offset > threshold || velocity > 300) next = activeIndex - 1;

            next = Math.max(0, Math.min(images.length - 1, next));
            
            animate(x, -(next * width), transitionConfig);
            onIndexChange(next);
          }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className="h-full flex-shrink-0 flex items-center justify-center p-0"
              style={{ width }}
            >
              <img
                src={img}
                draggable={false}
                className="w-full h-full object-contain pointer-events-none select-none"
                alt=""
              />
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}