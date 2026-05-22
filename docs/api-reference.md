# SmartStore AI API Reference

Base URL:

```txt
http://localhost:5000/api
```

Protected routes require:

```txt
Authorization: Bearer <jwt-token>
```

## Health

### GET `/health`

Returns API status and confirms the AI provider is Gemini.

## Authentication

### POST `/auth/signup`

Creates a store owner account.

```json
{
  "name": "Priya Sharma",
  "storeName": "Smart Gadgets",
  "email": "owner@example.com",
  "password": "secret123"
}
```

### POST `/auth/login`

Logs in a store owner and returns a JWT.

```json
{
  "email": "owner@example.com",
  "password": "secret123"
}
```

### GET `/auth/me`

Returns the logged-in user profile.

## Products

### GET `/products`

Returns all products owned by the logged-in user.

### POST `/products`

Creates a product.

```json
{
  "name": "AeroFit Smart Watch",
  "category": "Wearables",
  "price": 3499,
  "costPrice": 2100,
  "stock": 8,
  "unitsSold": 82,
  "description": "Optional description",
  "seoTags": ["smart watch", "fitness tracker"],
  "marketingCaptions": ["Track better. Train smarter."]
}
```

### POST `/products/seed`

Creates three viva-ready demo products for an empty product list.

### PUT `/products/:id`

Updates a product.

### DELETE `/products/:id`

Deletes a product.

## Gemini AI

### POST `/ai/content`

Generates product content from a request body without saving it.

### POST `/ai/products/:id/content`

Generates and saves:

- Product description
- SEO tags
- Marketing captions
- Strategy notes

### GET `/ai/sales-suggestions`

Uses Gemini to recommend:

- Pricing changes
- Product promotions
- Inventory actions
- Trending-product opportunities

If `GEMINI_API_KEY` is missing, the backend returns a deterministic fallback so the viva demo still works.

## Analytics

### GET `/analytics/dashboard`

Returns:

- Total revenue
- Total profit
- Total products
- Total stock
- Low-stock count
- Monthly revenue trend
- Top products
- Category revenue
- Low-stock products
