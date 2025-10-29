# Umazona Trivia Website

This is the official website for the Umazona trivia group. It's a single-page application built with a React frontend and an Express.js backend.

The site includes a "Contact Us" form and a dynamic "Upcoming Events" list that can be updated by a non-technical user.

## Tech Stack

* **Frontend:** React
* **Backend:** Node.js, Express.js
* **Database:** SQLite
* **File Parser:** `chokidar`, `csv-parser`

---

## 🚀 How to Run This Project

You must run both the backend and frontend at the same time in two separate terminals.

### 1. Backend (The API)

1.  Navigate to the backend folder:
    ```bash
    cd umazona-backend
    ```
2.  Install all the required packages:
    ```bash
    npm install
    ```
3.  Start the development server (which includes the file watcher):
    ```bash
    npm run dev
    ```
    The backend will now be running at `http://localhost:3000`.

### 2. Frontend (The Website)

1.  Open a **second terminal**.
2.  Navigate to the frontend folder:
    ```bash
    cd umazona-frontend
    ```
3.  Install all the required packages:
    ```bash
    npm install
    ```
4.  Start the React development server:
    ```bash
    npm start
    ```
    Your browser will automatically open to `http://localhost:3001` (since 3000 is in use).

---

## 🗓️ How to Update the "Upcoming Events" List

The events list is updated by uploading a single `events.csv` file.

**This is a "Wipe and Replace" system.** The new file you upload will *completely replace* the old list.

### User Workflow:

1.  Keep a "master" `events.csv` file on your computer.
2.  To add, edit, or delete an event, make the changes directly in that spreadsheet file.
3.  Save the file.
4.  Drag and drop your updated `events.csv` file into the `umazona-backend/uploads` folder. If you have an old `events.csv` -- delete it and add a new one.
5.  The server will automatically detect the new file, update the database, and move the file to the `archive` folder.
6.  Refresh the website to see your changes.

**CSV File Format:**
The CSV file **must** have these four headers in the first row:
`event_name,event_date,address,details`