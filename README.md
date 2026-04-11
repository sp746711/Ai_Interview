# 🧠 AI Mock Interview Platform

### 🚀 A Complete Interview Training System (Full-Stack + AI-Based)

---

## 📌 Overview

The **AI Mock Interview Platform** is a full-stack web application designed to simulate real-world interview processes for students and freshers.

This platform provides a **multi-round interview experience**, including resume screening, aptitude testing, and AI-based interviews with voice and video interaction. It helps users understand how interviews actually work in companies and provides **detailed feedback for improvement**.

---

## 🎯 Key Features

### 🔐 Authentication

* User Registration & Login
* Secure authentication system

---

### 🏠 Dashboard

* Total Interviews
* Average Score
* Best Score
* Recent Interview History
* Quick access to start new interview

---

### 🟣 Round 1: Interview Setup + Resume (Mandatory)

* Choose Interview Type:

  * Technical
  * Non-Technical
* Resume Upload (PDF) OR Create Resume
* Resume is used for evaluation and feedback

---

### 🟡 Round 2: Online Test (Screening Round)

* MCQ-based questions
* Timer: **30 minutes (countdown)**
* Auto evaluation of answers
* Score calculation

---

### 🔵 Round 3 Setup

* Select Job Role:

  * Frontend, Backend, HR, Marketing, etc.
* Select Difficulty:

  * Easy / Medium / Hard
* Select Interview Length:

  * Short (3), Medium (5), Long (10) questions

---

### 🔴 Round 3: AI Interview

* AI-based question system
* Voice + Text answer support
* Live camera preview
* Real interview simulation

---

### 🟢 Final Feedback System

* Combined evaluation from all rounds:

  * Resume Score
  * Test Score
  * Interview Performance
* Strengths & Weaknesses
* Improvement Suggestions

---

### 📋 History Tracking

* View past interviews
* Review scores and performance

---

## 🏗️ Tech Stack

### 🔹 Frontend

* React.js
* Tailwind CSS

### 🔹 Backend

* Python (FastAPI)

### 🔹 Database

* MongoDB

---

## 🧠 System Workflow

```text
Landing Page
   ↓
Login / Signup
   ↓
Dashboard
   ↓
Round 1: Type + Resume (Mandatory)
   ↓
Round 2: Online Test (MCQ + 30 min)
   ↓
Round 3 Setup (Role + Difficulty + Length)
   ↓
Round 3: AI Interview (Voice + Video)
   ↓
Final Feedback (Score + Suggestions)
   ↓
Back to Dashboard
```

---

## 📂 Project Structure

### 🔹 Backend (FastAPI)

```text
backend/app/
 ├── main.py
 ├── db/
 ├── models/
 ├── routes/
 ├── controllers/
 ├── services/
 ├── utils/
 ├── schemas/
 ├── core/
```

---

### 🔹 Frontend (React)

```text
frontend/src/
 ├── pages/
 │    ├── Login.jsx
 │    ├── Dashboard.jsx
 │    ├── Round1.jsx
 │    ├── Test.jsx
 │    ├── Setup.jsx
 │    ├── AIInterview.jsx
 │    ├── Feedback.jsx
 │
 ├── components/
 ├── context/
 ├── services/
 ├── App.jsx
```

---

## ⚙️ Installation Guide

### 🔹 Backend Setup (Python)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

python -m uvicorn app.main:app --reload --port 8001
```

👉 Open:

```
http://127.0.0.1:8001/docs
```

---

### 🔹 Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev
```

👉 Open:

```
http://localhost:5173
```

---

## 🔌 API Overview

### 🔐 Auth APIs

* POST `/api/auth/register`
* POST `/api/auth/login`

---

### 🎤 Interview APIs

* POST `/api/interview/start`
* POST `/api/interview/round1`
* POST `/api/interview/setup`
* GET `/api/interview/result`

---

### 🧪 Test APIs

* GET `/api/test/questions`
* POST `/api/test/submit`

---

### 🤖 AI APIs

* POST `/api/interview/question`
* POST `/api/interview/answer`

---

## 🧠 Unique Features (Your Custom Additions)

✔ Resume is **mandatory** (real interview simulation)
✔ Multi-round system like real MNCs
✔ Interview length selection (Short/Medium/Long)
✔ Combined feedback from all rounds
✔ Voice + Video interview interface
✔ Dashboard analytics (Total, Avg, Best score)

---

## 🚀 Future Enhancements

* AI-based answer evaluation using NLP
* Speech-to-text integration
* Emotion detection during interview
* Resume improvement suggestions
* Multi-language support
* Company-specific interview modes

---

## 🏆 Conclusion

The **AI Mock Interview Platform** is a complete and scalable solution for interview preparation. It simulates real-world interview processes and provides meaningful feedback to help users improve.

This project demonstrates strong skills in:

* Full-stack development
* Backend system design
* AI integration readiness
* UI/UX structuring

---

## 👨‍💻 Author

**Sujan Pradhan**
CSE-AI Student

---
