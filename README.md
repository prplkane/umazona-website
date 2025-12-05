# Umazona Trivia Website

The official website for **Umazona** — a premier trivia/quiz experience group. This is a full-stack web application featuring event management, team member profiles, media galleries, corporate hire requests, and an admin panel for content management.

Built with **React** (frontend), **Express.js** (backend), **SQLite** (database), and **Google Drive API** (media integration).

---

## ✨ Features

### Public Pages

- **Home Page** — Hero section, upcoming games, team features, gallery preview, and a mini-quiz
- **Members Page** — Meet the team with shuffled member cards (profiles, facts, contact info)
- **Gallery Pages** — Browse photos from past events (integrated with Google Drive)

### Interactive Features

- **Events List** — View and filter upcoming trivia nights
- **Reservation System** — Book seats for upcoming games (with modal form)
- **Contact Form** — Reach out to the team
- **Hire Form** — Request corporate/private event services
- **Mini Quiz** — Test your knowledge before the real game
- **Admin Panel** — Manage content, events, and settings (protected by token)

### Backend Services

- **CSV Event Import** — Upload `events.csv` to automatically update the events database
- **Google Drive Integration** — Fetch and display photos from organized game folders
- **Email Notifications** — Send confirmations for contact and hire requests
- **Admin API** — Token-protected endpoints for content management

---

## 🏗️ Tech Stack

| Layer     | Technology |
|-----------|-----------|
| **Frontend**  | React 19, React Router, CSS (no external UI library) |
| **Backend**   | Node.js, Express.js |
| **Database**  | SQLite3 |
| **Auth** | Bearer token (admin API) |
| **File Handling** | Multer, Chokidar, CSV-Parser |
| **Media** | Google Drive API (photos), Nodemailer (email) |
| **Dev Tools** | Concurrently (run both servers), Cross-env (port management) |

---

## 📂 Project Structure

```
Umazon/
├── backend/
│   ├── server.js                 # Express server, API endpoints
│   ├── database.js               # SQLite setup (contacts, events, etc.)
│   ├── package.json              # Backend dependencies
│   ├── .env                       # Secrets (Google API keys, email, admin token)
│   ├── uploads/                  # CSV uploads folder
│   │   └── archive/              # Processed CSV files
│   └── utils/
│       ├── csvWatcher.js         # Auto-detect & process events.csv
│       ├── googleDriveService.js # Google Drive API calls
│       ├── gameConfig.js         # Game folder mapping
│       └── ... (other utilities)
│
├── frontend/
│   ├── src/
│   │   ├── App.js                # Main app, routes
│   │   ├── index.js              # Entry point (smooth-scroll control)
│   │   ├── index.css             # Global styles
│   │   ├── components/           # Shared components (Navbar, Footer, AdminPanel)
│   │   ├── pages/
│   │   │   ├── HomePage/         # Hero, Events, Gallery, Features, Forms
│   │   │   ├── MembersPage/      # Team member profiles & shuffle
│   │   │   └── GalleryPage/      # Photo gallery by game
│   │   └── public/               # Static assets, images
│   ├── package.json              # Frontend dependencies
│   └── .gitignore
│
├── package.json                  # Root package (dev script with concurrently)
├── README.md                     # This file
├── .gitignore                    # Global ignore rules
└── LICENSE

```

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+) and npm
- Google Drive API credentials (for photo gallery)
- SMTP credentials (for email notifications, optional)

### Installation & Running

**Clone and install:**
```bash
git clone <repo-url>
cd Umazon
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

**From the repo root, start both servers:**
```bash
npm run dev
```

This will launch:
- **Frontend** on `http://localhost:3001` (React dev server)
- **Backend** on `http://localhost:3000` (Express API)

Your browser should open to `http://localhost:3001` automatically.

> **Note:** If you want to run them separately:
> - Backend: `cd backend && npm run dev`
> - Frontend: `cd frontend && npm run dev`

---

## 📋 Configuration

### Environment Variables

Create a `.env` file in the `backend/` folder:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./umazona.db

# Google Drive API
GOOGLE_DRIVE_API_KEY=your_api_key_here
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here

# Email (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
CONTACT_RECIPIENTS=email1@example.com,email2@example.com

# Admin API
ADMIN_API_TOKEN=your_secret_token_here

