import React from 'react';
import { FileText, Target, Bot, Sparkles } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Resume Analysis',
    description:
      'Upload your resume and let MockMind AI identify the skills, technologies, experience, relevant strengths, and potential gaps that matter for your target role.',
    bullets: [
      'Skills and technologies extracted from your resume',
      'Experience and project relevance highlighted',
      'Strengths identified for interview focus',
      'Potential gaps surfaced for improvement',
    ],
  },
  {
    icon: Target,
    title: 'Targeted Skill Assessment',
    description:
      'Take a role-specific technical assessment designed around your background and the type of position you are preparing for.',
    bullets: [
      'Questions aligned to your target role',
      'Technical knowledge evaluated systematically',
      'Screening-style assessment before interview practice',
      'Results inform your preparation path',
    ],
  },
  {
    icon: Bot,
    title: 'AI Interviewer',
    description:
      'Practice through realistic AI-powered interview conversations that adapt to your responses and simulate real interview conditions.',
    bullets: [
      'Conversational interview practice',
      'Adaptive follow-up based on your answers',
      'Role and difficulty tailored to your setup',
      'Build confidence before the real thing',
    ],
  },
  {
    icon: Sparkles,
    title: 'AI Feedback & Recommendations',
    description:
      'Receive detailed performance analysis including your score, strengths, areas to improve, and personalized recommendations.',
    bullets: [
      'Overall and round-specific scores',
      'Strengths and weaknesses identified',
      'Actionable improvement suggestions',
      'Personalized recommendations for next steps',
    ],
  },
];

const LandingFeatures = () => {
  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <div className="max-w-2xl mb-14 sm:mb-20">
        <p className="text-sm font-medium text-landing-peach/90 mb-3">Features</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
          Everything You Need to Prepare
        </h1>
        <p className="mt-4 text-base sm:text-lg text-landing-muted leading-relaxed">
          MockMind AI combines resume intelligence, skill assessment, AI interview
          practice, and performance feedback into one complete preparation platform.
        </p>
      </div>

      <div className="space-y-8 sm:space-y-10">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="landing-card p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 lg:gap-10"
            >
              <div className="w-14 h-14 rounded-xl bg-landing-peach/10 flex items-center justify-center shrink-0">
                <Icon className="w-7 h-7 text-landing-peach/90" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                  {feature.title}
                </h2>
                <p className="text-sm sm:text-base text-landing-muted leading-relaxed mb-5">
                  {feature.description}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {feature.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-sm text-white/60"
                    >
                      <span className="text-landing-peach/70 mt-1">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-16 sm:mt-24 landing-card p-6 sm:p-10">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
          About MockMind AI
        </h2>
        <p className="text-sm sm:text-base text-landing-muted leading-relaxed max-w-3xl">
          MockMind AI is an AI-powered interview preparation platform built for
          candidates who want more than generic practice. The platform analyzes
          your resume, assesses your skills, simulates real interviews, and
          delivers actionable feedback — helping you prepare with purpose and
          improve your interview readiness step by step.
        </p>
      </section>
    </div>
  );
};

export default LandingFeatures;
