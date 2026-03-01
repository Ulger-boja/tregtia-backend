const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

// POST /api/reports — submit a report
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { listingId, reason, details } = req.body;
    if (!listingId || !reason) {
      return res.status(400).json({ success: false, message: 'listingId and reason are required' });
    }
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    const report = await prisma.report.create({
      data: { userId: req.user.id, listingId, reason, details: details || null },
    });
    res.status(201).json({ success: true, data: { report } });
  } catch (err) { next(err); }
});

// GET /api/reports — admin only, list all pending reports
router.get('/', authenticate, async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const reports = await prisma.report.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, city: true, images: true, userId: true } },
      },
    });
    res.json({ success: true, data: { reports } });
  } catch (err) { next(err); }
});

// PUT /api/reports/:id — admin dismiss report
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status: req.body.status || 'reviewed' },
    });
    res.json({ success: true, data: { report } });
  } catch (err) { next(err); }
});

module.exports = router;
