import { useEffect, useCallback, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X} from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { motion, useMotionValue, animate } from 'framer-motion';

interface ImageLightboxProps {
  images: string[];
  activeIndex: number; // Índice inicial que viene del padre
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void; // Se llama al cerrar para sincronizar el fondo
  alt?: string;
}

export function ImageLightbox({ images, activeIndex: initialIndex, open, onOpenChange, onIndexChange, alt }: ImageLightboxProps) {
  // Estado interno para que el fondo no se mueva mientras navegamos en el Lightbox
  const [internalIndex, setInternalIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const hasMultiple = images.length > 1;
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar el índice interno cuando se abre el modal
  useEffect(() => {
    if (open) {
      setInternalIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [open, initialIndex]);

  // Medir contenedor
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Animación del carrusel interno
  useEffect(() => {
    if (containerWidth > 0) {
      animate(x, -(internalIndex * containerWidth), {
        type: "spring",
        stiffness: 260,
        damping: 28,
      });
    }
  }, [internalIndex, containerWidth, x]);

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      // Al cerrar, sincronizamos el índice del padre con el que quedó en el Lightbox
      onIndexChange(internalIndex);
    }
    onOpenChange(isOpen);
  }, [internalIndex, onIndexChange, onOpenChange]);

  const goToPrev = useCallback(() => {
    if (isZoomed) return;
    setInternalIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length, isZoomed]);

  const goToNext = useCallback(() => {
    if (isZoomed) return;
    setInternalIndex((prev) => (prev + 1) % images.length);
  }, [images.length, isZoomed]);

  // Atajos de teclado
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[100vw] w-screen h-screen p-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-md border-none shadow-none flex flex-col items-center justify-center z-[100] outline-none overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{alt || 'Image gallery'}</DialogTitle>
        </VisuallyHidden>

        {/* --- CONTROLES SUPERIORES --- */}
        <div className="absolute top-4 right-4 z-[150] flex items-center gap-2">
          <button 
            onClick={() => handleClose(false)} 
            className="p-2 text-white/70 hover:text-white transition-colors bg-black/40 rounded-full backdrop-blur-sm"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* --- CONTADOR --- */}
        <div className="absolute bottom-4 right-6 z-[150] text-white font-medium text-sm bg-black/40 px-3 py-1 rounded-md backdrop-blur-sm border border-white/10 select-none">
          {internalIndex + 1} of {images.length}
        </div>
        
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-full h-full flex items-center overflow-hidden" ref={containerRef}>
            {containerWidth > 0 && (
              <motion.div
                className="flex h-full"
                style={{ x }}
                drag={hasMultiple && !isZoomed ? "x" : false}
                dragConstraints={{ left: -(internalIndex * containerWidth), right: -(internalIndex * containerWidth) }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) goToNext();
                  else if (info.offset.x > 50) goToPrev();
                }}
              >
                {images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 flex items-center justify-center w-screen h-screen overflow-hidden" 
                    style={{ width: containerWidth }}
                  >
                    <ZoomableImage 
                      src={img} 
                      isActive={internalIndex === idx} 
                      onZoomChange={setIsZoomed}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* NAVEGACIÓN */}
          {!isZoomed && hasMultiple && (
            <>
              <button 
                onClick={goToPrev} 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 z-[110] transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={goToNext} 
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 z-[110] transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
      const targetY = overflow - (mousePercent * overflow * 2);
      setYPos(targetY);
    }
  };

  useEffect(() => {
    if (!isActive) {
      setZoomed(false);
      setYPos(0);
    }
  }, [isActive]);

  return (
    <div 
      className="relative flex items-center justify-center w-full h-full"
      onMouseMove={handleMouseMove}
    >
      <motion.img
        ref={imgRef}
        src={src}
        animate={{ 
          scale: zoomed ? scale : 1,
          y: zoomed ? yPos : 0
        }}
        transition={{ duration: 0 }} 
        className={`max-h-full max-w-full w-auto h-auto object-contain select-none shadow-2xl ${
          zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
        }`}
        onClick={toggleZoom}
      />
    </div>
  );
}