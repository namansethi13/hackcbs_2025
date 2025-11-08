const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile, getAllUsers } = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

// Important: /all must come before /me to avoid route conflicts
router.get('/all', getAllUsers);
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

module.exports = router;
