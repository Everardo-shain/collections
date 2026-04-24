import { FIELD_MAP, CollectionItem } from "@/config";

// 1. Cargamos todas las imágenes de la carpeta de forma inmediata
const allImages = import.meta.glob("@/images/*.{jpg,jpeg,png,webp}", { 
  eager: true, 
  import: 'default' 
});
const imagePaths = Object.values(allImages) as string[];

/**
 * Mapea un objeto plano del JSON a nuestra interfaz CollectionItem
 * de forma totalmente dinámica basada en FIELD_MAP.
 */
export function mapItem(raw: Record<string, string>): CollectionItem {
  // Extraemos el ID primero para la lógica de imágenes
  // Buscamos la llave que en el JSON se llama "ID" (mapeada a 'id')
  const idKeyInJSON = FIELD_MAP.id; 
  const id = raw[idKeyInJSON]?.trim() || "";

  // 2. CREACIÓN DINÁMICA DE CAMPOS
  // Creamos un objeto vacío y lo llenamos recorriendo el FIELD_MAP
  const fields = {} as any;
  
  Object.entries(FIELD_MAP).forEach(([camelKey, jsonName]) => {
    // Tomamos el valor del JSON usando el nombre real (ej: raw["Display Name"])
    // y lo asignamos a nuestra llave interna (ej: fields["displayName"])
    fields[camelKey] = raw[jsonName]?.trim() || "";
  });

  // 3. LÓGICA DE IMÁGENES
  // Filtramos las rutas que empiecen con "ID_"
  const matchingImages = imagePaths
    .filter((path) => {
      const fileName = path.split('/').pop() || "";
      return fileName.startsWith(`${id}_`);
    })
    .sort(); // Orden alfabético (123_1.jpg, 123_2.jpg...)

  // 4. RESULTADO FINAL
  return {
    ...fields,
    id, // Aseguramos el ID
    // Imagen principal (la primera encontrada o el placeholder)
    image: matchingImages.length > 0 ? matchingImages[0] : "/src/images/placeholder.jpg",
    // Galería completa
    images: matchingImages
  };
}