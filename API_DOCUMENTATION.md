# 🚀 Inventrika API Documentation

## Overview
The Inventrika AI-Powered Inventory Management API provides comprehensive endpoints for managing products, inventory, suppliers, categories, analytics, and AI-driven insights.

**Base URL:** `http://localhost:5000/api`
**Version:** 1.0.0

## Authentication
All protected endpoints require a valid JWT token in the Authorization header or as a cookie.

```bash
Authorization: Bearer <your-jwt-token>
```

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### 🏠 Health & Info

#### GET `/health`
Check API health status.

**Response:**
```json
{
  "success": true,
  "message": "Inventrika API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

#### GET `/`
Get API information and available endpoints.

---

### 🔐 Authentication (`/auth`)

#### POST `/auth/register`
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### POST `/auth/login`
Authenticate user.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### POST `/auth/logout`
Logout user (requires authentication).

---

### 👥 Users (`/users`)

#### GET `/users/profile` 🔒
Get current user profile.

#### PUT `/users/profile` 🔒
Update user profile.

---

### 📦 Products (`/products`)

#### GET `/products`
Get all products with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search in name, SKU, description
- `category` (string): Filter by category ID
- `supplier` (string): Filter by supplier ID
- `status` (string): active | inactive | discontinued
- `stockStatus` (string): in_stock | low_stock | out_of_stock | overstock
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `tags` (string): Comma-separated tags
- `sortBy` (string): name | price | quantity | createdAt | updatedAt
- `sortOrder` (string): asc | desc

#### GET `/products/me` 🔒
Get current user's products with same filtering options as above.

#### GET `/products/reorder` 🔒
Get products that need reordering.

#### GET `/products/:productId` 🔒
Get single product details with recent stock movements.

#### POST `/products` 🔒
Create a new product.

**Body:**
```json
{
  "name": "Product Name",
  "sku": "SKU-001",
  "description": "Product description",
  "price": 29.99,
  "cost": 15.00,
  "quantity": 100,
  "minStock": 10,
  "maxStock": 500,
  "category": "categoryId",
  "supplier": "supplierId",
  "location": "Warehouse A",
  "images": ["https://example.com/image.jpg"],
  "tags": ["electronics", "gadget"]
}
```

#### PUT `/products/:productId` 🔒
Update product (partial updates supported).

#### DELETE `/products/:productId` 🔒
Delete product.

#### PATCH `/products/:productId/stock` 🔒
Update product stock quantity.

**Body:**
```json
{
  "quantity": 50,
  "operation": "add|subtract|set",
  "reason": "Restocking",
  "reference": "PO-12345"
}
```

#### POST `/products/:productId/rate`
Rate a product (1-5 stars).

**Body:**
```json
{
  "rating": 5
}
```

#### PATCH `/products/bulk` 🔒
Bulk update multiple products.

**Body:**
```json
{
  "productIds": ["id1", "id2", "id3"],
  "updates": {
    "status": "inactive"
  }
}
```

---

### 📋 Categories (`/categories`)

#### GET `/categories`
Get all categories with optional filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search in category name
- `includeInactive`: Include inactive categories
- `sortBy`: name | createdAt
- `sortOrder`: asc | desc

#### GET `/categories/:categoryId`
Get single category with sample products.

#### POST `/categories` 🔒
Create new category.

**Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and gadgets",
  "color": "bg-blue-500",
  "icon": "Zap",
  "parentCategory": "parentCategoryId",
  "sortOrder": 1
}
```

#### PUT `/categories/:categoryId` 🔒
Update category.

#### DELETE `/categories/:categoryId` 🔒
Delete category (must not have products or subcategories).

#### GET `/categories/:categoryId/analytics` 🔒
Get category analytics and performance metrics.

#### POST `/categories/update-metadata` 🔒
Bulk update metadata for all categories.

---

### 🏭 Suppliers (`/suppliers`)

#### GET `/suppliers`
Get all suppliers with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search in name, code, email
- `status`: active | inactive | blacklisted
- `minRating`: Minimum rating filter
- `sortBy`: name | performance | deliveryPerformance
- `sortOrder`: asc | desc

#### GET `/suppliers/leaderboard`
Get supplier performance leaderboard.

#### GET `/suppliers/:supplierId`
Get single supplier with products and performance data.

#### POST `/suppliers` 🔒
Create new supplier.

