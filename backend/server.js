import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;
const uri = 'mongodb+srv://brunosurijon:Bruno2025@gondoleando.dbvpois.mongodb.net/Gondoleando?retryWrites=true&w=majority';
const client = new MongoClient(uri);
const dbName = 'Gondoleando';
const JWT_SECRET = 'bruno123';

app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

async function getDB() {
  await client.connect();
  return client.db(dbName);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ mensaje: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
}

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await getDB();
    const user = await db.collection('usuarios').findOne({ email });
    if (!user) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });

    const coincide = await bcrypt.compare(password, user.password);
    if (!coincide) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch {
    res.status(500).json({ mensaje: 'Error en el login' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { nombreApellido, email, password } = req.body;
  try {
    const db = await getDB();
    const existe = await db.collection('usuarios').findOne({ email });
    if (existe) return res.status(400).json({ mensaje: 'Ya existe ese email' });

    const hash = await bcrypt.hash(password, 10);
    await db.collection('usuarios').insertOne({
      nombreApellido,
      email,
      password: hash,
      cantidadListas: 0,
      categoriaFavorita: 'Ninguna',
      supermercadoFavorito: 'Ninguno'
    });

    res.status(201).json({ mensaje: 'Usuario creado con éxito' });
  } catch {
    res.status(500).json({ mensaje: 'Error al registrar' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const db = await getDB();
    const user = await db.collection('usuarios').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { password: 0 } }
    );
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    res.json(user);
  } catch {
    res.status(500).json({ mensaje: 'Error al obtener usuario' });
  }
});

app.get('/api/productos', async (req, res) => {
  try {
    const db = await getDB();
    const productos = await db.collection('productos').find({}).toArray();
    res.json(productos);
  } catch {
    res.status(500).send('Error al obtener todos los productos');
  }
});

app.post('/api/listas', authMiddleware, async (req, res) => {
  try {
    const db = await getDB();
    const { productos, nombre } = req.body;

    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({ mensaje: 'Productos inválidos' });
    }

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return res.status(400).json({ mensaje: 'Nombre inválido' });
    }

    const usuarioId = new ObjectId(req.userId);
    const listaExistente = await db.collection('listas').findOne({ usuarioId, nombre });

    if (listaExistente) {
      await db.collection('listas').updateOne(
        { _id: listaExistente._id },
        { $set: { productos, actualizadaEn: new Date() } }
      );
    } else {
      await db.collection('listas').insertOne({
        usuarioId,
        nombre,
        productos,
        creadaEn: new Date()
      });
    }

    const listas = await db.collection('listas').find({ usuarioId }).toArray();
    const listasUsuario = listas.length;

    const conteoCategorias = {};
    const conteoSupermercados = {};
    listas.forEach(lista => {
      lista.productos.forEach(p => {
        conteoCategorias[p.categoria] = (conteoCategorias[p.categoria] || 0) + 1;
        conteoSupermercados[p.supermercado] = (conteoSupermercados[p.supermercado] || 0) + 1;
      });
    });

    const categoriaFavorita = Object.entries(conteoCategorias).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ninguna';
    const supermercadoFavorito = Object.entries(conteoSupermercados).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ninguno';

    await db.collection('usuarios').updateOne(
      { _id: usuarioId },
      {
        $set: {
          cantidadListas: listasUsuario,
          categoriaFavorita,
          supermercadoFavorito
        }
      }
    );

    res.status(201).json({ mensaje: 'Lista guardada o actualizada' });
  } catch (err) {
    console.error('Error al guardar lista:', err);
    res.status(500).json({ mensaje: 'Error al guardar lista' });
  }
});

app.get('/api/listas', authMiddleware, async (req, res) => {
  try {
    const db = await getDB();
    const usuarioId = new ObjectId(req.userId);
    const listas = await db.collection('listas')
      .find({ usuarioId })
      .project({ productos: 1, nombre: 1, creadaEn: 1 })
      .toArray();
    res.json(listas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener listas' });
  }
});

app.delete('/api/listas/:nombre', authMiddleware, async (req, res) => {
  try {
    const db = await getDB();
    const nombre = req.params.nombre;
    const usuarioId = new ObjectId(req.userId);

    const resultado = await db.collection('listas').deleteOne({ usuarioId, nombre });
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ mensaje: 'Lista no encontrada o no te pertenece' });
    }

    const listasUsuario = await db.collection('listas').countDocuments({ usuarioId });

    await db.collection('usuarios').updateOne(
      { _id: usuarioId },
      { $set: { cantidadListas: listasUsuario } }
    );

    res.json({ mensaje: 'Lista eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al eliminar lista por nombre' });
  }
});

app.delete('/api/listas', authMiddleware, async (req, res) => {
  try {
    const db = await getDB();
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'Nombre de lista requerido' });

    const usuarioId = new ObjectId(req.userId);

    const resultado = await db.collection('listas').deleteOne({ usuarioId, nombre });
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ mensaje: 'Lista no encontrada o no te pertenece' });
    }

    const listasUsuario = await db.collection('listas').countDocuments({ usuarioId });

    await db.collection('usuarios').updateOne(
      { _id: usuarioId },
      {
        $set: {
          cantidadListas: listasUsuario
        }
      }
    );

    res.json({ mensaje: 'Lista eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al eliminar lista por nombre' });
  }
});


app.get('/api/perfil', authMiddleware, async (req, res) => {
  try {
    const db = await getDB();
    const usuario = await db.collection('usuarios').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { password: 0 } }
    );
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    res.json({
      cantidadListas: usuario.cantidadListas || 0,
      categoriaFavorita: usuario.categoriaFavorita || 'Ninguna',
      supermercadoFavorito: usuario.supermercadoFavorito || 'Ninguno'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener perfil' });
  }
});

app.get('/api/sucursales-cercanas', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ mensaje: 'Latitud y longitud requeridas' });
  }

  try {
    const db = await getDB();
    const sucursales = await db.collection('sucursales').aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: "distancia",
          spherical: true
        }
      }
    ]).toArray();

    res.json(sucursales.map(s => ({
      nombre: s.nombre,
      direccion: s.direccion,
      distancia: Math.round(s.distancia), // en metros
      ubicacion: s.ubicacion
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al buscar sucursales cercanas' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
