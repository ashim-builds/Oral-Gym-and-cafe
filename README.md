# 🏋️‍♂️ Oral Gym and Cafe - Fullstack Mobile Application

Production-ready mobile application (Android + iOS) with Node.js/Express REST API, MySQL database, and **In-App Mobile Admin Management Suite** for **Oral Gym and Cafe** fitness supplements and performance nutrition.

---

## 🏛️ System Architecture

```
                                    ┌────────────────────────┐
                                    │    MySQL Database      │
                                    │   (Prisma ORM Engine)  │
                                    └───────────▲────────────┘
                                                │
                                    ┌───────────┴────────────┐
                                    │   Node.js + Express    │
                                    │   TypeScript REST API  │
                                    │   (Port: 5000)         │
                                    └───────────▲────────────┘
                                                │
                                    ┌───────────┴────────────────┐
                                    │  React Native Expo Mobile  │
                                    │  Android + iOS Application │
                                    │  • Customer Shop & Cart    │
                                    │  • In-App Admin Management │
                                    └────────────────────────────┘
```

---

## 📁 Project Directory Structure

```
.
├── backend/                  # Node.js + Express + TypeScript + Prisma MySQL REST API
│   ├── prisma/
│   │   ├── schema.prisma     # MySQL Schema (customers, products, orders, branches, otps, etc.)
│   │   └── seed.ts           # Rich fitness seed data (admin, branches, supplements, orders)
│   ├── src/
│   │   ├── config/           # Database & Environment configuration
│   │   ├── controllers/      # REST API Controllers (auth, products, orders, admin, etc.)
│   │   ├── middleware/       # JWT Auth, Guest Auth, Error handling & Rate limits
│   │   ├── routes/           # Express Route definitions
│   │   ├── services/         # OTP service (with provider abstraction), orders, products
│   │   ├── types/            # TypeScript interfaces & types
│   │   └── validators/       # Zod input validation schemas
│   ├── .env.example
│   └── package.json
│
└── mobile/                   # React Native + Expo + TypeScript Mobile Application
    ├── src/
    │   ├── components/       # Header (with global cart badge), ProductCard, Modals
    │   ├── constants/        # Theme tokens (dark gym aesthetics, electric orange)
    │   ├── context/          # AuthContext, CartContext, and AdminContext
    │   ├── navigation/       # AppNavigator (Tabs + Customer Stack + In-App Admin Stack)
    │   ├── screens/
    │   │   ├── auth/         # WelcomeScreen, PhoneInputScreen, OtpVerificationScreen, CompleteProfileScreen
    │   │   ├── shop/         # HomeScreen, ProductsScreen, ProductDetailScreen, AboutBusinessScreen, OwnerProfileScreen
    │   │   ├── branches/     # BranchesScreen (Online hub indicator + Map Directions)
    │   │   ├── cart/         # CartScreen, CheckoutScreen (COD / Cash on Pickup), OrderConfirmationScreen
    │   │   ├── orders/       # OrdersListScreen, OrderDetailScreen (Live status stepper)
    │   │   ├── profile/      # ProfileScreen & EditProfileModal + In-App Admin Access
    │   │   └── admin/        # In-App Mobile Admin Suite:
    │   │       ├── AdminLoginScreen.tsx
    │   │       ├── AdminDashboardScreen.tsx
    │   │       ├── AdminProductsScreen.tsx
    │   │       ├── AdminCategoriesScreen.tsx
    │   │       ├── AdminOrdersScreen.tsx
    │   │       ├── AdminBranchesScreen.tsx
    │   │       ├── AdminCustomersScreen.tsx
    │   │       ├── AdminBusinessOwnerScreen.tsx
    │   │       └── AdminSettingsScreen.tsx
    │   ├── services/         # Mobile API client & Admin Service with SecureStore token management
    │   └── types/            # TypeScript interfaces
    ├── App.tsx
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup (Node.js + MySQL)

```bash
cd backend

# Install dependencies
npm install

# Configure environment in .env (Ensure MySQL is running)
# DATABASE_URL="mysql://root:password@localhost:3306/oral_gym_db"

# Generate Prisma Client & Run Migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed database with supplements, branches, admin, and initial data
npx prisma db seed

# Start API server on http://localhost:5000
npm run dev
```

### 2. Mobile App Setup (React Native + Expo)

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Press `w` in the Expo terminal to open in a web browser, or scan the QR code with **Expo Go** on Android / iOS.

---

## 🔐 Credentials

### Admin Login (Inside Mobile App):
- **Access Route**: In the app, tap the **Profile Tab** -> **"In-App Admin Management"** (or **"Staff & Admin Portal Login"**)
- **Email**: `admin@oralgym.com`
- **Password**: `admin123`

### Demo Customer Phone Login:
- **Phone**: `9800000000` (or any valid 10-digit number)
- **OTP (Dev / Mock Mode)**: Check terminal logs or use mock verification

---

## 💳 Payment & Ordering Architecture
- **Payment Methods**: Cash on Delivery (COD) & Cash on Counter Pickup only.
- **Single Ordering Hub**: Only 1 active physical branch receives and processes online customer orders at a time.
- **Transactional Stock Validation**: All product prices and inventory stock checks are validated on the server via MySQL transactions during checkout.
