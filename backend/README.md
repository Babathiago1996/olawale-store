# Olawale Store - Backend API

Production-ready, enterprise-grade Inventory Management SaaS Backend built with Node.js, Express, and MongoDB.

## 🚀 Features

### Core Functionality
- ✅ **Authentication & Authorization**
  - JWT-based authentication (access + refresh tokens)
  - Role-Based Access Control (Admin, Staff, Auditor)
  - OTP-based password reset with email
  - Account locking after failed login attempts
  - Session management across multiple devices

- ✅ **Inventory Management**
  - Full CRUD operations for items
  - Multi-image support via Cloudinary
  - SKU auto-generation
  - Stock tracking and management
  - Low stock alerts
  - Restock history
  - Category organization

- ✅ **Sales Management**
  - Immutable transaction records
  - Multiple payment methods
  - Profit calculations
  - Sales analytics and reporting
  - Top-selling items tracking
  - Daily/Monthly reports

- ✅ **Alert System**
  - Automatic low-stock alerts
  - Out-of-stock notifications
  - Email notifications
  - Alert resolution workflow
  - Critical alert prioritization

- ✅ **Analytics & Reporting**
  - Executive dashboard
  - Sales statistics
  - Inventory analytics
  - User activity tracking
  - Comprehensive audit logs

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── auth.controller.js   # Authentication logic
│   ├── user.controller.js   # User management
│   ├── item.controller.js   # Inventory operations
│   ├── category.controller.js # Category management
│   ├── sale.controller.js   # Sales transactions
│   ├── alert.controller.js  # Alert management
│   └── dashboard.controller.js # Analytics
├── middleware/
│   └── auth.js              # Authentication & RBAC middleware
├── models/
│   ├── User.js              # User schema
│   ├── Item.js              # Inventory item schema
│   ├── Category.js          # Category schema
│   ├── Sale.js              # Sales transaction schema
│   ├── Alert.js             # Alert schema
│   └── AuditLog.js          # Audit trail schema
├── routes/
│   ├── auth.routes.js       # Authentication endpoints
│   ├── user.routes.js       # User endpoints
│   ├── item.routes.js       # Inventory endpoints
│   ├── category.routes.js   # Category endpoints
│   ├── sale.routes.js       # Sales endpoints
│   ├── alert.routes.js      # Alert endpoints
│   └── dashboard.routes.js  # Dashboard endpoints
├── services/
│   ├── cloudinary.service.js # Image upload service
│   └── email.service.js     # Email service
├── utils/
│   ├── AppError.js          # Error handling utilities
│   └── jwt.js               # JWT utilities
├── .env.example             # Environment variables template
├── package.json
└── server.js                # Application entry point
```

## 🛠️ Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm >= 9.0.0

### Setup

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/olawale-store
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
```

4. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "staff"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Request Password Reset OTP
```http
POST /api/v1/auth/request-password-reset
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password with OTP
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123"
}
```

### Item Endpoints

#### Create Item
```http
POST /api/v1/items
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

{
  "name": "Product Name",
  "description": "Product Description",
  "category": "categoryId",
  "costPrice": 5000,
  "sellingPrice": 7500,
  "stockQuantity": 100,
  "lowStockThreshold": 10,
  "images": [file1, file2]
}
```

#### Get All Items
```http
GET /api/v1/items?page=1&limit=20&search=product&category=categoryId
Authorization: Bearer {accessToken}
```

#### Restock Item
```http
POST /api/v1/items/{itemId}/restock
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "quantity": 50,
  "costPrice": 5200,
  "supplier": "Supplier Name",
  "notes": "Restock notes"
}
```

### Sale Endpoints

#### Create Sale
```http
POST /api/v1/sales
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "items": [
    {
      "item": "itemId",
      "quantity": 2,
      "unitPrice": 7500
    }
  ],
  "paymentMethod": "cash",
  "customer": {
    "name": "Customer Name",
    "phone": "+234..."
  }
}
```

#### Get Sales Statistics
```http
GET /api/v1/sales/statistics?period=month
Authorization: Bearer {accessToken}
```

### Dashboard Endpoints

#### Get Dashboard Overview
```http
GET /api/v1/dashboard/overview
Authorization: Bearer {accessToken}
```

Response includes:
- Total inventory value (₦)
- Today's sales and revenue
- Low stock alerts
- Recent transactions

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Tokens**: Separate access and refresh tokens
- **Rate Limiting**: Protection against brute force attacks
- **Input Sanitization**: MongoDB injection prevention
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Account Locking**: After 5 failed login attempts

## 📊 Database Schema

### User Model
- Authentication & profile information
- Role-based permissions
- Refresh token management
- Login attempt tracking

### Item Model
- Product details
- Multi-image support
- Stock tracking
- Restock history
- Automatic stock status calculation

### Sale Model
- Immutable transaction records
- Item details snapshot
- Profit calculations
- Payment tracking

### Alert Model
- Type-based alerts
- Severity levels
- Resolution workflow
- Notification tracking

### AuditLog Model
- Complete system activity tracking
- User action history
- Security event logging

## 🚀 Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for large datasets
- Aggregation pipelines for analytics
- Cloudinary CDN for image delivery
- Response compression
- Connection pooling

## 🧪 Testing

Run tests:
```bash
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NODE_ENV | Environment (development/production) | Yes |
| PORT | Server port | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_ACCESS_SECRET | JWT access token secret | Yes |
| JWT_REFRESH_SECRET | JWT refresh token secret | Yes |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | Yes |
| CLOUDINARY_API_KEY | Cloudinary API key | Yes |
| CLOUDINARY_API_SECRET | Cloudinary API secret | Yes |
| EMAIL_USER | Email service username | Yes |
| EMAIL_PASSWORD | Email service password | Yes |

## 🔄 API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "status": "fail",
  "message": "Error message",
  "error": {
    // Error details (development only)
  }
}
```

## 📈 Monitoring & Logging

- Request logging with Morgan
- Audit logs for all critical operations
- Error tracking and logging
- Performance monitoring

## 🌐 Currency

All monetary values are in **Nigerian Naira (₦)**

## 📄 License

MIT

## 👨‍💻 Support

For support, email support@olawalestore.com