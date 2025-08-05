import axios from 'axios';
import fs from 'fs';
import cron from 'node-cron';

const BASE_URL = 'https://diaonline.supermercadosdia.com.ar/api/catalog_system/pub/products/search/';
const categorias = ['almacen', 'bebidas', 'frescos', 'limpieza', 'congelados', 'perfumeria'];
const productos = [];

// ✅ Ruta pública correcta del logo desde el backend
const LOGO_DIA = 'http://localhost:3001/public/img/dia.png';

async function obtenerProductos(categoria) {
  let pagina = 1;
  let totalProductos = 0;

  while (true) {
    const url = `${BASE_URL}${categoria}?_from=${(pagina - 1) * 24}&_to=${pagina * 24 - 1}`;
    console.log(`🔄 Página ${pagina} de ${categoria}...`);

    try {
      const { data } = await axios.get(url, { timeout: 10000 });

      if (!data.length) {
        console.log(`✅ No hay más productos en ${categoria}.`);
        break;
      }

      for (const item of data) {
        const nombre = item.productName;
        const precio = item.items[0].sellers[0].commertialOffer.Price;
        const imagen = item.items[0].images[0]?.imageUrl || null;

        if (nombre && precio > 0) {
          const existenteIndex = productos.findIndex(
            p => p.nombre === nombre && p.supermercado === 'Día'
          );

          const producto = {
            nombre,
            precio,
            categoria,
            imagen,
            supermercado: 'Día',
            logo: LOGO_DIA
          };

          if (existenteIndex !== -1) {
            productos[existenteIndex] = producto;
          } else {
            productos.push(producto);
          }
        }
      }

      totalProductos += data.length;
      pagina++;
    } catch (error) {
      console.error(`❌ Error en ${categoria}, página ${pagina}: ${error.message}`);
      break;
    }
  }

  console.log(`🛒 Total productos en ${categoria}: ${totalProductos}`);
}

export async function main() {
  productos.length = 0;

  for (const categoria of categorias) {
    console.log(`📦 Buscando productos de ${categoria}...`);
    await obtenerProductos(categoria);
  }

  fs.writeFileSync('productos-dia.json', JSON.stringify(productos, null, 2));
  console.log(`📁 Archivo 'productos-dia.json' creado con éxito ✅`);
  console.log(`🔎 Total general de productos: ${productos.length}`);
}

// 🔄 Programación diaria a las 2:00 AM
cron.schedule('0 2 * * *', () => {
  console.log('🔄 Ejecutando scraper automático:', new Date().toLocaleString());
  main().catch(console.error);
});

console.log('⏳ Scheduler iniciado. El scraper correrá automáticamente todos los días a las 2 AM.');

// 🟢 Ejecutar al iniciar también
main();
