import React from 'react';
import {
  UserCheck,
  FileSearch,
  Mic,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Code2,
} from 'lucide-react';

const reasons = [
  {
    icon: UserCheck,
    title: 'Personalized Preparation',
    description:
      'Preparation tailored to your resume, skills, and target role — not one-size-fits-all practice.',
  },
  {
    icon: FileSearch,
    title: 'Resume-Based Insights',
    description:
      'Identify relevant skills and technologies from your resume to focus your interview preparation.',
  },
  {
    icon: Mic,
    title: 'AI-Powered Practice',
    description:
      'Practice realistic interview conversations with an AI interviewer that adapts to your responses.',
  },
  {
    icon: TrendingUp,
    title: 'Actionable Feedback',
    description:
      'Understand your strengths, weaknesses, and improvement areas with clear, personalized recommendations.',
  },
];

const audiences = [
  {
    icon: GraduationCap,
    title: 'Students & Fresh Graduates',
    description:
      'Build interview confidence and prepare for your first career opportunities with structured practice.',
  },
  {
    icon: Briefcase,
    title: 'Job Seekers',
    description:
      'Practice before upcoming interviews and improve your performance with data-driven feedback.',
  },
  {
    icon: Code2,
    title: 'Developers & Technical Candidates',
    description:
      'Strengthen technical skills and prepare for real-world engineering and technical interviews.',
  },
];

const LandingWhyMockMind = () => {
  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <div className="max-w-3xl mb-14 sm:mb-20">
        <p className="text-sm font-medium text-landing-peach/90 mb-3">
          Why MockMind AI?
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
          Prepare with Purpose,
          <br />
          <span className="text-landing-peach">Not Just Practice.</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-landing-muted leading-relaxed">
          MockMind AI combines resume analysis, skill assessment, AI interview
          practice, performance feedback, and personalized recommendations — all
          designed to help you prepare more intelligently and improve your
          interview readiness.
        </p>
      </div>

      <section className="mb-16 sm:mb-24">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-8 sm:mb-10">
          Why Use MockMind AI?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {reasons.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="landing-card p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-landing-peach/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-landing-peach/90" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-landing-bronze mb-1 block">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-landing-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-8 sm:mb-10">
          Who Is MockMind AI For?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
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
      </section>
    </div>
  );
};

export default LandingWhyMockMind;
