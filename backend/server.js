import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // Загрузка переменных из .env

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'bruno123';

// Фикс путей для ES-модуля
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB клиент
const client = new MongoClient(MONGO_URI);
const dbName = 'Gondoleando';

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

// 👉 Статические файлы из Vite
app.use(express.static(path.join(__dirname, '../dist')));

// 🔄 SPA fallback
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ===================
// 🔒 Middleware JWT
// ===================
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

// ===================
// 🔌 DB Utils
// ===================
async function getDB() {
  await client.connect();
  return client.db(dbName);
}

// ===================
// 📦 API Routes
// ===================

// ✅ REGISTER
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
      supermercadoFavorito: 'Ninguno',
    });

    res.status(201).json({ mensaje: 'Usuario creado con éxito' });
  } catch {
    res.status(500).json({ mensaje: 'Error al registrar' });
  }
});

// ✅ LOGIN
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

// ✅ ME
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

// ✅ Otros endpoints (productos, listas, perfil, etc.)
// ... (оставляем без изменений – они у тебя уже хорошие)

/// [💬 ПРИМЕЧАНИЕ]
/// Я не вставляю сюда все `/api/listas`, `/api/perfil`, `/api/sucursales-cercanas`, чтобы не дублировать.
/// Но в твоем коде они уже были корректно написаны — можешь их оставить как есть.


// 🚀 Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
