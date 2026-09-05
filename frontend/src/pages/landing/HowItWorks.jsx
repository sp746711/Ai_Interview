import React from 'react';
import { UploadCloud, CheckCircle2, MessageSquare, BarChart3, Check } from 'lucide-react';
import './HowItWorks.css';

const timelineSteps = [
  {
    number: '01',
    title: 'Upload Resume',
    desc: 'Let our AI understand your background.',
    accentClass: 'hiw-marker-gold',
  },
  {
    number: '02',
    title: 'Take Assessment',
    desc: 'Evaluate your technical skills and knowledge.',
    accentClass: 'hiw-marker-coral',
  },
  {
    number: '03',
    title: 'AI Interview',
    desc: 'Practice with an AI interviewer.',
    accentClass: 'hiw-marker-purple',
  },
  {
    number: '04',
    title: 'Get Feedback',
    desc: 'Receive detailed analysis and recommendations.',
    accentClass: 'hiw-marker-green',
  },
];

const detailedCards = [
  {
    id: 'card-1',
    number: '1.',
    title: '1. Upload Your Resume',
    desc: 'Provide your resume so the platform can understand your background, skills, and experience.',
    icon: UploadCloud,
    cardClass: 'hiw-card-gold',
    iconCircleBg: 'rgba(217, 119, 6, 0.14)',
    iconColor: '#f59e0b',
    mockupType: 'upload',
    checklist: [
      'Extract key skills and technologies',
      'Identify your strengths',
      'Tailor the interview experience',
    ],
  },
  {
    id: 'card-2',
    number: '2.',
    title: '2. Take the Skill Assessment',
    desc: 'Complete role-specific questions tailored to your resume and target position.',
    icon: CheckCircle2,
    cardClass: 'hiw-card-coral',
    iconCircleBg: 'rgba(243, 160, 128, 0.14)',
    iconColor: '#f3a080',
    mockupType: 'assessment',
    checklist: [
      'Questions based on your resume',
      'Covers multiple technical areas',
      'Helps identify your current skill level',
    ],
  },
  {
    id: 'card-3',
    number: '3.',
    title: '3. Practice the AI Interview',
    desc: 'Have a realistic interview conversation with an AI interviewer that adapts to your skills and performance.',
    icon: MessageSquare,
    cardClass: 'hiw-card-purple',
    iconCircleBg: 'rgba(196, 181, 253, 0.14)',
    iconColor: '#c4b5fd',
    mockupType: 'interview',
    checklist: [
      'Realistic interview experience',
      'Dynamic and role-specific questions',
      'Conversation adapts to your responses',
    ],
  },
  {
    id: 'card-4',
    number: '4.',
    title: '4. Get Your Feedback',
    desc: 'Receive a detailed performance analysis with scores, strengths, areas to improve, and personalized recommendations.',
    icon: BarChart3,
    cardClass: 'hiw-card-green',
    iconCircleBg: 'rgba(134, 239, 172, 0.14)',
    iconColor: '#86efac',
    mockupType: 'feedback',
    checklist: [
      'Detailed performance analysis',
      'Strengths and improvement areas',
      'Personalized learning recommendations',
    ],
  },
];

