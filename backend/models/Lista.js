const mongoose = require('mongoose');

const listaSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  productos: [
    {
      nombre: String,
      categoria: String,
      supermercado: String,
      precio: Number,
    }
  ],
  creadaEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lista', listaSchema);