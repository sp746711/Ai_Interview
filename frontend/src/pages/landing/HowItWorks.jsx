import React from 'react';
import { Upload, ClipboardCheck, MessageSquare, LineChart } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Resume',
    description:
      'The platform understands your background, skills, and experience from your resume to personalize your preparation journey.',
  },
  {
    number: '02',
    icon: ClipboardCheck,
    title: 'Take the Skill Assessment',
    description:
      'Role-specific questions evaluate your technical knowledge and skills in a structured screening-style assessment.',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Practice the AI Interview',
    description:
      'Practice through an AI-powered interview conversation that simulates real interview conditions and adapts to your responses.',
  },
  {
    number: '04',
    icon: LineChart,
    title: 'Get Feedback',
    description:
      'Receive performance analysis including your strengths, areas to improve, scores, and personalized recommendations.',
  },
];

const LandingHowItWorks = () => {
  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <div className="max-w-2xl mb-14 sm:mb-20">
        <p className="text-sm font-medium text-landing-peach/90 mb-3">How It Works</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
          Your Path to Interview Readiness
        </h1>
        <p className="mt-4 text-base sm:text-lg text-landing-muted leading-relaxed">
          Four clear steps from resume upload to actionable feedback — designed
          to mirror how real interview processes work.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="relative">
              <div className="landing-card p-6 sm:p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-bold text-landing-peach/80">
                    {step.number}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-landing-bronze" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-white mb-3">
                  {step.title}
                </h2>
                <p className="text-sm text-landing-muted leading-relaxed flex-1">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden xl:block absolute top-1/2 -right-3 w-6 h-px bg-landing-peach/30 z-10" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-14 sm:mt-20 landing-card p-6 sm:p-10 text-center max-w-3xl mx-auto">
        <p className="text-sm text-landing-muted mb-2">The complete flow</p>
        <p className="text-base sm:text-lg text-white/80 font-medium">
          Resume Analysis → Skill Assessment → AI Interview → Feedback & Insights
        </p>
      </div>
    </div>
  );
};

export default LandingHowItWorks;
