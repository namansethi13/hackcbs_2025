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
/**

 const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');
const prisma = require('../prismaClient');

const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});
const syncUserWithDb = async (req, res, next) => {
  try {
    const auth0Id = req.auth.sub; // Auth0 user ID (e.g., "auth0|123456")
    const email = req.auth.email || req.auth[`${process.env.AUTH0_AUDIENCE}/email`];
    const name = req.auth.name || req.auth[`${process.env.AUTH0_AUDIENCE}/name`];

    if (!email) {
      return res.status(400).json({ error: 'Email not found in token' });
    }
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
          password: 'AUTH0_USER'
        }
      });
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      auth0Id: auth0Id
    };

    next();
  } catch (error) {
    console.error('Error syncing user with database:', error);
    return res.status(500).json({ error: 'Could not authenticate user' });
  }
};
const authMiddleware = [checkJwt, syncUserWithDb];

module.exports = authMiddleware;

 */
