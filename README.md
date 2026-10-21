# Smart Campus Complaint Management System

A college-level web application for submitting, tracking, assigning, and resolving campus complaints.

## Technologies used

- HTML5 (`frontend/index.html`)
- CSS3 (`frontend/src/styles.css`)
- JavaScript (frontend and backend logic)
- React (`frontend/src`)
- Node.js + Express.js (`backend/src`)
- MySQL (`database/database.sql`)

No Java, Python, PHP, MongoDB, Firebase, or other backend language/database is required.

## Main features

### Student side
- Login and role-based access
- Dashboard with complaint statistics
- Create complaints for classrooms, labs, washrooms, electrical issues, Wi-Fi/IT, security, housekeeping, and other campus services
- Automatic department mapping from complaint category
- Priority selection with expected resolution target
- Complaint ticket IDs
- Track complaint status through a timeline
- Search and filter submitted complaints
- Add follow-up comments
- In-app notifications when status or assignment changes

### Authority/admin side
- Admin dashboard with KPIs
- Status distribution and department workload views
- Search, filtering, sorting, and priority/status controls
- Open complaint details with full activity history
- Assign department and update priority/status
- Add official authority responses and resolution notes
- Mark complaints as resolved/rejected
- Automatic student notifications for important complaint changes

## Demo accounts

Student:
- Email: `student@campus.edu`
- Password: `student123`

Admin:
- Email: `admin@campus.edu`
- Password: `admin123`

## Requirements

- Node.js 18+ recommended
- MySQL 8+
- A browser such as Chrome/Edge

## 1. Create the MySQL database

Open MySQL Workbench and run **all** of `database/database.sql`.

The script creates:
- database `smart_campus`
- tables for users, departments, categories, complaints, complaint updates, notifications, and sessions
- demo users
- demo complaints and update history

## 2. Configure the backend

Open `backend/src/config.js` and set the MySQL credentials for your computer.

Default values in the project:

```js
host: 'localhost',
port: 3306,
user: 'root',
password: 'root',
database: 'smart_campus'
```

Change only the values that differ on your machine.

## 3. Start the backend

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:5000`.

## 4. Start the React frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will show the local URL, normally `http://localhost:5173`.

## 5. Login

Use the demo account above.

## Project structure

```text
smart-campus-complaint-management-system/
├── backend/
│   ├── src/
│   │   ├── config.js
│   │   ├── db.js
│   │   ├── middleware/auth.js
│   │   ├── routes/auth.js
│   │   ├── routes/complaints.js
│   │   ├── routes/meta.js
│   │   ├── routes/notifications.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── database.sql
└── README.md
```

## Academic/demo note

Authentication is implemented with database-backed session tokens so the application demonstrates real client-server interaction rather than storing the entire application in the browser. Passwords are stored as salted SHA-256 hashes using Node.js built-in cryptography. This is suitable for a classroom demonstration; a production deployment should use HTTPS, a stronger password hashing scheme such as Argon2/bcrypt, environment variables, and a production session store.
