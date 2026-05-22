const express = require('express');
const Product = require('../models/Product');
const protect = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const buildMonthlyRevenue = (products) => {
  const totals = new Map(monthLabels.map((month) => [month, 0]));

  products.forEach((product) => {
    if (product.monthlySales?.length) {
      product.monthlySales.forEach((sale) => {
        totals.set(sale.month, Number(((totals.get(sale.month) || 0) + sale.revenue).toFixed(2)));
      });
      return;
    }

    monthLabels.forEach((month, index) => {
      const weightedRevenue = product.price * product.unitsSold * (0.08 + index * 0.025);
      totals.set(month, Number(((totals.get(month) || 0) + weightedRevenue).toFixed(2)));
    });
  });

  return Array.from(totals, ([month, revenue]) => ({ month, revenue }));
};

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const products = await Product.find({ user: req.user._id });

    const totalRevenue = products.reduce((sum, product) => sum + product.price * product.unitsSold, 0);
    const totalProfit = products.reduce(
      (sum, product) => sum + (product.price - product.costPrice) * product.unitsSold,
      0
    );
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const lowStock = products.filter((product) => product.stock <= 5);
    const topProducts = [...products]
      .sort((a, b) => b.price * b.unitsSold - a.price * a.unitsSold)
      .slice(0, 5)
      .map((product) => ({
        id: product._id,
        name: product.name,
        category: product.category,
        revenue: Number((product.price * product.unitsSold).toFixed(2)),
        unitsSold: product.unitsSold,
        stock: product.stock,
      }));

    const categoryRevenue = products.reduce((acc, product) => {
      acc[product.category] = Number(((acc[product.category] || 0) + product.price * product.unitsSold).toFixed(2));
      return acc;
    }, {});

    res.json({
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        totalProducts: products.length,
        totalStock,
        lowStockCount: lowStock.length,
      },
      monthlyRevenue: buildMonthlyRevenue(products),
      topProducts,
      categoryRevenue: Object.entries(categoryRevenue).map(([category, revenue]) => ({ category, revenue })),
      lowStockProducts: lowStock.map((product) => ({
        id: product._id,
        name: product.name,
        stock: product.stock,
      })),
    });
  })
);

module.exports = router;
