const express = require('express');
const Product = require('../models/Product');
const protect = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

const normalizeProductBody = (body) => ({
  name: body.name,
  category: body.category,
  price: Number(body.price || 0),
  costPrice: Number(body.costPrice || 0),
  stock: Number(body.stock || 0),
  unitsSold: Number(body.unitsSold || 0),
  imageUrl: body.imageUrl || '',
  status: body.status || 'active',
  description: body.description || '',
  seoTags: Array.isArray(body.seoTags)
    ? body.seoTags
    : String(body.seoTags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
  marketingCaptions: Array.isArray(body.marketingCaptions)
    ? body.marketingCaptions
    : String(body.marketingCaptions || '')
        .split('\n')
        .map((caption) => caption.trim())
        .filter(Boolean),
  monthlySales: Array.isArray(body.monthlySales) ? body.monthlySales : [],
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const products = await Product.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ products });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = normalizeProductBody(req.body);

    if (!payload.name || !payload.category) {
      return res.status(400).json({ message: 'Product name and category are required' });
    }

    const product = await Product.create({
      ...payload,
      user: req.user._id,
    });

    res.status(201).json({ product });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      normalizeProductBody(req.body),
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  })
);

module.exports = router;
