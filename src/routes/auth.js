const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, generateToken } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

const prisma = new PrismaClient();

const formatUser = (u) => {
  const { password, ...rest } = u;
  return rest;
};

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, phone, userType } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, phone, userType: userType || 'INDIVIDUAL' },
    });
    const token = generateToken(user.id);
    res.status(201).json({ success: true, data: { token, user: formatUser(user) } });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.password) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const token = generateToken(user.id);
    res.json({ success: true, data: { token, user: formatUser(user) } });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: { user: formatUser(req.user) } });
});

// PUT /api/auth/me
router.put('/me', authenticate, uploadAvatar, async (req, res, next) => {
  try {
    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.phone) data.phone = req.body.phone;
    if (req.file) data.avatar = req.file.path || req.file.secure_url;
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({ success: true, data: { user: formatUser(user) } });
  } catch (err) { next(err); }
});

module.exports = router;
