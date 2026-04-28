import { useEffect, useCallback, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, useMotionValue, animate } from 'framer-motion';

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

  // Sync index whenever the lightbox opens
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

  // Programmatic navigation - exposed to nav arrows
  const navRef = useRef<{ go: (next: number) => void } | null>(null);

  const goToPrev = useCallback(() => navRef.current?.go(internalIndex - 1), [internalIndex]);
  const goToNext = useCallback(() => navRef.current?.go(internalIndex + 1), [internalIndex]);

  // Keyboard
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[100vw] w-screen h-screen p-0 bg-background border-none shadow-none flex flex-col items-center justify-center z-[100] outline-none overflow-hidden [&>button]:hidden duration-0"
      >
        <VisuallyHidden>
          <DialogTitle>{alt || 'Image gallery'}</DialogTitle>
        </VisuallyHidden>

        {/* Close button */}
        <div className="absolute top-4 right-4 z-[150]">
          <button
            onClick={() => handleClose(false)}
            className="p-3 bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 transition-all rounded-full shadow-lg"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Counter */}
        {hasMultiple && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[150] bg-black/40 backdrop-blur-md text-white border border-white/10 font-medium text-xs px-4 py-2 rounded-full select-none shadow-lg">
            {internalIndex + 1} / {images.length}
          </div>
        )}

        <div className="relative w-full h-full flex items-center justify-center">
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

          {/* Nav arrows — desktop only */}
          {!isZoomed && hasMultiple && (
            <>
              <button
                onClick={goToPrev}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 items-center justify-center hover:bg-black/60 z-[110] transition-all shadow-xl"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-9 h-9" />
              </button>
              <button
                onClick={goToNext}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 items-center justify-center hover:bg-black/60 z-[110] transition-all shadow-xl"
                aria-label="Next image"
              >
                <ChevronRight className="w-9 h-9" />
              </button>
            </>
          )}
        </div>

        {/* Footer with displayName */}
        {alt && (
          <div className="absolute bottom-0 left-0 right-0 z-[140] pointer-events-none">
            <div className="px-6 py-4 bg-gradient-to-t from-black/70 to-transparent flex justify-center">
              <span className="text-white/90 text-sm font-medium tracking-wide text-center max-w-2xl truncate">
                {alt}
              </span>
            </div>
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
