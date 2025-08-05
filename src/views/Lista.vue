<template>
  <div class="contenedor-inicio">
    <!-- Sección Listas existentes -->
    <div v-if="!nombreLista">
      <h2 v-if="Object.keys(todasLasListas).length">Listas creadas</h2>
      <div v-else class="lista-vacia">
        <img src="@/assets/lista.png" alt="Lista vacía" class="icono-lista-vacia" />
        <p class="mensaje-lista-vacia">Aún no armaste ninguna lista</p>
        <button @click="abrirModalCrear" class="boton-principal">Crear lista de compras</button>
      </div>
      <div v-if="Object.keys(todasLasListas).length" class="todas-las-listas-grid">
        <div
          v-for="(items, nombre) in todasLasListas"
          :key="nombre"
          class="lista-card"
          @click="seleccionarLista(nombre)"
        >
          <div class="contenido-lista-card">
            <h3>{{ nombre }}</h3>
            <p class="cantidad-productos">{{ items.length }} productos</p>
            <div class="acciones-lista">
              <button
              v-if="items.length > 0"
              @click.stop="descargarLista(nombre, items)"
              class="boton-descargar-icono"
              aria-label="Descargar lista"
            >
              <img src="@/assets/descargar.png" alt="Descargar" />
            </button>

              <button
                @click.stop="confirmarEliminarLista(nombre)"
                class="boton-eliminar-icono"
                aria-label="Eliminar lista"
              >
                <img src="@/assets/eliminar.png" alt="Eliminar" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="Object.keys(todasLasListas).length" class="boton-crear-centro">
        <button @click="abrirModalCrear" class="boton-principal">Crear nueva lista</button>
      </div>
    </div>

    <!-- Sección Lista seleccionada -->
    <div v-if="nombreLista">
      <div class="cabecera-lista">
        <div class="titulo-con-eliminar">
          <h2 class="titulo-lista">{{ nombreLista }}</h2>
          <button
            @click.stop="confirmarEliminarLista(nombreLista)"
            class="btn-eliminar-lista-titulo"
            aria-label="Eliminar lista"
          >
            <img src="@/assets/eliminar.png" alt="Eliminar" />
          </button>
        </div>
      </div>

      <!-- Botones de cambio de vista -->
      <div v-if="lista.length" class="botones-vista">
        <button :class="{ activo: vista === 'producto' }" @click="vista = 'producto'">Conteo por producto</button>
        <button :class="{ activo: vista === 'supermercado' }" @click="vista = 'supermercado'">Conteo por supermercado</button>
      </div>

      <!-- Vista por producto -->
      <div v-if="vista === 'producto' && lista.length" class="productos-grid">
        <div v-for="(producto, index) in lista" :key="producto._id" class="producto-card">
          <img :src="producto.imagen" alt="imagen" class="producto-img" />
          <h3 :class="{ tachado: producto.comprado }">{{ producto.nombre }}</h3>
          <p>
            <strong>
              <span :class="{ tachado: producto.comprado }">
                ${{ (parsearPrecio(producto.precio) * (producto.cantidad || 1)).toFixed(2) }}
              </span>
            </strong>
          </p>
          <img v-if="producto.logo" :src="producto.logo" alt="logo supermercado" class="logo-img" />
          <div class="acciones-inferiores">
            <div class="checkbox-container">
              <input type="checkbox" v-model="producto.comprado" @change="guardarEnStorage" />
            </div>
            <div class="cantidad-control">
              <button @click="restarCantidad(producto)">−</button>
              <span>{{ producto.cantidad || 1 }}</span>
              <button @click="sumarCantidad(producto)">+</button>
            </div>
            <button class="boton-eliminar-detalle" @click="abrirModalEliminarProducto(index)" aria-label="Eliminar producto">
              <img src="@/assets/eliminar.png" alt="Eliminar" />
            </button>
          </div>
        </div>
      </div>

      <!-- Botón "Añadir productos" solo si vista === 'producto' y lista NO está vacía -->
      <div v-if="vista === 'producto' && lista.length" class="botones-acciones">
        <router-link
          :to="{ path: '/', query: { lista: nombreLista } }"
          class="boton-principal btn-anadir-productos"
        >
          Añadir productos
        </router-link>
      </div>

      <!-- Lista por supermercado -->
      <div v-if="vista === 'supermercado' && lista.length" class="supermercados-totales">
        <div v-if="vistaSuperLista">
          <div class="super-lista-header lista-armada">
            <img v-if="superLista[0]?.logo" :src="superLista[0].logo" alt="logo supermercado" class="logo-img" />
            <h2>{{ supermercadoSeleccionado }}</h2>
          </div>
          <div class="super-productos">
            <div v-for="(producto, index) in superLista" :key="producto._id" class="producto-card">
              <img v-if="producto.imagen" :src="producto.imagen" alt="imagen del producto" class="producto-img" />
              <h3 :class="{ tachado: producto.comprado }">{{ producto.nombre }}</h3>
              <p>
                <strong>
                  <span :class="{ tachado: producto.comprado }">
                    ${{ (parsearPrecio(producto.precio) * (producto.cantidad || 1)).toFixed(2) }}
                  </span>
                </strong>
              </p>
              <img v-if="producto.logo" :src="producto.logo" alt="logo supermercado" class="logo-img" />
              <div class="acciones-inferiores">
                <div class="checkbox-container">
                  <input type="checkbox" v-model="producto.comprado" @change="guardarEnStorage" />
                </div>
                <div class="cantidad-control">
                  <button @click="restarCantidad(producto)">−</button>
                  <span>{{ producto.cantidad || 1 }}</span>
                  <button @click="sumarCantidad(producto)">+</button>
                </div>
                <!-- Aquí el cambio clave: paso index y flag true -->
                <button class="boton-eliminar-detalle" @click="abrirModalEliminarProducto(index, true)" aria-label="Eliminar producto">
                  <img src="@/assets/eliminar.png" alt="Eliminar" />
                </button>
              </div>
            </div>
          </div>
          <div class="total-acciones-contenedor">
            <div class="total-box">Total: ${{ totalSuperLista }}</div>
          </div>
          <div class="botones-acciones">
            <router-link
              :to="{ path: '/', query: { lista: nombreLista } }"
              class="boton-principal btn-anadir-productos"
            >
              Añadir productos
            </router-link>
            <button @click="volverAConsolidado" class="boton-principal">
              Ver conteo general
            </button>
          </div>
        </div>

        <!-- Mostrar todos los supermercados -->
        <div v-else>
          <div
            v-for="(productos, supermercado) in productosPorSupermercado"
            :key="supermercado"
            class="super-card"
          >
            <div class="super-header" @click="toggleSupermercado(supermercado)" role="button" tabindex="0">
              <div class="super-info">
                <img v-if="productos[0]?.logo" :src="productos[0].logo" alt="logo supermercado" class="logo-img" />
                <h3>{{ supermercado }}</h3>
              </div>
              <p class="total-super"><strong>${{ calcularTotal(productos) }}</strong></p>
            </div>
            <div v-if="supermercadoAbierto === supermercado" class="super-productos">
              <div v-for="producto in productos" :key="producto._id" class="producto-card">
                <div class="producto-info">
                  <h4>{{ (producto.cantidad || 1) }} x {{ producto.nombre }}</h4>
                  <p class="precio-producto"><strong>${{ parsearPrecio(producto.precio) }}</strong></p>
                </div>
              </div>
              <div class="armar-lista-supermercado">
                <button @click="armarListaSupermercado(supermercado, productos)" class="boton-principal">
                  Armar lista individual
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SIN productos: imagen + texto + botón SOLO SI vista === 'producto' -->
      <div v-if="!lista.length && vista === 'producto'" class="lista-vacia">
        <img src="@/assets/lista.png" alt="Lista vacía" class="icono-lista-vacia" />
        <p class="mensaje-lista-vacia">Aún no hay productos en la lista</p>
        <router-link
          :to="{ path: '/', query: { lista: nombreLista } }"
          class="boton-principal btn-anadir-productos"
        >
          Añadir productos
        </router-link>
      </div>

      <!-- Total + botón vaciar -->
      <div v-if="vista === 'producto' && lista.length" class="total-acciones-contenedor">
        <div class="total-box">Total: ${{ total }}</div>
        <div class="total-box clickable" @click="vaciarLista">Vaciar lista</div>
      </div>
    </div>

    <!-- MODALES -->
    <div v-if="modalCrearVisible" class="modal-backdrop" @click.self="cerrarModalCrear">
      <div class="modal">
        <img src="@/assets/cerrar.png" alt="Cerrar modal" class="cerrar-icono" @click="cerrarModalCrear" />
        <h2 class="modal-titulo">Ingresar nombre de la lista</h2>
        <div class="nueva-lista">
          <input
            v-model="nuevoNombreLista"
            type="text"
            placeholder="Nombre de la lista"
            @keyup.enter="crearLista"
            autofocus
            aria-label="Nombre de la nueva lista"
            class="input-nueva-lista"
          />
          <button @click="crearLista" :disabled="!nuevoNombreLista.trim()" type="button">Crear lista</button>
        </div>
        <p v-if="mensajeError" class="error">{{ mensajeError }}</p>
      </div>
    </div>

    <div v-if="modalEliminarVisible" class="modal-backdrop" @click.self="cerrarModalEliminar">
      <div class="modal">
        <h2>Confirmar eliminación</h2>
        <p>¿Querés eliminar la lista "<strong>{{ listaAEliminar }}</strong>"?</p>
        <div class="modal-buttons">
          <button @click="eliminarLista" type="button" class="btn-eliminar">Eliminar</button>
          <button @click="cerrarModalEliminar" type="button">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="modalEliminarProductoVisible" class="modal-backdrop" @click.self="cerrarModalEliminarProducto">
      <div class="modal">
        <h2>Confirmar eliminación</h2>
        <p>¿Seguro que querés eliminar este producto?</p>
        <div class="modal-buttons">
          <button @click="eliminarProductoConfirmado" type="button" class="btn-eliminar">Eliminar</button>
          <button @click="cerrarModalEliminarProducto" type="button">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ListaDeCompras",
  data() {
    return {
      lista: [],
      nombreLista: "",
      todasLasListas: {},
      mensajeError: "",
      nuevoNombreLista: "",
      modalCrearVisible: false,
      modalEliminarVisible: false,
      listaAEliminar: null,
      vista: "producto",
      supermercadoAbierto: null,
      modalEliminarProductoVisible: false,
      productoAEliminar: null,
      productoAEliminarIndex: null,
      productoEnSuperLista: false,
      userId: null,
      vistaSuperLista: false,
      superLista: [],
      supermercadoSeleccionado: "",
    };
  },
  computed: {
    total() {
      return this.lista
        .filter((p) => !p.comprado)
        .reduce((acc, p) => {
          const precio = parseFloat(this.parsearPrecio(p.precio));
          const cantidad = p.cantidad || 1;
          return acc + (isNaN(precio) ? 0 : precio * cantidad);
        }, 0)
        .toFixed(2);
    },
    totalSuperLista() {
      return this.superLista
        .filter((p) => !p.comprado)
        .reduce((acc, p) => {
          const precio = parseFloat(this.parsearPrecio(p.precio));
          const cantidad = p.cantidad || 1;
          return acc + (isNaN(precio) ? 0 : precio * cantidad);
        }, 0)
        .toFixed(2);
    },
    productosPorSupermercado() {
      const agrupado = {};
      this.lista.forEach((producto) => {
        if (producto.comprado) return;
        const superKey = producto.supermercado || "Otro";
        if (!agrupado[superKey]) agrupado[superKey] = [];
        agrupado[superKey].push(producto);
      });
      return agrupado;
    },
  },
  methods: {
    parseJwt(token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch {
        return null;
      }
    },
    toggleSupermercado(nombre) {
      this.supermercadoAbierto =
        this.supermercadoAbierto === nombre ? null : nombre;
    },
    sumarCantidad(producto) {
      if (!producto.cantidad) producto.cantidad = 1;
      producto.cantidad++;
      this.guardarEnStorage();
    },
    restarCantidad(producto) {
      if (!producto.cantidad || producto.cantidad <= 1) return;
      producto.cantidad--;
      this.guardarEnStorage();
    },
    calcularTotal(productos) {
      return productos
        .reduce((acc, p) => {
          const precio = parseFloat(this.parsearPrecio(p.precio));
          const cantidad = p.cantidad || 1;
          return acc + (isNaN(precio) ? 0 : precio * cantidad);
        }, 0)
        .toFixed(2);
    },
    parsearPrecio(precio) {
      if (typeof precio === "string") {
        const limpio = precio
          .replace(/\$/g, "")
          .replace(/\./g, "")
          .replace(",", ".");
        const numero = parseFloat(limpio);
        return isNaN(numero) ? "0.00" : numero.toFixed(2);
      }
      if (typeof precio === "number") return precio.toFixed(2);
      return "0.00";
    },
    abrirModalEliminarProducto(index, enSuperLista = false) {
      this.productoAEliminarIndex = index;
      this.productoAEliminar = enSuperLista ? this.superLista[index] : this.lista[index];
      this.productoEnSuperLista = enSuperLista;
      this.modalEliminarProductoVisible = true;
    },
    cerrarModalEliminarProducto() {
      this.modalEliminarProductoVisible = false;
      this.productoAEliminar = null;
      this.productoAEliminarIndex = null;
      this.productoEnSuperLista = false;
    },
    eliminarProductoConfirmado() {
      if (this.productoAEliminarIndex === null) return;

      if (this.productoEnSuperLista) {
        this.superLista.splice(this.productoAEliminarIndex, 1);
        const indexEnLista = this.lista.findIndex(
          (p) =>
            p.nombre === this.productoAEliminar.nombre &&
            p.supermercado === this.productoAEliminar.supermercado
        );
        if (indexEnLista !== -1) {
          this.lista.splice(indexEnLista, 1);
        }

        if (this.superLista.length === 0) {
          if (this.lista.length > 0) {
            this.volverAConsolidado();
          } else {
            this.vistaSuperLista = false;
            this.vista = "producto";
          }
        }
      } else {
        this.lista.splice(this.productoAEliminarIndex, 1);
      }

      this.guardarEnStorage();
      this.cerrarModalEliminarProducto();
    },
    vaciarLista() {
      this.lista = [];
      this.guardarEnStorage();
    },
    guardarEnStorage() {
      if (!this.userId) {
        console.warn("No hay usuario logueado");
        return;
      }
      if (this.nombreLista) {
        const listasPorUsuario = JSON.parse(localStorage.getItem("listasDeComprasPorUsuario")) || {};
        listasPorUsuario[this.userId] = {
          ...listasPorUsuario[this.userId],
          [this.nombreLista]: this.lista,
        };
        localStorage.setItem("listasDeComprasPorUsuario", JSON.stringify(listasPorUsuario));
        this.todasLasListas = listasPorUsuario[this.userId];
        this.guardarListaEnBackend();
      }
    },
    async guardarListaEnBackend() {
      const token = localStorage.getItem("token");
      if (!token || !this.nombreLista || !this.lista.length) return;
      try {
        const res = await fetch("https://gondoleando.onrender.com/api/listas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productos: this.lista,
            nombre: this.nombreLista,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("❌ Error al guardar en backend:", data);
        }
      } catch (err) {
        console.error("❌ Error al conectar al backend:", err);
      }
    },
    cargarDesdeStorage() {
      const token = localStorage.getItem("token");
      const payload = this.parseJwt(token);
      this.userId = payload ? payload.id : null;
      if (!this.userId) {
        this.todasLasListas = {};
        this.lista = [];
        this.nombreLista = "";
        return;
      }
      const listasPorUsuario = JSON.parse(localStorage.getItem("listasDeComprasPorUsuario")) || {};
      this.todasLasListas = listasPorUsuario[this.userId] || {};
      const query = new URLSearchParams(window.location.search);
      const nombreQuery = query.get("lista");
      if (nombreQuery && this.todasLasListas[nombreQuery]) {
        this.nombreLista = nombreQuery;
        this.lista = this.todasLasListas[nombreQuery];
      } else {
        this.nombreLista = "";
        this.lista = [];
      }
    },
    seleccionarLista(nombre) {
      this.nombreLista = nombre;
      this.lista = this.todasLasListas[nombre] || [];
      this.mensajeError = "";
      this.nuevoNombreLista = "";
      this.vista = "producto";
      this.supermercadoAbierto = null;
      this.vistaSuperLista = false;
    },
    abrirModalCrear() {
      this.nuevoNombreLista = "";
      this.mensajeError = "";
      this.modalCrearVisible = true;
    },
    cerrarModalCrear() {
      this.modalCrearVisible = false;
      this.mensajeError = "";
    },
    crearLista() {
      const nueva = this.nuevoNombreLista.trim();
      if (!nueva) {
        this.mensajeError = "Debes ingresar un nombre válido.";
        return;
      }
      if (this.todasLasListas[nueva]) {
        this.mensajeError = "Ya existe una lista con ese nombre.";
        return;
      }
      this.todasLasListas[nueva] = [];
      const listasPorUsuario = JSON.parse(localStorage.getItem("listasDeComprasPorUsuario")) || {};
      listasPorUsuario[this.userId] = this.todasLasListas;
      localStorage.setItem("listasDeComprasPorUsuario", JSON.stringify(listasPorUsuario));
      this.nombreLista = "";
      this.lista = [];
      this.modalCrearVisible = false;
      this.nuevoNombreLista = "";
      this.mensajeError = "";
    },
    confirmarEliminarLista(nombre) {
      this.listaAEliminar = nombre;
      this.modalEliminarVisible = true;
    },
    cerrarModalEliminar() {
      this.modalEliminarVisible = false;
      this.listaAEliminar = null;
    },
    async eliminarLista() {
      if (!this.listaAEliminar) return;
      const token = localStorage.getItem("token");
      const listaABorrar = this.listaAEliminar;
      const esActual = listaABorrar === this.nombreLista;
      const listasPorUsuario = JSON.parse(localStorage.getItem("listasDeComprasPorUsuario")) || {};
      if (listasPorUsuario[this.userId] && listasPorUsuario[this.userId][listaABorrar]) {
        delete listasPorUsuario[this.userId][listaABorrar];
        localStorage.setItem("listasDeComprasPorUsuario", JSON.stringify(listasPorUsuario));
      }
      try {
        await fetch(`https://gondoleando.onrender.com/api/listas/${encodeURIComponent(listaABorrar)}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("Error al eliminar en backend:", err);
      }
      if (esActual) {
        this.nombreLista = "";
        this.lista = [];
      }
      this.cargarDesdeStorage();
      this.cerrarModalEliminar();
    },
    armarListaSupermercado(nombreSuper, productos) {
      this.superLista = productos.map(p => ({ ...p }));
      this.supermercadoSeleccionado = nombreSuper;
      this.vistaSuperLista = true;
    },
    volverAConsolidado() {
      this.vistaSuperLista = false;
      this.superLista = [];
      this.supermercadoSeleccionado = "";
      this.supermercadoAbierto = null;
    },
    descargarLista(nombre, items) {
      if (!items.length) return;

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const marginLeft = 15;
      let verticalOffset = 30;

      doc.setFontSize(22);
      doc.setTextColor("#112D55");
      doc.setFont("poppins", "bold");
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = doc.getTextWidth("Gondoleando");
      doc.text("Gondoleando", (pageWidth - textWidth) / 2, verticalOffset);

      verticalOffset += 15;
      doc.setFontSize(14);
      doc.setFont("poppins", "bold");
      doc.setTextColor("#112D55");
      doc.text(`${nombre}`, marginLeft, verticalOffset);

      verticalOffset += 12;
      doc.setFontSize(11);
      doc.setFont("poppins", "normal");

      items.forEach((item, i) => {
        const cantidad = item.cantidad || 1;
        const precioUnitario = parseFloat(this.parsearPrecio(item.precio));
        const totalItem = (precioUnitario * cantidad).toFixed(2);
        const supermercado = item.supermercado ? `${item.supermercado}` : "";

        doc.setTextColor("#000");
        const detalleInicio = `${i + 1}. `;
        doc.text(detalleInicio, marginLeft, verticalOffset);

        let offset = marginLeft + doc.getTextWidth(detalleInicio);

        doc.setFont("poppins", "bold");
        doc.setTextColor("#112D55");
        doc.text(supermercado, offset, verticalOffset);
        offset += doc.getTextWidth(supermercado + "  ");

        doc.setFont("poppins", "normal");
        doc.setTextColor("#000");
        const nombreProducto = `${item.nombre} - ${cantidad} x `;
        doc.text(nombreProducto, offset, verticalOffset);
        offset += doc.getTextWidth(nombreProducto);

        doc.setFont("poppins", "bold");
        doc.setTextColor("#112D55");
        const precios = `$${precioUnitario.toFixed(2)} = $${totalItem}`;
        doc.text(precios, offset, verticalOffset);

        verticalOffset += 10;

        if (verticalOffset > 280) {
          doc.addPage();
          verticalOffset = 30;
        }
      });

      verticalOffset += 10;
      doc.setFontSize(13);
      doc.setTextColor("#112D55");
      doc.setFont("poppins", "bold");
      doc.text(`Total: $${this.calcularTotal(items)}`, marginLeft, verticalOffset);

      doc.save(`${nombre}.pdf`);
    },
  },
  mounted() {
    this.cargarDesdeStorage();
  },
};
</script>


<style scoped>
.todas-las-listas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.lista-card {
  width: 100%;
  box-sizing: border-box;
  border: 2px solid #112d55;
  border-radius: 12px;
  padding: 1rem 1rem 0.8rem;
  background-color: #f8f8f8;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.2s ease;
}
.lista-card:hover {
  transform: scale(1.02);
}
.lista-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #112d55;
  margin: 0;
  margin-bottom: 0.2rem;
}
.lista-card p {
  margin: 0;
  font-size: 0.9rem;
  color: #444;
}
.contenido-lista-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.boton-descargar-icono,
.boton-eliminar-icono {
  background: none;
  border: none;
  padding: 0;
  width: 28px;
  height: 28px;
  margin: 5px;
  cursor: pointer;
}
.boton-descargar-icono img,
.boton-eliminar-icono img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.boton-descargar-icono:hover img
.boton-eliminar-icono:hover img {
  filter: brightness(0.8);
}
.acciones-inferiores {
  position: relative;
  width: 100%;
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 1rem;
}
.checkbox-container {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0.2rem;
}
.boton-eliminar-detalle {
  position: absolute;
  bottom: 0;
  right: 0;
  background: none;
  border: none;
  padding: 0;
  width: 28px;
  height: 28px;
  cursor: pointer;
}
.boton-eliminar-detalle img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.boton-eliminar-detalle:hover img {
  filter: brightness(0.8);
}
.cantidad-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid #112d55;
  border-radius: 6px;
  background-color: white;
  padding: 0 0.6rem;
  margin: 0 auto;
  height: 28px; /* Ajustar la altura del contenedor */
}
.cantidad-control button {
  background: none;
  border: none;
  font-size: 1.5rem; 
  color: #112d55;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cantidad-control span {
  font-size: 1.5rem;
  font-weight: bold;
  color: #112d55;
  flex: 1;
  text-align: center;
}
.boton-eliminar-detalle {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  align-self: flex-end;
}
.boton-eliminar-detalle img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.boton-eliminar-detalle:hover img {
  filter: brightness(0.8);
}
.acciones-inferiores {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  margin-top: auto;
  padding-top: 1rem;
  position: relative;
  gap: 0.5rem;
}
.checkbox-container {
  align-self: flex-end;
  padding-bottom: 0.2rem;
}
.cantidad-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid #112d55;
  border-radius: 6px;
  padding: 0.2rem 0.6rem;
  background-color: white;
  height: 28px; /* Ajustar la altura del contenedor */
  justify-content: center;
  flex: 1;
  max-width: 100px;
  margin: 0 auto;
}
.cantidad-control button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #112d55;
  cursor: pointer;
}
.cantidad-control span {
  font-size: 1rem;
  font-weight: bold;
  color: #112d55;
}
.acciones-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}
.botones-acciones {
  display: flex; 
  gap: 1rem; 
  justify-content: center; 
  margin-top: 1rem; 
}
.boton-principal {
  background-color: #112d55;
  color: white;
  padding: 0.8rem 1.6rem;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.boton-principal:hover {
  background-color: #0d2040;
}
.boton-crear-centro {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}
.cabecera-lista {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  margin-bottom: 2.5rem;
}
.titulo-con-eliminar {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.titulo-con-eliminar h2 {
  font-size: 1.8rem;
  color: #112d55;
  margin: 0;
}
.btn-eliminar-lista-titulo {
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-eliminar-lista-titulo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.btn-eliminar-lista-titulo:hover img {
  filter: brightness(0.8);
}
.botones-vista {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.botones-vista button {
  padding: 0.8rem 1.4rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 2px solid #112d55;
  background-color: white;
  color: #112d55;
  cursor: pointer;
}
.botones-vista button.activo {
  background-color: #112d55;
  color: white;
  border-color: #112d55;
}
.contenedor-boton-agregar {
  text-align: center;
  margin-top: 2rem;
}
.router-link-exact-active.boton-principal,
.btn-agregar {
  display: inline-block;
  background-color: #112d55;
  color: white;
  padding: 0.8rem 1.6rem;
  font-size: 1rem;
  border-radius: 10px;
  text-decoration: none;
  transition: background-color 0.2s ease;
  border: none;
}
.btn-agregar:hover {
  background-color: #0d2040;
}
.productos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.producto-card {
  background-color: #ffffff;
  border: 2px solid #112d55;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.checkbox-container {
  position: absolute;
  top: 10px;
  left: 10px;
}
.producto-img {
  width: 100px;
  height: auto;
  margin-bottom: 0.7rem;
  object-fit: contain;
}
.producto-card h3 {
  font-size: 0.95rem;
  margin: 0.5rem 0 0.3rem;
  text-align: center;
}
.producto-card p {
  margin: 15px;
  font-size: 1.1rem;
}
.producto-card button {
  background: none;
  border: none;
  color: #112d55;
  margin-top: 0.6rem;
  font-size: 0.9rem;
  cursor: pointer;
}
.tachado {
  text-decoration: line-through;
  opacity: 0.6;
}
.total-contenedor {
  background-color: #112d55;
  color: white;
  font-size: 1.2rem;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  width: 100%;
  max-width: 400px;
  margin: 2rem auto 0;
}
.total-contenedor button {
  background-color: transparent;
  border: 2px solid white;
  color: white;
  padding: 0.4rem 1.2rem;
  margin-top: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
}
.super-card {
  border: 2px solid #ccc;
  border-radius: 14px;
  overflow: hidden;
  background-color: #fefefe;
  margin-bottom: 1rem;
}
.super-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #f1f1f1;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}
.super-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-grow: 1;
  width: 100%; 
}
.super-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #112d55;
}
.armar-lista-supermercado {
  margin-top: 1rem;
  text-align: left; 
  grid-column: span 4; 
}
.total-super {
  margin-left: auto;
  font-weight: bold;
  font-size: 1.1rem;
  text-align: right;
}
.super-productos {
  display: grid; 
  grid-template-columns: repeat(4, 1fr); 
  gap: 1.5rem; 
  padding: 1.2rem 2rem 1.5rem; 
}
.super-productos .producto-card {
  background-color: #ffffff;
  border: 2px solid #112d55;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  gap: 1rem;
}
.super-productos .producto-card h3 {
  margin: 0.2rem 0;
}
.super-productos .producto-card p {
  margin: 0.2rem 0; 
}
.lista-vacia {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}
.icono-lista-vacia {
  width: 120px;
  height: auto;
  margin-bottom: 1.5rem;
}
.mensaje-lista-vacia {
  font-size: 1.1rem;
  font-weight: 600;
  color: #112d55;
  margin-bottom: 1.5rem;
}
.nombre-lista-activa {
  font-size: 1.2rem;
  font-weight: 600;
  color: #112d55;
  margin-bottom: 1.2rem;
}
.total-acciones-contenedor {
  display: flex; 
  gap: 1rem; 
  justify-content: center; 
  margin-top: 1rem;
}
.total-box {
  background-color: #112d55;
  color: white;
  font-size: 1rem;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-align: center;
  min-width: 130px;
  cursor: default;
  transition: background-color 0.2s ease;
}
.total-box.clickable {
  cursor: pointer;
}
.total-box.clickable:hover {
  background-color: #0d2040;
}
.boton-anadir-productos {
  max-width: 220px;
  height: auto;
  font-size: 1rem;
  margin-top: 4px;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: rgba(248, 248, 248, 0.96);
  padding: 2.5rem;
  border-radius: 8px;
  max-width: 460px;
  width: 95%;
  text-align: center;
  position: relative;
  box-shadow: 0 12px 30px rgba(17, 45, 85, 0.1);
  font-family: 'Arial', sans-serif;
  overflow: hidden;
}
.modal::before {
  content: '';
  background-repeat: no-repeat;
  background-position: center;
  background-size: 80px;
  opacity: 0.08;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
.modal h2 {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #112D55;
  position: relative;
  z-index: 1;
}
.modal input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 1rem;
  z-index: 1;
  position: relative;
  font-size: 1rem;
  margin-top: 1rem;
}
.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  z-index: 1;
  position: relative;
}
.modal-buttons button {
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  margin-left: 1rem;
  margin-top: 4px; 
}
.modal-buttons button.btn-eliminar {
  margin-left: 0; 
}
.error {
  color: #e74c3c;
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
}
.lista-armada {
  display: flex; 
  align-items: center; 
}
.lista-armada h2 {
  margin-right: 10px;
}
.super-lista-header {
  display: flex;
  align-items: center; 
  justify-content: center; 
  text-align: center; 
  gap: 15px; 
  margin-bottom: 1rem; 
}



@media (max-width: 768px) {
.cantidad-productos {
    display: none;
  }

  .botones-vista {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    margin-bottom: 1rem;
  }
 
  .productos-grid, .super-productos {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .producto-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid #112d55;
    padding: 1rem;
    border-radius: 6px;
    background-color: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .producto-img {
    width: 100px;
    height: auto;
    margin-bottom: 0.5rem;
  }

  .logo-img {
    width: 50px;
    height: auto;
  }

  h3 {
    font-size: 1rem;
    text-align: center;
    margin: 0.3rem 0;
  }

  p {
    font-size: 0.9rem;
    margin: 0.3rem 0;
  }

  .acciones-inferiores {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .cantidad-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cantidad-control button {
    font-size: 1rem;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    border: none;
  }

  .boton-eliminar-detalle img {
    width: 20px;
    height: 20px;
  }

  .checkbox-container input {
    transform: scale(1.3);
  }

  .botones-acciones,
  .total-acciones-contenedor {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
  }


  .boton-principal.btn-anadir-productos {
    width: 90%;
    max-width: 300px;
    font-size: 1rem;
    padding: 0.75rem 1rem;
    text-align: center;
  }

  .total-acciones-contenedor .total-box {
    width: 90%;
    max-width: 300px;
    font-size: 1rem;
    padding: 0.75rem 1rem;
    text-align: center;
    border-radius: 6px;
  }

  .total-acciones-contenedor .total-box.clickable {
    background-color: #112d55;
    cursor: pointer;
  }
}

</style>