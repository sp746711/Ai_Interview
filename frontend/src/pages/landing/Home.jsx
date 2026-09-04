import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Target,
  Bot,
  BarChart3,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Code2,
} from 'lucide-react';

const journeySteps = [
  {
    icon: FileText,
    title: 'Resume Analysis',
    description: 'Understand your skills, experience, and strengths from your resume.',
  },
  {
    icon: Target,
    title: 'Skill Assessment',
    description: 'Evaluate technical knowledge with role-specific questions.',
  },
  {
    icon: Bot,
    title: 'AI Interview',
    description: 'Practice realistic interview conversations powered by AI.',
  },
  {
    icon: BarChart3,
    title: 'Feedback & Insights',
    description: 'Receive scores, strengths, and personalized recommendations.',
  },
];

const audiences = [
  {
    icon: GraduationCap,
    title: 'Students & Fresh Graduates',
    description:
      'Build interview confidence and prepare for your first career opportunities.',
  },
  {
    icon: Briefcase,
    title: 'Job Seekers',
    description:
      'Practice before upcoming interviews and improve your overall performance.',
  },
  {
    icon: Code2,
    title: 'Developers & Technical Candidates',
    description:
      'Strengthen technical skills and prepare for real-world engineering interviews.',
  },
];

const LandingHome = () => {
  return (
    <>
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-wide text-landing-peach/90 mb-6">
            Practice Today. Perform Tomorrow.
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white">
            Master Your Next
            <br />
            <span className="text-landing-peach">Tech Interview</span>
          </h1>

          <p className="mt-6 sm:mt-8 text-base sm:text-lg text-landing-muted leading-relaxed max-w-2xl">
            Prepare smarter with AI-powered interview practice, skill assessment,
            and personalized performance feedback. Build confidence and take the
            next step in your career.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xl sm:text-2xl font-semibold text-white/90">
            Interview Preparation Journey
          </h2>
          <p className="mt-2 text-sm sm:text-base text-landing-muted">
            From resume to feedback — a complete path to interview readiness
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-2">
          {journeySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.title}>
                <div className="landing-card p-6 flex flex-col items-center text-center flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-landing-peach/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-landing-peach/90" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-landing-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < journeySteps.length - 1 && (
                  <div className="flex items-center justify-center lg:px-1 shrink-0">
                    <ArrowRight className="w-5 h-5 text-landing-peach/40 rotate-90 lg:rotate-0" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xl sm:text-2xl font-semibold text-white/90">
            Who Is MockMind AI For?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {audiences.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="landing-card p-6 sm:p-8">
                <div className="w-11 h-11 rounded-lg bg-white/[0.04] flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-landing-bronze" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-landing-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-4 text-sm">
          <Link
            to="/features"
            className="text-landing-peach hover:text-landing-peach-muted transition-colors"
          >
            Explore Features →
          </Link>
          <Link
            to="/how-it-works"
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            See How It Works →
          </Link>
        </div>
      </section>
    </>
  );
};

export default LandingHome;
