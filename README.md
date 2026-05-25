# ⚡ TaskFlow — Full-Stack Task Management App

A production-ready task management application demonstrating a **Django + Express.js + React** full-stack architecture.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           React Frontend  :3000              │
│  (Task Board UI, Auth, Drag & Drop)          │
└──────────────────┬──────────────────────────┘
                   │ HTTP requests
┌──────────────────▼──────────────────────────┐
│        Express.js Gateway  :4000             │
│  • Rate limiting (global + auth routes)      │
│  • JWT decoding & request logging            │
│  • HTTP proxy to Django                      │
│  • Error handling & 502 fallbacks            │
└──────────────────┬──────────────────────────┘
                   │ Proxied requests
┌──────────────────▼──────────────────────────┐
│        Django REST API  :8000                │
│  • JWT authentication (simplejwt)            │
│  • Projects & Tasks CRUD                     │
│  • Filtering, search, pagination             │
│  • SQLite (dev) / PostgreSQL (prod)          │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         SQLite / PostgreSQL DB               │
└─────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Django Backend (Python)

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations api
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Start the server
python manage.py runserver 8000
```

Django API is now live at `http://localhost:8000`

---

### 2. Express.js Gateway (Node.js)

```bash
cd gateway

npm install
npm run dev        # uses nodemon for hot-reload
# or: npm start
```

Gateway is now live at `http://localhost:4000`

---

### 3. React Frontend

```bash
cd frontend

npm install
npm start
```

Frontend is now live at `http://localhost:3000`

---

## 📡 API Endpoints

All requests flow through the Express gateway on `:4000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Get JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user |
| GET/POST | `/api/projects/` | List / Create projects |
| GET/PATCH/DELETE | `/api/projects/:id/` | Project detail |
| GET/POST | `/api/tasks/` | List / Create tasks |
| GET/PATCH/DELETE | `/api/tasks/:id/` | Task detail |
| GET | `/health` | Gateway health check |

### Filtering Examples
```
GET /api/tasks/?status=in_progress
GET /api/tasks/?priority=high&project=1
GET /api/projects/?search=website
```

---

## 🔑 Key Technical Decisions

### Django (Python Backend)
- **Django REST Framework** for a clean, serializer-based API
- **SimpleJWT** for stateless JWT authentication (access + refresh tokens)
- **django-filter** for powerful query-param filtering
- Custom serializers with nested relationships (task counts, user details)
- ViewSet-based routing for clean, RESTful URL patterns

### Express.js (API Gateway)
- **http-proxy-middleware** to proxy all `/api/*` requests to Django
- **express-rate-limit** for DDoS protection (stricter limits on auth routes)
- **morgan** for structured request logging
- JWT decoding middleware adds `x-user-id` header for audit trails
- Graceful 502 error handling when Django is unreachable

### React (Frontend)
- **Context API** for global auth state (no Redux needed at this scale)
- Custom `useAuth` hook for clean component access
- HTML5 Drag & Drop API for moving tasks between columns
- Service layer (`/api/index.js`) centralises all fetch calls
- Auto-logout on 401 response with token cleanup

---

## 📁 Project Structure

```
taskflow/
├── backend/                  # Django REST API
│   ├── models.py             # Project, Task models
│   ├── serializers.py        # DRF serializers
│   ├── views.py              # ViewSets + Auth views
│   ├── urls.py               # URL routing
│   ├── settings.py           # Django configuration
│   └── requirements.txt
│
├── gateway/                  # Express.js Gateway
│   ├── index.js              # Main gateway server
│   └── package.json
│
└── frontend/                 # React Application
    ├── src/
    │   ├── App.js            # Root app + pages
    │   ├── api/index.js      # API service layer
    │   ├── context/
    │   │   └── AuthContext.js
    │   └── components/
    │       └── TaskBoard.js  # Kanban board (drag & drop)
    └── package.json
```

---

## ✅ Features

- 🔐 **JWT Authentication** — register, login, refresh tokens
- 📋 **Project Management** — create, view, delete projects
- ✅ **Task CRUD** — create tasks with title, description, priority, due date
- 🎯 **Kanban Board** — drag tasks between To Do / In Progress / Done columns
- 🔍 **Search & Filter** — filter tasks by status, priority, project
- 🛡️ **Rate Limiting** — via Express gateway middleware
- 📝 **Request Logging** — every request logged with user ID

---

*Built with Django 4.2, Express.js 4.18, React 18*
