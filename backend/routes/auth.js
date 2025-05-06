const express = require('express');
const { register, login, mockTikTokSignup } = require('../controllers/authController');
const { check } = require('express-validator');

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role must be seller, marketer, or admin').isIn(['seller', 'marketer', 'admin']),
  ],
  register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  login
);

router.post(
  '/tiktok-signup',
  [
    check('email', 'Please include a valid email').isEmail(),
  ],
  mockTikTokSignup
);

module.exports = router;