**Body:**
```json
{
  "name": "Supplier Name",
  "code": "SUP-001",
  "contact": {
    "email": "supplier@example.com",
    "phone": "+1234567890",
    "website": "https://supplier.com",
    "contactPerson": "John Smith"
  },
  "address": {
    "street": "123 Business St",
    "city": "Business City",
    "state": "BC",
    "zipCode": "12345",
    "country": "Country"
  },
  "paymentTerms": {
    "creditDays": 30,
    "discountPercent": 2.5,
    "preferredPaymentMethod": "bank_transfer"
  },
  "tags": ["electronics", "reliable"],
  "notes": "Preferred supplier for electronics"
}
```

#### PUT `/suppliers/:supplierId` 🔒
Update supplier.

#### DELETE `/suppliers/:supplierId` 🔒
Delete supplier (must not have associated products).

#### POST `/suppliers/:supplierId/rate` 🔒
Rate supplier performance.

**Body:**
```json
{
  "rating": 4.5,
  "comment": "Good service"
}
```

#### POST `/suppliers/:supplierId/performance` 🔒
Update supplier performance metrics.

**Body:**
```json
{
  "orderData": {
    "onTime": true,
    "qualityRating": 4.2,
    "responseTime": 24
  }
}
```

#### GET `/suppliers/:supplierId/analytics` 🔒
Get supplier analytics and metrics.

---

### 📊 Inventory (`/inventory`)

#### GET `/inventory` 🔒
Get user's inventory with products and statistics.

**Query Parameters:**
- `includeAlerts`: Include fresh alerts (default: true)
- `includeStatistics`: Include statistics (default: true)
- `populate`: Populate product details (default: true)

#### GET `/inventory/summary` 🔒
Get inventory summary with breakdowns and analytics.

#### GET `/inventory/alerts` 🔒
Get inventory alerts.

**Query Parameters:**
- `severity`: critical | warning | info
- `unreadOnly`: Show only unread alerts

#### POST `/inventory` 🔒
Add product to inventory.

**Body:**
```json
{
  "productId": "productId",
  "quantity": 50,
  "location": "A1-B2",
  "reason": "New stock arrival"
}
```

#### DELETE `/inventory` 🔒
Remove product from inventory.

**Body:**
```json
{
  "productId": "productId",
  "quantity": 25,
  "reason": "Sale"
}
```

#### PUT `/inventory` 🔒
Update inventory settings.

**Body:**
```json
{
  "name": "Updated Inventory Name",
  "settings": {
    "autoReorder": true,
    "lowStockThreshold": 5,
    "trackExpiry": true
  }
}
```

#### POST `/inventory/reserve` 🔒
Reserve product quantity.

**Body:**
```json
{
  "productId": "productId",
  "quantity": 10,
  "reason": "Order reservation"
}
```

#### POST `/inventory/transfer` 🔒
Transfer product between locations.

**Body:**
```json
{
  "productId": "productId",
  "quantity": 20,
  "fromLocation": "A1",
  "toLocation": "B2",
  "reason": "Reorganization"
}
```

#### PATCH `/inventory/alerts/read` 🔒
Mark alerts as read.

**Body:**
```json
{
  "alertIds": ["alertId1", "alertId2"]
}
```

---

### 📈 Analytics (`/analytics`)

#### GET `/analytics/dashboard` 🔒
Get dashboard analytics with key metrics and charts.

**Query Parameters:**
- `period`: 7d | 30d | 60d | 90d (default: 30d)

**Response includes:**
- Summary statistics
- Revenue trends
- Category distribution
- Top selling products
- Recent alerts

#### GET `/analytics/inventory` 🔒
Get detailed inventory analytics.

**Query Parameters:**
- `period`: Analysis period
- `categoryId`: Filter by category
- `supplierId`: Filter by supplier

**Response includes:**
- Stock movement analytics
- Inventory turnover data
- Stock status distribution
- ABC analysis

#### GET `/analytics/sales` 🔒
Get sales analytics and performance metrics.

**Query Parameters:**
- `period`: Analysis period
- `groupBy`: day | week | month

**Response includes:**
- Sales summary
- Time series data
- Top products by revenue
- Category performance

#### GET `/analytics/suppliers` 🔒
Get supplier performance analytics.

**Query Parameters:**
- `period`: Analysis period

---

### 🤖 AI Features (`/ai`)

#### GET `/ai/insights` 🔒
Get AI-generated insights.

