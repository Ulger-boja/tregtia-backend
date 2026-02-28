const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/favorites
router.get('/', authenticate, async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            category: { select: { slug: true, name_sq: true, name_en: true } },
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
    const active = favorites.filter((f) => f.listing?.status === 'ACTIVE');
    res.json({ success: true, data: { favorites: active } });
  } catch (err) { next(err); }
});

// POST /api/favorites/:listingId
router.post('/:listingId', authenticate, async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: req.user.id, listingId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { userId_listingId: { userId: req.user.id, listingId } } });
      return res.json({ success: true, data: { isFavorited: false } });
    }
    await prisma.favorite.create({ data: { userId: req.user.id, listingId } });
    res.json({ success: true, data: { isFavorited: true } });
  } catch (err) { next(err); }
});

module.exports = router;
