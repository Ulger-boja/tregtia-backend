const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);

  if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'A record with this value already exists' });
  if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Record not found' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large (max 5MB)' });
  if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ success: false, message: 'Too many files (max 10)' });
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
