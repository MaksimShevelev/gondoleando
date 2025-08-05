<template>
  <div class="contenedor-supermercados">
    <h2 class="titulo-super">Supermercados</h2>

    <div class="grid-supermercados">
      <div
        v-for="supermercado in supermercados"
        :key="supermercado.nombre"
        class="card-super"
      >
        <img
          :src="supermercado.logo"
          :alt="supermercado.nombre"
          class="logo-super-supermercados"
        />
        <button class="btn-super" @click="verProductos(supermercado.nombre)">
          Ver productos
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Supermercados',
  data() {
    return {
      supermercados: [
        { nombre: 'Carrefour', logo: new URL('@/assets/carrefour.png', import.meta.url).href },
        { nombre: 'Coto', logo: new URL('@/assets/coto.png', import.meta.url).href },
        { nombre: 'Día', logo: new URL('@/assets/dia.png', import.meta.url).href },
        { nombre: 'Mas', logo: new URL('@/assets/mas.png', import.meta.url).href }
      ]
    };
  },
  methods: {
    verProductos(nombre) {
      this.$router.push({ path: '/', query: { supermercado: nombre } });
    }
  }
};
</script>
