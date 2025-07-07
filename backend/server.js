require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Multer com caminho absoluto
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Pasta uploads criada em:', uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fotosdb')
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro no MongoDB:', err));

// Modelo
const Foto = mongoose.model('Foto', {
  nome: String,
  caminho: String, // Salvar como "uploads/nome-do-arquivo"
  dataUpload: { type: Date, default: Date.now }
});

// Servir arquivos estáticos
app.use('/uploads', express.static(uploadsDir));

// Rota de Upload
app.post('/api/upload', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    const novaFoto = new Foto({
      nome: req.file.originalname,
      caminho: 'uploads/' + req.file.filename // Caminho relativo para o frontend
    });

    await novaFoto.save();
    res.status(201).json(novaFoto);

  } catch (err) {
    console.error('❌ Erro no upload:', err);
    res.status(500).json({ erro: 'Erro no servidor', detalhes: err.message });
  }
});

// Rota para listar fotos
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
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});