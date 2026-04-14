# Peerly

Peerly is a full-stack mentoring platform that helps students connect as **mentors** and **mentees**.
It includes:

- A static frontend (HTML/CSS/JavaScript) for authentication, dashboard, profile, mentors listing, and requests.
- A Node.js + Express backend with MongoDB for auth, profiles, mentor requests, and mentor matching.

## Demo



https://github.com/user-attachments/assets/af927ccf-6fe7-4021-9ccf-0d91b1cd8486



https://github.com/user-attachments/assets/21bac3e6-5436-4cd2-a022-18913e43ba68



## Features

- User registration and login
- Mentor and mentee roles
- Profile updates (skills, interests, year, department, bio)
- Mentor request flow (send, view incoming, accept/reject)
- Basic mentor matching based on shared skills/interests

## Project Structure

```text
Peerly/
├── frontend/
│   ├── dashboard.html
│   ├── login.html
│   ├── mentors.html
│   ├── profile.html
│   ├── register.html
│   ├── requests.html
│   ├── css/
│   └── js/
└── backend/
    ├── server.js
    ├── models/
    ├── routes/
    ├── middleware/
    └── package.json
```

## Backend Setup

1. Go to backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file inside `backend/` (optional but recommended):

```env
PORT=5000
JWT_SECRET=your_secret_key
```

> Note: If `MONGO_URI` is not provided, the app defaults to `mongodb://127.0.0.1:27017/mentorConnect`.

4. Start the backend server:

```bash
npm run dev
```

or

```bash
npm start
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login and receive JWT token

### Users
- `PUT /api/users/profile` — Update logged-in profile (protected)
- `GET /api/users/mentors` — List all mentors

### Requests
- `POST /api/requests` — Send mentor request (protected)
- `GET /api/requests/incoming` — View incoming mentor requests (protected)
- `PUT /api/requests/:id` — Update request status (protected)

### Match
- `GET /api/match/mentors` — Ranked mentor recommendations for mentee (protected)

## Frontend Usage

1. Open `frontend/register.html` to create an account.
2. Login from `frontend/login.html`.
3. Use dashboard and other pages to browse mentors, send requests, and manage profile.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose
- Auth: JWT + bcryptjs

## Future Improvements

- Add full validation and centralized error handling
- Improve role-based authorization checks
- Add unit/integration tests
- Deploy frontend and backend with environment-specific configs
