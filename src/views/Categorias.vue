<template>
  <div class="contenedor-categorias">
    <h2 class="titulo-categorias">Categorías</h2>

    <div class="grid-categorias">
      <div
        v-for="categoria in categorias"
        :key="categoria.nombre"
        class="card-categoria"
        @click="verProductosPorCategoria(categoria.nombre)"
        style="cursor: pointer;"
      >
        <div class="icono-circulo">
          <img
            :src="categoria.imagen"
            alt="icono"
            class="icono-imagenCategoria"
          />
        </div>
        <span class="textoCategoria">{{ categoria.mostrar }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Categorias",
  data() {
    return {
      categorias: [
        { nombre: "almacen", mostrar: "Almacén", imagen: new URL('@/assets/almacen.jpg', import.meta.url).href },
        { nombre: "bebidas", mostrar: "Bebidas", imagen: new URL('@/assets/bebidas.jpg', import.meta.url).href },
        { nombre: "frescos", mostrar: "Frescos", imagen: new URL('@/assets/frescos.jpg', import.meta.url).href },
        { nombre: "congelados", mostrar: "Congelados", imagen: new URL('@/assets/congelados.jpg', import.meta.url).href },
        { nombre: "limpieza", mostrar: "Limpieza", imagen: new URL('@/assets/limpieza.jpg', import.meta.url).href },
        { nombre: "perfumeria", mostrar: "Perfumería", imagen: new URL('@/assets/perfumeria.jpg', import.meta.url).href }
      ],
    };
  },
  methods: {
    capitalizar(texto) {
      if (!texto) return '';
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    },
    verProductosPorCategoria(nombreCategoria) {
      this.$router.push({ path: '/', query: { categoria: nombreCategoria } });
    }
  }
};
</script>
