const express = require('express');
const User = require('../models/User');
const protect = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const sendAuthResponse = require('../utils/sendAuthResponse');

const router = express.Router();

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { name, email, password, storeName } = req.body;

    if (!name || !email || !password || !storeName) {
      return res.status(400).json({ message: 'Name, email, password and store name are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = await User.create({ name, email, password, storeName });
    sendAuthResponse(res, user, 201);
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    sendAuthResponse(res, user);
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

module.exports = router;
