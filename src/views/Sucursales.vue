<template>
  <div class="contenedor-sucursales">
    <h2 class="titulo-sucursales">Sucursales principales</h2>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading">Buscando ubicación y sucursales...</div>

    <div v-if="sucursales.length > 0">
      <!-- Mapa arriba -->
      <div id="mapa" style="height: 400px; margin-top: 20px;"></div>

      <div class="sucursales-grid">
        <div
          v-for="(sucursal, index) in mostrarSucursales"
          :key="index"
          class="sucursal-card"
        >
          <div class="sucursal-header">
            <img
              v-if="sucursal.logo"
              :src="sucursal.logo"
              alt="Logo supermercado"
              class="sucursales-logo-supermercado"
            />
          </div>
          <div class="sucursal-info">
            <div class="sucursal-distancia">
              <img
                :src="iconoDistancia"
                alt="Distancia"
                class="icono-atributo"
              />
              {{ sucursal.distancia }} mts
            </div>

            <div class="sucursal-direccion">
              <img
                :src="iconoUbicacion"
                alt="Ubicación"
                class="icono-atributo"
              />
              {{ sucursal.direccion }}
            </div>
          </div>
        </div>
      </div>

      <!-- Paginación solo escritorio -->
      <div class="paginacion" v-if="totalPaginas > 1 && !esMobil">
        <button
          @click="cambiarPagina(paginaActual - 1)"
          :disabled="paginaActual === 1"
          type="button"
        >
          ← Anterior
        </button>
        <select v-model.number="paginaActual" @change="scrollAlTop">
          <option v-for="n in totalPaginas" :key="n" :value="n">
            Página {{ n }}
          </option>
        </select>
        <button
          @click="cambiarPagina(paginaActual + 1)"
          :disabled="paginaActual === totalPaginas"
          type="button"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <div v-else-if="!loading" class="sin-productos">
      No se encontraron sucursales.
    </div>
  </div>
</template>

<script>
import L from 'leaflet';

// Importar íconos
import iconoUbicacion from '@/assets/ubicacionSucursales.png';
import iconoDistancia from '@/assets/distancia.png';

// Importar logos por nombre
import logoCoto from '@/assets/coto.png';
import logoDia from '@/assets/dia.png';
import logoCarrefour from '@/assets/carrefour.png';
import logoMas from '@/assets/mas.png';

export default {
  data() {
    return {
      sucursales: [],
      loading: true,
      error: null,
      mapa: null,
      paginaActual: 1,
      itemsPorPagina: 8,
      ubicacionUsuario: null,
      iconoUbicacion,
      iconoDistancia,
      esMobil: false
    };
  },
  computed: {
    totalPaginas() {
      return Math.ceil(this.sucursales.length / this.itemsPorPagina);
    },
    sucursalesPaginadas() {
      const start = (this.paginaActual - 1) * this.itemsPorPagina;
      return this.sucursales.slice(start, start + this.itemsPorPagina);
    },
    mostrarSucursales() {
      return this.esMobil ? this.sucursales : this.sucursalesPaginadas;
    }
  },
  methods: {
    async obtenerSucursales(lat, lng) {
      try {
        const res = await fetch(`http://localhost:10000/api/sucursales-cercanas?lat=${lat}&lng=${lng}`);
        if (!res.ok) throw new Error('Error al cargar sucursales');
        const data = await res.json();

        // Agregar logos según nombre
        const sucursalesConLogo = data.map(sucursal => {
          let logo = null;
          const nombre = sucursal.nombre.toLowerCase();
          if (nombre.includes('coto')) logo = logoCoto;
          else if (nombre.includes('día') || nombre.includes('dia')) logo = logoDia;
          else if (nombre.includes('carrefour')) logo = logoCarrefour;
          else if (nombre.includes('más') || nombre.includes('mas')) logo = logoMas;

          return { ...sucursal, logo };
        });

        this.sucursales = sucursalesConLogo;
        this.ubicacionUsuario = [lat, lng];
        this.paginaActual = 1;

        this.$nextTick(() => {
          this.dibujarMapa(lat, lng, this.sucursales);
        });
      } catch (e) {
        this.error = 'Error al cargar sucursales';
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    dibujarMapa(latUsuario, lngUsuario, sucursales) {
      if (this.mapa) this.mapa.remove();

      this.mapa = L.map('mapa').setView([latUsuario, lngUsuario], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap'
      }).addTo(this.mapa);

      L.marker([latUsuario, lngUsuario], { title: 'Tu ubicación' })
        .addTo(this.mapa)
        .bindPopup('📍 Tu ubicación')
        .openPopup();

      sucursales.forEach(sucursal => {
        const [lng, lat] = sucursal.ubicacion.coordinates;
        L.marker([lat, lng], { title: sucursal.nombre })
          .addTo(this.mapa)
          .bindPopup(`<strong>${sucursal.nombre}</strong><br>${sucursal.direccion}<br>${sucursal.distancia} metros`);
      });
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
    checkEsMobil() {
      this.esMobil = window.innerWidth <= 768;
    }
  },
  mounted() {
    this.checkEsMobil();
    window.addEventListener('resize', this.checkEsMobil);

    if (!navigator.geolocation) {
      this.error = 'Geolocalización no soportada';
      this.loading = false;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        this.obtenerSucursales(latitude, longitude);
      },
      err => {
        this.error = 'Error al obtener tu ubicación';
        this.loading = false;
      }
    );
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkEsMobil);
  }
};
</script>
