
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth failed: No token provided');
    return res.status(401).json({
      error: "Unauthorized: No Token Provided"
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { userId: decoded.userId });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      console.log('Auth failed: User not found for id:', decoded.userId);
      return res.status(401).json({
        error: 'Unauthorized: invalid user'
      })
    }

    console.log('Auth successful for user:', user.email);
    req.user = {
      id: user.id
    };
    next();
  }
  catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({
      error: 'Unauthorized: invalid token _ auth.middleware',
      details: error.message
    });
  }
}

module.exports = authMiddleware;
