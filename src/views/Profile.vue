<template>
  <div class="profile-page">
    <h2 class="titulo-perfil">
      <img src="@/assets/perfil.png" alt="Perfil" class="imagen-perfil" />
      {{ user ? user.nombreApellido : 'Cargando...' }}
    </h2>
    <div v-if="loading">Cargando...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="user && perfil">
      <div class="datos-perfil-container">
        <div class="dato-perfil">
          <label><strong>Listas creadas:</strong></label>
          <input type="text" v-model="perfil.cantidadListas" class="input-dato" readonly />
        </div>
        <div class="dato-perfil">
          <label><strong>Supermercado favorito:</strong></label>
          <input type="text" v-model="perfil.supermercadoFavorito" class="input-dato" readonly />
        </div>
        <div class="dato-perfil">
          <label><strong>Categoría favorita:</strong></label>
          <input type="text" :value="categoriaLabel(perfil.categoriaFavorita)" class="input-dato" readonly />
        </div>
      </div>
    </div>
    <div v-else>
      <p>No hay datos para mostrar.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const user = ref(null);
const perfil = ref(null);
const loading = ref(false);
const error = ref(null);
const router = useRouter();

// Traducción de categorías con tilde
function categoriaLabel(nombre) {
  const etiquetas = {
    almacen: 'Almacén',
    bebidas: 'Bebidas',
    frescos: 'Frescos',
    congelados: 'Congelados',
    limpieza: 'Limpieza',
    perfumeria: 'Perfumería',
  };
  if (!nombre) return '';
  const normalizado = nombre.toLowerCase();
  return etiquetas[normalizado] || capitalizar(nombre);
}

// Función auxiliar para capitalizar
function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Lógica al montar el componente
onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // Obtener datos del usuario
    const userRes = await fetch('http://localhost:3001/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!userRes.ok) {
      if (userRes.status === 401) {
        router.push('/login');
        return;
      }
      throw new Error('Error al cargar datos del usuario');
    }

    user.value = await userRes.json();

    // Obtener datos del perfil
    const perfilRes = await fetch('http://localhost:3001/api/perfil', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!perfilRes.ok) {
      throw new Error('Error al cargar datos del perfil');
    }

    perfil.value = await perfilRes.json();
    console.log('Perfil cargado:', perfil.value);

  } catch (err) {
    console.error(err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>


<style scoped>

</style>