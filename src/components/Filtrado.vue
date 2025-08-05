<template>
  <div class="filtros-icono-contenedor-alt" ref="contenedorFiltro">
    <button @click="toggleFiltro" class="filtros-boton-icono-alt" aria-label="Abrir filtros">
      <img src="@/assets/filtrado.png" alt="Filtrar" class="filtros-icono-alt" />
    </button>

    <div v-if="mostrarFiltros" class="filtros-menu-alt" ref="menuFiltro">
      <p class="filtros-titulo">Filtrar por</p>

      <select v-model="filtrosLocales.categoria" aria-label="Filtrar por categoría">
        <option value="">Categorías</option>
        <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
      </select>

      <select v-model="filtrosLocales.supermercado" aria-label="Filtrar por supermercado">
        <option value="">Supermercados</option>
        <option v-for="sup in supermercados" :key="sup" :value="sup">{{ sup }}</option>
      </select>

      <input
        type="number"
        min="0"
        v-model.number="filtrosLocales.precio"
        placeholder="Precio máximo"
        aria-label="Precio máximo"
      />

      <button @click="aplicarFiltrosDesdeComponente">Aplicar filtros</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Filtrado',
  props: {
    categorias: {
      type: Array,
      default: () => []
    },
    supermercados: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      mostrarFiltros: false,
      filtrosLocales: {
        categoria: '',
        supermercado: '',
        precio: null
      }
    };
  },
  methods: {
    toggleFiltro() {
      this.mostrarFiltros = !this.mostrarFiltros;
    },
    aplicarFiltrosDesdeComponente() {
      this.$emit('filtrar', { ...this.filtrosLocales });
      this.mostrarFiltros = false;
    },
    cerrarSiClickAfuera(e) {
      const contenedor = this.$refs.contenedorFiltro;
      if (this.mostrarFiltros && contenedor && !contenedor.contains(e.target)) {
        this.mostrarFiltros = false;
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.cerrarSiClickAfuera);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.cerrarSiClickAfuera);
  }
};
</script>