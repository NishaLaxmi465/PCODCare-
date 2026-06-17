# PCODCare

PCODCare is a full-stack PCOD/PCOS health tracker with a Node.js/Express/MongoDB API and a React dashboard.

## Features

- JWT access and refresh token authentication with refresh-token rotation.
- Mongoose models for users, tracker logs, reports, chat history, notifications, appointments, and refresh tokens.
- CRUD APIs for symptoms, weight, water, exercise, steps, mood, medicines, notifications, appointments, and medical reports.
- Health Insights risk scoring from BMI, symptoms, acne, hair fall, cycle irregularity, weight trend, and steps.
- Cycle irregularity detection using mean and standard deviation of logged cycle lengths.
- AI diet plan generation and AI chatbot through an LLM API call when `OPENAI_API_KEY` is set.
- Secure report upload/download for PDF, JPG, and PNG files up to 10MB.
- Analytics dashboard with steps, weight, water, symptoms, calories, and BMI charts.
- Health report PDF export.

## Backend Setup

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Set `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in `backend/.env`.

For AI features, add:

```bash
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4.1-mini
```

Without an API key, the AI endpoints return safe built-in fallback guidance so the UI remains usable in development.

## Frontend Setup

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and expects the API at `http://localhost:5000/api` by default.

## API Overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- `GET/PATCH /api/users/me`
- `GET/POST /api/trackers/:type`, `PATCH/DELETE /api/trackers/:type/:id`
- `GET /api/insights`, `GET /api/insights/dashboard`, `GET /api/insights/analytics`
- `POST /api/ai/diet-plan`, `POST /api/ai/chat`, `GET /api/ai/suggestions`
- `GET/POST /api/reports`, `PATCH /api/reports/:id`, `GET /api/reports/:id/download`, `GET /api/reports/health/export`
- `GET/POST/PATCH/DELETE /api/notifications`
- `GET/POST/PATCH/DELETE /api/appointments`

Tracker types are `symptoms`, `weight`, `water`, `exercise`, `steps`, `mood`, and `medications`.
