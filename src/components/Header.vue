<template>
  <header v-if="isLoggedIn" class="header">
    <button class="hamburger" @click="menuAbierto = !menuAbierto" aria-label="Abrir menú">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>
    <div class="logo-header">
      <img src="@/assets/logo.png" alt="Logo" class="logo-img-header" />
      <img src="@/assets/logo-celu.png" alt="Logo móvil" class="logo-img-header-celu" />
    </div>
    <RouterLink to="/profile" class="perfil-movil">
      <img src="@/assets/perfil.png" alt="Perfil" class="icon-img perfil" />
    </RouterLink>
    <nav :class="{ abierto: menuAbierto }">
      <img
        v-if="menuAbierto"
        src="@/assets/cerrar.png"
        alt="Cerrar"
        class="boton-cerrar-header"
        @click="menuAbierto = false"
      />
      <ul class="nav-list">
        <li v-if="isLoggedIn">
          <RouterLink to="/">
            <img src="@/assets/home.png" alt="Inicio" class="icono-menu solo-mobile" />
            Inicio
          </RouterLink>
        </li>
        <li v-if="isLoggedIn">
          <RouterLink to="/lista">
            <img src="@/assets/lista.png" alt="Lista" class="icono-menu solo-mobile" />
            Lista
          </RouterLink>
        </li>
        <li v-if="isLoggedIn">
          <RouterLink to="/sucursales">
            <img src="@/assets/ubicacionSucursales.png" alt="Sucursales" class="icono-menu solo-mobile" />
            Sucursales
          </RouterLink>
        </li>
        <li v-if="isLoggedIn">
          <RouterLink to="/supermercados">
            <img src="@/assets/supermercados.png" alt="Supermercados" class="icono-menu solo-mobile" />
            Supermercados
          </RouterLink>
        </li>
        <li v-if="isLoggedIn">
          <RouterLink to="/categorias">
            <img src="@/assets/categorias.png" alt="Categorías" class="icono-menu solo-mobile" />
            Categorías
          </RouterLink>
        </li>
        <li v-if="isLoggedIn" class="solo-mobile logout-mobile-li">
          <RouterLink to="#" @click.prevent="logout" class="logout-mobile-link">
            <img src="@/assets/logout.png" alt="Cerrar sesión" class="icono-menu solo-mobile" />
            Cerrar sesión
          </RouterLink>
        </li>
        <li v-if="isLoggedIn">
          <div class="iconos-usuario">
            <RouterLink to="/profile" class="icon-link">
              <img src="@/assets/perfil.png" alt="Perfil" class="icon-img perfil" />
            </RouterLink>
            <button @click="logout" class="icon-button" title="Cerrar sesión">
              <img src="@/assets/logout.png" alt="Logout" class="icon-img logout" />
            </button>
          </div>
        </li>
        <li v-if="!isLoggedIn"><RouterLink to="/login">Iniciar sesión</RouterLink></li>
        <li v-if="!isLoggedIn"><RouterLink to="/register">Registrarse</RouterLink></li>
      </ul>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isLoggedIn = ref(false)
const menuAbierto = ref(false)

function checkLogin() {
  isLoggedIn.value = !!localStorage.getItem('token')
}

onMounted(() => {
  checkLogin()
})

window.addEventListener('login', checkLogin)
window.addEventListener('logout', checkLogin)

function logout() {
  localStorage.removeItem('token')
  window.dispatchEvent(new Event('logout'))
  router.push('/login')
}

// 👇 Watch para cerrar el menú cuando cambia la ruta (solo en mobile)
watch(() => route.fullPath, () => {
  if (window.innerWidth <= 768) {
    menuAbierto.value = false
  }
})
</script>

