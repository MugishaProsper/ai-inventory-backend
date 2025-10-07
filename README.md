# 🚀 Inventrika - AI-Powered Inventory Management Backend

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.18+-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-6.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
</div>

<div align="center">
  <h3>A comprehensive REST API backend for AI-powered inventory management with advanced analytics and intelligent insights</h3>
  <p>Built with Node.js, Express, MongoDB, and cutting-edge AI algorithms</p>
</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🔧 Configuration](#-configuration)
- [📚 API Documentation](#-api-documentation)
- [🤖 AI Features](#-ai-features)
- [🔒 Security](#-security)
- [📊 Database Schema](#-database-schema)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

## ✨ Features

### 🎛️ **Core Inventory Management**
- **Product Management** - Complete CRUD operations with advanced filtering
- **Category Management** - Hierarchical categories with color coding and analytics
- **Supplier Management** - Performance tracking and rating system
- **Stock Movements** - Detailed tracking of all inventory movements
- **Multi-location Support** - Track products across different locations

### 🤖 **AI-Powered Capabilities**
- **Demand Forecasting** - Predict future inventory needs using time series analysis
- **Smart Reorder Suggestions** - AI-driven restocking recommendations
- **Trend Analysis** - Identify sales patterns and market trends
- **Anomaly Detection** - Flag unusual inventory movements and patterns
- **ABC Analysis** - Automatic product classification by value and importance
- **Price Optimization** - AI-suggested pricing based on demand elasticity

### 📊 **Advanced Analytics**
- **Real-time Dashboard** - Live inventory statistics and KPIs
- **Sales Analytics** - Revenue trends and performance metrics
- **Supplier Performance** - Delivery, quality, and reliability tracking
- **Inventory Turnover** - Stock rotation and efficiency analysis
- **Profit Margin Analysis** - Product profitability insights

### 🚨 **Smart Alerting System**
- **Low Stock Alerts** - Automatic notifications when stock runs low
- **Out of Stock Warnings** - Critical inventory shortages
- **Overstock Notifications** - Excess inventory alerts
- **Expiry Tracking** - Product expiration date monitoring
- **Custom Alert Rules** - User-defined alert conditions

### 🔐 **Security & Performance**
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access** - Granular permission system
- **Rate Limiting** - API abuse prevention
- **Data Validation** - Comprehensive input validation with Joi
- **Error Handling** - Standardized error responses
- **Request Logging** - Detailed API usage tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│           (React Web App, Mobile App, etc.)                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   API Gateway                               │
│            (Express.js with Middleware)                     │
├─────────────────────────────────────────────────────────────┤
│  Auth │ Validation │ Rate Limiting │ CORS │ Security       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Route Handlers                              │
├─────────┬─────────┬─────────┬─────────┬─────────┬──────────┤
│Products │Inventory│Categories│Suppliers│Analytics│AI Engine │
└─────────┴─────────┴─────────┴─────────┴─────────┴──────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Business Logic Layer                         │
├─────────────────────────────────────────────────────────────┤
│        Controllers & Services & AI Algorithms              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Data Access Layer                          │
├─────────────────────────────────────────────────────────────┤
│              MongoDB with Mongoose ODM                     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MugishaProsper/ai-inventory-backend.git
cd ai-inventory-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
``` 

5. **Start the development server**
```bash
npm run dev
```

6. **Verify installation**
```bash
curl http://localhost:5000/api/health
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/inventrika_db
DB_NAME=inventrika_db

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Client Configuration
CLIENT_URL=http://localhost:3000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER="nelsonprox92@gmail.com"
EMAIL_PASS="nelsonprox92@gmail.com"
EMAIL_FROM="support@inventrika.com"

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AI Configuration
AI_CONFIDENCE_THRESHOLD=0.7
FORECAST_DEFAULT_PERIOD=30
```

## 🔧 Configuration

### Database Configuration
The application uses MongoDB with Mongoose ODM. Database configuration is handled in `config/db.config.js`.

### Authentication Configuration
JWT-based authentication with configurable token expiration and refresh tokens.

### AI Configuration
Configurable AI parameters for forecasting, anomaly detection, and insights generation.

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require a JWT token:
```bash
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Products
- `GET /api/products` - Get all products (with filtering & pagination)
- `POST /api/products` - Create new product 🔒
- `GET /api/products/:id` - Get product details 🔒
- `PUT /api/products/:id` - Update product 🔒
- `DELETE /api/products/:id` - Delete product 🔒
- `PATCH /api/products/:id/stock` - Update stock quantity 🔒

#### Inventory
- `GET /api/inventory` - Get inventory overview 🔒
- `POST /api/inventory` - Add product to inventory 🔒
- `DELETE /api/inventory` - Remove product from inventory 🔒
- `GET /api/inventory/alerts` - Get inventory alerts 🔒
- `POST /api/inventory/transfer` - Transfer between locations 🔒

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics 🔒
- `GET /api/analytics/inventory` - Inventory analytics 🔒
- `GET /api/analytics/sales` - Sales analytics 🔒
- `GET /api/analytics/suppliers` - Supplier performance 🔒

#### AI Features
- `GET /api/ai/insights` - Get AI insights 🔒
- `POST /api/ai/forecast` - Generate demand forecast 🔒
- `POST /api/ai/reorder-suggestions` - Get reorder suggestions 🔒
- `POST /api/ai/anomalies` - Detect anomalies 🔒
- `GET /api/ai/trends` - Analyze trends 🔒

🔒 = Requires Authentication

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## 🤖 AI Features

### Demand Forecasting
Uses exponential smoothing and seasonal decomposition to predict future demand:

```javascript
// Generate 30-day demand forecast
POST /api/ai/forecast
{
  "productIds": ["product1", "product2"],
  "period": "30d"
}
```

### Anomaly Detection
Statistical analysis to identify unusual patterns:

```javascript
// Detect anomalies with medium sensitivity
POST /api/ai/anomalies
{
  "sensitivity": "medium"
}
```

### Smart Reorder Suggestions
AI-driven inventory optimization:

```javascript
// Get intelligent reorder suggestions
POST /api/ai/reorder-suggestions
{
  "threshold": "auto"
}
```

### AI Algorithms Used
- **Exponential Smoothing** - For demand forecasting
- **Moving Averages** - For trend analysis
- **Z-Score Analysis** - For anomaly detection
- **ABC Classification** - For inventory categorization
- **Economic Order Quantity (EOQ)** - For optimal order quantities

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Password hashing using bcrypt
- Role-based access control

### Security Middleware
- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Rate limiting to prevent abuse
- Input validation and sanitization
- MongoDB injection prevention

### Data Protection
- Sensitive data encryption
- Secure cookie handling
- Environment variable protection
- SQL injection prevention (via Mongoose)

## 📊 Database Schema

### Core Collections

#### Products
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  name: String,
  sku: String,
  price: Number,
  cost: Number,
  quantity: Number,
  minStock: Number,
  maxStock: Number,
  category: ObjectId,
  supplier: ObjectId,
  aiInsights: {
    demandForecast: {
      nextMonth: Number,
      confidence: Number,
      trend: String
    }
  },
  statistics: {
    totalSold: Number,
    totalRevenue: Number,
    avgRating: Number
  }
}
```

#### Inventory
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  name: String,
  products: [{
    product: ObjectId,
    quantity: Number,
    reservedQuantity: Number,
    availableQuantity: Number,
    location: String
  }],
  statistics: {
    totalProducts: Number,
    totalValue: Number,
    lowStockItems: Number,
    outOfStockItems: Number
  },
  alerts: [{
    type: String,
    product: ObjectId,
    message: String,
    severity: String,
    isRead: Boolean
  }]
}
```

#### AI Insights
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  type: String,
  title: String,
  description: String,
  confidence: Number,
  priority: String,
  status: String,
  actionable: Boolean,
  products: [ObjectId],
  data: {
    forecast: Object,
    reorderSuggestion: Object,
    trendAnalysis: Object,
    anomaly: Object
  }
}
```

### Indexes
- Text indexes for search functionality
- Compound indexes for performance optimization
- TTL indexes for automatic cleanup

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm test -- --grep "Product"
```

### Test Structure
```
tests/
├── unit/
│   ├── models/
│   ├── controllers/
│   └── utils/
├── integration/
│   ├── routes/
│   └── database/
└── fixtures/
    └── sample-data.js
```

### Testing Tools
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **MongoDB Memory Server** - In-memory database for tests
- **Factory Bot** - Test data generation

## 🚀 Deployment

### Docker Deployment

1. **Build Docker image**
```bash
docker build -t inventrika-api .
```

2. **Run with Docker Compose**
```bash
docker-compose up -d
```

### Production Deployment

1. **Environment Setup**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/inventrika
```

2. **Process Management**
```bash
# Using PM2
npm install -g pm2
pm2 start ecosystem.config.js

# Using systemd
sudo systemctl start inventrika-api
```

### Monitoring & Logging
- Winston for structured logging
- Health check endpoints
- Performance monitoring with APM tools
- Error tracking and alerting

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**
4. **Add tests for new functionality**
5. **Run tests and linting**
```bash
npm test
npm run lint
```

6. **Commit your changes**
```bash
git commit -m 'Add some amazing feature'
```

7. **Push to the branch**
```bash
git push origin feature/amazing-feature
```

8. **Open a Pull Request**

### Code Style
- ESLint configuration for code quality
- Prettier for code formatting
- Conventional commits for clear history
- JSDoc comments for documentation

### Project Structure
```
src/
├── controllers/     # Route handlers and business logic
├── models/         # Database models and schemas
├── routes/         # API route definitions
├── middlewares/    # Custom middleware functions
├── utils/          # Utility functions and helpers
├── config/         # Configuration files
└── services/       # External service integrations
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- MongoDB team for the flexible database solution
- The open-source community for amazing packages and tools

---

<div align="center">
  <p>Built with 🗿 by the Inventrika Team</p>
  <p>
    <a href="#-table-of-contents">Back to Top</a> •
    <a href="./API_DOCUMENTATION.md">API Docs</a> •
    <a href="https://github.com/your-username/inventrika-backend/issues">Report Bug</a> •
    <a href="https://github.com/your-username/inventrika-backend/issues">Request Feature</a>
  </p>
</div>