/**
 * Global Error Handler Middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          status: 'error',
          message: 'هذا السجل موجود بالفعل', // Record already exists
          field: err.meta?.target
        });
      case 'P2025':
        return res.status(404).json({
          status: 'error',
          message: 'السجل غير موجود' // Record not found
        });
      case 'P2003':
        return res.status(400).json({
          status: 'error',
          message: 'خطأ في العلاقات - السجل المرتبط غير موجود' // Foreign key constraint error
        });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'خطأ في التحقق من البيانات', // Validation error
      errors: err.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'خطأ في المصادقة' // Authentication error
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'حدث خطأ في الخادم'; // Server error

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
