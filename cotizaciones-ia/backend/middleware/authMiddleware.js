import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Cuenta deshabilitada o inexistente' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export default authMiddleware;
