require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro de conexão:', err));

// Modelo
const Foto = mongoose.model('Foto', {
  nome: String,
  caminho: String,
  dataUpload: { type: Date, default: Date.now }
});

// Rotas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/upload', upload.single('arquivo'), async (req, res) => {
  try {
    const novaFoto = new Foto({
      nome: req.file.originalname,
      caminho: req.file.path.replace(/\\/g, '/')
    });
    await novaFoto.save();
    res.status(201).json(novaFoto);
  } catch (err) {
    res.status(500).json({ erro: 'Erro no servidor' });
  }
});

app.get('/api/fotos', async (req, res) => {
  try {
    const fotos = await Foto.find().sort({ dataUpload: -1 });
    res.json(fotos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar fotos' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});