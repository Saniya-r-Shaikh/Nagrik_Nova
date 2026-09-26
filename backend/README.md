# Nagrik Nova - Backend API

Nagrik Nova is a civic intelligence platform that connects community-reported challenges with the people, research, and resources ready to solve them. This repository houses the Node.js/Express backend server integrated with MongoDB and Google Gemini AI.

---

## Features

* **User Authentication:** Secure registration and login supporting multiple roles (`citizen`, `ngo`, `university`, `industry`, `admin`).
* **Civic Issue Ticketing:** Complete CRUD operations for submitting, tracking, and managing community infrastructure complaints.
* **AI-Powered Civic Briefs:** Integrates **Google Gemini AI (`gemini-3.1-flash-lite`)** to automatically analyze civic issues, determine priorities, categorize domains, extract required technical expertise, and generate actionable solution pathways.
* **Collaborator Matching:** Automatically matches issues with registered institutional partners (e.g., local engineering colleges) based on required skill sets.

---

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose ODM)
* **AI Engine:** `@google/generative-ai` (Gemini API)
* **Middleware:** CORS, dotenv

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.
* [MongoDB](https://www.mongodb.com/) running locally (`mongodb://127.0.0.1:27017/nagrik_nova`).

### Installation

1. Clone the repository and navigate into the backend directory:
   ```bash
   git clone [https://github.com/Saniya-r-Shaikh/Nagrik_Nova.git](https://github.com/Saniya-r-Shaikh/Nagrik_Nova.git)
   cd Nagrik_Nova_Clean
Install dependencies:

Bash
npm install express mongoose cors dotenv @google/generative-ai
Create a .env file in the root directory and add your configuration:

Code snippet
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/nagrik_nova
GEMINI_API_KEY=your_google_gemini_api_key_here
Running the Server
Start the backend server in development mode:

Bash
node server.js
You should see confirmation in your terminal:

Plaintext
◇ injected env (1) from .env
Server live on port 5000
✅ Clean Database Connected!
API Endpoints
Authentication
POST /api/auth/register - Register a new user/organization profile

POST /api/auth/login - Authenticate user and receive token

Issues & AI Analysis
GET /api/issues - Retrieve all reported civic issues

POST /api/issues - Submit a new community issue

GET /api/issues/:id - Fetch details for a specific issue

POST /api/issues/:id/analyze - [AI Agent] Triggers Gemini AI to analyze the issue, assign priority, and match collaborators

License
Built for civic impact and hackathon innovation.