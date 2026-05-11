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
  const location = useLocation(); // Este ya detecta la ruta virtual

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
      // CAMBIO CLAVE: Usamos location.pathname del hook, no window.location
      // Además, verificamos si realmente estamos SALIENDO de una colección
      if (!location.pathname.startsWith('/view/')) {
        const isDarkNow = document.documentElement.classList.contains('dark');
        const defaultColor = isDarkNow ? SITE_METADATA.darkAccentColor : SITE_METADATA.lightAccentColor;
        document.documentElement.style.setProperty('--accent-color', defaultColor);
        localStorage.setItem('last-accent-color', defaultColor);
      }
    };
    // Quitamos 'location.pathname' de las dependencias para que no se resetee al filtrar
    // Solo queremos que se ejecute cuando cambie la configuración de la colección
  }, [collectionData.config]); 

  return collectionData;
}