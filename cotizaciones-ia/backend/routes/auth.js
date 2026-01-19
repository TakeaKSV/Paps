import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

dotenv.config();

const router = express.Router();

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TTL || '12h'
  });
};

const sendAuthResponse = (res, user, message = 'Autenticado correctamente') => {
  const token = signToken(user._id);
  const cookieOptions = {
    httpOnly: true,
    secure: secure,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 12 // 12 horas
  };

  res.cookie('token', token, cookieOptions);
  return res.json({
    message,
    user: sanitizeUser(user)
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  rfc: user.rfc,
  address: user.address,
  companyName: user.companyName,
  companyAddress: user.companyAddress,
  signatureName: user.signatureName,
  signatureTitle: user.signatureTitle,
  role: user.role
});

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      rfc,
      address,
      companyName,
      companyAddress,
      signatureName,
      signatureTitle,
      password,
      adminSecret
    } = req.body;

    if (!name || !email || !rfc || !address || !companyName || !companyAddress || !signatureName || !password) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben llenarse.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { rfc }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese RFC o correo.' });
    }

    const userCount = await User.countDocuments();
    const secretFromEnv = process.env.ADMIN_REGISTRATION_TOKEN;
    const allowOpenRegistration = userCount === 0;

    if (!allowOpenRegistration) {
      if (!secretFromEnv || adminSecret !== secretFromEnv) {
        return res.status(403).json({ message: 'No tienes permisos para registrar usuarios.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      rfc: rfc.toUpperCase(),
      address,
      companyName,
      companyAddress,
      signatureName,
      signatureTitle,
      password: hashedPassword,
      role: userCount === 0 ? 'admin' : 'sales'
    });

    await user.save();

    return sendAuthResponse(res, user, 'Cuenta creada correctamente');
  } catch (error) {
    console.error('❌ Error en registro:', error);
    return res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { rfc, password } = req.body;

    if (!rfc || !password) {
      return res.status(400).json({ message: 'RFC y contraseña son obligatorios.' });
    }

    const user = await User.findOne({ rfc: rfc.toUpperCase() });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tu cuenta está deshabilitada.' });
    }

    return sendAuthResponse(res, user, 'Inicio de sesión exitoso');
  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Sesión cerrada' });
});

router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    user: sanitizeUser(req.user)
  });
});

export default router;
