import Usuario from '../models/Usuario.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'bruno123';

export async function registrar(req, res) {
  const { nombreApellido, email, password } = req.body;

  try {
    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) return res.status(400).json({ mensaje: 'Ya existe ese email' });

    const hash = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({ nombreApellido, email, password: hash });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario creado' });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ mensaje: 'Error al registrar' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: usuario._id, email: usuario.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ mensaje: 'Error en el login' });
  }
}
