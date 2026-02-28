const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { listings: true } } },
        },
        _count: { select: { listings: true } },
      },
    });

    // Sum children listing counts into parent total
    const enriched = categories.map(cat => ({
      ...cat,
      _count: {
        listings: cat._count.listings + cat.children.reduce((sum, ch) => sum + ch._count.listings, 0),
      },
    }));

    res.json({ success: true, data: { categories: enriched } });
  } catch (err) { next(err); }
});

module.exports = router;
