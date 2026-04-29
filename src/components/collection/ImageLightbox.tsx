import { useEffect, useCallback, useState, useRef, useLayoutEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { cn } from "@/lib/utils";

// A11y helper
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
    {children}
  </span>
);

interface ImageLightboxProps {
  images: string[];
  activeIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  alt?: string;
}

export function ImageLightbox({ images, activeIndex: initialIndex, open, onOpenChange, onIndexChange, alt }: ImageLightboxProps) {
  const [internalIndex, setInternalIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const navRef = useRef<{ go: (next: number) => void } | null>(null);
  const currentIndex = open && navRef.current === null ? initialIndex : internalIndex;

  useLayoutEffect(() => {
    if (open) {
      setInternalIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [open, initialIndex]);

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) onIndexChange(currentIndex);
    onOpenChange(isOpen);
  }, [currentIndex, onIndexChange, onOpenChange]);

  const goToPrev = useCallback(() => navRef.current?.go(currentIndex - 1), [currentIndex]);
  const goToNext = useCallback(() => navRef.current?.go(currentIndex + 1), [currentIndex]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') handleClose(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goToPrev, goToNext, handleClose]);

  const hasMultiple = images.length > 1;
  const controlStyles = "bg-background/50 backdrop-blur-md text-foreground border border-border shadow-sm transition-all hover:bg-background";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-none max-w-[100vw] w-screen h-screen !gap-0 !p-0 !rounded-none bg-background border-none shadow-none flex flex-col z-[100] outline-none overflow-hidden [&>button]:hidden duration-0 data-[state=open]:!animate-none data-[state=closed]:!animate-none"
      >
        <VisuallyHidden>
          <DialogTitle>{alt || 'Image gallery'}</DialogTitle>
        </VisuallyHidden>

        <div className="relative flex-1 min-h-0 w-full overflow-hidden flex items-stretch justify-center mb-[-1px]">
          
          {/* Contador (Flotante) */}
          {hasMultiple && (
            <div className={cn(
              "absolute top-6 left-6 z-[150] px-4 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase",
              controlStyles
            )}>
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Botón Cerrar (Flotante) */}
          <button
            onClick={() => handleClose(false)}
            className={cn("absolute top-6 right-6 z-[150] p-2.5 rounded-full", controlStyles)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Carrusel */}
          {open && (
            <LightboxCarousel
              key={`lightbox-${initialIndex}-${images.length}`}
              images={images}
              activeIndex={currentIndex}
              onIndexChange={setInternalIndex}
              isZoomed={isZoomed}
              onZoomChange={setIsZoomed}
              navRef={navRef}
            />
          )}

          {/* Flechas (Solo Desktop) */}
          {!isZoomed && hasMultiple && (
            <>
              <button
                onClick={goToPrev}
                className={cn("hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full items-center justify-center z-[110]", controlStyles)}
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={goToNext}
                className={cn("hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full items-center justify-center z-[110]", controlStyles)}
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}
        </div>

        {/* --- FOOTER (El nombre del item) --- */}
        {alt && (
          <div className="h-14 shrink-0 mt-0 flex items-center justify-center px-6 bg-background border-t border-border z-[140]">
            <span className="text-foreground text-[13px] font-medium tracking-tight text-center truncate max-w-3xl uppercase">
              {alt}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Infinite carousel using sentinel slides + 1:1 drag with framer-motion.
 * Shares its logic with the InfiniteCarousel from ItemDetail.
 */
function LightboxCarousel({
  images,
  activeIndex,
  onIndexChange,
  isZoomed,
  onZoomChange,
  navRef,
}: {
  images: string[];
  activeIndex: number;
  onIndexChange: (i: number) => void;
  isZoomed: boolean;
  onZoomChange: (z: boolean) => void;
  navRef: React.MutableRefObject<{ go: (next: number) => void } | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMultiple = images.length > 1;
  const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const initialOffset = hasMultiple ? activeIndex + 1 : activeIndex;
  const [width, setWidth] = useState(initialWidth);
  const x = useMotionValue(-(initialOffset * initialWidth));
  const draggingRef = useRef(false);
  const animatingRef = useRef(false);
  const previousActiveIndexRef = useRef(activeIndex);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const measure = () => {
      const w = el.offsetWidth;
      if (w <= 0) return;
      setWidth(w);
      if (!animatingRef.current && !draggingRef.current) {
        const offset = hasMultiple ? previousActiveIndexRef.current + 1 : previousActiveIndexRef.current;
        x.set(-(offset * w));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasMultiple, x]);

  useEffect(() => {
    if (width === 0) return;
    if (draggingRef.current || animatingRef.current) return;
    const previousIndex = previousActiveIndexRef.current;
    if (previousIndex === activeIndex) return;

    const isForwardClone = previousIndex === images.length - 1 && activeIndex === 0;
    const isBackwardClone = previousIndex === 0 && activeIndex === images.length - 1;
    const target = isForwardClone
      ? -((images.length + 1) * width)
      : isBackwardClone
        ? 0
        : -((activeIndex + 1) * width);

    if (Math.abs(x.get() - target) < 1) {
      previousActiveIndexRef.current = activeIndex;
      return;
    }
    animatingRef.current = true;
    animate(x, target, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      onComplete: () => {
        if (isForwardClone) {
          x.set(-width);
        } else if (isBackwardClone) {
          x.set(-(images.length * width));
        }
        previousActiveIndexRef.current = activeIndex;
        animatingRef.current = false;
      },
    });
  }, [activeIndex, width, x, images.length]);

  // Programmatic go() exposed via ref
  const go = useCallback((next: number) => {
    if (isZoomed || !hasMultiple || width === 0) return;
    animatingRef.current = true;
    const sentinelTarget = -((next + 1) * width);
    animate(x, sentinelTarget, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      onComplete: () => {
        let wrapped = next;
        if (next < 0) {
          wrapped = images.length - 1;
          x.set(-(images.length * width));
        } else if (next >= images.length) {
          wrapped = 0;
          x.set(-width);
        }
        previousActiveIndexRef.current = wrapped;
        animatingRef.current = false;
        onIndexChange(wrapped);
      },
    });
  }, [isZoomed, hasMultiple, width, images.length, x, onIndexChange]);

  useEffect(() => {
    navRef.current = { go };
    return () => { navRef.current = null; };
  }, [go, navRef]);

  if (!hasMultiple) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-end justify-center">
        <ZoomableImage src={images[0]} isActive onZoomChange={onZoomChange} />
      </div>
    );
  }

  const slides = [images[images.length - 1], ...images, images[0]];

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      {width > 0 && (
        <motion.div
          className="flex h-full"
          style={{ x, width: width * slides.length }}
          drag={!isZoomed ? 'x' : false}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => { draggingRef.current = true; }}
          onDragEnd={(_, info) => {
            draggingRef.current = false;
            const offset = info.offset.x;
            const velocity = info.velocity.x;
            const threshold = width * 0.1;
            let next = activeIndex;
            if (offset < -threshold || velocity < -400) next = activeIndex + 1;
            else if (offset > threshold || velocity > 400) next = activeIndex - 1;
            go(next);
          }}
        >
          {slides.map((img, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 flex items-end justify-center h-full"
              style={{ width }}
            >
              <ZoomableImage
                src={img}
                isActive={idx === activeIndex + 1}
                onZoomChange={onZoomChange}
              />
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ZoomableImage({ src, isActive, onZoomChange }: { src: string, isActive: boolean, onZoomChange: (z: boolean) => void }) {
  const [zoomed, setZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [yPos, setYPos] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const toggleZoom = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    if (!zoomed) {
      const rect = imgRef.current.getBoundingClientRect();
      const newScale = window.innerWidth / rect.width;
      const clickYRelative = e.clientY - rect.top;
      const clickPercent = clickYRelative / rect.height;
      const imgHeightFull = rect.height * newScale;
      const overflow = (imgHeightFull - window.innerHeight) / 2;

      setScale(newScale);
      setZoomed(true);
      onZoomChange(true);
      if (imgHeightFull > window.innerHeight) {
        setYPos(overflow - (clickPercent * overflow * 2));
      }
    } else {
      setZoomed(false);
      onZoomChange(false);
      setYPos(0);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!zoomed || !imgRef.current) return;
    const fullHeight = imgRef.current.offsetHeight * scale;
    const windowH = window.innerHeight;
    if (fullHeight > windowH) {
      const overflow = (fullHeight - windowH) / 2;
      const mousePercent = e.clientY / windowH;
      setYPos(overflow - (mousePercent * overflow * 2));
    }
  };

  useEffect(() => {
    if (!isActive) {
      setZoomed(false);
      setYPos(0);
    }
  }, [isActive]);

  return (
    <div className="relative flex items-end justify-center w-full h-full" onMouseMove={handleMouseMove}>
      <motion.img
        ref={imgRef}
        src={src}
        draggable={false}
        animate={{ scale: zoomed ? scale : 1, y: zoomed ? yPos : 0 }}
        transition={{ duration: 0.2 }}
        className={`max-h-full max-w-full w-auto h-auto object-contain select-none shadow-2xl pointer-events-auto ${
          zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
        }`}
        onClick={toggleZoom}
      />
    </div>
  );
}
