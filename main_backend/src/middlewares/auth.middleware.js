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
