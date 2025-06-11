const express = require('express');
const { register, login, tiktokAuth, tiktokCallback } = require('../controllers/authController');
const { check } = require('express-validator');

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Valid email is required').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Role is required').not().isEmpty().isIn(['seller', 'marketer', 'admin']),
  ],
  register
);

router.post(
  '/login',
  [
    check('email', 'Valid email is required').isEmail(),
    check('password', 'Password is required').not().isEmpty(),
  ],
  login
);

// TikTok authentication routes (under /api/auth)
router.get('/tiktok', tiktokAuth);
router.get('/callback', tiktokCallback);

module.exports = router;