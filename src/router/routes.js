import { createRouter, createWebHistory } from 'vue-router'
import Inicio from '../views/Inicio.vue'
import Lista from '../views/Lista.vue'
import Sucursales from '../views/Sucursales.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import Supermercados from '../views/Supermercados.vue' // ⬅ nuevo
import Categorias from '../views/Categorias.vue'       // ⬅ nuevo

const routes = [
  { path: '/', name: 'Inicio', component: Inicio, meta: { requiresAuth: true } },
  { path: '/lista', name: 'Lista', component: Lista, meta: { requiresAuth: true } },
  { path: '/sucursales', name: 'Sucursales', component: Sucursales, meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/supermercados', name: 'Supermercados', component: Supermercados, meta: { requiresAuth: true } }, // ⬅
  { path: '/categorias', name: 'Categorias', component: Categorias, meta: { requiresAuth: true } },           // ⬅
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
