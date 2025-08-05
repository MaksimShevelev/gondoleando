import puppeteer from 'puppeteer';
import fs from 'fs';
import cron from 'node-cron';

const categorias = {
  almacen: '8pub5z',
  bebidas: '1c1jy9y',
  frescos: '1ewuqo6',
  limpieza: 'nityfw',
  congelados: '1xgbihs',
  perfumeria: 'cblpjz'
};

const productos = [];
const LOGO_COTO = 'http://localhost:3001/public/img/coto.png'; 

async function scrollDinamico(page, intentos = 50) {
  let prevCount = 0;
  let mismoConteo = 0;

  for (let i = 0; i < intentos; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
    await new Promise(resolve => setTimeout(resolve, 100));

    const count = await page.$$eval('.card-container', cards => cards.length);
    console.log(`📦 Scroll ${i + 1}: ${count} productos cargados...`);

    if (count === prevCount) {
      mismoConteo++;
      if (mismoConteo >= 10) break;
    } else {
      mismoConteo = 0;
    }
    prevCount = count;
  }

  const totalCards = await page.$$eval('.card-container', cards => cards.length);
  console.log(`🧮 Total detectado tras scroll: ${totalCards}`);
}

async function scrapearCategoria(page, nombreCategoria, codigoCategoria, paginasMax = Infinity) {
  const baseUrl = `https://www.cotodigital.com.ar/sitios/cdigi/categoria/catalogo-${nombreCategoria}/_/N-${codigoCategoria}?Nf=product.endDate%7CGTEQ%201.7489088E12%7C%7Cproduct.startDate%7CLTEQ%201.7489088E12&Nr=AND(product.sDisp_200:1004,product.language:español,OR(product.siteId:CotoDigital))`;

  let pagina = 0;
  const productosPorPagina = 24;
  let seguir = true;

  while (seguir && pagina < paginasMax) {
    const urlConPagina = `${baseUrl}&No=${pagina * productosPorPagina}`;
    console.log(`📄 ${nombreCategoria.toUpperCase()} - Página ${pagina + 1}: ${urlConPagina}`);
    await page.goto(urlConPagina, { waitUntil: 'domcontentloaded', timeout: 0 });

    try {
      await scrollDinamico(page);
      await page.waitForSelector('.card-container', { timeout: 30000 });

      const data = await page.$$eval('.card-container', cards =>
        cards.map(card => {
          const nombre = card.querySelector('h3.nombre-producto')?.innerText.trim() || '';
          const precio = card.querySelector('h4.card-title')?.innerText.trim() || '';
          const imagen = card.querySelector('img')?.src || '';
          return { nombre, precio, imagen };
        })
      );

      const filtrados = data.filter(p => p.nombre && p.precio);
      if (filtrados.length === 0) {
        console.log(`❌ No se encontraron productos en ${nombreCategoria} página ${pagina + 1}. Fin del scraping.`);
        seguir = false;
      } else {
        productos.push(...filtrados.map(p => ({
          ...p,
          categoria: nombreCategoria,
          supermercado: 'Coto',
          logo: LOGO_COTO
        })));
        console.log(`✅ ${nombreCategoria} Página ${pagina + 1}: ${filtrados.length} productos.`);
        pagina++;
      }

    } catch (error) {
      console.error(`❌ Error en ${nombreCategoria} página ${pagina + 1}: ${error.message}`);
      seguir = false;
    }
  }
}

export async function main() {
  productos.length = 0;
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './tmp/puppeteer-profile'
  });
  const page = await browser.newPage();

  for (const [nombre, codigo] of Object.entries(categorias)) {
    console.log(`🛒 Scrapeando categoría: ${nombre}`);
    await scrapearCategoria(page, nombre, codigo, 100);
  }

  await browser.close();

  fs.writeFileSync('productos-coto.json', JSON.stringify(productos, null, 2));
  console.log(`📁 Archivo 'productos-coto.json' creado con éxito ✅`);
  console.log(`🔎 Total productos guardados: ${productos.length}`);
}

cron.schedule('0 2 * * *', () => {
  console.log('🔄 Ejecutando scraper automático:', new Date().toLocaleString());
  main().catch(console.error);
});

console.log('⏳ Scheduler iniciado. El scraper correrá automáticamente todos los días a las 2 AM.');

main();
