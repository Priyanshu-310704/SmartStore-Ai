const express = require('express');
const Product = require('../models/Product');
const protect = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { generateProductContent, generateSalesSuggestions } = require('../services/geminiService');

const router = express.Router();

router.use(protect);

router.post(
  '/content',
  asyncHandler(async (req, res) => {
    const product = req.body.product || req.body;

    if (!product.name || !product.category) {
      return res.status(400).json({ message: 'Product name and category are required' });
    }

    const content = await generateProductContent(product);
    res.json({ content });
  })
);

router.post(
  '/products/:id/content',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const content = await generateProductContent(product);
    product.description = content.description;
    product.seoTags = content.seoTags || [];
    product.marketingCaptions = content.marketingCaptions || [];
    product.geminiNotes = content.notes || '';
    await product.save();

    res.json({ product, content });
  })
);

router.get(
  '/sales-suggestions',
  asyncHandler(async (req, res) => {
    const products = await Product.find({ user: req.user._id }).sort({ unitsSold: -1 });
    const suggestions = await generateSalesSuggestions(products);
    res.json({ suggestions });
  })
);

module.exports = router;
