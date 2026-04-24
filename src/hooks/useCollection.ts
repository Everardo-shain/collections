import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { COLLECTIONS_MAP, DEFAULT_COLLECTION_ID, CollectionId, CollectionConfig } from "@/config";

/**
 * Devuelve la configuración activa basada en el parámetro :collectionId de la URL.
 * Si no hay parámetro o no es válido, usa la colección por defecto.
 */
export function useCollection(): { collectionId: CollectionId; config: CollectionConfig } {
  const params = useParams<{ collectionId?: string }>();
  return useMemo(() => {
    const id = (params.collectionId && COLLECTIONS_MAP[params.collectionId]
      ? params.collectionId
      : DEFAULT_COLLECTION_ID) as CollectionId;
    return { collectionId: id, config: COLLECTIONS_MAP[id] };
  }, [params.collectionId]);
}
