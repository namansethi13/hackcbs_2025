const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');
const prisma = require('../prismaClient');
const axios = require('axios');

const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://dev-hxbv3eu0f4ouih6a.us.auth0.com/.well-known/jwks.json`
  }),
  // audience: 'https://dev-hxbv3eu0f4ouih6a.us.auth0.com/api/v2/',
  issuer: `https://dev-hxbv3eu0f4ouih6a.us.auth0.com/`,
  algorithms: ['RS256']
});

const getUserInfo = async (accessToken) => {
  try {
    console.log('Attempting to fetch user info from Auth0...');
    const response = await axios.get('https://dev-hxbv3eu0f4ouih6a.us.auth0.com/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('User info response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return null;
  }
};

const syncUserWithDb = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const auth0Id = req.auth.sub;
    const token = req.headers.authorization.split(' ')[1];
    console.log('Token payload:', req.auth);
    console.log('Fetching user info with token:', token.substring(0, 10) + '...');
    const userInfo = await getUserInfo(token);

    if (!userInfo) {
      console.error('Failed to fetch user info from Auth0');
      return res.status(400).json({ error: 'Could not fetch user information from Auth0' });
    }
    
    if (!userInfo.email) {
      console.error('Email missing from Auth0 user info:', userInfo);
      return res.status(400).json({ error: 'Email not found in user information' });
    }

    let user = await prisma.user.findFirst({
      where: { 
        email: userInfo.email.toLowerCase()
      }
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          email: userInfo.email.toLowerCase(),
          name: userInfo.name || null,
          password: 'AUTH0_USER' // placeholder since we're using Auth0
        }
      });
      console.log('Created new user:', user.id);
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
