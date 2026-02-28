const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'tregtia-dev-secret';

const generateToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = verifyToken(authHeader.split(' ')[1]);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  try {
    const decoded = verifyToken(authHeader.split(' ')[1]);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (user) req.user = user;
  } catch {}
  next();
};

module.exports = { authenticate, optionalAuth, generateToken, verifyToken };
