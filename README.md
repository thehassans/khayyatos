# SaaS Tailor - Professional Tailoring Management System

A comprehensive SaaS platform for managing tailoring businesses with multi-language support, worker management, customer tracking, and WhatsApp integration.

## Features

### Admin Panel
- Create and manage user accounts (shop owners)
- Subscription management (7-day trial, 1 year, lifetime)
- Dashboard with all users statistics
- Login as any user for support

### User Panel (Shop Owner)
- **Dashboard**: Overview of business metrics
- **Workers**: Create and manage workers with per-stitching or salary payment
- **Worker Amounts**: Track and send payments to workers
- **Customers**: Manage customers with measurements
- **Stitchings**: Create orders, assign to workers, track status
- **Customer Loyalty**: View top customers and spending history
- **WhatsApp Integration**: Send automated notifications
- **Settings**: Logo, language, receipt configuration

### Worker Panel
- **Dashboard**: View assigned work and earnings
- **Stitchings**: View assigned orders with measurements
- **Amounts**: Track earnings and payments received
- **Settings**: Language preferences

### Multi-Language Support
- English
- العربية (Arabic)
- हिन्दी (Hindi)
- اردو (Urdu)
- বাংলা (Bengali)

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js, Tailwind CSS
- **Authentication**: JWT
- **WhatsApp**: whatsapp-web.js

## Installation

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm start
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
CUSTOM_DOMAIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
MONGODB_URI=mongodb://localhost:27017/saas_tailor
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=30d
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=Admin@123456
```

### Frontend (.env)
```
REACT_APP_API_URL=https://yourdomain.com/api
```

## Plesk Deployment Guide

### 1. Create Node.js Application in Plesk
- Go to Domains → your domain → Node.js
- Set Application Root to the backend folder
- Set Application Startup File to `server.js`
- Set Node.js version to 18.x or higher

### 2. Configure Environment Variables
In Plesk Node.js settings, add all environment variables from `.env.example`

### 3. Build Frontend
```bash
cd frontend
npm install
npm run build
```

### 4. Deploy Files
- Upload `backend` folder to your domain's root
- Upload `frontend/build` contents to the frontend serving location
- Or configure backend to serve frontend (already configured in server.js)

### 5. Configure MongoDB
- Install MongoDB on your server or use MongoDB Atlas
- Update MONGODB_URI in environment variables

### 6. Start Application
- In Plesk Node.js, click "Restart App"
- Enable "Application Mode" as Production

### 7. SSL Configuration
- Enable SSL/TLS certificate in Plesk
- Ensure CUSTOM_DOMAIN uses https://

## Default Credentials

**Admin Login:**
- Email: admin@yourdomain.com (or your configured email)
- Password: Admin@123456 (change this immediately!)

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/user/login` - User login
- `POST /api/auth/worker/login` - Worker login
- `GET /api/auth/verify` - Verify token

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/login-as` - Login as user

### User
- `GET /api/user/dashboard` - Dashboard
- `GET /api/user/profile` - Profile

### Workers, Customers, Stitchings, Payments, Settings, WhatsApp
See route files for complete API documentation.

## License

MIT License

## Support

For support, please contact the administrator.
