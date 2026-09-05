import React, { useEffect } from 'react';
import {
  FileText,
  Target,
  Bot,
  Sparkles,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
} from 'lucide-react';
import './Features.css';

const features = [
  {
    icon: FileText,
    cardClass: 'features-card-amber',
    iconStyle: 'features-icon-amber',
    title: 'Resume Analysis',
    description:
      'Upload your resume to extract key skills, relevant experience, core competencies, and critical interview gaps.',
    bullets: [
      'Skills and technologies extracted',
      'Relevant strengths surfaced for focus',
      'Targeted gaps pinpointed for growth',
    ],
  },
  {
    icon: Target,
    cardClass: 'features-card-coral',
    iconStyle: 'features-icon-coral',
    title: 'Targeted Skill Assessment',
    description:
      'Evaluate technical knowledge through role-specific evaluations designed around your background and target position.',
    bullets: [
      'Questions tailored to your target role',
      'Systematic technical knowledge evaluation',
      'Screening-style benchmark before practice',
    ],
  },
  {
    icon: Bot,
    cardClass: 'features-card-purple',
    iconStyle: 'features-icon-purple',
    title: 'AI Interviewer',
    description:
      'Practice realistic interview conversations that dynamically adapt to your answers and simulate real interview pressure.',
    bullets: [
      'Conversational interview practice',
      'Adaptive follow-up questions in real time',
      'Configurable role and difficulty levels',
    ],
  },
  {
    icon: Sparkles,
    cardClass: 'features-card-green',
    iconStyle: 'features-icon-green',
    title: 'AI Feedback & Recommendations',
    description:
      'Receive granular performance scoring, comprehensive strengths breakdown, and actionable next-step recommendations.',
    bullets: [
      'Overall and round-specific scoring metrics',
      'Clear identification of strengths & gaps',
      'Personalized roadmap for improvement',
    ],
  },
];

const platformJourney = [
  { step: '01', title: 'Resume Analysis', icon: FileText },
  { step: '02', title: 'Skill Assessment', icon: Target },
  { step: '03', title: 'AI Interview', icon: Bot },
  { step: '04', title: 'Feedback & Insights', icon: BarChart3 },
];

const aboutConcepts = [
  {
    icon: ShieldCheck,
    title: 'Built for Real Preparation',
    description:
      'Practice with adaptive role-specific questions and realistic scenarios designed to simulate actual hiring standards.',
  },
  {
    icon: Zap,
    title: 'AI-Driven Insights',
    description:
      'Gain objective evaluation metrics, discover hidden gaps in your answers, and receive personalized coaching recommendations.',
  },
  {
    icon: Award,
    title: 'A Brighter Career Tomorrow',
    description:
      'Transform interview hesitation into measurable readiness to successfully unlock high-impact opportunities in tech.',
  },
];

const LandingFeatures = () => {
  // Ensure the shared footer is removed specifically from the Features page
  useEffect(() => {
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
    <div className="features-page">
      {/* ---------------- Hero / Introduction ---------------- */}
      <section className="features-hero-section">
        <div className="features-hero-glow" />
        <div className="features-hero-container">
          <div className="features-hero-content">
            <div className="features-eyebrow">
              <span className="features-eyebrow-dot" />
              <span>Platform Features</span>
            </div>

            <h1 className="features-hero-title">
              Everything You Need
              <br />
              <span className="features-hero-accent">
                to Prepare for Your Next Interview
              </span>
            </h1>

            <p className="features-hero-desc">
              MockMind AI provides a complete, structured and personalized
              interview preparation experience.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Four Main Feature Cards ---------------- */}
      <section className="features-cards-section">
        <div className="features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`features-card ${feature.cardClass}`}
              >
                <div className="features-card-top">
                  <div className={`features-icon-circle ${feature.iconStyle}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="features-card-title">{feature.title}</h2>
                  <p className="features-card-desc">{feature.description}</p>
                  <ul className="features-card-bullets">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="features-card-bullet-item">
                        <span className="features-card-bullet-dot" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="features-card-bottom">
                  <div className="features-card-action" aria-hidden="true">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Complete Platform Experience ---------------- */}
      <section className="features-platform-section">
        <div className="features-platform-card">
          <div className="features-platform-header">
            <p className="features-platform-eyebrow">
              Complete Platform Experience
            </p>
            <h2 className="features-platform-title">From Resume to Readiness</h2>
            <p className="features-platform-desc">
              All the tools you need in one platform to practice, evaluate
              and improve your interview performance.
            </p>
          </div>

          <div className="features-platform-flow">
            {platformJourney.map((item, index) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={item.title}>
                  <div className="features-platform-step">
                    <div className="features-platform-step-icon">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="features-platform-step-info">
                      <span className="features-platform-step-num">
                        Step {item.step}
                      </span>
                      <span className="features-platform-step-title">
                        {item.title}
                      </span>
                    </div>
                  </div>

                  {index < platformJourney.length - 1 && (
                    <div className="features-platform-separator">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- About MockMind AI ---------------- */}
      <section className="features-about-section">
        <div className="features-about-card">
          <div className="features-about-grid">
            <div className="features-about-left">
              <p className="features-about-eyebrow">About MockMind AI</p>
              <h2 className="features-about-title">More Than Just Practice</h2>
              <p className="features-about-desc">
                MockMind AI is an AI-powered interview preparation platform
                designed to help candidates practice, evaluate, and systematically
                improve technical interview skills. Built for developers and
                technical candidates, the platform combines resume intelligence with
                realistic interview simulations and actionable feedback so you
                prepare with purpose.
              </p>
            </div>

            <div className="features-concepts-list">
              {aboutConcepts.map((concept) => {
                const Icon = concept.icon;
                return (
                  <div key={concept.title} className="features-concept-card">
                    <div className="features-concept-icon-box">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="features-concept-content">
                      <h3 className="features-concept-title">
                        {concept.title}
                      </h3>
                      <p className="features-concept-desc">
                        {concept.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingFeatures;
