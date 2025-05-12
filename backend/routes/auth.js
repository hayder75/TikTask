const express = require('express');
const { register, login } = require('../controllers/authController');
const { protect, restrictTo } = require('../utils/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6+ characters').isLength({ min: 6 }),
    check('role', 'Role must be seller or marketer').isIn(['seller', 'marketer']),
  ],
  register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').not().isEmpty(),
  ],
  login
);

module.exports = router;