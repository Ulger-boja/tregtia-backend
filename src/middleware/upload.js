const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'da026eij2',
  api_key: process.env.CLOUDINARY_API_KEY || '742261158633776',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'JYPbeMmHyXlQGYTD-6QgfTnQoew',
});

const listingStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tregtia/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
    public_id: () => `listing-${uuidv4()}`,
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tregtia/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }],
    public_id: () => `avatar-${uuidv4()}`,
  },
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP allowed.'), false);
  }
};

module.exports = {
  uploadImages: multer({ storage: listingStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 10 } }).array('images', 10),
  uploadAvatar: multer({ storage: avatarStorage, fileFilter, limits: { fileSize: 2 * 1024 * 1024, files: 1 } }).single('avatar'),
};
