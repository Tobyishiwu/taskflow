# ⚡ TaskFlow

### A Full-Stack Task Management Application

> Built with **Django** · **Express.js** · **React** — demonstrating a production-grade three-tier architecture.

![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)
![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-25-339933?style=for-the-badge&logo=node.js&logoColor=white)

---

## 🎯 What is TaskFlow?

TaskFlow is a Kanban-style project and task management app — think a simplified Trello or Jira. It lets users create projects, add tasks, set priorities, assign due dates, and drag tasks across **To Do → In Progress → Done** columns in real time.

The app is built across three separate services that communicate with each other, demonstrating real-world full-stack architecture skills.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           React Frontend  :3000              │
│  Task Board UI · Auth · Drag & Drop         │
└──────────────────┬──────────────────────────┘
                   │ HTTP requests
┌──────────────────▼──────────────────────────┐
│        Express.js Gateway  :4000             │
│  Rate Limiting · Logging · Proxy            │
└──────────────────┬──────────────────────────┘
                   │ Proxied requests
┌──────────────────▼──────────────────────────┐
│        Django REST API  :8000                │
│  JWT Auth · CRUD · Filtering · Pagination   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              SQLite Database                 │
└─────────────────────────────────────────────┘
```

Every request from the browser flows through the **Express.js gateway** before reaching **Django** — just like production systems at scale.

---

## ✨ Features

| Feature | Details |
|--------|---------|
| 🔐 JWT Authentication | Register, login, refresh tokens, auto-logout on expiry |
| 📋 Project Management | Create, view, and delete projects |
| ✅ Task CRUD | Add tasks with title, description, priority, and due date |
| 🎯 Kanban Board | Drag and drop tasks between To Do, In Progress, and Done |
| 🛡️ Rate Limiting | Via Express middleware — 200 req/15min global, 20/15min on auth |
| 📝 Request Logging | Every request logged with timestamp, method, path, and user ID |
| 🔍 Search & Filter | Filter tasks by status, priority, and project |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:

```bash
python --version   # 3.9 or higher
node --version     # 16 or higher
npm --version      # 8 or higher
git --version
```

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Tobyishiwu/taskflow.git
cd taskflow
```

**2. Start Django Backend**
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Set up the database
python manage.py makemigrations api
python manage.py migrate

# Start the server
python manage.py runserver 8000
```

✅ Django running at `http://localhost:8000`

**3. Start Express Gateway** *(open a new terminal)*
```bash
cd gateway
npm install
node index.js
```

✅ Gateway running at `http://localhost:4000`

**4. Start React Frontend** *(open a new terminal)*
```bash
cd frontend
npm install
npm start
```

✅ App running at `http://localhost:3000` — opens automatically in browser

---

## 📡 API Endpoints

All requests flow through the Express gateway on port `4000`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Create a new account |
| `POST` | `/api/auth/login/` | Login and receive JWT tokens |
| `POST` | `/api/auth/refresh/` | Refresh access token |
| `GET` | `/api/auth/me/` | Get current user profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/` | List all projects |
| `POST` | `/api/projects/` | Create a new project |
| `GET` | `/api/projects/:id/` | Get project details |
| `PATCH` | `/api/projects/:id/` | Update a project |
| `DELETE` | `/api/projects/:id/` | Delete a project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks/` | List all tasks |
| `POST` | `/api/tasks/` | Create a new task |
| `GET` | `/api/tasks/:id/` | Get task details |
| `PATCH` | `/api/tasks/:id/` | Update a task (e.g. move columns) |
| `DELETE` | `/api/tasks/:id/` | Delete a task |

### Filtering Examples
```
GET /api/tasks/?status=in_progress
GET /api/tasks/?priority=high
GET /api/tasks/?project=1
GET /api/projects/?search=website
```

---

## 📁 Project Structure

```
taskflow/
├── backend/                    # Django REST API
│   ├── api/
│   │   ├── models.py           # Project & Task models
│   │   ├── serializers.py      # DRF serializers with nested data
│   │   ├── views.py            # ViewSets + JWT auth views
│   │   └── urls.py             # API URL routing
│   ├── taskflow/
│   │   ├── settings.py         # Django configuration
│   │   └── urls.py             # Root URL config
│   └── requirements.txt
│
├── gateway/                    # Express.js API Gateway
│   ├── index.js                # Proxy, rate limiting, logging
│   └── package.json
│
└── frontend/                   # React Application
    ├── src/
    │   ├── App.js              # Root app + all pages
    │   ├── api/
    │   │   └── index.js        # Centralised API service layer
    │   ├── context/
    │   │   └── AuthContext.js  # Global auth state + hooks
    │   └── components/
    │       └── TaskBoard.js    # Kanban board with drag & drop
    └── package.json
```

---

## 🔑 Key Technical Decisions

### Django (Python) — Backend
- **Django REST Framework** for clean, serializer-based API design
- **SimpleJWT** for stateless JWT authentication with access + refresh tokens
- **django-filter** for powerful query-parameter filtering
- Custom serializers with nested relationships (task counts, user details)
- ViewSet-based routing for clean, RESTful URL patterns

### Express.js — API Gateway
- Acts as a middleware layer between React and Django
- **http-proxy-middleware** proxies all `/api/*` requests to Django
- **express-rate-limit** protects against abuse with stricter limits on auth routes
- **morgan** for structured HTTP request logging
- JWT decoding adds `x-user-id` header to proxied requests for audit trails
- Graceful 502 error handling when Django is unreachable

### React — Frontend
- **Context API** for global authentication state management
- Custom `useAuth()` hook for clean, reusable auth access in components
- HTML5 **Drag & Drop API** for moving tasks between Kanban columns
- Centralised API service layer handles all fetch calls in one place
- Auto-logout and redirect on 401 Unauthorized responses

---

## 👨‍💻 Author

**Tobias** — Full-Stack Developer
GitHub: [@Tobyishiwu](https://github.com/Tobyishiwu)

---

*Built as a technical demonstration of Django (Python), Express.js (JavaScript), and React (JavaScript) full-stack development.*
