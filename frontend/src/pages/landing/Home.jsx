import React, { useEffect } from 'react';
import {
  FileText,
  Target,
  Bot,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';
import './Home.css';

const journeySteps = [
  {
    icon: FileText,
    iconStyle: 'home-journey-icon-white',
    title: 'Resume Analysis',
    description: 'Upload your resume and identify key skills.',
  },
  {
    icon: Target,
    iconStyle: 'home-journey-icon-coral',
    title: 'Skill Assessment',
    description: 'Test your technical knowledge.',
  },
  {
    icon: Bot,
    iconStyle: 'home-journey-icon-purple',
    title: 'AI Interview',
    description: 'Practice with an AI interviewer.',
  },
  {
    icon: BarChart3,
    iconStyle: 'home-journey-icon-bronze',
    title: 'Feedback & Insights',
    description: 'Get detailed analysis and recommendations.',
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Build Confidence',
    description: 'Practice in a real interview environment.',
  },
  {
    icon: Sparkles,
    title: 'Identify Your Strengths',
    description: 'Understand your skills with AI-driven insights.',
  },
  {
    icon: TrendingUp,
    title: 'Focus on Growth',
    description: 'Get personalized recommendations.',
  },
  {
    icon: Award,
    title: 'Be Interview Ready',
    description: 'Take the next step in your career.',
  },
];

const LandingHome = () => {
  // Ensure the shared footer is removed specifically from the Home landing page
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
    <div className="home-landing">
      {/* ---------------- ONE CONTINUOUS CINEMATIC HERO SECTION ---------------- */}
      <section className="home-cinematic-section">
        <div className="home-cinematic-glow" />

        {/* Hero Content (Left side, workspace visible on right) */}
        <div className="home-hero-container">
          <div className="home-hero-content">
            <div className="home-hero-eyebrow">
              <span className="home-hero-eyebrow-dot" />
              <span>AI-Powered Interview Platform</span>
            </div>

            <h1 className="home-hero-headline">
              Master Your Next
              <br />
              <span className="home-hero-accent">Tech Interview</span>
            </h1>

            <p className="home-hero-description">
              Prepare smarter with AI-powered interview practice, skill assessment,
              and personalized performance feedback. Build confidence and take the
              next step in your career.
            </p>

            <div className="home-hero-tagline">
              — A smarter way to prepare
            </div>
          </div>
        </div>

        {/* Interview Preparation Journey (Inside the same cinematic background) */}
        <div className="home-journey-container">
          <div className="home-journey-header">
            <h2 className="home-journey-eyebrow">
              YOUR COMPLETE INTERVIEW PREPARATION JOURNEY
            </h2>
          </div>

          <div className="home-journey-cards-wrapper">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.title}>
                  <div className="home-journey-card-col">
                    <div className="home-journey-card">
                      <div className={`home-journey-icon-circle ${step.iconStyle}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="home-journey-card-title">{step.title}</h3>
                      <p className="home-journey-card-desc">{step.description}</p>
                    </div>
                  </div>

                  {index < journeySteps.length - 1 && (
                    <div className="home-journey-separator">
                      <ArrowRight className="home-journey-arrow" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- CREAM BENEFIT STRIP ---------------- */}
      <section className="home-benefit-strip">
        <div className="home-benefit-container">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="home-benefit-item">
                <div className="home-benefit-icon-box">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="home-benefit-content">
                  <h4 className="home-benefit-title">{item.title}</h4>
                  <p className="home-benefit-desc">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default LandingHome;
