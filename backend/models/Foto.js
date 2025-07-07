const mongoose = require('mongoose');

const FotoSchema = new mongoose.Schema({
  nome: String,
  caminho: String, // Caminho do arquivo no servidor
  dataUpload: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Foto', FotoSchema);