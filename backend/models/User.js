import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombreApellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

export default mongoose.model('Usuario', usuarioSchema);