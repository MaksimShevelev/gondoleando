<template>
  <div class="register-page">
    <div class="register-card">
      <img src="@/assets/logo.png" alt="Logo" class="logo-imgRegister" />
      <h2>Registrarse</h2>
      <form @submit.prevent="handleRegister">
        <input
          v-model="nombreApellido"
          type="text"
          placeholder="Nombre y Apellido"
          required
        />
        <input
          v-model="email"
          type="email"
          placeholder="Correo electrónico"
          required
        />
        <input
          v-model="password"
          type="password"
          placeholder="Contraseña (mínimo 6 caracteres)"
          minlength="6"
          required
        />
        <button type="submit" class="register-button" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Registrarse</span>
        </button>
      </form>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
      <p class="login-text">
        ¿Ya tenés una cuenta?
        <RouterLink to="/login">Ingresar</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";

const router = useRouter();
const nombreApellido = ref("");
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const loading = ref(false);

async function handleRegister() {
  errorMessage.value = "";
  successMessage.value = "";
  loading.value = true;

  const startTime = Date.now();

  try {
    const res = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreApellido: nombreApellido.value,
        email: email.value,
        password: password.value,
      }),
    });

    const elapsed = Date.now() - startTime;
    const remaining = 1000 - elapsed;
    await new Promise((resolve) => setTimeout(resolve, Math.max(remaining, 0)));

    if (!res.ok) {
      const data = await res.json();
      if (data.message && data.message.includes("exist")) {
        throw new Error("Cuenta existente");
      }
      throw new Error(data.message || "Error al registrar");
    }

    successMessage.value = "Registro exitoso";
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
