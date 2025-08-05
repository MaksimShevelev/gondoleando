<template>
  <div class="contenedor-inicio">
    <div class="imagenes-acceso">
      <RouterLink to="/lista" class="card-acceso">
        <img src="@/assets/listaImagen.jpg" alt="Ir a lista" />
        <span>Armá tu lista de compras</span>
      </RouterLink>

      <RouterLink to="/sucursales" class="card-acceso">
        <img src="@/assets/sucursalesImagen.jpeg" alt="Ir a sucursales" />
        <span>Encontrá sucursales cercanas</span>
      </RouterLink>
    </div>
        

    <div class="buscador-filtrado-contenedor">
      <Buscador
        v-model="entradaBusqueda"
        @input-buscador="esperarBusqueda"
      />
      <div class="filtros-icono-contenedor-alt" ref="filtroContenedor">
        <button @click="toggleFiltro" class="filtros-boton-completo" type="button">
          Filtrar por {{ mostrarFiltros ? '▲' : '▼' }}
        </button>
        <div v-if="mostrarFiltros" class="filtros-menu-alt">
          <p class="filtros-titulo">Filtrar por</p>
          <select v-model="filtrosLocales.categoria">
            <option value="">Categorías</option>
            <option v-for="cat in categoriasDisponibles" :key="cat" :value="cat">
              {{ categoriaLabel(cat) }}
            </option>
          </select>
          <select v-model="filtrosLocales.supermercado">
            <option value="">Supermercados</option>
            <option v-for="sup in supermercadosDisponibles" :key="sup">
              {{ sup }}
            </option>
          </select>
          <input type="number" v-model.number="filtrosLocales.precio" placeholder="Precio máximo" min="0" />
          <button @click="aplicarFiltrosDesdeComponente" type="button">Aplicar filtros</button>
          <button @click="vaciarFiltros" type="button" class="limpiar-filtros-btn">Limpiar filtros</button>
        </div>
      </div>
    </div>


    <!-- Grid productos -->
    <div v-if="productosFiltrados.length" class="productos-grid">
      <div
        v-for="producto in productosMostrados"
        :key="producto._id"
        class="producto-card"
      >
        <img :src="producto.imagen" alt="imagen producto" class="producto-img" />
        <p>{{ producto.nombre }}</p>
        <h3><strong>$ {{ parsearPrecio(producto.precio) }}</strong></h3>
        <div class="logo-boton-container">
          <img :src="producto.logo" alt="logo supermercado" class="logo-img" />
          <button class="agregarListaInicio" @click="abrirModal(producto)" type="button">Agregar a la lista</button>
        </div>
      </div>
    </div>
    <p v-if="cargando" class="sin-productos">Cargando productos...</p>
    <p v-else-if="!productosFiltrados.length" class="sin-productos">No hay productos disponibles para esa búsqueda.</p>

    <!-- Paginación -->
    <div class="paginacion" v-if="!esMobile && totalPaginas > 1">
      <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1" type="button">← Anterior</button>
      <select v-model.number="paginaActual" @change="scrollAlTop">
        <option v-for="n in totalPaginas" :key="n" :value="n">Página {{ n }}</option>
      </select>
      <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas" type="button">Siguiente →</button>
    </div>

    <!-- Modal -->
    <div v-if="modalVisible" class="modal-backdrop" @click.self="cerrarModal">
      <div class="modal">
        <img src="@/assets/cerrar.png" alt="Cerrar modal" class="cerrar-icono" @click="cerrarModal" />
        <h2 class="modal-titulo">
          {{ nombresListas.length ? '¿A qué lista querés agregar?' : 'Ingresar nombre de la lista' }}
        </h2>
        <div v-if="nombresListas.length && productoSeleccionado" class="producto-a-agregar">
          <img :src="productoSeleccionado.imagen" alt="imagen producto" />
          <div class="info-producto">
            <p>{{ productoSeleccionado.nombre }}</p>
            <h3>$ {{ parsearPrecio(productoSeleccionado.precio) }}</h3>
          </div>
          <img :src="productoSeleccionado.logo" alt="logo supermercado" class="logo-super" />
        </div>
        <div v-if="nombresListas.length" class="listas-disponibles">
          <button
            v-for="nombre in nombresListas"
            :key="nombre"
            class="boton-lista"
            @click="agregarProductoALaLista(nombre)"
            type="button"
          >
            {{ nombre }}
            <img src="@/assets/lista.png" alt="icono lista" class="icono-lista" />
          </button>
        </div>
        <div v-else class="nueva-lista">
          <input
            v-model="nuevoNombreLista"
            type="text"
            placeholder="Nombre de la lista"
            @keyup.enter="crearYAgregar"
            autofocus
            aria-label="Nombre de la nueva lista"
            class="input-nueva-lista"
          />
          <button @click="crearYAgregar" :disabled="!nuevoNombreLista.trim()" type="button">Crear lista</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Buscador from '@/components/Buscador.vue';
