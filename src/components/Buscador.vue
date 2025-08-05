<template>
  <div class="buscador-contenedor">
    <input
      v-model="valorLocal"
      @input="emitirBusqueda"
      type="text"
      placeholder="Buscar productos..."
      class="buscador"
    />

    <img
      v-if="!valorLocal"
      src="@/assets/buscador.png"
      alt="Buscar"
      class="icono-input"
      @click="emitirBusqueda"
      role="button"
      tabindex="0"
    />

    <button
      v-else
      class="cerrar"
      @click="limpiarBusqueda"
    >
      <img src="@/assets/cerrar.png" alt="Cerrar" />
    </button>
  </div>
</template>

<script>
export default {
  name: 'Buscador',
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      valorLocal: this.modelValue
    };
  },
  watch: {
    modelValue(nuevoValor) {
      this.valorLocal = nuevoValor;
    }
  },
  methods: {
    emitirBusqueda() {
      this.$emit('update:modelValue', this.valorLocal);
      this.$emit('input-buscador');
    },
    limpiarBusqueda() {
      this.valorLocal = '';
      this.emitirBusqueda();
    }
  }
};
</script>

