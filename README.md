# Executive Management Performance Dashboard App

A full-stack enterprise mobile and web application designed for executive management tracking, directive monitoring, two-year rolling work plans, personal calendar management, and minutes of meeting (MoM) repository.

Built with **React Native (Expo)**, **NativeWind / Tailwind CSS**, **Node.js (Express)**, and **MongoDB**.

---

## 🌟 Key Features

- **📊 Management & User Dashboards:** Real-time metrics, interactive status cards, monthly/yearly directive filters, and analytical trend charts.
- **📅 Personal Calendar & Task Tracker:** Custom interactive monthly calendar, daily task assignment, completion tracking, and role-based permissions (view-only for officers' tasks).
- **💬 Directives Management System:**
  - Create new directives with attachment files.
  - Separate **Pending**, **Endorsed**, and **Closed** directive screens.
  - Interactive reply threads supporting multi-file attachments and downloads.
- **📝 Member's Two-Year Rolling Work Plan:**
  - Activity area section management with quarterly rich-text editing (2025–2026).
  - Custom PDF report generation and printing (`expo-print`).
  - Draft saving and final submission lock system.
- **📑 Minutes of Meeting (MoM) Repository:** Searchable archive of meeting minutes with PDF attachments and custom enterprise success/confirmation modals.
- **🔐 Multi-Role Access Control:** Role-tailored menu options and permission layers for `Admin`, `User`, `Management`, and `jManagement`.
- **🎨 Modern Enterprise UI Design:** Dark Green `#0D4429` corporate branding, soft badges, smooth animations, and custom modal popups.

---

## 🛠️ Technology Stack

### **Frontend (Mobile App)**
- **Framework:** React Native / Expo (v54)
- **Styling:** NativeWind (v4) / Tailwind CSS
- **Navigation:** React Navigation (Native Stack, Bottom Tabs)
- **Icons & UI:** `@expo/vector-icons`, `react-native-calendars`, `react-native-pell-rich-editor`
- **Networking:** Async Storage, Expo Document Picker, Expo Print, Expo Linking

### **Backend (API Server)**
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js (v5)
- **Database:** MongoDB (via Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens) & `bcryptjs` password hashing
- **File Uploads:** Multer (disk storage for attachments)

---

## 📁 Repository Structure

```
PerformanceDashboardApp/
├── backend/                  # Express.js REST API Server
│   ├── index.js              # Entry point
│   ├── src/
│   │   ├── app.js            # App configuration & middleware
│   │   ├── config/           # Database connection & seed script
│   │   ├── controllers/      # Business logic handlers
│   │   ├── middleware/       # Auth & JWT middlewares
│   │   ├── models/           # Mongoose schemas (User, Task, Directive, MoM, TwoYearPlan)
│   │   ├── routes/           # API Endpoints
│   │   └── uploads/          # Local file storage for directives & MoMs
│   └── package.json
│
├── frontend/                 # React Native Expo Application
│   ├── assets/               # Branding logos and static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components & Side Menu navigation
│   │   ├── features/         # Feature modules (Auth, Calendar, Dashboard, Directives, MoMs, TwoYearPlan)
│   │   └── utils/            # Helper functions & API base URL setup
│   └── package.json
└── README.md
```

---

## 🚀 How to Run Locally

### **Prerequisites**
Make sure you have the following installed on your development machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (Local server running on port `27017` OR a MongoDB Atlas cluster URI)
- Expo Go App on your mobile device (Android/iOS) OR Android Studio Emulator / Xcode Simulator.

---

### **Step 1: Backend Setup & Execution**

1. Open terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/performance-dashboard
   JWT_SECRET=your_secret_jwt_key_12345
   ```

4. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000` (or `http://0.0.0.0:5000`) and auto-seed default test accounts if the database is empty.*

---

### **Step 2: Frontend Setup & Execution**

1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure API Base URL:
   Open `frontend/src/utils/utils.js` and verify/set `API_BASE_URL`:
   - For physical device testing over Wi-Fi, ensure your phone and computer are on the **same Wi-Fi network**.
   - `utils.js` automatically detects your Metro host IP address.

4. Start the Expo development server:
   ```bash
   npx expo start
   ```

5. Launch on device/emulator:
   - **Expo Go App:** Scan the QR code displayed in the terminal using Expo Go (Android) or Camera App (iOS).
   - **Android Emulator:** Press `a` in the terminal.
   - **iOS Simulator:** Press `i` in the terminal.
   - **Web Browser:** Press `w` in the terminal.

---

## 🔐 Default Seed Credentials

When starting the backend for the first time, default accounts are seeded into MongoDB:

| Role | Email | Password |
| :--- | :--- | :--- |
| **User** | `user@example.com` | `password123` |
| **Management** | `management@example.com` | `management123` |
| **Admin** | `admin@example.com` | `password123` |

---

## 🌐 Production Deployment Guide

### **1. Deploying the Backend API (Ubuntu / VPS Server)**

1. **Host Backend on VPS (DigitalOcean / AWS EC2 / Hetzner):**
   - Clone project repository on the server.
   - Install Node.js and PM2 globally: `npm install -g pm2`.

2. **Configure `.env` for Production:**
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<dbuser>:<dbpassword>@cluster.mongodb.net/performance-dashboard?retryWrites=true&w=majority
   JWT_SECRET=production_super_secret_jwt_key
   ```

3. **Start Process with PM2:**
   ```bash
   cd backend
   npm install --production
   pm2 start index.js --name "dashboard-backend"
   pm2 save
   ```

4. **Nginx Reverse Proxy & SSL (HTTPS):**
   - Point your domain/subdomain DNS (e.g., `api.yourdomain.com`) to the VPS IP address.
   - Configure Nginx to proxy `https://api.yourdomain.com` to `http://127.0.0.1:5000`.
   - Obtain SSL via Certbot: `sudo certbot --nginx -d api.yourdomain.com`.

---

### **2. Building & Deploying the Mobile App (Android APK / AAB)**

1. **Update API Base URL:**
   In `frontend/src/utils/utils.js`, change `API_BASE_URL` to your production backend domain:
   ```javascript
   export const API_BASE_URL = "https://api.yourdomain.com/";
   ```

2. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

3. **Configure EAS Build:**
   ```bash
   cd frontend
   eas build:configure
   ```

4. **Build APK for Direct Distribution:**
   ```bash
   eas build -p android --profile preview
   ```
   *Download the generated standalone `.apk` file once Expo cloud build completes.*

5. **Build Android App Bundle (AAB) for Google Play Store:**
   ```bash
   eas build -p android --profile production
   ```

---

## 🤝 Shared Database Integration Notice

If connecting this application to an existing live Web application's MongoDB database:
1. Ensure both backends share the exact same `MONGO_URI`.
2. Ensure collection names (`users`, `tasks`, `directives`, `moms`, `twoyearplans`) match.
3. Ensure password encryption uses identical `bcrypt` hashing with matching salt rounds.
4. Set matching `JWT_SECRET` in both environment configurations.
