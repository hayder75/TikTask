const express = require('express');
const { createCategory, getCategories } = require('../controllers/categoryController');
const { check } = require('express-validator');

const router = express.Router();

router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is optional').optional().trim(),
  ],
  createCategory
);

router.get('/', getCategories);

module.exports = router;