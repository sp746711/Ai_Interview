<div align="center">

# 🧠 MockMind AI

### **AI-Powered Full-Stack Mock Interview Platform**

> A full-stack AI interview preparation platform that simulates a structured multi-round hiring journey — from intelligent resume screening and proctored technical assessments to conversational AI interviews and personalized performance analytics.

<br />

`React 19` &nbsp;•&nbsp; `FastAPI` &nbsp;•&nbsp; `MongoDB` &nbsp;•&nbsp; `Ollama` &nbsp;•&nbsp; `Qwen3:4b` &nbsp;•&nbsp; `MediaPipe Tasks Vision` &nbsp;•&nbsp; `Web Speech API`

<br />

</div>

---

## 🧭 Explore MockMind AI

- [🚀 How MockMind AI Works](#-how-mockmind-ai-works)
- [🔄 The Complete Interview Journey](#-the-complete-interview-journey)
- [📄 Round 1 — Intelligent Resume Screening](#-round-1--intelligent-resume-screening)
- [⏱️ Round 2 — Online Assessment](#️-round-2--online-assessment)
- [🧠 Assessment Intelligence](#-assessment-intelligence)
- [🎯 AI Interview Setup](#-ai-interview-setup)
- [🎙️ Round 3 — Conversational AI Interview](#️-round-3--conversational-ai-interview)
- [🤖 AI Architecture](#-ai-architecture)
- [🏗️ System Architecture](#️-system-architecture)
- [🔌 Frontend → API → Backend](#-frontend--api--backend)
- [🔗 Interview Data Flow](#-interview-data-flow)
- [🗄️ Data Layer](#️-data-layer)
- [🔐 Interview Integrity & Proctoring](#-interview-integrity--proctoring)
- [📊 Performance Intelligence](#-performance-intelligence)
- [🛠️ Technology Stack](#️-technology-stack)
- [📂 Project Structure](#-project-structure)
- [🌐 Application Route Map](#-application-route-map)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🧠 Local AI Runtime](#-local-ai-runtime)
- [🚀 Installation & Setup](#-installation--setup)
- [👨‍💻 Typical User Journey](#-typical-user-journey)
- [💡 Why MockMind AI?](#-why-mockmind-ai)
- [📋 Product Capabilities Matrix](#-product-capabilities-matrix)
- [🔭 Future Roadmap](#-future-roadmap)
- [👨‍💻 Author](#-author)

---

## 🚀 How MockMind AI Works

MockMind AI transforms scattered interview prep into a structured, realistic enterprise-style hiring pipeline:

```mermaid
flowchart TD
    User([Candidate]) --> Landing["🌐 Landing & Features"]
    Landing --> Auth["🔐 Authentication (Login / Register)"]
    Auth --> Dashboard["📊 Centralized Dashboard"]
    Dashboard --> Start["🚀 Initialize Interview (Technical / Non-Technical)"]
    
    subgraph StagedPipeline ["Structured Multi-Round Recruitment Pipeline"]
        Start --> R1["📄 Round 1: Resume Screening (PDF Upload & Parsing)"]
        R1 --> R1Feedback["📑 Round 1: Resume Intelligence Feedback"]
        R1Feedback --> R2["⏱️ Round 2: 50-Question Proctored Assessment"]
        R2 --> R2Feedback["🧠 Round 2: AI Diagnostic Assessment Feedback"]
        R2Feedback --> Setup["🎯 Interview Setup (Domain Role Selection)"]
        Setup --> R3["🎙️ Round 3: Conversational AI Voice + Vision Interview"]
        R3 --> FinalFeedback["📈 Comprehensive Multi-Round Feedback"]
    end
    
    FinalFeedback --> History["📋 History Tracking & Analytics"]
    History --> Dashboard
```

---

## 🔄 The Complete Interview Journey

Each stage of the interview builds upon the candidate's previous submissions to generate contextual questions and comprehensive evaluations:

```mermaid
graph TD
    A["Public Landing Page<br/><code>/</code>, <code>/features</code>, <code>/how-it-works</code>"] --> B["Authentication<br/><code>/login</code>, <code>/register</code>"]
    B --> C["Candidate Dashboard<br/><code>/dashboard</code>"]
    C --> D["Start New Interview<br/><code>Select Track: Technical / Non-Technical</code>"]
    
    D --> E["Round 1 — Resume Screening<br/><code>/round1</code><br/>• Drag-and-Drop PDF Upload (≤ 5MB)<br/>• PyMuPDF Text Extraction"]
    E --> F["Round 1 — Resume Intelligence<br/><code>/round1-feedback</code><br/>• ATS Compatibility Analysis<br/>• Skill & Role-Fit Evaluation (Qwen3:4b)"]
    
    F --> G["Round 2 — Online Assessment<br/><code>/test</code><br/>• 50 MCQs (10 Aptitude + 10 Reasoning + 30 Domain)<br/>• 50-Minute Timed Countdown<br/>• Real-Time Proctoring & Security Safeguards"]
    G --> H["Round 2 — Diagnostic Intelligence<br/>• Strengths & Weakness Mapping<br/>• Category Performance Scoring"]
    
    H --> I["AI Interview Setup<br/><code>/setup</code><br/>• Target Role & Domain Selection<br/>• Dynamic Pipeline Initialization"]
    I --> J["Round 3 — AI Interview<br/><code>/ai-interview</code><br/>• Voice Readiness Gate<br/>• Speech-to-Text Answers & AI Vocal TTS<br/>• MediaPipe FaceLandmarker Vision Tracking"]
    
    J --> K["Final Combined Feedback<br/><code>/feedback</code><br/>• Multi-Round Weighted Scoring<br/>• Actionable Growth Recommendations"]
    K --> L["History & Analytics<br/><code>/history</code>, <code>/dashboard</code>"]
```

---

## 📄 Round 1 — Intelligent Resume Screening

Round 1 provides automated resume parsing and ATS (Applicant Tracking System) intelligence using local LLM inference and deterministic keyword extractors.

```mermaid
flowchart TD
    subgraph CandidateInput ["Candidate Submission"]
        PDF["📄 PDF Resume File"] --> Upload["Upload Handler (Max 5MB Validation)"]
        Track["Track Selection (Technical / Non-Technical)"] --> Upload
    end

    subgraph ExtractionProcessing ["Backend Processing"]
        Upload --> PyMuPDF["PyMuPDF (fitz) Text Extraction"]
        PyMuPDF --> Parser["Resume Parser & Keyword Normalizer"]
        Parser --> IntelligenceService["Resume Intelligence Service"]
    end

    subgraph AIEvaluation ["AI Analysis Engine"]
        IntelligenceService --> OllamaLLM["Local Ollama Service (Qwen3:4b)"]
        IntelligenceService -.-> HeuristicFallback["Heuristic / Rule-Based Fallback Engine"]
    end

    subgraph FeedbackGeneration ["Structured Feedback Output"]
        OllamaLLM --> Analysis["Candidate Profile Extraction"]
        HeuristicFallback --> Analysis
        Analysis --> ATS["ATS Compatibility Score"]
        Analysis --> Skills["Extracted Technical & Core Skills"]
        Analysis --> Strengths["Key Strengths & Project Highlights"]
        Analysis --> Growth["Actionable Structural Suggestions"]
    end
```

### Key Capabilities Confirmed in Source:
- **Strict PDF Ingestion**: Client and server-side validation enforcing PDF format and a 5MB size limit.
- **PyMuPDF Extraction**: Clean text extraction without relying on external cloud document parsers.
- **Ollama `qwen3:4b` Intelligence**: Deep parsing for role-fit assessment, experience summaries, and skill detection.
- **Resilient Fallback**: If local LLM inference is offline or busy, rule-based heuristics ensure the candidate's journey is never blocked.
- **Immediate Feedback Loop**: Dedicated `/round1-feedback` route presenting resume strengths and areas of improvement before moving forward.

---

## ⏱️ Round 2 — Online Assessment

Round 2 tests foundational competencies through a 50-question, 50-minute timed screening examination.

```mermaid
flowchart TD
    StartR2["Initialize Round 2 Session"] --> QuestionAPI["FastAPI <code>/api/test/questions</code>"]
    
    QuestionAPI --> DBFetch["MongoDB Question Aggregate Sample"]
    
    subgraph QuestionDistribution ["50 Multiple-Choice Questions (MCQs)"]
        DBFetch --> Aptitude["10 Aptitude Questions<br/>(Quantitative / Mathematical)"]
        DBFetch --> Reasoning["10 Logical Reasoning Questions<br/>(Analytical / Deductive)"]
        DBFetch --> Domain["30 Domain Questions<br/>(Technical: CS/Code | Non-Technical: Verbal)"]
    end
    
    QuestionDistribution --> TestInterface["Test Interface <code>/test</code>"]
    
    subgraph AssessmentControls ["Live Testing Environment"]
        TestInterface --> Timer["⏱️ 50-Minute Synchronized Countdown"]
        TestInterface --> Tracking["Option Selection & Answer State Tracker"]
        TestInterface --> ProctoringEngine["🛡️ Proctoring & Anti-Cheating Monitor"]
    end
    
    ProctoringEngine --> SubmitEvent["Submit Test Action<br/>(Manual or Automated on Time-Out)"]
    Tracking --> SubmitEvent
    Timer --> SubmitEvent
    
    SubmitEvent --> GradeAPI["FastAPI <code>/api/test/submit</code>"]
    GradeAPI --> AutomatedScore["Instant Category & Overall Score Calculation"]
    AutomatedScore --> NextStage["Stage Transition to <code>setup</code>"]
```

---

## 🧠 Assessment Intelligence

Performance in Round 2 is evaluated across categories to provide diagnostic insights:

```mermaid
flowchart LR
    Results["Assessment Submission<br/>(Correct Answers, Category Marks, Time Taken)"] --> BackendService["Test Feedback Service"]
    
    BackendService --> OllamaReq["Ollama LLM Engine<br/><code>qwen3:4b</code>"]
    BackendService -.-> Fallback["Diagnostic Fallback Rules"]
    
    OllamaReq --> Insights["Diagnostic Intelligence"]
    Fallback --> Insights
    
    subgraph AssessmentReport ["Generated Diagnostic Breakdown"]
        Insights --> S1["📊 Category Score Mastery (Aptitude / Reasoning / Domain)"]
        Insights --> S2["💪 Identified Cognitive Strengths"]
        Insights --> S3["⚠️ Targeted Weaknesses & Gaps"]
        Insights --> S4["🎯 Recommended Study & Preparation Actions"]
    end
```

---

## 🎯 AI Interview Setup

Between the written assessment and live interview, candidates configure their target role domain on `/setup`:

```mermaid
flowchart TD
    SetupRoute["Access Interview Setup <code>/setup</code>"] --> ValidateStage["Verify Interview Stage = 'setup'"]
    
    ValidateStage --> DomainCheck{"Interview Track Type"}
    
    DomainCheck -->|Technical Track| TechRoles["Technical Roles:<br/>• Software Engineering<br/>• Full-Stack / Frontend / Backend<br/>• AI & Machine Learning / Data Science<br/>• Cloud / DevOps / Cybersecurity<br/>• Data Engineering / GenAI & LLM"]
    
    DomainCheck -->|Non-Technical Track| NonTechRoles["Non-Technical Roles:<br/>• Human Resources (HR)<br/>• Sales & Business Development<br/>• Digital Marketing<br/>• Business Analysis<br/>• Project / Operations Management"]
    
    TechRoles --> SelectRole["Candidate Selects Target Role / Domain"]
    NonTechRoles --> SelectRole
    
    SelectRole --> StartAction["Click 'Start AI Interview' Button"]
    StartAction --> PostSetup["POST <code>/api/interview/setup</code><br/>• Updates Stage to 'ai'<br/>• Stores Configured Role"]
    PostSetup --> NavigateAI["Navigate to <code>/ai-interview</code>"]
```

---

## 🎙️ Round 3 — Conversational AI Interview

Round 3 represents the core simulation: an interactive video and voice interview with real-time browser-based computer vision and conversational turn-taking.

```mermaid
flowchart TD
    Candidate(["Candidate"])
    
    subgraph AudioPipeline ["Voice Input & Output Pipeline"]
        Candidate -->|Speaks Answer| Mic["Microphone"]
        Mic --> STT["Web Speech API<br/><code>webkitSpeechRecognition</code>"]
        STT --> Transcript["Answer Transcript Stream"]
        
        AIVoice["AI Question Vocalization"] --> TTS["Web Speech API<br/><code>speechSynthesis</code>"]
        TTS -->|Audible Speech| Candidate
    end
    
    subgraph VisionPipeline ["Real-Time Vision Pipeline"]
        Candidate -->|Video Feed| Cam["Webcam Stream"]
        Cam --> MediaPipe["Google MediaPipe Tasks Vision<br/><code>FaceLandmarker</code>"]
        MediaPipe --> AttentionMesh["Face Mesh & Head Orientation<br/>• Attention Tracking<br/>• Eye Contact Analysis<br/>• Engagement Estimation"]
    end
    
    subgraph ConversationalControl ["Interview Controller & Backend Flow"]
        Gate["Voice Readiness Gate<br/>'Are you ready to begin?'"] -->|User Confirms 'Yes / Ready'| StartQ["Activate 5-Question Interview Session"]
        Transcript --> Controller["AI Controller <code>/api/interview/answer</code>"]
        AttentionMesh --> Controller
        Controller --> EvalEngine["AI Service Evaluation Engine<br/>• Keyword Hit Analysis<br/>• Answer Completeness Score (1-10)<br/>• Quality Feedback"]
        EvalEngine --> NextQ["Fetch Next Question <code>/api/interview/question</code>"]
        NextQ --> AIVoice
    end
```

### Browser AI Technologies Confirmed in Code:
1. **Web Speech API (`webkitSpeechRecognition`)**: Converts spoken answers into real-time text without requiring paid cloud transcription APIs.
2. **Speech Synthesis (`speechSynthesis`)**: Gives MockMind AI a spoken voice to read questions and deliver audio guidance.
3. **Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)**: Client-side FaceLandmarker computer vision running on WebAssembly/WebGL to track engagement and head pose locally on the candidate's device.
4. **Conversational Readiness Gate**: Candidates confirm their readiness verbally ("Yes", "I'm ready", "Let's start") before question timers and evaluation commence.

---

## 🤖 AI Architecture

MockMind AI integrates local language models, browser APIs, and edge computer vision into a cohesive multi-modal intelligence system:

```mermaid
flowchart TB
    subgraph MockMindIntelligence ["MOCKMIND AI MULTI-MODAL ENGINE"]
        
        subgraph LocalLLMLayer ["1. Local LLM Reasoning Layer (Ollama)"]
            OllamaServer["Local Ollama Server (http://localhost:11434)"]
            QwenModel["Qwen3:4b LLM"]
            OllamaServer --- QwenModel
            
            QwenModel --> R1Task["Resume ATS & Entity Extraction"]
            QwenModel --> R2Task["Diagnostic Assessment Feedback"]
            QwenModel --> FallbackGuard["Heuristic Fallback Safety Net"]
        end
        
        subgraph EdgeVisionLayer ["2. Client-Side Edge Vision Layer"]
            MP["@mediapipe/tasks-vision (Wasm)"]
            FL["FaceLandmarker"]
            MP --- FL
            
            FL --> Attention["Real-Time Eye-Contact & Attention Tracking"]
            FL --> Pose["Head Orientation & Engagement Detection"]
        end
        
        subgraph SpeechLayer ["3. Client-Side Voice Layer"]
            WS_STT["Web Speech Recognition (STT)"]
            WS_TTS["Web Speech Synthesis (TTS)"]
            
            WS_STT --> Answers["Voice Answer Transcription"]
            WS_TTS --> Questions["Audio Question Delivery"]
            WS_TTS --> AvatarVoice["Contextual Assistant Mascot Voice"]
        end
        
    end
```

---

## 🏗️ System Architecture

Complete architectural blueprint illustrating the connection between the user's browser, the FastAPI backend, MongoDB, and local AI engines:

```mermaid
flowchart TB
    subgraph ClientTier ["Client Tier (Browser)"]
        User["Candidate"]
        
        subgraph ReactApp ["React 19 + Vite Application"]
            UI["Modern Dark Cinematic UI (Tailwind CSS)"]
            Router["React Router 7 Navigation"]
            AuthContext["Auth Context & JWT Storage"]
            AxiosClient["Axios HTTP Interceptor (Bearer Token)"]
            MediaPipeWasm["MediaPipe Tasks Vision (FaceLandmarker)"]
            SpeechEngine["Web Speech API (STT / TTS)"]
        end
        
        User <--> UI
        UI --- MediaPipeWasm
        UI --- SpeechEngine
    end
    
    subgraph ServerTier ["Server Tier (FastAPI Backend)"]
        FastAPIApp["FastAPI Application (Port 8001)"]
        CORS["CORS Middleware"]
        AuthDep["JWT Dependency Injection (get_current_user)"]
        
        subgraph Controllers ["Controllers & Services"]
            AuthController["AuthController"]
            InterviewController["InterviewController"]
            TestController["TestController"]
            AIController["AIController"]
            DashboardController["DashboardController"]
            ResumeIntel["Resume Intelligence Service"]
            TestFeedback["Test Feedback Service"]
            ScoringService["Scoring Service"]
        end
        
        FastAPIApp --> CORS
        CORS --> AuthDep
        AuthDep --> Controllers
    end
    
    subgraph DataAITier ["Data & Intelligence Tier"]
        MongoDB[("MongoDB (ai_interview_db)<br/>Motor Async Driver")]
        OllamaLocal["Ollama Local Daemon<br/><code>qwen3:4b</code> (Port 11434)"]
    end
    
    AxiosClient <==>|"RESTful API (JSON)"| FastAPIApp
    Controllers <==>|"Async Queries"| MongoDB
    ResumeIntel <==>|"HTTPX Async (Timeout 600s)"| OllamaLocal
    TestFeedback <==>|"HTTPX Async (Timeout 240s)"| OllamaLocal
```

---

## 🔌 Frontend → API → Backend

Communication between the frontend client and backend services is handled via cleanly namespaced REST APIs:

```mermaid
sequenceDiagram
    autonumber
    participant UI as React 19 Frontend
    participant API as Axios Client
    participant Route as FastAPI Router
    participant Ctrl as Controller
    participant DB as MongoDB
    participant AI as Ollama (Qwen3:4b)

    UI->>API: User Action (Upload Resume / Submit Answer)
    API->>Route: POST /api/interview/round1 (with Bearer Token)
    Route->>Ctrl: Validate JWT & Route to InterviewController
    Ctrl->>DB: Fetch & Update Interview Stage Document
    Ctrl->>AI: Request Analysis via HTTPX (Async)
    AI-->>Ctrl: Return Extracted JSON Intelligence
    Ctrl->>DB: Persist Scores & Feedback
    Ctrl-->>API: Return JSON Response
    API-->>UI: Update React State & Navigate Stage
```

### API Endpoint Reference

#### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user credentials and return JWT bearer token |
| `PUT` | `/api/auth/profile` | Update candidate profile attributes |
| `POST` | `/api/auth/change-password` | Update existing user password |

#### 🎤 Interview Lifecycle (`/api/interview`)
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/interview/start` | Initialize new interview session (`technical` or `non-technical`) |
| `POST` | `/api/interview/round1` | Upload PDF resume for parsing and ATS scoring |
| `POST` | `/api/interview/setup` | Set target domain role for Round 3 |
| `GET` | `/api/interview/result` | Retrieve full interview results across all rounds |
| `GET` | `/api/interview/stage` | Validate current interview pipeline stage |
| `GET` | `/api/interview/history` | Fetch user interview history |

#### 🧪 Online Assessment (`/api/test`)
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/test/questions` | Retrieve 50 randomized MCQs (10 Aptitude, 10 Reasoning, 30 Domain) |
| `POST` | `/api/test/submit` | Submit test answers for automated evaluation |

#### 🤖 AI Interview Interaction (`/api/interview`)
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/interview/readiness` | Evaluate candidate verbal readiness response |
| `POST` | `/api/interview/question` | Fetch next tailored AI interview question |
| `POST` | `/api/interview/answer` | Submit spoken answer transcript for AI scoring |
| `POST` | `/api/interview/skip` | Skip the current active interview question |

#### 📊 Dashboard Analytics (`/api/dashboard`)
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/overview` | Global candidate overview metrics (Total, Average, Best, Recent) |
| `GET` | `/api/dashboard/analytics` | Track-filtered performance analytics (`technical` vs `non-technical`) |
| `GET` | `/api/dashboard/history` | Full candidate interview log |

---

## 🔗 Interview Data Flow

```mermaid
flowchart TD
    Candidate(["Candidate Input"]) --> AuthSession["User Session (JWT)"]
    AuthSession --> InterviewDoc["New Interview Record created in MongoDB"]
    
    InterviewDoc --> ResumeData["Round 1: Resume Text & ATS Metrics"]
    ResumeData --> TestDoc["Round 2: 50 Answer Selections & Proctoring Violations"]
    TestDoc --> RoleData["Setup: Selected Target Role"]
    RoleData --> AIDoc["Round 3: 5 Spoken Answers & Attention Scores"]
    
    AIDoc --> ConsolidatedResults["Multi-Round Score Aggregation Engine"]
    ConsolidatedResults --> DBStore[("Persisted in MongoDB <code>interviews</code>")]
    
    DBStore --> DashView["Dashboard Overview & Metric Cards"]
    DBStore --> ReportView["Detailed Performance Feedback Report"]
    DBStore --> HistoryView["Past Interview Timeline"]
```

---

## 🗄️ Data Layer

MockMind AI utilizes an asynchronous **MongoDB** document database via the **Motor** driver. The database stores structured records across verified collections:

| Collection | Role in Platform | Confirmed Fields & Schemas |
| :--- | :--- | :--- |
| `users` | User credentials & accounts | `username`, `email`, `hashed_password`, `name`, `created_at` |
| `interviews` | Master state of each interview session | `user_id`, `interview_type`, `stage`, `resume_data`, `test_questions`, `test_score`, `round3_state`, `scores`, `overall_score` |
| `aptitude_questions` | Aptitude MCQ question bank | `question`, `options`, `correct_answer`, `category: "aptitude"` |
| `reasoning_questions`| Logical reasoning question bank | `question`, `options`, `correct_answer`, `category: "reasoning"` |
| `tests` | Technical domain question bank | `question`, `options`, `correct_answer`, `category: "technical"` |
| `verbal_questions` | Non-technical verbal question bank | `question`, `options`, `correct_answer`, `category: "verbal"` |

---

## 🔐 Interview Integrity & Proctoring

The Round 2 Online Assessment is protected by automated proctoring safeguards implemented directly within `Test.jsx`:

```mermaid
flowchart TD
    CandidateTest["Candidate Takes Assessment"] --> Monitor["Continuous Security Monitor"]
    
    subgraph Safeguards ["Proctoring Event Handlers"]
        Monitor --> Fullscreen["🖥️ Fullscreen Enforcement<br/>(Exit triggers warning)"]
        Monitor --> Visibility["👀 Tab Switch Detection<br/>(<code>visibilitychange</code> event)"]
        Monitor --> WindowBlur["🪟 Window Blur Detection<br/>(<code>blur</code> event)"]
        Monitor --> ClipboardLock["🚫 Copy / Paste Restrictions<br/>(Intercepts clipboard shortcuts)"]
    end
    
    Safeguards --> ViolationCounter["Violation Increment Counter"]
    
    ViolationCounter --> ThresholdCheck{"Violation Count Threshold"}
    ThresholdCheck -->|Minor Violations| WarningModal["Display Security Warning Banner"]
    ThresholdCheck -->|Threshold Exceeded| AutoTerminate["Automatic Security Termination & Immediate Submission"]
    
    AutoTerminate --> AutoSubmit["POST /api/test/submit (Flagged Submission)"]
```

---

## 📊 Performance Intelligence

The candidate dashboard aggregates multi-round performance metrics to provide continuous insights into progress:

```mermaid
flowchart LR
    R1Score["Round 1:<br/>Resume Score"] --> Engine["Scoring Aggregator"]
    R2Score["Round 2:<br/>Test Score (out of 50)"] --> Engine
    R3Score["Round 3:<br/>AI Interview Score"] --> Engine
    
    Engine --> TotalScore["Consolidated Performance Score (0-100%)"]
    
    TotalScore --> DashboardCards["Dashboard KPI Cards:<br/>• Total Interviews<br/>• Completed Interviews<br/>• Average Score<br/>• Best Score"]
    TotalScore --> DomainToggle["Track Analytics Toggle:<br/>• Technical Track Analytics<br/>• Non-Technical Track Analytics"]
    TotalScore --> HistoricalLog["Interview Timeline & Past Reports"]
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `19.2.4` | Component architecture & modern UI rendering |
| **Vite** | `8.0.4` | Development server & lightning-fast production bundler |
| **React Router** | `7.14.0` | Client-side routing with protected layout wrappers |
| **Tailwind CSS** | `3.4.19` | Cinematic dark UI styling with warm peach accents |
| **MediaPipe Tasks Vision** | `1.0.1` | Real-time face tracking & eye contact analysis |
| **Lucide React** | `1.8.0` | Consistent iconography across all pages |
| **Axios** | `1.15.0` | Promise-based HTTP client with authorization headers |
| **Web Speech API** | Native Browser API | Client-side Speech Recognition (STT) and Synthesis (TTS) |

### Backend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **FastAPI** | Current | High-performance asynchronous REST API framework |
| **Uvicorn** | Standard | Lightning-fast ASGI production web server |
| **Motor** | Current | Asynchronous Python driver for MongoDB |
| **PyMuPDF (`fitz`)** | Current | PDF text extraction and document preprocessing |
| **HTTPX** | Current | Asynchronous HTTP client for local Ollama communication |
| **Pydantic** | v2 / email | Schema definition, input validation, and settings |
| **Python-Jose** | Cryptography | JWT encoding, decoding, and bearer token handling |
| **Passlib** | Bcrypt | Secure, one-way password hashing and verification |

### Local AI & Storage
| Technology | Details | Purpose |
| :--- | :--- | :--- |
| **Ollama** | Local runtime (`:11434`) | Zero-cost, private, offline LLM execution |
| **Qwen3:4b** | Model | Structured resume parsing and test diagnostic feedback |
| **MongoDB** | Database (`:27017`) | NoSQL document storage for users, interviews, and question banks |

---

## 📂 Project Structure

```text
Ai_Interview/
├── backend/
│   ├── app/
│   │   ├── controllers/            # Request handlers and business orchestration
│   │   │   ├── ai_controller.py
│   │   │   ├── auth_controller.py
│   │   │   ├── dashboard_controller.py
│   │   │   ├── interview_controller.py
│   │   │   └── test_controller.py
│   │   ├── core/                   # Security, JWT tokens, and settings
│   │   ├── db/                     # MongoDB connection life-cycle handlers
│   │   ├── dependencies/           # Database session and auth dependencies
│   │   ├── exceptions/             # Global error handlers
│   │   ├── middleware/             # Custom authentication middleware
│   │   ├── models/                 # Internal data models
│   │   ├── routes/                 # FastAPI API route declarations
│   │   │   ├── ai_routes.py
│   │   │   ├── auth_routes.py
│   │   │   ├── dashboard_routes.py
│   │   │   ├── interview_routes.py
│   │   │   └── test_routes.py
│   │   ├── schemas/                # Pydantic request and response schemas
│   │   ├── services/               # Deep logic (AI, resume parsing, scoring)
│   │   │   ├── ai_service.py
│   │   │   ├── dashboard_service.py
│   │   │   ├── resume_intelligence_service.py
│   │   │   ├── resume_service.py
│   │   │   ├── scoring_service.py
│   │   │   └── test_feedback_service.py
│   │   └── utils/                  # Text normalizers and helpers
│   ├── main.py                     # Backend application entry point
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Sample environment configuration
│
├── frontend/
│   ├── src/
│   │   ├── assets/                 # Brand assets and visual imagery
│   │   ├── components/
│   │   │   ├── ai/                 # Avatar logic and speech synthesis
│   │   │   ├── dashboard/          # Layouts, navigation bars, and headers
│   │   │   └── landing/            # Landing page navigation and footer
│   │   ├── context/                # AuthContext and state management
│   │   ├── pages/
│   │   │   ├── auth/               # Login and Register pages
│   │   │   ├── dashboard/          # Dashboard metrics and analytics
│   │   │   ├── history/            # Interview history log
│   │   │   ├── interview/          # Staged interview pipeline:
│   │   │   │   ├── Round1.jsx          # Resume screening
│   │   │   │   ├── Round1Feedback.jsx  # Resume intelligence feedback
│   │   │   │   ├── Test.jsx            # 50-question online assessment
│   │   │   │   ├── Setup.jsx           # Domain and role configuration
│   │   │   │   ├── AIInterview.jsx     # Live AI voice and vision interview
│   │   │   │   └── Feedback.jsx        # Final combined performance review
│   │   │   ├── landing/            # Home, Features, How It Works, Why MockMind
│   │   │   └── profile/            # User profile management
│   │   ├── services/               # Axios API instance
│   │   ├── App.jsx                 # Master application routing
│   │   ├── index.css               # Design system, variables, and typography
│   │   └── main.jsx                # React DOM entry point
│   ├── package.json                # Frontend dependencies and npm scripts
│   ├── tailwind.config.js          # Tailwind CSS theme configuration
│   └── vite.config.js              # Vite configuration
│
└── README.md                       # Root documentation
```

---

## 🌐 Application Route Map

```mermaid
graph LR
    subgraph PublicRoutes ["Public / Marketing Routes"]
        R_Home["<code>/</code> (Landing Home)"]
        R_Feat["<code>/features</code> (Features Showcase)"]
        R_HIW["<code>/how-it-works</code> (Pipeline Guide)"]
        R_Why["<code>/why-mockmind</code> (Platform Value)"]
    end

    subgraph AuthRoutes ["Authentication Routes"]
        R_Log["<code>/login</code> (Candidate Login)"]
        R_Reg["<code>/register</code> (Create Account)"]
    end

    subgraph DashboardRoutes ["Candidate Dashboard Routes (Protected)"]
        R_Dash["<code>/dashboard</code> (Metrics & Analytics)"]
        R_Hist["<code>/history</code> (Session Archive)"]
        R_Prof["<code>/profile</code> (User Profile & Password)"]
    end

    subgraph InterviewRoutes ["Interview Pipeline Routes (Protected)"]
        R_R1["<code>/round1</code> (Resume Screening)"]
        R_R1F["<code>/round1-feedback</code> (Resume Intelligence)"]
        R_Test["<code>/test</code> (Online Assessment)"]
        R_Setup["<code>/setup</code> (AI Interview Setup)"]
        R_AI["<code>/ai-interview</code> (Conversational Interview)"]
        R_Feed["<code>/feedback</code> (Final Consolidated Report)"]
    end
```

---

## ⚙️ Environment Configuration

Configure the backend environment by creating a `.env` file in the `backend/` directory based on `backend/.env.example`:

```env
MONGO_URI=mongodb://localhost:27017/
DATABASE_NAME=ai_interview_db
SECRET_KEY=your_super_secret_jwt_key_please_change
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

## 🧠 Local AI Runtime

MockMind AI runs its language model locally using **Ollama**, ensuring complete candidate data privacy, zero API subscription costs, and offline capability:

```mermaid
flowchart LR
    App["MockMind AI Backend"] -->|"HTTP /api/generate"| Ollama["Local Ollama Daemon<br/>(http://localhost:11434)"]
    Ollama --> Model["Qwen3:4b LLM"]
    Model -->|"JSON Output"| App
```

### Starting the Local Model:
```bash
# 1. Install Ollama from https://ollama.com
# 2. Pull the configured Qwen model:
ollama pull qwen3:4b

# 3. Ensure the daemon is running (default port 11434):
ollama serve
```

*Note: The platform features automated fallback heuristics. If Ollama is temporarily offline or processing on low-spec hardware, the system transitions smoothly to rule-based evaluation without disrupting the candidate's interview.*

---

## 🚀 Installation & Setup

```mermaid
flowchart LR
    Step1["1. Start MongoDB<br/>(Port 27017)"] --> Step2["2. Pull & Run Ollama<br/>(qwen3:4b)"]
    Step2 --> Step3["3. Start FastAPI Backend<br/>(Port 8001)"]
    Step3 --> Step4["4. Start Vite Frontend<br/>(Port 5173)"]
```

### 1. Prerequisites
- **Node.js** (v18+) & `npm`
- **Python** (v3.10+)
- **MongoDB** running on `localhost:27017`
- **Ollama** with `qwen3:4b` installed

### 2. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS / Linux:
# source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --reload --port 8001
```
Interactive API documentation will be available at: `http://127.0.0.1:8001/docs`

### 3. Frontend Setup
```bash
# In a separate terminal, navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
Access the application in your browser at: `http://localhost:5173`

---

## 👨‍💻 Typical User Journey

1. **Discovery & Sign-Up**: The candidate explores platform features on the landing page, creates an account, and logs in.
2. **Dashboard Overview**: The candidate reviews their previous scores and selects **Start Interview** (choosing either the *Technical* or *Non-Technical* track).
3. **Resume Submission**: In Round 1, the candidate uploads their PDF resume. The system validates the file, extracts text via PyMuPDF, and computes an ATS score.
4. **Resume Intelligence**: The candidate inspects detected skills, strengths, and formatting recommendations on `/round1-feedback`.
5. **Timed Assessment**: In Round 2, the candidate enters fullscreen to complete 50 MCQs across Aptitude, Reasoning, and Domain competencies within 50 minutes under active proctoring.
6. **Role Configuration**: On `/setup`, the candidate picks their specific target role from the curated domain catalog.
7. **Conversational AI Practice**: In Round 3, the candidate activates camera and microphone, verifies readiness verbally, and answers 5 AI-vocalized questions while MediaPipe assesses engagement.
8. **Holistic Feedback**: The candidate reviews an actionable report combining scores across all three rounds with specific improvement guidance.

---

## 💡 Why MockMind AI?

Traditional interview tools suffer from major limitations: simple chatbots only prompt generic questions without context, while online tests lack conversational depth. 

**MockMind AI combines the entire recruitment pipeline into one integrated preparation ecosystem:**

- **Comprehensive End-to-End Journey**: Integrates resume screening, cognitive/domain testing, and conversational practice.
- **Privacy-First Local AI**: Operates on a local LLM via Ollama (`qwen3:4b`)—keeping candidate resumes and responses private with zero third-party API costs.
- **Multi-Modal Interaction**: Incorporates Web Speech API (STT & TTS) alongside Google MediaPipe vision for real-time engagement analysis.
- **Enterprise-Grade Proctoring**: Simulates realistic exam conditions with fullscreen, blur, and tab-switch monitoring.
- **Actionable Growth Intelligence**: Delivers diagnostic feedback after every stage, helping candidates identify exact areas to study before real interviews.

---

## 📋 Product Capabilities Matrix

| Module | Core Functionality | Confirmed Implementation Technologies |
| :--- | :--- | :--- |
| **Authentication** | Secure JWT authentication & profile updates | FastAPI, `python-jose`, `passlib[bcrypt]` |
| **Resume Screening** | PDF parsing, ATS scoring & keyword extraction | PyMuPDF (`fitz`), Ollama `qwen3:4b`, FastAPI |
| **Online Assessment** | 50 MCQs (Aptitude, Reasoning, Domain) | MongoDB Aggregation, React 19, FastAPI |
| **Proctoring Engine** | Fullscreen, tab visibility & clipboard control | React DOM event listeners (`visibilitychange`, `blur`) |
| **Assessment Intelligence**| Automated grading & diagnostic feedback | Test Feedback Service, Ollama `qwen3:4b` |
| **Voice Interaction** | Speech-to-text answers & audio question delivery | Web Speech API (`SpeechRecognition`, `speechSynthesis`) |
| **Vision Tracking** | Head pose, attention & eye contact estimation | Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) |
| **Analytics Dashboard** | Track toggles, KPI cards & performance history | React 19, Axios, Motor (MongoDB) |

---

## 🔭 Future Roadmap

### ✅ Currently Implemented & Verified
- [x] Full multi-round recruitment pipeline (Round 1 → Round 2 → Setup → Round 3 → Feedback).
- [x] Local private LLM intelligence (`qwen3:4b` via Ollama) with fallback heuristic handlers.
- [x] PyMuPDF resume parsing and automated ATS evaluation.
- [x] 50-question proctored online assessment with 50-minute countdown.
- [x] Browser-based proctoring safeguards (tab switch, window blur, clipboard locks).
- [x] Live video preview with MediaPipe FaceLandmarker attention tracking.
- [x] Hands-free conversational speech recognition and vocalized speech synthesis.
- [x] Interactive voice mascot assistant delivering situational advice across the application.
- [x] Comprehensive multi-round scoring and performance dashboard analytics.

### 🚀 Future Enhancements (Planned)
- [ ] **Candidate Video Replay Analysis**: Session recording playback with timestamped feedback markers.
- [ ] **Voice Emotion & Pitch Diagnostics**: Vocal acoustic analysis for confidence, pace, and pause tracking.
- [ ] **In-Browser Coding Sandbox**: Interactive code editor with test-case execution for software engineering candidates.
- [ ] **Company-Specific Practice Packs**: Question catalogs modeled after specific corporate recruitment tracks.
- [ ] **Multilingual Interview Simulation**: Multi-language translation support for international interview preparation.

---

## 👨‍💻 Author

<div align="center">

### **Sujan Pradhan**
**CSE-AI Student**  
MockMind AI Project Lead

</div>
