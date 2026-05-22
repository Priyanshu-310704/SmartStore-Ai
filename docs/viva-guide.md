# Viva Guide

Viva date: May 23, 2026  
Deadline reminder: commits after 3:00 PM may be rejected, so push before that time.

## One-Minute Project Explanation

SmartStore AI is an AI-powered e-commerce admin assistant for store owners. A store owner signs up, logs in, adds products, generates product descriptions, SEO tags and marketing captions using Gemini, then monitors revenue, top products and low-stock alerts from the dashboard. The system also gives AI sales suggestions such as restocking low inventory, testing price changes and promoting high-potential products.

## Demo Flow

1. Open the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

2. Open the backend:

   ```bash
   cd backend
   npm run dev
   ```

3. Start MongoDB locally or use MongoDB Atlas.

4. Create an account or use the demo workspace.

5. Go to Products and add a product.

6. Go to AI Studio and generate Gemini content.

7. Go to Dashboard and explain revenue charts.

8. Go to Sales Insights and explain suggestions and inventory alerts.

## Architecture Explanation

Frontend:

- React Vite app
- Tailwind CSS for UI
- Chart.js for analytics charts
- Axios for backend requests

Backend:

- Express.js API
- MongoDB with Mongoose models
- JWT authentication
- bcrypt password hashing
- Gemini API for content generation and sales suggestions

## Important Code Areas

- Backend server: `backend/src/server.js`
- Auth routes: `backend/src/routes/authRoutes.js`
- Product routes: `backend/src/routes/productRoutes.js`
- Gemini service: `backend/src/services/geminiService.js`
- Analytics routes: `backend/src/routes/analyticsRoutes.js`
- Frontend app: `frontend/src/App.jsx`

## Likely Viva Questions

### What problem does SmartStore AI solve?

It helps small store owners manage products and produce better product content without manually writing descriptions, tags and captions. It also turns basic sales data into useful business recommendations.

### Why JWT?

JWT allows the backend to protect API routes without storing sessions on the server. After login, the token is sent with each request in the `Authorization` header.

### Why bcrypt?

Plain passwords should never be stored. bcrypt hashes passwords with a salt, making leaked passwords much harder to reverse.

### Why MongoDB?

Product data can vary across categories, so MongoDB is flexible and easy to model with Mongoose.

### Where is AI used?

AI is used in `geminiService.js` for product descriptions, SEO tags, marketing captions and sales suggestions.

### What happens if Gemini key is missing?

The backend has fallback output so the demo does not fail during viva. In production, `GEMINI_API_KEY` should be configured in `.env`.

### How are analytics calculated?

Revenue is calculated as `price * unitsSold`. Profit is calculated as `(price - costPrice) * unitsSold`. The dashboard also sorts top products and detects low-stock products.

### How is user data separated?

Every product stores the logged-in user's id. Product queries filter by `user: req.user._id`, so users only see their own products.

## Improvements To Mention

- Add real order checkout integration.
- Add product image upload with Cloudinary or S3.
- Add role-based access for staff.
- Add export reports as PDF or CSV.
- Add scheduled inventory notifications.
- Add more advanced Gemini trend analysis using historical order data.
