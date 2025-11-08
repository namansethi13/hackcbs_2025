// BACKUP: Original JWT-based authentication middleware
// This was the authentication system before migrating to Auth0
// Kept for reference in case you need to switch back

const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: "Unauthorized: No Token Provided"
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized: invalid user'
      })
    }

    req.user = {
      id: user.id
    };
    next();
  }
  catch (error) {
    return res.status(401).json({
      error: 'Unauthorized: invalid token _ auth.middleware'
    });
  }
}

module.exports = authMiddleware;
