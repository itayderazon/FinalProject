# RecommendationAlgo - Smart Nutrition & Menu Planning Platform

A comprehensive nutrition and meal planning application that helps users create personalized menus based on their dietary goals while finding the best prices across multiple supermarkets.

## 🏗️ **Architecture Overview**

The application follows a microservices architecture:

- **Node.js API Server** - Main backend handling authentication, data management, and business logic
- **Python FastAPI Server** - Advanced algorithms for meal generation and nutrition optimization
- **React Frontend** - User-facing web application with modern UI/UX
- **PostgreSQL Database** - Comprehensive data storage for products, nutrition, pricing, and user data

## 🚀 **Features**

### Core Functionality
- **User Authentication & Profiles** - Secure JWT-based authentication with personalized nutrition profiles
- **Product Catalog** - Comprehensive database of products with nutrition information and real-time pricing
- **Menu Generation** - AI-powered meal planning based on dietary goals and preferences
- **Price Comparison** - Multi-supermarket price tracking and optimization
- **Nutrition Tracking** - Daily nutrition logging and progress monitoring

### Advanced Features
- **Smart Recommendations** - Machine learning algorithms for personalized food suggestions
- **Multi-Store Shopping Lists** - Optimized shopping routes and price comparisons
- **Template Management** - Save and reuse successful meal plans
- **Allergen Management** - Comprehensive allergen filtering and warnings

## 📋 **Prerequisites**

- **Node.js** 16.0+ 
- **Python** 3.8+
- **PostgreSQL** 13+
- **npm/yarn** for package management
- **Docker** (optional, for containerized development)

## 🛠️ **Installation & Setup**

### 1. Clone the Repository
```bash
git clone [repository-url]
cd FinalProject
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nutrition_app
POSTGRES_USER=nutrition_user
POSTGRES_PASSWORD=your-secure-password

# Node.js Server
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# API URLs
PYTHON_SERVER_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### 3. Database Setup

#### Option A: Docker (Recommended)
```bash
cd database
docker-compose up -d
```

#### Option B: Local PostgreSQL
```bash
# Create database and user
createdb nutrition_app
psql nutrition_app < database/schema.sql
```

### 4. Install Dependencies & Start Services

#### Backend Services
```bash
# Node.js Server
cd NodeServer
npm install
npm run dev  # Starts on port 3001

# Python Server (in new terminal)
cd PythonServer
pip install -r requirements.txt
python -m src.api.server  # Starts on port 8000
```

#### Frontend
```bash
# React Application (in new terminal)
cd Web
npm install
npm run dev  # Starts on port 5173
```

### 5. Load Initial Data
```bash
cd database
npm run seed  # Load product and category data
```

## 🔧 **Development**

### Project Structure
```
FinalProject/
├── NodeServer/          # Express.js API server
│   ├── controllers/     # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API endpoints  
│   ├── middleware/     # Authentication, validation, etc.
│   └── utils/          # Helper functions
├── PythonServer/        # FastAPI algorithm server
│   ├── src/api/        # API routes and models
│   ├── src/algorithm/  # Menu generation algorithms
│   ├── src/services/   # Business logic services
│   └── src/models/     # Data models
├── Web/                # React frontend
│   ├── src/components/ # Reusable UI components
│   ├── src/pages/      # Page components
│   ├── src/services/   # API communication
│   └── src/hooks/      # Custom React hooks
├── database/           # Database setup and migrations
└── data/              # Data processing and seeding
```

### API Documentation

#### Node.js Server Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/products` - Product catalog with pagination
- `GET /api/products/search` - Advanced product search
- `POST /api/daily-menus` - Create daily menu plans
- `GET /api/nutrition/logs` - User nutrition tracking

#### Python Server Endpoints  
- `POST /api/nutrition/generate-menu` - AI-powered menu generation
- `GET /api/catalog/search` - Advanced catalog search
- `POST /api/catalog/add-product` - Add products to menu

### Database Schema

Key tables:
- `products` - Product information with nutrition data
- `price_history` - Multi-supermarket pricing data
- `users` - User accounts and profiles
- `daily_menus` - User meal plans
- `nutrition_logs` - Daily nutrition tracking

## 🧪 **Testing**

```bash
# Node.js Server Tests
cd NodeServer
npm test

# Python Server Tests
cd PythonServer
python -m pytest

# Frontend Tests
cd Web
npm test
```

## 🚀 **Deployment**

### Production Environment Variables
```bash
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
POSTGRES_PASSWORD=secure-production-password
CORS_ORIGINS=https://yourdomain.com
```

### Docker Deployment
```bash
# Build and run all services
docker-compose -f docker-compose.production.yml up -d
```

## 📊 **Performance Considerations**

- **Database Indexing** - Optimized queries with proper indexing
- **Connection Pooling** - PostgreSQL connection pool management
- **Rate Limiting** - API rate limiting to prevent abuse
- **Caching** - Redis caching for frequently accessed data
- **Image Optimization** - Optimized product image serving
- **Pagination** - All list endpoints include pagination

## 🔒 **Security Features**

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable rounds
- **Input Validation** - Comprehensive request validation 
- **SQL Injection Prevention** - Parameterized queries
- **Rate Limiting** - Per-endpoint and user-based limits
- **CORS Configuration** - Environment-based CORS setup

## 📝 **API Response Formats**

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE",
  "details": { ... }
}
```

## 🐛 **Common Issues & Solutions**

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo service postgresql status

# Reset database
cd database && npm run reset-db
```

### Port Conflicts
- Node.js Server: Default port 3001
- Python Server: Default port 8000  
- React Frontend: Default port 5173
- PostgreSQL: Default port 5432

