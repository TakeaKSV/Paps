import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import quotationsRouter from './routes/quotations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error conectando a MongoDB:', err));

app.use('/api/quotations', quotationsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API de Cotizador de Sistemas de Riego funcionando' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});