**Query Parameters:**
- `type`: demand_forecast | reorder_suggestion | trend_analysis | anomaly_detection
- `priority`: low | medium | high | critical
- `status`: active | dismissed | implemented
- `page`, `limit`: Pagination

#### GET `/ai/insights/summary` 🔒
Get AI insights summary and statistics.

#### POST `/ai/forecast` 🔒
Generate demand forecasts.

**Body:**
```json
{
  "productIds": ["id1", "id2"],
  "period": "30d"
}
```

#### POST `/ai/reorder-suggestions` 🔒
Generate reorder suggestions.

**Body:**
```json
{
  "threshold": "auto"
}
```

#### GET `/ai/trends` 🔒
Analyze trends in sales and inventory.

**Query Parameters:**
- `period`: Analysis period
- `type`: all | sales | category

#### POST `/ai/anomalies` 🔒
Detect anomalies in stock movements.

**Body:**
```json
{
  "sensitivity": "medium"
}
```

#### POST `/ai/insights/:insightId/dismiss` 🔒
Dismiss an AI insight.

**Body:**
```json
{
  "reason": "Not applicable"
}
```

#### POST `/ai/insights/:insightId/implement` 🔒
Mark insight as implemented.

---

### 📋 Stock Movements (`/stock-movements`)

#### GET `/stock-movements` 🔒
Get stock movements with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `productId`: Filter by product
- `type`: in | out | adjustment | transfer | damaged | returned
- `startDate`, `endDate`: Date range filter
- `sortBy`: createdAt | quantity
- `sortOrder`: asc | desc

#### GET `/stock-movements/product/:productId` 🔒
Get stock movements for specific product.

#### GET `/stock-movements/analytics` 🔒
Get stock movement analytics.

#### GET `/stock-movements/date-range` 🔒
Get movements within date range.

**Query Parameters:**
- `startDate`, `endDate`: Required date range
- `type`: Optional movement type filter

---

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Rate Limiting

- Standard endpoints: 100 requests per minute
- AI endpoints: 20 requests per minute
- Authentication endpoints: 10 requests per minute

## Data Models

### Product
```json
{
  "_id": "ObjectId",
  "user": "ObjectId",
  "name": "string",
  "sku": "string",
  "description": "string",
  "price": "number",
  "cost": "number",
  "quantity": "number",
  "minStock": "number",
  "maxStock": "number",
  "category": "ObjectId",
  "supplier": "ObjectId",
  "location": "string",
  "images": ["string"],
  "status": "active|inactive|discontinued",
  "tags": ["string"],
  "statistics": {
    "totalSold": "number",
    "totalRevenue": "number",
    "avgRating": "number"
  },
  "aiInsights": {
    "demandForecast": {
      "nextMonth": "number",
      "confidence": "number",
      "trend": "string"
    }
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Category
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "color": "string",
  "icon": "string",
  "parentCategory": "ObjectId",
  "isActive": "boolean",
  "metadata": {
    "productCount": "number",
    "totalValue": "number"
  },
  "createdAt": "Date"
}
```

### Supplier
```json
{
  "_id": "ObjectId",
  "name": "string",
  "code": "string",
  "contact": {
    "email": "string",
    "phone": "string",
    "website": "string"
  },
  "performance": {
    "rating": "number",
    "totalOrders": "number",
    "onTimeDeliveries": "number"
  },
  "status": "active|inactive|blacklisted",
  "createdAt": "Date"
}
```

## Examples

### Create Product with Category and Supplier
```bash
# 1. Create Category
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices",
    "color": "bg-blue-500"
  }'

# 2. Create Supplier
curl -X POST http://localhost:5000/api/suppliers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Supplier Inc",
    "contact": {
      "email": "supplier@tech.com"
    }
  }'

# 3. Create Product
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Headphones",
    "price": 99.99,
    "cost": 45.00,
    "category": "CATEGORY_ID",
    "supplier": "SUPPLIER_ID",
    "quantity": 50
  }'
```

### Get Dashboard Analytics
```bash
curl -X GET "http://localhost:5000/api/analytics/dashboard?period=30d" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Generate AI Insights
```bash
curl -X POST http://localhost:5000/api/ai/forecast \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "30d"
  }'
```

## WebSocket Events (Future Enhancement)

- `inventory:low-stock` - Real-time low stock alerts
- `inventory:out-of-stock` - Out of stock notifications
- `ai:insight-generated` - New AI insights
- `analytics:update` - Real-time analytics updates

---

For more information or support, contact the development team or check the GitHub repository.