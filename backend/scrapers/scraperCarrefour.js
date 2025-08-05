import axios from 'axios';
import fs from 'fs';
import cron from 'node-cron';

const BASE_URL = 'https://www.carrefour.com.ar/api/catalog_system/pub/products/search/';
const LOGO_CARREFOUR = 'http://localhost:3001/public/img/carrefour.png';

const categoriasMap = {
  almacen: 'almacen',
  bebidas: 'bebidas',
  limpieza: 'limpieza',
  congelados: 'congelados',
  perfumeria: 'perfumeria',
  'lacteos-y-productos-frescos': 'frescos',
  'frutas-y-verduras': 'frescos',
  'carnes-y-pescados': 'frescos'
};

const productos = [];

async function obtenerProductos(ruta, categoria) {
  let pagina = 1;
  let totalProductos = 0;

  while (true) {
    const from = (pagina - 1) * 24;
    const to = pagina * 24 - 1;
    const url = `${BASE_URL}${ruta}?_from=${from}&_to=${to}`;
    console.log(`🔄 Página ${pagina} de ${ruta}...`);

    try {
      const { data } = await axios.get(url, { timeout: 10000 });

      if (!data.length || data.length < 24) {
        console.log(`✅ No hay más productos en ${ruta}.`);
        break;
      }

      for (const item of data) {
        const nombre = item.productName?.trim();
        const precio = item.items?.[0]?.sellers?.[0]?.commertialOffer?.Price ?? null;
        const imagen = item.items?.[0]?.images?.[0]?.imageUrl || null;

        if (nombre && precio !== null && precio > 0) {
          productos.push({
            nombre,
            precio,
            categoria,
            imagen,
            supermercado: 'Carrefour',
            logo: LOGO_CARREFOUR
          });
        }
      }

      totalProductos += data.length;
      pagina++;
    } catch (error) {
      console.error(`❌ Error en ${ruta}, página ${pagina}: ${error.message}`);
      break;
    }
  }

  console.log(`🛒 Total productos en ${ruta}: ${totalProductos}`);
}

export async function main() {
  productos.length = 0;

  for (const ruta in categoriasMap) {
    const categoriaFinal = categoriasMap[ruta];
    console.log(`📦 Buscando productos de ${ruta} (→ ${categoriaFinal})`);
    await obtenerProductos(ruta, categoriaFinal);
  }

  fs.writeFileSync('productos-carrefour.json', JSON.stringify(productos, null, 2));
  console.log(`📁 Archivo 'productos-carrefour.json' creado con éxito ✅`);
  console.log(`🔎 Total general de productos: ${productos.length}`);
}

cron.schedule('0 2 * * *', () => {
  console.log('🔄 Ejecutando scraper automático:', new Date().toLocaleString());
  main().catch(console.error);
});

console.log('⏳ Scheduler iniciado. El scraper correrá automáticamente todos los días a las 2 AM.');

main();
