require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const Foto = require('./models/Foto');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer (salvar fotos na pasta 'uploads')
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Conexão com MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB Atlas'))
  .catch(err => console.error('Erro ao conectar:', err));

// No seu server.js, na rota /upload
app.post('/upload', upload.single('foto'), async (req, res) => {
  const caminhoWeb = req.file.path.replace(/\\/g, '/'); // Substitui \ por /
  const novaFoto = new Foto({
    nome: req.file.filename,
    caminho: caminhoWeb // Ex: "uploads/1751911315050-img3.png"
  });
  await novaFoto.save();
  res.status(201).json(novaFoto);
});

// Rota para listar fotos
app.get('/fotos', async (req, res) => {
  const fotos = await Foto.find();
  res.json(fotos);
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});