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

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) navRef.current?.go(currentIndex - 1);
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) navRef.current?.go(currentIndex + 1);
  }, [currentIndex, images.length]);

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

  const arrowStyles = cn(
    "bg-primary text-primary-foreground transition-all duration-200",
    "hover:bg-primary/90", // Ajustado para que sea sutil
    "disabled:opacity-20 disabled:cursor-not-allowed"
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-none w-screen h-screen !gap-0 !p-0 !rounded-none bg-background border-none shadow-none !flex flex-col z-[100] outline-none overflow-hidden [&>button]:hidden duration-0 data-[state=open]:!animate-none data-[state=closed]:!animate-none"
      >
        <VisuallyHidden>
          <DialogTitle>{alt || 'Image gallery'}</DialogTitle>
        </VisuallyHidden>

        {/* --- TOP BAR HEADER --- */}
        <div className="relative shrink-0 bg-background border-b border-border z-[150] min-h-[56px] md:h-14 flex flex-col justify-center">
          
          {/* Contenedor Principal: En Desktop es una línea, en Mobile se adapta */}
          <div className="w-full h-14 flex items-center justify-between px-6">
            
            {/* Contador (Izquierda) */}
            <div className="w-32 flex-shrink-0 text-[14px] md:text-[14px] font-bold tracking-[0.2em] uppercase text-muted-foreground select-none">
              {hasMultiple ? `${currentIndex + 1} / ${images.length}` : ''}
            </div>

            {/* Display Name (Desktop: Centro) */}
            <div className="hidden md:flex flex-1 min-w-0 justify-center px-4">
              {alt && (
                <span className="text-foreground text-[13px] font-black tracking-[0.1em] uppercase truncate antialiased">
                  {alt}
                </span>
              )}
            </div>

            {/* Botón Cerrar (Derecha) */}
            <div className="w-32 flex-shrink-0 flex justify-end">
              <button
                onClick={() => handleClose(false)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                aria-label="Close"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* Fila Inferior (Solo Mobile): Nombre debajo de los controles */}
          {alt && (
            <div className="md:hidden w-full px-6 pb-4 flex justify-center">
              <span className="text-foreground text-[12px] font-black tracking-[0.1em] uppercase text-center leading-tight antialiased">
                {alt}
              </span>
            </div>
          )}
        </div>

        {/* --- MAIN VIEWPORT --- */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden flex items-stretch justify-center">
          {/* Carrusel */}
          {open && (
            <LightboxCarousel
              key={`lightbox-${images.length}`}
              images={images}
              activeIndex={currentIndex}
              onIndexChange={setInternalIndex}
              isZoomed={isZoomed}
              onZoomChange={setIsZoomed}
              navRef={navRef}
            />
          )}

          {/* Flechas de Navegación */}
          {!isZoomed && hasMultiple && (
            <>
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className={cn("hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center z-[110]", arrowStyles)}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex === images.length - 1}
                className={cn("hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center z-[110]", arrowStyles)}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LightboxCarousel({
  images,
  activeIndex,
  onIndexChange,
  isZoomed,
  onZoomChange,
  navRef,
}: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const x = useMotionValue(-(activeIndex * width));
  const draggingRef = useRef(false);
  const hasMultiple = images.length > 1;

  const transitionConfig = {
    type: 'spring' as const,
    stiffness: 220,
    damping: 35,
    mass: 0.8,
    restDelta: 0.001
  };

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const measure = () => {
      const w = el.offsetWidth;
      if (w <= 0) return;
      setWidth(w);
      x.set(-(activeIndex * w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, x]); 

  useEffect(() => {
    if (width === 0 || draggingRef.current) return;
    animate(x, -(activeIndex * width), transitionConfig);
  }, [activeIndex, width, x]);

  const go = useCallback((next: number) => {
    if (isZoomed || !hasMultiple || width === 0) return;
    const clampedNext = Math.max(0, Math.min(images.length - 1, next));
    onIndexChange(clampedNext);
  }, [isZoomed, hasMultiple, width, images.length, onIndexChange]);

  useEffect(() => {
    navRef.current = { go };
    return () => { navRef.current = null; };
  }, [go, navRef]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden bg-background">
      {width > 0 && (
        <motion.div
          className="flex h-full cursor-grab active:cursor-grabbing"
          style={{ x, width: width * images.length }}
          drag={!isZoomed ? 'x' : false}
          dragConstraints={{ left: -((images.length - 1) * width), right: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={() => { draggingRef.current = true; }}
          onDragEnd={(_, info) => {
            setTimeout(() => { draggingRef.current = false; }, 50);
            const offset = info.offset.x;
            const velocity = info.velocity.x;
            let next = activeIndex;
            if (offset < -width * 0.15 || velocity < -300) next = activeIndex + 1;
            else if (offset > width * 0.15 || velocity > 300) next = activeIndex - 1;
            next = Math.max(0, Math.min(images.length - 1, next));
            animate(x, -(next * width), transitionConfig);
            onIndexChange(next);
          }}
        >
          {images.map((img, idx) => (
            <div key={idx} className="flex-shrink-0 flex items-center justify-center h-full" style={{ width }}>
              <ZoomableImage src={img} isActive={idx === activeIndex} onZoomChange={onZoomChange} isDraggingRef={draggingRef} />
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ZoomableImage({ src, isActive, onZoomChange, isDraggingRef }: any) {
  const [zoomed, setZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [yPos, setYPos] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const toggleZoom = (e: React.MouseEvent) => {
    if (isDraggingRef?.current) return;
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
      if (imgHeightFull > window.innerHeight) setYPos(overflow - (clickPercent * overflow * 2));
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
    <div className="relative flex items-center justify-center w-full h-full" onMouseMove={handleMouseMove}>
      <motion.img
        ref={imgRef}
        src={src}
        draggable={false}
        animate={{ scale: zoomed ? scale : 1, y: zoomed ? yPos : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "max-h-full max-w-full w-auto h-auto object-contain select-none pointer-events-auto",
          zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
        )}
        onClick={toggleZoom}
      />
    </div>
  );
}