import { useParams, useLocation } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { 
  COLLECTIONS_MAP, 
  DEFAULT_COLLECTION_ID, 
  SITE_METADATA, 
  CollectionId, 
  CollectionConfig 
} from "@/config";

export function useCollection(): { collectionId: CollectionId; config: CollectionConfig } {
  const params = useParams<{ collectionId?: string }>();
  const location = useLocation();

  const collectionData = useMemo(() => {
    const id = (params.collectionId && COLLECTIONS_MAP[params.collectionId]
      ? params.collectionId
      : DEFAULT_COLLECTION_ID) as CollectionId;
    
    return { collectionId: id, config: COLLECTIONS_MAP[id] };
  }, [params.collectionId]);

  useEffect(() => {
    const metadata = (collectionData.config as any).metadata;
    const lightColor = metadata?.lightAccentColor || SITE_METADATA.lightAccentColor;
    const darkColor = metadata?.darkAccentColor || SITE_METADATA.darkAccentColor;

    const updateAccentColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const colorToApply = isDark ? darkColor : lightColor;
      
      document.documentElement.style.setProperty('--accent-color', colorToApply);
      
      // GUARDAR en localStorage para la próxima carga
      localStorage.setItem('last-accent-color', colorToApply);
    };

    updateAccentColor();

    const observer = new MutationObserver(updateAccentColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
      if (!window.location.pathname.includes('/view/')) {
        const isDarkNow = document.documentElement.classList.contains('dark');
        const defaultColor = isDarkNow ? SITE_METADATA.darkAccentColor : SITE_METADATA.lightAccentColor;
        document.documentElement.style.setProperty('--accent-color', defaultColor);
        
        // Actualizar también el storage al salir
        localStorage.setItem('last-accent-color', defaultColor);
      }
    };
  }, [collectionData.config, location.pathname]);

  return collectionData;
}