import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import quotationsRouter from './routes/quotations.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);
const FRONTEND_URL = process.env.FRONTEND_URL;
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos. Intenta más tarde.'
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error conectando a MongoDB:', err));

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/quotations', quotationsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API de Cotizador de Sistemas de Riego funcionando' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});