# 🏕️ YelpCamp — Campground Booking and Social Platform

Welcome to **YelpCamp**, a full-stack web platform where outdoor enthusiasts can explore campgrounds, book adventures, share stories, and connect with a community of campers, hosts, and admins.

> 🚀 Built using **Node.js**, **Express**, **MongoDB**, and **EJS**, YelpCamp provides rich features tailored to each user role.

---

## 🔑 Roles & Permissions

### 👤 Users
- 🔍 Browse & book campgrounds
- 📸 Post trip experiences with images
- 👥 Follow other campers
- 🚩 Report inappropriate content or users

### 🏕️ Hosts
- 🛠️ Create, edit, delete campgrounds
- 📨 Submit campground requests (create/update/delete) to Admins
- 📋 Track status of campground requests

### 🛡️ Admins
- 🔎 Review & act on reported content
- ✅ Approve/reject campground requests
- 📧 Send moderation/booking emails
- 🧹 Moderate flagged content & users

---

## 🌟 Key Features

- 🧑‍💻 **Role-based access control** (Users, Hosts, Admins)
- 🧭 **Campground discovery** with photos, geolocation, and maps
- 🧵 **Social feed**: Post camping memories & follow others
- 🚀 **Booking system** with automated email notifications
- ☁️ **Cloudinary** integration for image uploads
- 🗺️ **Mapbox** for interactive geolocation & campground maps
- 🔐 Security best practices: Helmet, Mongo Sanitize, etc.
- 📧 OTP-based Email Verification & Notifications via **Nodemailer**

---

## 📸 Screenshots

You can view screenshots of the project [here](https://drive.google.com/drive/folders/10h3CWRHN-iiAMXz9leIxqRRVdMXwUpwP?usp=drive_link).

> These screenshots showcase key features of the YelpCamp application .

---

## 🧰 Tech Stack

| Category       | Technologies                                     |
|----------------|--------------------------------------------------|
| Backend        | Node.js, Express.js                              |
| Frontend       | EJS Templates, Bootstrap 5                       |
| Database       | MongoDB with Mongoose ODM                        |
| Authentication | Custom auth with session, roles, bcrypt         |
| Geolocation    | Mapbox API                                       |
| Image Uploads  | Cloudinary                                       |
| Email Services | Nodemailer (for OTP, booking, and alerts)        |
| Security       | Helmet, express-mongo-sanitize, cookie-session   |
| Sessions       | connect-mongo (MongoDB session persistence)      |

---

## 🗂️ Project Structure

```
YelpCamp/
├── models/              # Mongoose schemas: Users, Posts, Campgrounds, etc.
├── routes/              # Modular routes: users, hosts, admins, campgrounds
├── views/               # EJS templates and partials
├── public/              # CSS, JS, images
├── middleware/          # Custom middleware for roles, auth, etc.
├── controllers/         # Route logic, DB operations
├── utils/               # Email helpers, Mapbox integration
├── app.js               # Express configuration
└── .env                 # Environment variables
```

---

## 🚀 Getting Started

1. **Clone the Repo**
   ```bash
   git clone https://github.com/yourusername/yelpcamp.git
   cd yelpcamp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root:
   ```env
   DB_URL=mongodb://localhost:27017/yelpcamp
   CLOUDINARY_CLOUD_NAME=your_cloud
   CLOUDINARY_KEY=your_key
   CLOUDINARY_SECRET=your_secret
   MAPBOX_TOKEN=your_mapbox_token
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   SESSION_SECRET=your_secret
   ```

4. **Run the App**
   ```bash
   npm start
   ```

5. **Open in Browser**
   ```
   http://localhost:3000
   ```

---

## 🧪 Seed Users & Sample Data

### ✳️ Create Hashed Passwords
```js
const bcrypt = require('bcrypt');
bcrypt.hash('password123', 12).then(console.log);
```

### 🛠️ Sample Admin/Host Insertion (MongoDB)
```js
db.admins.insertOne({
  name: "Admin One",
  email: "admin@example.com",
  password: "<hashed_password>"
});

db.hosts.insertOne({
  name: "Host One",
  email: "host@example.com",
  password: "<hashed_password>"
});
```

---

## 📬 API Endpoints Overview

### 🌐 Movies & Posts
- `GET /campgrounds` – List all campgrounds
- `GET /campgrounds/:id` – View specific campground
- `POST /posts` – Add new trip post
- `GET /posts/:id` – View post detail

### 🎟️ Booking & Trip Flow
- `POST /book/:campgroundId` – Book a trip
- `GET /bookings` – See your bookings
- `DELETE /bookings/:id` – Cancel a booking

### 🔧 Host Requests
- `POST /requests/campground` – New campground request
- `PATCH /requests/:id` – Update request
- `GET /host/dashboard` – View your requests

---

## 🔐 Security Highlights

- ✅ CSRF & XSS Protection (Helmet, Sanitization)
- 🔒 Passwords hashed with bcrypt
- 🔐 Sessions stored securely in Mongo
- 🛡️ Rate limiting and validation for sensitive routes

---



## 📢 Contributors

Made with ❤️ by [Chennakeshava] 

---
