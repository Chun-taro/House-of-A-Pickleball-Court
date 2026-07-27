# House of A's Pickleball Court (Full MERN Stack)

A dedicated MERN (MongoDB, Express, React, Node.js) reservation system for **House of A's Pickleball Court** in Linabo, Malaybalay City, Bukidnon.

---

## 📍 Venue Overview

- **Venue Name**: House of A’s Pickleball Court
- **Location**: Purok-1, Linabo, Malaybalay City, Bukidnon
- **Description**: Family-owned outdoor covered single court venue for pickleball training, friendly matches, and open play.
- **Operating Hours**: 5:00 AM – 11:00 PM (Daily)
- **Court Rates (Exclusive Reservations)**:
  - 5:00 AM – 5:00 PM: **₱150.00 / Hour**
  - 5:00 PM – 11:00 PM: **₱200.00 / Hour**
- **Open Court Free Play Promo**:
  - Schedule: **5:00 AM – 1:00 PM**
  - Price: **₱70.00 per person** (Enjoy up to 8 hours of play)
  - Player Limit: **16 players max**
  - Grouping: Play with your own group or join other morning players on court
  - Payment: **Cash only** at the house counter
- **Amenities & Gear**:
  - Road Parking
  - Clean Restroom
  - Paddle and Balls for rent or for sale
  - Keychains for sale
  - Free Wi-Fi

---

## 🛠️ Architecture

- **Backend (`/backend`)**: Node.js + Express.js REST API with MongoDB (Mongoose ODM), JWT Authentication, and Role-Based Access Control (`customer`, `staff`, `admin`).
- **Frontend (`/frontend`)**: React 18 + Vite + Tailwind CSS v4 + Lucide React Icons.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```

### 2. Seed Database
Make sure MongoDB is running locally (`mongodb://127.0.0.1:27017/sports_center_db`), then seed initial data:
```bash
npm run seed
```

### 3. Start Application
Launch both Backend (Port 5000) and Frontend (Port 5173) concurrently:
```bash
npm run dev
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@houseofas.com` | `password123` |
| **Staff Member** | `staff@houseofas.com` | `password123` |
| **Customer** | `player@gmail.com` | `password123` |
