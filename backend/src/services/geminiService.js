const { GoogleGenerativeAI } = require('@google/generative-ai');

const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const parseJsonBlock = (text) => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

const fallbackContent = (product) => ({
  description: `${product.name} is a high-value ${product.category} product designed for customers who want reliable quality and a smooth shopping experience. Its pricing, positioning and stock profile make it a strong candidate for focused digital campaigns.`,
  seoTags: [
    product.name,
    product.category,
    `buy ${product.name}`,
    `${product.category} online`,
    'smart shopping',
  ],
  marketingCaptions: [
    `Upgrade your cart with ${product.name} today.`,
    `Limited stock alert: ${product.name} is ready for your next best-seller campaign.`,
    `Bring more value to your store with this ${product.category} favorite.`,
  ],
  notes: 'Generated with local fallback because GEMINI_API_KEY is not configured or Gemini was unavailable.',
});

const fallbackSuggestions = (products) => {
  if (!products.length) {
    return [
      {
        title: 'Add products to unlock insights',
        reason: 'The dashboard needs product, stock and sales data before Gemini can recommend improvements.',
        action: 'Add at least five products with price, stock and units sold.',
        priority: 'high',
      },
    ];
  }

  return products.slice(0, 5).map((product) => {
    if (product.stock <= 5) {
      return {
        title: `Restock ${product.name}`,
        reason: `${product.name} has low stock and ${product.unitsSold} units sold.`,
        action: 'Reorder inventory and show a low-stock urgency caption.',
        priority: 'high',
      };
    }

    if (product.unitsSold >= 50) {
      return {
        title: `Test a higher price for ${product.name}`,
        reason: 'Strong sales volume suggests demand is healthy.',
        action: 'Increase price by 5-8% for one week and compare conversion.',
        priority: 'medium',
      };
    }

    return {
      title: `Promote ${product.name}`,
      reason: 'Sales are moderate and the product can benefit from better visibility.',
      action: 'Create a bundle offer and use the AI marketing caption in social posts.',
      priority: 'medium',
    };
  });
};

const getGeminiModel = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: modelName });
};

const generateProductContent = async (product) => {
  const model = getGeminiModel();

  if (!model) {
    return fallbackContent(product);
  }

  const prompt = `
You are SmartStore AI, an e-commerce admin assistant.
Create conversion-focused content for this product:
Name: ${product.name}
Category: ${product.category}
Price: ${product.price}
Stock: ${product.stock}
Units sold: ${product.unitsSold}

Return only valid JSON with this shape:
{
  "description": "80-120 word product description",
  "seoTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "marketingCaptions": ["caption1", "caption2", "caption3"],
  "notes": "short strategic note"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJsonBlock(text);
  } catch (error) {
    console.error(`Gemini content generation failed: ${error.message}`);
    return fallbackContent(product);
  }
};

const generateSalesSuggestions = async (products) => {
  const model = getGeminiModel();

  if (!model) {
    return fallbackSuggestions(products);
  }

  const compactProducts = products.map((product) => ({
    name: product.name,
    category: product.category,
    price: product.price,
    costPrice: product.costPrice,
    stock: product.stock,
    unitsSold: product.unitsSold,
    revenue: product.price * product.unitsSold,
  }));

  const prompt = `
You are SmartStore AI. Analyze these store products and return practical sales suggestions.
Products: ${JSON.stringify(compactProducts)}

Return only valid JSON array. Each item must use:
{
  "title": "short recommendation",
  "reason": "why this matters",
  "action": "specific action owner can take",
  "priority": "high|medium|low"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJsonBlock(text);
  } catch (error) {
    console.error(`Gemini sales suggestions failed: ${error.message}`);
    return fallbackSuggestions(products);
  }
};

module.exports = {
  generateProductContent,
  generateSalesSuggestions,
};
