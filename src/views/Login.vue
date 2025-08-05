<template>
  <div class="login-page">
    <div class="login-card">
      <img src="@/assets/logo.png" alt="Logo" class="logo-imgLogin" />
      <h2>Iniciar sesión</h2>
      <form @submit.prevent="handleLogin">
        <input v-model="email" type="email" placeholder="Correo electrónico" required />
        <input v-model="password" type="password" placeholder="Contraseña" required />
        <button type="submit" class="login-button" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>Iniciar sesión</span>
        </button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
      <p class="register-text">
        ¿No tenés cuenta?
        <a href="/register">Regístrate</a>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: '',
      error: '',
      success: '',
      isLoading: false
    };
  },
  methods: {
    async handleLogin() {
      this.error = '';
      this.success = '';
      this.isLoading = true;

      const startTime = Date.now();

      try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password })
        });

        const data = await response.json();

        const elapsed = Date.now() - startTime;
        const remaining = 1000 - elapsed;

        if (!response.ok) {
          await new Promise(resolve => setTimeout(resolve, Math.max(remaining, 0)));
          this.error = data.mensaje || 'Error al iniciar sesión';
          return;
        }

        await new Promise(resolve => setTimeout(resolve, Math.max(remaining, 0)));


        this.success = '¡Inicio de sesión exitoso!';
        localStorage.setItem('token', data.token);
        window.dispatchEvent(new Event('login'));

        setTimeout(() => {
          this.$router.push('/');
        }, 1500);
      } catch (err) {
        this.error = 'Error de conexión con el servidor';
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

