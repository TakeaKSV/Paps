import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', 'data');

const decodeFromEnv = () => {
  const encoded = process.env.PRODUCT_CATALOG_BASE64;
  if (!encoded) {
    return null;
  }

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('❌ No se pudo decodificar PRODUCT_CATALOG_BASE64. Revisa que el contenido sea Base64 y JSON válido.');
    return null;
  }
};

const loadFromFile = () => {
  const candidateFiles = [
    path.join(dataDir, 'productCatalog.json'),
    path.join(dataDir, 'productCatalog.sample.json')
  ];

  for (const filePath of candidateFiles) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.error(`❌ Error leyendo catálogo ${filePath}:`, error.message);
      }
    }
  }

  return {};
};

const productCatalog = decodeFromEnv() || loadFromFile();

if (!Object.keys(productCatalog).length) {
  console.warn('⚠️ No se encontró ningún catálogo de productos. La generación de cotizaciones podría fallar.');
}

export default productCatalog;