const LandingHowItWorks = () => {
  // Ensure the shared footer is removed specifically from the How It Works page
  React.useEffect(() => {
    const footer = document.querySelector('.landing-page > footer');
    if (footer) {
      const originalDisplay = footer.style.display;
      footer.style.display = 'none';
      return () => {
        footer.style.display = originalDisplay;
      };
    }
  }, []);

  return (
    <div className="how-it-works-page">
      {/* --------------------------------------------------
          1. Hero Section with Cinematic Workspace Background
          -------------------------------------------------- */}
      <section className="hiw-hero-section">
        <div className="hiw-hero-glow" />
        <div className="hiw-hero-container">
          <div className="hiw-hero-content">
            <div className="hiw-eyebrow">
              <span className="hiw-eyebrow-dot" />
              HOW IT WORKS
            </div>
            <h1 className="hiw-hero-title">
              Your Step-by-Step Journey<br />
              <span className="hiw-hero-accent">to Interview Success</span>
            </h1>
            <p className="hiw-hero-desc">
              A simple and structured process to help you prepare, practice and improve with MockMind AI.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          2. Horizontal Step Timeline (01 to 04 with connector)
          -------------------------------------------------- */}
      <section className="hiw-timeline-section">
        <div className="hiw-timeline-card">
          <div className="hiw-timeline-track">
            <div className="hiw-timeline-line" />
            {timelineSteps.map((step) => (
              <div key={step.number} className="hiw-timeline-step">
                <div className={`hiw-timeline-marker ${step.accentClass}`}>
                  {step.number}
                </div>
                <h3 className="hiw-timeline-step-title">{step.title}</h3>
                <p className="hiw-timeline-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          3. Four Detailed Step Cards (Desktop: 4 across)
          -------------------------------------------------- */}
      <section className="hiw-cards-section">
        <div className="hiw-cards-grid">
          {detailedCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className={`hiw-card ${card.cardClass}`}>
                <div>
                  {/* Card Header */}
                  <div className="hiw-card-header">
                    <div
                      className="hiw-card-icon-circle"
                      style={{ backgroundColor: card.iconCircleBg, color: card.iconColor }}
                    >
                      <Icon size={19} />
                    </div>
                    <h2 className="hiw-card-title">{card.title}</h2>
                  </div>

                  <p className="hiw-card-desc">{card.desc}</p>

                  {/* Mini Interface Mockup */}
                  <div className="hiw-mockup-box">
                    {/* Mockup 1: Resume Upload Box */}
                    {card.mockupType === 'upload' && (
                      <div className="hiw-upload-dropzone">
                        <div className="hiw-upload-icon-wrap">
                          <UploadCloud size={15} />
                        </div>
                        <p className="hiw-upload-main-text">
                          Drag and drop your resume here
                        </p>
                        <p className="hiw-upload-sub-text">
                          Supports PDF, DOC, DOCX (Max 5MB)
                        </p>
                      </div>
                    )}

                    {/* Mockup 2: Skill Assessment */}
                    {card.mockupType === 'assessment' && (
                      <div className="hiw-assessment-mock">
                        <div className="hiw-assessment-top">
                          <span>Skill Assessment</span>
                          <span>3 / 15</span>
                        </div>
                        <div className="hiw-progress-bar-bg">
                          <div className="hiw-progress-bar-fill" />
                        </div>
                        <p className="hiw-assessment-question">
                          Which is used to create a React component?
                        </p>
                        <div className="hiw-assessment-option hiw-assessment-option-active">
                          <span style={{ color: '#f3a080', fontWeight: 700 }}>•</span>
                          <span>function MyComponent()</span>
                        </div>
                        <div className="hiw-assessment-option">
                          <span style={{ opacity: 0.4 }}>•</span>
                          <span>createComponent()</span>
                        </div>
                      </div>
                    )}

                    {/* Mockup 3: AI Interviewer Chat */}
                    {card.mockupType === 'interview' && (
                      <div className="hiw-interview-mock">
                        <div className="hiw-interview-header">
                          <span className="hiw-pulsing-dot" />
                          <span>AI Interviewer</span>
                        </div>
                        <div className="hiw-chat-bubble-ai">
                          Tell me about how React handles state updates under the hood.
                        </div>
                        <div className="hiw-chat-bubble-user">
                          React batches state updates together to optimize DOM rendering...
                        </div>
                      </div>
                    )}

                    {/* Mockup 4: Performance Summary Feedback */}
                    {card.mockupType === 'feedback' && (
                      <div className="hiw-feedback-mock">
                        <div className="hiw-feedback-top">
                          <span className="hiw-feedback-label">Performance Summary</span>
                          <span className="hiw-feedback-score-badge">78% Good</span>
                        </div>
                        <div className="hiw-metric-row">
                          <span>Problem Solving</span>
                          <div className="hiw-metric-bar">
                            <div className="hiw-metric-fill" style={{ width: '85%', backgroundColor: '#86efac' }} />
                          </div>
                          <span>85%</span>
                        </div>
                        <div className="hiw-metric-row">
                          <span>Code Quality</span>
                          <div className="hiw-metric-bar">
                            <div className="hiw-metric-fill" style={{ width: '72%', backgroundColor: '#86efac' }} />
                          </div>
                          <span>72%</span>
                        </div>
                        <div className="hiw-metric-row">
                          <span>Communication</span>
                          <div className="hiw-metric-bar">
                            <div className="hiw-metric-fill" style={{ width: '76%', backgroundColor: '#86efac' }} />
                          </div>
                          <span>76%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supporting Checklist Items */}
                <ul className="hiw-checklist">
                  {card.checklist.map((item, idx) => (
                    <li key={idx} className="hiw-checklist-item">
                      <Check className="hiw-check-icon" style={{ color: card.iconColor }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------
          4. Bottom Closing Quote Section
          "A Better You / For A Brighter Tomorrow"
          “Success is not luck, it’s preparation.” — MockMind AI
          -------------------------------------------------- */}
      <section className="hiw-quote-section">
        <div className="hiw-quote-card">
          <div className="hiw-quote-grid">
            <div className="hiw-quote-left">
              <h2 className="hiw-quote-heading">
                A Better You<br />
                <span className="hiw-quote-heading-accent">For A Brighter Tomorrow</span>
              </h2>
            </div>
            <div className="hiw-quote-right">
              <blockquote className="hiw-quote-text">
                “Success is not luck, it’s preparation.”
              </blockquote>
              <p className="hiw-quote-author">— MockMind AI</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingHowItWorks;
