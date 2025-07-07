require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GridFSBucket } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro de conexão:', err));

// Configuração do GridFS
let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = new GridFSBucket(conn.db, { bucketName: 'uploads' });
});

// Modelo para metadados das fotos
const Foto = mongoose.model('Foto', {
  nome: String,
  caminho: String, // Nome do arquivo no GridFS
  dataUpload: { type: Date, default: Date.now }
});

// Configuração do Multer para arquivo temporário
const upload = multer({ dest: 'temp/' });

// Rota de Upload (com GridFS)
app.post('/api/upload', upload.single('arquivo'), async (req, res) => {
  try {
    const readStream = fs.createReadStream(req.file.path);
    const writeStream = gfs.openUploadStream(req.file.originalname);

    readStream.pipe(writeStream)
      .on('finish', async () => {
        // Salva metadados no MongoDB
        const novaFoto = new Foto({
          nome: req.file.originalname,
          caminho: req.file.originalname // Nome do arquivo no GridFS
        });
        await novaFoto.save();
        
        // Remove o arquivo temporário
        fs.unlinkSync(req.file.path);
        
        res.status(201).json(novaFoto);
      })
      .on('error', (err) => {
        throw err;
      });
  } catch (err) {
    res.status(500).json({ erro: 'Erro no upload: ' + err.message });
  }
});

// Rota para listar fotos (metadados)
app.get('/api/fotos', async (req, res) => {
  try {
    const fotos = await Foto.find().sort({ dataUpload: -1 });
    res.json(fotos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar fotos' });
  }
});

// Rota para exibir uma imagem (via GridFS)
app.get('/api/image/:filename', (req, res) => {
  try {
    const downloadStream = gfs.openDownloadStreamByName(req.params.filename);
    downloadStream.pipe(res);
  } catch (err) {
    res.status(404).json({ erro: 'Imagem não encontrada' });
  }
});

// Pasta temporária para uploads (opcional)
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});