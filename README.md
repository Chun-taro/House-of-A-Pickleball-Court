# House of A's Pickleball Court (Full MERN Stack)

A dedicated MERN (MongoDB, Express, React, Node.js) reservation system for **House of A's Pickleball Court** in Linabo, Malaybalay City, Bukidnon.

---

## 📍 Venue Overview

- **Venue Name**: House of A’s Pickleball Court
- **Location**: Purok-1, Linabo, Malaybalay City, Bukidnon
- **Description**: Family-owned outdoor covered single court venue for pickleball training, friendly matches, and open play.
- **Operating Hours**: 6:00 AM – 10:00 PM (Daily)
- **Hourly Rate**: ₱150.00 / Hour

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
