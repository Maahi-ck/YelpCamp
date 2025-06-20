# 🏕️ YelpCamp — Campground Booking and Social Platform

YelpCamp is a full-stack web application where users can explore and book campgrounds, share posts about their camping trips, and engage with a community featuring distinct roles: Users, Hosts, and Admins.

---

## 👥 User Roles & Capabilities

### 🧍 Users
- Browse and book campgrounds.
- Create and upload posts sharing their camping trip experiences.
- Follow other users to see their trip posts.
- Report inappropriate posts and users.

### 🏕️ Hosts
- Manage their campgrounds by creating, editing, and deleting listings.
- Submit campground modification requests to Admins for approval.
- Track the status of their campground requests.

### 🛡️ Admins
- Review and moderate reported posts and users.
- Approve or reject campground creation, edit, and deletion requests from Hosts.
- Unreport or delete flagged content.
- Send email notifications related to moderation and booking activities.

---

## ✨ Key Features

- Role-based access control for Users, Hosts, and Admins.
- Social features allowing users to post about their camping trips and follow others.
- Comprehensive reporting and moderation system for content and users.
- Booking system with automated email notifications.
- Host campground management with an approval workflow for modifications.
- Image uploads via Cloudinary.
- Geolocation and mapping powered by Mapbox.
- Security enhancements including input sanitization and secure HTTP headers.
- Custom-built user authentication system.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS templating engine, Bootstrap CSS
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Custom authentication logic
- **File Uploads:** Cloudinary API
- **Geocoding:** Mapbox SDK
- **Email Service:** Nodemailer
- **Security:** Helmet, express-mongo-sanitize
- **Session Store:** connect-mongo for persistent sessions

---

## 📁 Architecture Overview

- **Routes:** Separate modules for Users, Hosts, Admins, and Campgrounds.
- **Models:** Mongoose schemas for Users, Hosts, Admins, Posts, Campgrounds, Reviews, Trips, and Requests.
- **Views:** EJS templates rendering dynamic pages and forms.
- **Middleware:** Session management, flash messages, method override, input sanitization, and security headers.

---

## 🚦 Summary

YelpCamp is a comprehensive campground booking and social platform, combining robust role-based features, social posting capabilities, content moderation, and administrative approval workflows — all designed to create a safe, interactive outdoor community.

---
