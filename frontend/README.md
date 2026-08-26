# Nagrik Nova

Light-themed MERN prototype for crowdsourced civic challenges and AI-guided collaboration between citizens, NGOs, universities and industry.

## Run locally

1. Install MongoDB locally (or create a MongoDB Atlas database).
2. Copy `backend/.env.example` to `backend/.env`, then set `MONGO_URI` and a secure `JWT_SECRET`.
3. In one terminal: `cd backend`, `npm install`, `npm run seed`, `npm run dev`.
4. In a second terminal: `cd frontend`, `npm install`, `npm run dev`.
5. Open the Vite URL (normally `http://localhost:5173`).

## Seeded accounts

All accounts use password `Nova@2026`.

| Role | Email |
|---|---|
| Admin | admin@nagriknova.com |
| University | university@nagriknova.com |
| Industry | industry@nagriknova.com |
| Citizen | citizen@nagriknova.com |

The prototype's analysis route includes a reliable local classifier so demos work without an API key. Add your preferred LLM provider in `backend/src/routes/issues.js` for production AI analysis, keeping the key server-side.
