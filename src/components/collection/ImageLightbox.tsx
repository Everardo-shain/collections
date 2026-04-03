import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImageLightboxProps {
  images: string[];
  activeIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  alt?: string;
}

export function ImageLightbox({ images, activeIndex, open, onOpenChange, onIndexChange, alt }: ImageLightboxProps) {
  const hasMultiple = images.length > 1;

  const goToPrev = useCallback(() => {
    onIndexChange((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length, onIndexChange]);

  const goToNext = useCallback(() => {
    onIndexChange((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goToPrev, goToNext]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-2 sm:p-4 bg-card border-border">
        <VisuallyHidden>
          <DialogTitle>{alt || 'Image gallery'}</DialogTitle>
        </VisuallyHidden>
        <div className="relative flex items-center justify-center">
          <img
            src={images[activeIndex]}
            alt={alt ? `${alt} - Image ${activeIndex + 1}` : `Image ${activeIndex + 1}`}
            className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg"
          />
          {hasMultiple && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-card transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-card transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        {hasMultiple && (
          <div className="flex justify-center gap-1.5 mt-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onIndexChange(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === activeIndex ? 'bg-foreground' : 'bg-muted-foreground/40'
                }`}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
