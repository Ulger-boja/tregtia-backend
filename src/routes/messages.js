const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/messages — conversations
router.get('/', authenticate, async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.user.id }, { receiverId: req.user.id }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });
    res.json({ success: true, data: { messages } });
  } catch (err) { next(err); }
});

// POST /api/messages
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { receiverId, listingId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ success: false, message: 'Receiver and content required' });
    const message = await prisma.message.create({
      data: { senderId: req.user.id, receiverId, listingId, content },
    });
    res.status(201).json({ success: true, data: { message } });
  } catch (err) { next(err); }
});

module.exports = router;
