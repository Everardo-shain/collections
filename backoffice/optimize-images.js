import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración de rutas
const RAW_DIR = path.join(__dirname, 'raw-images');
const TARGET_DIR = path.join(__dirname, '../src/assets/images');

// Configuración de optimización
const MAX_WIDTH = 1200; // Ancho máximo para la web
const QUALITY = 80;     // Calidad de compresión JPEG (80 es el punto óptimo peso/calidad)

async function optimizeCollections() {
  if (!fs.existsSync(RAW_DIR)) {
    console.log('No raw-images folder found. Nothing to optimize.');
    return;
  }

  const collections = fs.readdirSync(RAW_DIR);

  for (const collection of collections) {
    const rawCollectionPath = path.join(RAW_DIR, collection);
    const targetCollectionPath = path.join(TARGET_DIR, collection);

    // Validar que sea una carpeta
    if (!fs.statSync(rawCollectionPath).isDirectory()) continue;

    // Asegurar que exista la carpeta de destino en src/assets/images
    if (!fs.existsSync(targetCollectionPath)) {
      fs.mkdirSync(targetCollectionPath, { recursive: true });
    }

    const files = fs.readdirSync(rawCollectionPath);
    if (files.length === 0) continue;

    console.log(`\n📦 Processing collection: ${collection}`);

    for (const file of files) {
      const filePath = path.join(rawCollectionPath, file);
      
      // Ignorar archivos ocultos del sistema (como .DS_Store en Mac)
      if (file.startsWith('.')) continue;

      // El nombre final siempre será en minúsculas y extensión .jpg
      const outputFileName = file.replace(/\.(png|jpeg|webp)$/, '.jpg');
      const outputPath = path.join(targetCollectionPath, outputFileName);

      try {
        console.log(`⚡ Optimizing: ${file} -> ${outputFileName}`);
        
        // Procesamiento con Sharp
        await sharp(filePath)
          .rotate() // <--- ESTA LÍNEA CORRIGE EL GIRO BASÁNDOSE EN LA FOTO ORIGINAL
          .resize({ width: MAX_WIDTH, withoutEnlargement: true }) 
          .jpeg({ quality: QUALITY, progressive: true })          
          .toFile(outputPath);

        // Borrar el archivo HD original una vez optimizado con éxito
        fs.unlinkSync(filePath);
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
  }
  console.log('\n✅ Optimization finished. Auxiliary folders cleared.');
}

optimizeCollections();