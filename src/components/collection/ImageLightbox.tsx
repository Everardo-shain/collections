import { useEffect, useCallback, useState, useRef } from 'react';
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

  useEffect(() => {
    if (open) {
      setInternalIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [open, initialIndex]);

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) onIndexChange(internalIndex);
    onOpenChange(isOpen);
  }, [internalIndex, onIndexChange, onOpenChange]);

  const navRef = useRef<{ go: (next: number) => void } | null>(null);
  const goToPrev = useCallback(() => navRef.current?.go(internalIndex - 1), [internalIndex]);
  const goToNext = useCallback(() => navRef.current?.go(internalIndex + 1), [internalIndex]);

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
        className="max-w-[100vw] w-screen h-screen p-0 bg-background border-none shadow-none flex flex-col z-[100] outline-none overflow-hidden [&>button]:hidden duration-0"
      >
        <VisuallyHidden>
          <DialogTitle>{alt || 'Image gallery'}</DialogTitle>
        </VisuallyHidden>

        {/* --- ÁREA PRINCIPAL --- */}
        {/* Cambiamos items-center por items-end para pegar la imagen al footer */}
        <div className="relative flex-1 w-full overflow-hidden flex items-end justify-center">
          
          {/* Contador (Flotante) */}
          {hasMultiple && (
            <div className={cn(
              "absolute top-6 left-6 z-[150] px-4 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase",
              controlStyles
            )}>
              {internalIndex + 1} / {images.length}
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
              images={images}
              activeIndex={internalIndex}
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
                className={cn("hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center z-[110]", controlStyles)}
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={goToNext}
                className={cn("hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center z-[110]", controlStyles)}
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}
        </div>

        {/* --- FOOTER (El nombre del item) --- */}
        {alt && (
          <div className="h-14 shrink-0 flex items-center justify-center px-6 bg-background border-t border-border z-[140]">
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
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const draggingRef = useRef(false);
  const animatingRef = useRef(false);
  const initializedRef = useRef(false);
  const hasMultiple = images.length > 1;

  // Measure container with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const measure = () => {
      const w = el.offsetWidth;
      if (w <= 0) return;
      setWidth(w);
      if (!initializedRef.current) {
        const offset = hasMultiple ? activeIndex + 1 : activeIndex;
        x.set(-(offset * w));
        initializedRef.current = true;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Snap to active index when it changes externally (keyboard/buttons)
  useEffect(() => {
    if (width === 0) return;
    if (draggingRef.current || animatingRef.current) return;
    const offset = hasMultiple ? activeIndex + 1 : activeIndex;
    const target = -(offset * width);
    if (Math.abs(x.get() - target) < 1) return;
    animate(x, target, { type: 'spring', stiffness: 300, damping: 32 });
  }, [activeIndex, width, x, hasMultiple]);

  // Programmatic go() exposed via ref
  const go = useCallback((next: number) => {
    if (isZoomed || !hasMultiple || width === 0) return;
    animatingRef.current = true;
    const sentinelTarget = -((next + 1) * width);
    animate(x, sentinelTarget, {
      type: 'spring',
      stiffness: 300,
      damping: 32,
      onComplete: () => {
        const wrapped = ((next % images.length) + images.length) % images.length;
        if (wrapped !== next) x.set(-((wrapped + 1) * width));
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
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
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
            const threshold = width * 0.18;
            let next = activeIndex;
            if (offset < -threshold || velocity < -400) next = activeIndex + 1;
            else if (offset > threshold || velocity > 400) next = activeIndex - 1;
            go(next);
          }}
        >
          {slides.map((img, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 flex items-center justify-center h-full"
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
    <div className="relative flex items-center justify-center w-full h-full" onMouseMove={handleMouseMove}>
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
