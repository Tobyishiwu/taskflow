# ⚡ TaskFlow

A full-stack task management app — like a mini Trello — built with Django, Express.js, and React.

![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

---

## What it does

- 🔐 Register and log in securely with JWT tokens
- 📋 Create and manage projects
- ✅ Add tasks with priority levels and due dates
- 🎯 Drag tasks across **To Do → In Progress → Done** columns
- 🛡️ All requests go through an Express.js gateway before hitting Django

---

## How it works

```
React (UI)  →  Express.js (Gateway)  →  Django (API)  →  Database
```

Three services working together — just like a real production app.

---

## Running it locally

You need Python and Node.js installed.

**1. Backend (Django)**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

**2. Gateway (Express)**
```bash
cd gateway
npm install
node index.js
```

**3. Frontend (React)**
```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` — register an account and start adding tasks!

---

## Built with

- **Django** + Django REST Framework — API and database
- **Express.js** — API gateway with rate limiting and logging
- **React** — interactive frontend with drag and drop
- **JWT** — secure authentication

---

👨‍💻 Built by [Tobias](https://github.com/Tobyishiwu)
