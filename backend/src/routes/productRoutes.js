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

router.post(
  '/seed',
  asyncHandler(async (req, res) => {
    const existingCount = await Product.countDocuments({ user: req.user._id });

    if (existingCount > 0) {
      return res.status(409).json({ message: 'Seed data is only available for an empty product list' });
    }

    const products = await Product.insertMany(
      [
        {
          user: req.user._id,
          name: 'AeroFit Smart Watch',
          category: 'Wearables',
          price: 3499,
          costPrice: 2100,
          stock: 8,
          unitsSold: 82,
          description: 'A sleek fitness smartwatch with heart-rate tracking, water resistance and long battery life.',
          seoTags: ['smart watch', 'fitness tracker', 'wearables'],
          marketingCaptions: ['Track better. Train smarter. Sell faster.'],
        },
        {
          user: req.user._id,
          name: 'LumaDesk LED Lamp',
          category: 'Home Office',
          price: 1599,
          costPrice: 760,
          stock: 3,
          unitsSold: 44,
          description: 'Adjustable LED desk lamp with warm, cool and reading modes for compact workspaces.',
          seoTags: ['desk lamp', 'led lamp', 'home office'],
          marketingCaptions: ['Make late-night work feel lighter.'],
        },
        {
          user: req.user._id,
          name: 'UrbanPack Travel Bag',
          category: 'Accessories',
          price: 2299,
          costPrice: 1250,
          stock: 16,
          unitsSold: 63,
          description: 'Durable travel backpack with laptop storage, anti-theft zippers and weekend capacity.',
          seoTags: ['travel bag', 'laptop backpack', 'anti theft bag'],
          marketingCaptions: ['Built for commutes, classes and quick trips.'],
        },
      ],
      { ordered: true }
    );

    res.status(201).json({ products });
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
