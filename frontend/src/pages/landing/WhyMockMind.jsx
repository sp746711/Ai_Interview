import React from 'react';
import {
  UserCheck,
  FileText,
  Bot,
  BarChart3,
  GraduationCap,
  Briefcase,
  Code2,
} from 'lucide-react';
import './WhyMockMind.css';

const featureCards = [
  {
    num: '01',
    title: 'Personalized Preparation',
    desc: 'Get a preparation experience based on your resume, skills, and target role.',
    icon: UserCheck,
    cardClass: 'wmm-card-orange',
    numClass: 'wmm-num-orange',
    iconClass: 'wmm-icon-orange',
  },
  {
    num: '02',
    title: 'Resume-Based Insights',
    desc: 'Identify relevant skills and technologies from your resume to focus on what matters.',
    icon: FileText,
    cardClass: 'wmm-card-red',
    numClass: 'wmm-num-red',
    iconClass: 'wmm-icon-red',
  },
  {
    num: '03',
    title: 'AI-Powered Practice',
    desc: 'Experience realistic interview conversations with an AI interviewer that adapts to your responses.',
    icon: Bot,
    cardClass: 'wmm-card-purple',
    numClass: 'wmm-num-purple',
    iconClass: 'wmm-icon-purple',
  },
  {
    num: '04',
    title: 'Actionable Feedback',
    desc: 'Get detailed performance analysis, strengths, areas to improve, and personalized recommendations.',
    icon: BarChart3,
    cardClass: 'wmm-card-green',
    numClass: 'wmm-num-green',
    iconClass: 'wmm-icon-green',
  },
];

const audiences = [
  {
    icon: GraduationCap,
    title: 'Students & Fresh Graduates',
    desc: 'Build interview confidence and prepare for your career.',
  },
  {
    icon: Briefcase,
    title: 'Job Seekers',
    desc: 'Practice before upcoming interviews and improve your performance.',
  },
  {
    icon: Code2,
    title: 'Developers & Technical Candidates',
    desc: 'Strengthen your technical skills and get ready for real-world interviews.',
  },
];

const LandingWhyMockMind = () => {
  // Ensure the shared footer is removed specifically from the Why MockMind AI page
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
    <div className="why-mockmind-page">
      {/* --------------------------------------------------
          1. Hero Section with Cinematic Workspace Atmosphere
          -------------------------------------------------- */}
      <section className="wmm-hero-section">
        <div className="wmm-hero-glow" />
        <div className="wmm-hero-container">
          <div className="wmm-hero-content">
            <div className="wmm-eyebrow">
              <span className="wmm-eyebrow-dot" />
              WHY MOCKMIND AI?
            </div>
            <h1 className="wmm-hero-title">
              Prepare with Purpose,<br />
              <span className="wmm-hero-accent">Not Just Practice.</span>
            </h1>
            <p className="wmm-hero-desc">
              MockMind AI brings together resume analysis, skill assessment,
              AI interview practice, and detailed feedback — so you can prepare
              smarter, build confidence, and achieve your career goals.
            </p>
            <div className="wmm-hero-tagline">
              <span className="wmm-tagline-bar" />
              <span>More Practice. Real Progress.</span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          2. "Why Use MockMind AI?" Section (4 Cards in 1 Row)
          -------------------------------------------------- */}
      <section className="wmm-features-section">
        <div className="wmm-features-header">
          <h2 className="wmm-section-title">Why Use MockMind AI?</h2>
          <p className="wmm-section-subtitle">
            A complete and structured platform designed for your interview success.
          </p>
        </div>

        <div className="wmm-features-grid">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.num} className={`wmm-feature-card ${card.cardClass}`}>
                <div className="wmm-card-top">
                  <span className={`wmm-card-num ${card.numClass}`}>{card.num}</span>
                  <div className={`wmm-card-icon-circle ${card.iconClass}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <h3 className="wmm-card-title">{card.title}</h3>
                <p className="wmm-card-desc">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------
          3. "Who Is MockMind AI For?" Section (Two Columns)
          -------------------------------------------------- */}
      <section className="wmm-audience-section">
        <div className="wmm-audience-grid">
          {/* Left Column: Audience Cards Container */}
          <div className="wmm-audience-left">
            <div className="wmm-audience-header">
              <h2 className="wmm-section-title">Who Is MockMind AI For?</h2>
              <p className="wmm-section-subtitle">
                Designed for anyone who wants to prepare better for technical interviews.
              </p>
            </div>

            <div className="wmm-audience-stack">
              {audiences.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="wmm-audience-card">
                    <div className="wmm-audience-icon-box">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="wmm-audience-card-title">{item.title}</h3>
                      <p className="wmm-audience-card-desc">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Visual Photographic Quote Panel */}
          <div className="wmm-quote-panel">
            <div className="wmm-quote-content">
              <blockquote className="wmm-quote-panel-text">
                “A better you<br />
                <span className="wmm-quote-panel-accent">for a brighter</span><br />
                tomorrow.”
              </blockquote>
              <p className="wmm-quote-panel-author">— MockMind AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          4. "Take Control" Wide CTA Strip
          -------------------------------------------------- */}
      <section className="wmm-cta-strip-section">
        <div className="wmm-cta-strip-card">
          <div className="wmm-cta-strip-grid">
            <div className="wmm-cta-strip-left">
              <h2 className="wmm-cta-strip-title">
                Take Control of Your Interview Journey
              </h2>
              <p className="wmm-cta-strip-desc">
                Understand your skills. Practice with purpose. Perform with confidence.
              </p>
            </div>
            <div className="wmm-cta-strip-right">
              <div className="wmm-cta-brand-icon">
                <Bot size={18} />
              </div>
              <span className="wmm-cta-brand-name">MockMind AI</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingWhyMockMind;