import { ObserveVisibility } from 'vue-observe-visibility';

export default {
  name: 'Inicio',
  components: { Buscador },
  directives: { ObserveVisibility },
  data() {
    return {
      productos: [],
      paginaActual: 1,
      productosPorPagina: 12,
      entradaBusqueda: '',
      busqueda: '',
      timer: null,
      filtros: {
        categoria: '',
        supermercado: '',
        precio: null
      },
      filtrosLocales: {
        categoria: '',
        supermercado: '',
        precio: null
      },
      mostrarFiltros: false,
      modalVisible: false,
      productoSeleccionado: null,
      listasDeCompras: {},
      nuevoNombreLista: '',
      cargando: true,
      cargandoMas: false,                  // para scroll infinito móvil
      productosMostradosInterno: [],       // variable interna para productos móviles
      cargaInicial: 20,                    // cantidad inicial móvil
      cargaBloque: 20,                     // cantidad a cargar cada vez móvil
      anchoPantalla: window.innerWidth    // para detectar mobile
    };
  },
  computed: {
    categoriasDisponibles() {
      return [...new Set(this.productos.map(p => p.categoria).filter(Boolean))];
    },
    supermercadosDisponibles() {
      return [...new Set(this.productos.map(p => p.supermercado).filter(Boolean))];
    },
    productosFiltrados() {
      let lista = [...this.productos];
      if (this.busqueda.trim()) {
        const texto = this.normalizar(this.busqueda.trim().toLowerCase());
        lista = lista.filter(p => this.normalizar(p.nombre.toLowerCase()).includes(texto));
      }
      if (this.filtros.categoria) {
        lista = lista.filter(p => p.categoria === this.filtros.categoria);
      }
      if (this.filtros.supermercado) {
        lista = lista.filter(p => p.supermercado === this.filtros.supermercado);
      }
      if (this.filtros.precio !== null) {
        lista = lista.filter(p => {
          const precio = parseFloat(this.parsearPrecio(p.precio));
          return !isNaN(precio) && precio <= this.filtros.precio;
        });
      }
      return this.shuffleArray(lista);
    },
    totalPaginas() {
      return Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
    },
    productosPaginados() {
      const inicio = (this.paginaActual - 1) * this.productosPorPagina;
      return this.productosFiltrados.slice(inicio, inicio + this.productosPorPagina);
    },
    esMobile() {
      return this.anchoPantalla <= 768;
    },
    productosMostrados() {
      // esta es la que usás en el template para mostrar
      if (this.esMobile) {
        return this.productosMostradosInterno.length
          ? this.productosMostradosInterno
          : this.productosFiltrados.slice(0, this.cargaInicial);
      } else {
        return this.productosPaginados;
      }
    },
    nombresListas() {
      return Object.keys(this.listasDeCompras);
    }
  },
  watch: {
    '$route.query.supermercado'(nuevo) {
      this.filtros.supermercado = nuevo;
      this.filtrosLocales.supermercado = nuevo;
      this.resetMobileScroll();
      this.paginaActual = 1;
    },
    '$route.query.categoria'(nuevo) {
      this.filtros.categoria = nuevo;
      this.filtrosLocales.categoria = nuevo;
      this.resetMobileScroll();
      this.paginaActual = 1;
    },
    filtros: {
      deep: true,
      handler() {
        this.resetMobileScroll();
        this.paginaActual = 1;
      }
    },
    busqueda() {
      this.resetMobileScroll();
      this.paginaActual = 1;
    },
    productosFiltrados() {
      this.resetMobileScroll();
    }
  },
  methods: {
    categoriaLabel(nombre) {
      const etiquetas = {
        almacen: 'Almacén',
        bebidas: 'Bebidas',
        frescos: 'Frescos',
        congelados: 'Congelados',
        limpieza: 'Limpieza',
        perfumeria: 'Perfumería',
      };
      return etiquetas[nombre] || this.capitalizar(nombre);
    },
    capitalizar(texto) {
      if (!texto) return '';
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    },
    toggleFiltro() {
      this.mostrarFiltros = !this.mostrarFiltros;
    },
    aplicarFiltrosDesdeComponente() {
      this.filtros = { ...this.filtrosLocales };
      this.mostrarFiltros = false;
      this.paginaActual = 1;
    },
    vaciarFiltros() {
      this.filtrosLocales = {
        categoria: '',
        supermercado: '',
        precio: null
      };
      this.filtros = {
        categoria: '',
        supermercado: '',
        precio: null
      };
      this.paginaActual = 1;
    },
    cambiarPagina(nuevaPagina) {
      if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
        this.paginaActual = nuevaPagina;
        this.scrollAlTop();
      }
    },
    scrollAlTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    cargarProductos() {
      this.cargando = true;
      axios.get('http://localhost:3001/api/productos')
        .then(response => {
          this.productos = response.data;
          if (this.esMobile) {
            this.productosMostradosInterno = this.productosFiltrados.slice(0, this.cargaInicial);
          }
        })
        .catch(error => {
          console.error('Error al cargar los productos:', error);
        })
        .finally(() => {
          this.cargando = false;
          if (this.$route.query.supermercado) {
            this.filtros.supermercado = this.$route.query.supermercado;
            this.filtrosLocales.supermercado = this.$route.query.supermercado;
          }
          if (this.$route.query.categoria) {
            this.filtros.categoria = this.$route.query.categoria;
            this.filtrosLocales.categoria = this.$route.query.categoria;
          }
        });
    },
    parsearPrecio(precio) {
      if (typeof precio === 'string') {
        const limpio = precio.replace(/\$/g, '').replace(/\./g, '').replace(',', '.');
        const numero = parseFloat(limpio);
        return isNaN(numero) ? 'N/A' : numero.toFixed(2);
      }
      if (typeof precio === 'number') {
        return precio.toFixed(2);
      }
      return 'N/A';
    },
    esperarBusqueda() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.busqueda = this.entradaBusqueda;
        this.paginaActual = 1;
      }, 400);
    },
    shuffleArray(array) {
      return array
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
    },
    normalizar(texto) {
      return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },
    abrirModal(producto) {
      this.productoSeleccionado = producto;
      this.modalVisible = true;
      this.nuevoNombreLista = '';
      this.cargarListas();
    },
    cerrarModal() {
      this.modalVisible = false;
      this.productoSeleccionado = null;
      this.nuevoNombreLista = '';
    },
    cargarListas() {
      const todas = JSON.parse(localStorage.getItem('listasDeComprasPorUsuario')) || {};
      this.listasDeCompras = todas[this.userId] || {};
    },
    async agregarProductoALaLista(nombreLista) {
      const todas = JSON.parse(localStorage.getItem('listasDeComprasPorUsuario')) || {};
      const listas = todas[this.userId] || {};
      if (!listas[nombreLista]) listas[nombreLista] = [];

      const existe = listas[nombreLista].some(p => p._id === this.productoSeleccionado._id);
      if (!existe) {
        listas[nombreLista].push(this.productoSeleccionado);
        todas[this.userId] = listas;
        localStorage.setItem('listasDeComprasPorUsuario', JSON.stringify(todas));

        const token = localStorage.getItem('token');
        if (token) {
          try {
            await fetch('http://localhost:3001/api/listas', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                nombre: nombreLista,
                productos: listas[nombreLista]
              })
            });
          } catch (error) {
            console.error('❌ Error al guardar en backend:', error);
          }
        }
      }

      this.cerrarModal();
      this.$router.push({ path: '/lista', query: { lista: nombreLista } });
    },
    async crearYAgregar() {
      const nombre = this.nuevoNombreLista.trim();
      if (!nombre) return;

      const todas = JSON.parse(localStorage.getItem('listasDeComprasPorUsuario')) || {};
      const listas = todas[this.userId] || {};

      if (listas[nombre]) return;

      listas[nombre] = [this.productoSeleccionado];
      todas[this.userId] = listas;
      localStorage.setItem('listasDeComprasPorUsuario', JSON.stringify(todas));

      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('http://localhost:3001/api/listas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              nombre,
              productos: listas[nombre]
            })
          });
        } catch (error) {
          console.error('❌ Error al guardar nueva lista en backend:', error);
        }
      }

      this.cerrarModal();
      this.$router.push({ path: '/lista', query: { lista: nombre } });
    },
    clickFueraDeFiltros(event) {
      const filtro = this.$refs.filtroContenedor;
      if (this.mostrarFiltros && filtro && !filtro.contains(event.target)) {
        this.mostrarFiltros = false;
      }
    },

    cargarMasProductos(isVisible) {
      if (isVisible && !this.cargandoMas && this.productosMostradosInterno.length < this.productosFiltrados.length) {
        this.cargandoMas = true;
        setTimeout(() => {
          const siguienteBloque = this.cargaBloque;
          const nuevosProductos = this.productosFiltrados.slice(
            this.productosMostradosInterno.length,
            this.productosMostradosInterno.length + siguienteBloque
          );
          this.productosMostradosInterno = this.productosMostradosInterno.concat(nuevosProductos);
          this.cargandoMas = false;
        }, 500);
      }
    },

    resetMobileScroll() {
      if (this.esMobile) {
        this.productosMostradosInterno = this.productosFiltrados.slice(0, this.cargaInicial);
      }
    }
  },
  mounted() {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userId = payload.id;
    }
    this.cargarProductos();

    window.addEventListener('resize', () => {
      this.anchoPantalla = window.innerWidth;
      this.resetMobileScroll();
    });

    document.addEventListener('click', this.clickFueraDeFiltros);
  },
  beforeUnmount() {
    clearTimeout(this.timer);
    document.removeEventListener('click', this.clickFueraDeFiltros);
    window.removeEventListener('resize', () => {});
  }
};
</script>
