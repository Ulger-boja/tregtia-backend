const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadImages } = require('../middleware/upload');

const prisma = new PrismaClient();

// GET /api/listings
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, city, search, sort = 'newest', minPrice, maxPrice } = req.query;
    const where = { status: 'ACTIVE' };

    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (city) where.city = { equals: city, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };

    const orderBy = sort === 'cheapest' ? { price: 'asc' }
      : sort === 'expensive' ? { price: 'desc' }
      : { createdAt: 'desc' };

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where, orderBy, skip, take,
        include: {
          category: { select: { slug: true, name_sq: true, name_en: true } },
          user: { select: { id: true, name: true, avatar: true } },
          _count: { select: { favorites: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        listings,
        pagination: { total, page: Number(page), limit: take, pages: Math.ceil(total / take) },
      },
    });
  } catch (err) { next(err); }
});

// GET /api/listings/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        user: { select: { id: true, name: true, phone: true, avatar: true, userType: true, companyName: true, createdAt: true } },
        _count: { select: { favorites: true } },
      },
    });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    // Increment views
    await prisma.listing.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });

    res.json({ success: true, data: { listing: { ...listing, views: listing.views + 1 } } });
  } catch (err) { next(err); }
});

// GET /api/listings/my
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { userId: req.user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { slug: true, name_sq: true, name_en: true } } },
    });
    res.json({ success: true, data: { listings } });
  } catch (err) { next(err); }
});

// POST /api/listings
router.post('/', authenticate, uploadImages, async (req, res, next) => {
  try {
    const { title, description, price, currency, negotiable, exchange, city, neighborhood, address, lat, lng, categoryId, attributes } = req.body;
    if (!title || !description || !categoryId || !city) {
      return res.status(400).json({ success: false, message: 'Title, description, category, and city are required' });
    }

    const images = (req.files || []).map((f) => f.path || f.secure_url || f.url);

    // Also accept image URLs in body (for scraper)
    if (images.length === 0 && req.body.images) {
      try {
        const parsed = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        if (Array.isArray(parsed)) images.push(...parsed.filter(u => typeof u === 'string' && u.startsWith('http')));
      } catch {}
    }

    const listing = await prisma.listing.create({
      data: {
        userId: req.user.id,
        categoryId,
        title,
        description,
        price: price ? parseFloat(price) : null,
        currency: currency || 'ALL',
        negotiable: negotiable === 'true' || negotiable === true,
        exchange: exchange === 'true' || exchange === true,
        city,
        neighborhood: neighborhood || null,
        address: address || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        images,
        attributes: attributes ? (typeof attributes === 'string' ? JSON.parse(attributes) : attributes) : null,
      },
      include: {
        category: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
    res.status(201).json({ success: true, data: { listing } });
  } catch (err) { next(err); }
});

// DELETE /api/listings/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ success: false, message: 'Not found' });
    if (listing.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'INACTIVE' } });
    res.json({ success: true, message: 'Listing deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