# Frontend (optional, in frontend/.env)
REACT_APP_PUBLIC_API_BASE_URL=http://localhost:3000
REACT_APP_ADMIN_API_BASE_URL=http://localhost:3000
```

---

## 📊 Database Schema

### `contacts` table
Stores form submissions from the "Contact Us" form.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Submitter name |
| phone | TEXT | Phone number |
| email | TEXT | Email address |
| message | TEXT | Message content |
| submitted_at | DATETIME | Submission timestamp |

### `events` table
Stores trivia game events.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| event_name | TEXT | Game title |
| event_date | DATETIME | Game date & time |
| address | TEXT | Location |
| details | TEXT | Format/notes |

### `hire_requests` table
Stores corporate event requests.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| company_name | TEXT | Organization name |
| contact_name | TEXT | Contact person |
| email | TEXT | Email |
| phone | TEXT | Phone |
| event_date | DATE | Requested date |
| team_size | INTEGER | Number of people |
| message | TEXT | Special requests |
| submitted_at | DATETIME | Submission timestamp |

---

## 🗂️ How to Update Content

### Update Events List

1. **Create/edit `events.csv`** on your computer with this format:
   ```
   event_name,event_date,address,details
   "Weekly Trivia Night","2025-01-15 19:00","Sochi, Main Hall","Solo or team, ~20 questions"
   "Corporate Game","2025-01-20 18:30","Moscow, Gazprom HQ","Private event, 50 players"
   ```

2. **Upload the file:**
   - Drag & drop `events.csv` into `backend/uploads/`
   - Or use the admin panel (if enabled)

3. **Server processes automatically:**
   - The watcher detects the new file
   - Parses and loads it into the database
   - Moves the processed file to `backend/uploads/archive/`
   - Frontend reflects changes immediately on refresh

### Update Team Members

Edit `frontend/src/pages/MembersPage/components/Members/Members.js`:
- Add/edit the `memberData` array with member objects
- Each member needs: id, name, contact, image path, aboutMe array, lifeFacts array
- Images should be in `frontend/public/images/`

### Manage Gallery Photos

Gallery photos are fetched from **Google Drive**:
1. Set up a Google Drive folder structure with game folders
2. Add `GOOGLE_DRIVE_FOLDER_ID` to `.env`
3. The backend uses the Google Drive API to index and fetch photos
4. Frontend displays them on the Gallery pages

---

## 🔐 Admin Panel

The admin panel (if enabled in code) allows you to:
- View and manage contact form submissions
- Add/edit events
- View hire requests
- Clear caches

**Access:** Protected by `ADMIN_API_TOKEN` (passed in request headers)

---

## 🌐 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/events` | List all events |
| GET | `/api/games` | List available game folders (from Google Drive) |
| GET | `/api/photos/:gameId` | Get photos for a specific game |
| POST | `/api/contacts` | Submit contact form |
| POST | `/api/hire` | Submit corporate hire request |
| POST | `/api/reservations` | Book a seat for an event |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/contacts` | List contact submissions |
| GET | `/admin/hire-requests` | List hire requests |
| POST | `/admin/events` | Create event |
| PUT | `/admin/events/:id` | Update event |
| DELETE | `/admin/events/:id` | Delete event |
| POST | `/admin/cache-clear` | Clear caches |

> All admin endpoints require `Authorization: Bearer <ADMIN_API_TOKEN>` header.

---

## 🛠️ Development

### Frontend Development

- **Hot reload:** Changes to React files auto-refresh the browser
- **Smooth scroll:** Enabled after initial page load to prevent unwanted scrolls
- **Responsive:** Mobile-first design with CSS media queries

### Backend Development

- **Auto-restart:** `nodemon` watches server files and restarts on changes
- **CSV watcher:** Monitors `backend/uploads/` for new `events.csv` files
- **CORS enabled:** Frontend can make requests to backend

### Common Commands

```bash
# From repo root
npm run dev                          # Run both servers

# Backend only
cd backend && npm run dev           # Dev server with nodemon
cd backend && npm start             # Production server

# Frontend only
cd frontend && npm run dev          # Dev server (PORT=3001)
cd frontend && npm run build        # Production build
cd frontend && npm run start        # Production server (PORT=3000)
cd frontend && npm test             # Run tests

# Build frontend for production
cd frontend && npm run build
# Output: frontend/build/
```

---

## 📦 Dependencies

### Frontend
- `react` — UI library
- `react-router-dom` — Page routing
- `react-router-hash-link` — Hash-based navigation

### Backend
- `express` — Web framework
- `sqlite3` — Database
- `cors` — Cross-origin requests
- `multer` — File upload handling
- `chokidar` — File system watcher
- `csv-parser` — CSV parsing
- `googleapis` — Google Drive API
- `nodemailer` — Email sending
- `dotenv` — Environment variables

### Dev Dependencies
- `nodemon` — Auto-restart server
- `concurrently` — Run multiple commands
- `cross-env` — Cross-platform env vars

---

## 📝 License

MIT License — See `LICENSE` file for details.

---

## 👥 Team

- **Евгения** — Event lead, experience designer
- **Дарья** — Question curator, host
- **Екатерина** — Operations, logistics

---

## 🤝 Contributing

This repo is for the Umazona team. For feature requests or bug reports, reach out via email or the contact form on the website.

---

## 📞 Contact

- **Email:** hello@umazona.com
- **Phone:** +7 (555) 123-4567
- **Website:** https://umazona.com (when deployed)

---

**Last Updated:** December 2025  
**Version:** 0.1.0