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

  // Sync to parent in real time whenever the internal index changes while open
  const updateIndex = useCallback((next: number) => {
    setInternalIndex(next);
    onIndexChange(next);
  }, [onIndexChange]);

  const handleClose = useCallback((isOpen: boolean) => {
    onOpenChange(isOpen);
  }, [onOpenChange]);

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
        className="!max-w-none fixed inset-0 w-screen h-[100dvh] !gap-0 !p-0 !rounded-none bg-background border-none shadow-none !flex flex-col z-[100] outline-none overflow-hidden [&>button]:hidden duration-0 data-[state=open]:!animate-none data-[state=closed]:!animate-none"
      >
        <VisuallyHidden>
          <DialogTitle>{alt || 'Image gallery'}</DialogTitle>
        </VisuallyHidden>

        {/* --- TOP BAR HEADER --- */}
        <div className="relative shrink-0 bg-background border-b border-border z-[150] min-h-[56px] md:h-14 flex flex-col justify-center pt-[env(safe-area-inset-top)]">
          
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
              onIndexChange={updateIndex}
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

  // NUEVO: Referencia en tiempo real para abortar gestos fantasma
  const isZoomedRef = useRef(isZoomed);
  useEffect(() => {
    isZoomedRef.current = isZoomed;
  }, [isZoomed]);

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
          className="flex h-full"
          style={{ x, width: width * images.length }}
          drag={!isZoomed ? 'x' : false}
          dragConstraints={{ left: -((images.length - 1) * width), right: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={() => { draggingRef.current = true; }}
          onDragEnd={(_, info) => {
            setTimeout(() => { draggingRef.current = false; }, 50);

            // FIX: Si el componente hijo activó el zoom, abortamos el swipe inmediatamente
            // y obligamos a la imagen a quedarse en su sitio.
            if (isZoomedRef.current) {
              animate(x, -(activeIndex * width), transitionConfig);
              return;
            }

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
  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const lastTouch = useRef({ x: 0, y: 0 });
  const startDistance = useRef(0);
  const initialScale = useRef(1);
  const isPinching = useRef(false);
  const canZoomRef = useRef(false);
  const lastTapTime = useRef(0);
  const lastTouchTime = useRef(0);

  // NUEVAS REFS: Para trackear el centro del pinch y la posición inicial
  const pinchStartMidpoint = useRef({ x: 0, y: 0 });
  const pinchStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => { canZoomRef.current = true; }, 400);
    return () => clearTimeout(timer);
  }, []);

  const getClampedOffsets = useCallback((newScale: number, newX: number, newY: number) => {
    if (!imgRef.current) return { x: 0, y: 0 };
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const fullW = imgRef.current.offsetWidth * newScale;
    const fullH = imgRef.current.offsetHeight * newScale;

    let clampedX = 0;
    let clampedY = 0;

    if (fullW > winW) {
      const limX = (fullW - winW) / 2;
      clampedX = Math.max(-limX, Math.min(limX, newX));
    } else {
      clampedX = 0; // Centrar si es más pequeña que la pantalla
    }

    if (fullH > winH) {
      const limY = (fullH - winH) / 2;
      clampedY = Math.max(-limY, Math.min(limY, newY));
    } else {
      clampedY = 0;
    }
    return { x: clampedX, y: clampedY };
  }, []);

  const resetZoom = useCallback(() => {
    setZoomed(false);
    onZoomChange(false);
    setXPos(0);
    setYPos(0);
    setScale(1);
    initialScale.current = 1;
  }, [onZoomChange]);

  const performZoom = (clientX: number, clientY: number) => {
    if (!imgRef.current) return;
    if (!zoomed) {
      const fixedScale = 2.5;
      const rect = imgRef.current.getBoundingClientRect();
      const clickXPercent = (clientX - rect.left) / rect.width;
      const clickYPercent = (clientY - rect.top) / rect.height;

      const { x, y } = getClampedOffsets(fixedScale, 
        ((rect.width * fixedScale) - window.innerWidth) / 2 - (clickXPercent * ((rect.width * fixedScale) - window.innerWidth)),
        ((rect.height * fixedScale) - window.innerHeight) / 2 - (clickYPercent * ((rect.height * fixedScale) - window.innerHeight))
      );

      setScale(fixedScale);
      setXPos(x);
      setYPos(y);
      setZoomed(true);
      onZoomChange(true);
    } else {
      resetZoom();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchTime.current = Date.now(); 
    
    if (e.touches.length === 2) {
      isPinching.current = true;
      onZoomChange(true); 
      
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      
      // Distancia inicial
      startDistance.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialScale.current = scale;

      // GUARDAR PUNTO MEDIO INICIAL (Focal Point)
      pinchStartMidpoint.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
      // Guardar posición inicial del renderizado
      pinchStartPos.current = { x: xPos, y: yPos };

    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        if (!isDraggingRef?.current && canZoomRef.current) {
          if (zoomed) resetZoom();
          else performZoom(e.touches[0].clientX, e.touches[0].clientY);
        }
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
      }

      if (zoomed) {
        isPinching.current = false;
        lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    lastTouchTime.current = Date.now();
    if (!imgRef.current) return;

    if (e.touches.length >= 2) {
      e.stopPropagation();
    }

    if (e.touches.length === 2 && isPinching.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      let newScale = (dist / startDistance.current) * initialScale.current;
      newScale = Math.max(1, Math.min(newScale, 5));

      if (newScale <= 1.05 && zoomed) {
        resetZoom();
        return;
      }

      // --- LÓGICA DE ZOOM HACIA EL PUNTO MEDIO ---
      const currentMidX = (t1.clientX + t2.clientX) / 2;
      const currentMidY = (t1.clientY + t2.clientY) / 2;

      // Cuánto ha crecido la imagen comparado con el inicio del pinch
      const scaleRatio = newScale / initialScale.current;

      // Calculamos cuánto se debe mover la imagen para que el punto bajo los dedos no se mueva.
      // La fórmula básica es: NuevaPos = CentroActual - (DistanciaAlCentro * ratio)
      // Ajustado a nuestro sistema de coordenadas (donde 0 es el centro):
      const focalX = pinchStartMidpoint.current.x - window.innerWidth / 2;
      const focalY = pinchStartMidpoint.current.y - window.innerHeight / 2;

      // Calculamos el desplazamiento extra provocado por el movimiento de los dedos
      const dragX = currentMidX - pinchStartMidpoint.current.x;
      const dragY = currentMidY - pinchStartMidpoint.current.y;

      const newX = (pinchStartPos.current.x - focalX) * scaleRatio + focalX + dragX;
      const newY = (pinchStartPos.current.y - focalY) * scaleRatio + focalY + dragY;

      const clamped = getClampedOffsets(newScale, newX, newY);
      
      setScale(newScale);
      setXPos(clamped.x);
      setYPos(clamped.y);
      
      if (newScale > 1.05) {
        setZoomed(true);
        onZoomChange(true);
      }
    } else if (e.touches.length === 1 && zoomed && !isPinching.current) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouch.current.x;
      const deltaY = touch.clientY - lastTouch.current.y;
      lastTouch.current = { x: touch.clientX, y: touch.clientY };

      const { x, y } = getClampedOffsets(scale, xPos + deltaX, yPos + deltaY);
      setXPos(x);
      setYPos(y);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    lastTouchTime.current = Date.now();
    if (scale <= 1.15 && zoomed) {
      resetZoom();
    }
    if (e.touches.length === 0) {
      setTimeout(() => { isPinching.current = false; }, 100);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (Date.now() - lastTouchTime.current < 500) return;
    if (isDraggingRef?.current || !canZoomRef.current) return;
    performZoom(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (Date.now() - lastTouchTime.current < 500) return;
    if (!zoomed || isPinching.current) return;
    const { x, y } = getClampedOffsets(scale, 
      ( (scale * window.innerWidth - window.innerWidth) / 2 ) - (e.clientX / window.innerWidth * (scale * window.innerWidth - window.innerWidth)),
      ( (scale * window.innerHeight - window.innerHeight) / 2 ) - (e.clientY / window.innerHeight * (scale * window.innerHeight - window.innerHeight))
    );
    setXPos(x);
    setYPos(y);
  };

  useEffect(() => { if (!isActive) resetZoom(); }, [isActive, resetZoom]);

  return (
    <div 
      className="relative flex items-center justify-center w-full h-full overflow-hidden touch-none" 
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDownCapture={(e) => {
        if (e.nativeEvent.pointerType === 'touch' && !e.isPrimary) {
          e.stopPropagation();
        }
      }}
    >
      <motion.img
        ref={imgRef}
        src={src}
        draggable={false}
        animate={{ scale, x: zoomed ? xPos : 0, y: zoomed ? yPos : 0 }}
        transition={isPinching.current ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          "max-h-full max-w-full w-auto h-auto object-contain select-none",
          zoomed ? 'cursor-zoom-out z-50' : 'cursor-zoom-in'
        )}
        onClick={handleClick}
      />
    </div>
  );
}