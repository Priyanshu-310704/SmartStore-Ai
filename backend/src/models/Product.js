const mongoose = require('mongoose');

const monthlySaleSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    units: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    description: {
      type: String,
      default: '',
    },
    seoTags: {
      type: [String],
      default: [],
    },
    marketingCaptions: {
      type: [String],
      default: [],
    },
    geminiNotes: {
      type: String,
      default: '',
    },
    monthlySales: {
      type: [monthlySaleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('revenue').get(function getRevenue() {
  return Number((this.price * this.unitsSold).toFixed(2));
});

productSchema.virtual('profit').get(function getProfit() {
  return Number(((this.price - this.costPrice) * this.unitsSold).toFixed(2));
});

module.exports = mongoose.model('Product', productSchema);
