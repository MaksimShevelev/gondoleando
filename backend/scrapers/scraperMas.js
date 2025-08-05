import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapearPagina(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(resolve => setTimeout(resolve, 2000));

  const productos = await page.evaluate(() => {
    const items = document.querySelectorAll('div.valtech-gdn-product-summary-status-0-x-container');
    const resultados = [];

    items.forEach(item => {
      const nombre = item.querySelector('span.vtex-product-summary-2-x-productBrand')?.innerText.trim() || null;

      const spansPrecio = item.querySelectorAll('span.valtech-gdn-dynamic-product-1-x-currencyInteger');
      let precio = null;
      if (spansPrecio.length >= 2) {
        const entero = spansPrecio[0].innerText.trim();
        const decimal = spansPrecio[1].innerText.trim();
        precio = parseInt(entero + decimal, 10);
      } else if (spansPrecio.length === 1) {
        precio = parseInt(spansPrecio[0].innerText.trim(), 10);
      }

      const img = item.querySelector('img');
      const imagen = img?.getAttribute('src') || img?.getAttribute('data-src') || null;

      if (nombre && precio !== null) {
        resultados.push({ nombre, precio, imagen });
      }
    });

    return resultados;
  });

  return productos;
}

async function scrapearTodasLasPaginas(baseUrl, categoria) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let pagina = 1;
  let todosLosProductos = [];

  while (true) {
    const urlConPagina = `${baseUrl}&page=${pagina}`;
    console.log(`📄 Scrapeando [${categoria}] página ${pagina}: ${urlConPagina}`);

    const productos = await scrapearPagina(page, urlConPagina);

    if (productos.length === 0) {
      console.log(`🛑 No se encontraron productos en [${categoria}] página ${pagina}. Fin del scraping.`);
      break;
    }

    const productosConCategoria = productos.map(p => ({
      ...p,
      categoria,
      supermercado: 'Mas',
      logo: 'http://localhost:3001/public/img/mas.png'
    }));

    todosLosProductos = todosLosProductos.concat(productosConCategoria);
    console.log(`✅ [${categoria}] Página ${pagina} - productos obtenidos: ${productos.length}`);

    pagina++;
  }

  await browser.close();
  return todosLosProductos;
}

async function main() {
  const categorias = [
    { nombre: 'frescos', url: 'https://www.masonline.com.ar/3432?map=productClusterIds&order=OrderByTopSaleDESC' },
    { nombre: 'frescos', url: 'https://www.masonline.com.ar/3431?map=productClusterIds&order=OrderByTopSaleDESC' },
    { nombre: 'congelados', url: 'https://www.masonline.com.ar/3432?map=productClusterIds&order=OrderByTopSaleDESC' },
    { nombre: 'almacen', url: 'https://www.masonline.com.ar/3454?map=productClusterIds' },
    { nombre: 'bebidas', url: 'https://www.masonline.com.ar/3433?map=productClusterIds&order=OrderByTopSaleDESC' },
    { nombre: 'limpieza', url: 'https://www.masonline.com.ar/272?map=productClusterIds' },
    { nombre: 'perfumeria', url: 'https://www.masonline.com.ar/3455?map=productClusterIds&order=OrderByTopSaleDESC' }
  ];

  let productosTotales = [];

  for (const cat of categorias) {
    const productos = await scrapearTodasLasPaginas(cat.url, cat.nombre);
    productosTotales = productosTotales.concat(productos);
  }

  console.log(`🔢 Total de productos de todas las categorías: ${productosTotales.length}`);
  fs.writeFileSync('productosMas.json', JSON.stringify(productosTotales, null, 2), 'utf-8');
  console.log('💾 Archivo guardado como productosMas.json');
}

main().catch(console.error);
