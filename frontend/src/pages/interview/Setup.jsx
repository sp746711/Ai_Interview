import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Settings,
  Loader2,
  ChevronDown,
  Briefcase,
  Play,
  ArrowRight,
  Video,
  HelpCircle,
  Zap,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

/* =========================================================
   TECHNICAL DOMAINS
========================================================= */

const TECHNICAL_ROLES = [
  'Software Engineering',
  'Data Analytics',
  'Data Science',
  'Artificial Intelligence & Machine Learning',
  'Full-Stack Development',
  'Frontend Development',
  'Backend Development',
  'Cloud Computing',
  'DevOps Engineering',
  'Cybersecurity',
  'Data Engineering',
  'Generative AI / LLM Engineering',
];

/* =========================================================
   NON-TECHNICAL DOMAINS
========================================================= */

const NON_TECHNICAL_ROLES = [
  'Human Resources (HR)',
  'Sales & Business Development',
  'Digital Marketing',
  'Business Analysis',
  'Project Management',
  'Operations Management',
];

const Setup = () => {
  /* =======================================================
     STATE
  ======================================================= */

  const [role, setRole] = useState('');
  const [interviewType, setInterviewType] = useState('');

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  /* =======================================================
     CURRENT INTERVIEW
  ======================================================= */

  const currentInterview = JSON.parse(
    localStorage.getItem('current_interview') || '{}'
  );

  /* =======================================================
     VALIDATE INTERVIEW STAGE
     AND GET INTERVIEW TYPE
  ======================================================= */

  useEffect(() => {
    const validateStage = async () => {
      if (!currentInterview?.id) {
        navigate('/dashboard');
        return;
      }

      try {
        const res = await api.get(
          `/interview/stage?interview_id=${currentInterview.id}`
        );

        /* User must complete Round 2 first */

        if (res.data.stage !== 'setup') {
          navigate('/dashboard');
          return;
        }

        /*
         Get interview type from backend.

         Expected:
         technical
         OR
         non-technical
        */

        const type = String(
          res.data.interview_type ||
            currentInterview.interview_type ||
            ''
        )
          .trim()
          .toLowerCase();

        if (
          type !== 'technical' &&
          type !== 'non-technical'
        ) {
          setError(
            'Unable to determine interview type.'
          );

          setPageLoading(false);
          return;
        }

        setInterviewType(type);

        /*
         Do not automatically select a role.
         User must choose one.
        */

        setRole('');

        setPageLoading(false);

      } catch (err) {
        console.error(
          'Failed to validate interview stage:',
          err
        );

        navigate('/dashboard');
      }
    };

    validateStage();

  }, [navigate, currentInterview?.id]);

  /* =======================================================
     SELECT DOMAIN LIST
  ======================================================= */

  const availableRoles =
    interviewType === 'technical'
      ? TECHNICAL_ROLES
      : interviewType === 'non-technical'
      ? NON_TECHNICAL_ROLES
      : [];

  /* =======================================================
     START AI INTERVIEW
  ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) {
      setError(
        'Please select a target role / domain.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      /*
       IMPORTANT:

       Difficulty and duration have been removed.

       Backend will receive only:

       interview_id
       role
      */

      await api.post('/interview/setup', {
        interview_id: currentInterview.id,
        role: role,
      });

      /* ===============================================
         UPDATE LOCAL STORAGE
      =============================================== */

      const updatedInterview = {
        ...currentInterview,

        interview_type: interviewType,

        role: role,

        stage: 'ai',
      };

      localStorage.setItem(
        'current_interview',
        JSON.stringify(updatedInterview)
      );

      /* ===============================================
         MOVE TO AI INTERVIEW
      =============================================== */

      navigate('/ai-interview');

    } catch (err) {
      console.error(
        'Failed to setup interview:',
        err
      );

      setError(
        err?.response?.data?.detail ||
          'Failed to setup interview.'
      );

      setLoading(false);
    }
  };

  /* =======================================================
     PAGE LOADING
  ======================================================= */

  if (pageLoading) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f7a078]" />
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-6 px-4 relative z-10">

      {/* =====================================================
          PAGE INTRODUCTION
      ====================================================== */}
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-9 flex flex-col items-center">
        {/* Small Rounded AI INTERVIEW Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181513]/90 border border-[#f7a078]/40 shadow-[0_0_15px_rgba(247,160,120,0.15)] mb-4 sm:mb-5">
          <Video className="w-3.5 h-3.5 text-[#f7a078]" />
          <span className="text-xs font-semibold tracking-wider text-[#f7a078] uppercase">
            AI Interview
          </span>
        </div>

        {/* Large Centered Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#f5f1ec] mb-3">
          AI Interview <span className="text-[#f7a078]">Setup</span>
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-[#9e9e9e] leading-relaxed max-w-lg">
          Configure your interview preferences and start a personalized AI-powered mock interview.
        </p>
      </div>

      {/* =====================================================
          MAIN SETUP CARD
      ====================================================== */}
      <div className="w-full max-w-[620px] rounded-2xl sm:rounded-3xl bg-[#0e0f10]/95 backdrop-blur-xl border border-[#342b26]/70 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(247,160,120,0.06)] p-6 sm:p-9 relative overflow-hidden transition-all duration-300">
        
        {/* Subtle Ambient Glow inside Card */}
        <div 
          className="absolute -top-16 -right-16 w-56 h-56 pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(247, 160, 120, 0.12) 0%, transparent 70%)',
            filter: 'blur(35px)',
          }}
        />

        {/* ===================================================
            CARD HEADER
        ==================================================== */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1c1815] border border-[#3a2920] flex items-center justify-center text-[#f7a078] shadow-[0_0_15px_rgba(247,160,120,0.12)] flex-shrink-0">
            <Settings className="w-6 h-6 text-[#f7a078]" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#f5f1ec] tracking-tight">
              AI Interview Setup
            </h2>

            {interviewType && (
              <p className="text-xs sm:text-sm text-[#8e8e8e] mt-0.5 font-medium">
                {interviewType === 'technical'
                  ? 'Technical Interview'
                  : 'Non-Technical Interview'}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-white/[0.08] my-6" />

        {/* ===================================================
            ERROR MESSAGE
        ==================================================== */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-start gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ===================================================
            SETUP FORM
        ==================================================== */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Target Role / Domain */}
          <div>
            <label className="block text-sm font-medium text-[#d8d8d8] mb-2.5">
              Target Role / Domain
            </label>

            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#888888] pointer-events-none" />

              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#08090a] border border-[#2c2b2a] hover:border-[#3e3a36] focus:border-[#f7a078] focus:ring-1 focus:ring-[#f7a078]/40 rounded-xl py-3.5 pl-11 pr-11 text-sm sm:text-base text-[#f5f1ec] appearance-none cursor-pointer outline-none transition-all duration-200"
                required
              >
                <option value="" className="bg-[#111213] text-[#888888]">
                  Select Target Role / Domain
                </option>

                {availableRoles.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-[#111213] text-[#f5f1ec] py-1.5"
                  >
                    {item}
                  </option>
                ))}
              </select>

              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#888888] pointer-events-none" />
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-white/[0.08] my-6" />

          {/* =================================================
              START AI INTERVIEW BUTTON
          ================================================== */}
          <div>
            <button
              type="submit"
              disabled={loading || !role || !interviewType}
              className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-bold text-sm sm:text-base text-[#0a0a0b] bg-gradient-to-r from-[#f6ad82] via-[#f7a078] to-[#f08d67] hover:brightness-105 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_25px_rgba(247,160,120,0.35)] hover:shadow-[0_6px_32px_rgba(247,160,120,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#0a0a0b]" />
                  <span>Starting Interview...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-[#0a0a0b] text-[#0a0a0b]" />
                  <span>Start AI Interview</span>
                  <ArrowRight className="w-4.5 h-4.5 text-[#0a0a0b] ml-1" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* =====================================================
          FOUR BENEFIT ITEMS
      ====================================================== */}
      <div className="w-full max-w-[840px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-10">
        
        {/* 1. Realistic Questions */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0c0d0e]/60 border border-white/[0.04]">
          <div className="w-10 h-10 rounded-xl bg-[#161413] border border-[#2e231c] flex items-center justify-center text-[#f7a078] flex-shrink-0 shadow-sm">
            <HelpCircle className="w-4.5 h-4.5 text-[#f7a078]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#f5f1ec]">Realistic Questions</h4>
            <p className="text-xs text-[#8a8a8a] mt-0.5 leading-relaxed">
              Get industry-relevant questions
            </p>
          </div>
        </div>

        {/* 2. Instant Feedback */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0c0d0e]/60 border border-white/[0.04]">
          <div className="w-10 h-10 rounded-xl bg-[#161413] border border-[#2e231c] flex items-center justify-center text-[#f7a078] flex-shrink-0 shadow-sm">
            <Zap className="w-4.5 h-4.5 text-[#f7a078]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#f5f1ec]">Instant Feedback</h4>
            <p className="text-xs text-[#8a8a8a] mt-0.5 leading-relaxed">
              Receive detailed performance analysis
            </p>
          </div>
        </div>

        {/* 3. Improve Skills */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0c0d0e]/60 border border-white/[0.04]">
          <div className="w-10 h-10 rounded-xl bg-[#161413] border border-[#2e231c] flex items-center justify-center text-[#f7a078] flex-shrink-0 shadow-sm">
            <TrendingUp className="w-4.5 h-4.5 text-[#f7a078]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#f5f1ec]">Improve Skills</h4>
            <p className="text-xs text-[#8a8a8a] mt-0.5 leading-relaxed">
              Identify strengths and areas to grow
            </p>
          </div>
        </div>

        {/* 4. Build Confidence */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0c0d0e]/60 border border-white/[0.04]">
          <div className="w-10 h-10 rounded-xl bg-[#161413] border border-[#2e231c] flex items-center justify-center text-[#f7a078] flex-shrink-0 shadow-sm">
            <ShieldCheck className="w-4.5 h-4.5 text-[#f7a078]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#f5f1ec]">Build Confidence</h4>
            <p className="text-xs text-[#8a8a8a] mt-0.5 leading-relaxed">
              Practice in a safe environment
            </p>
          </div>
        </div>

      </div>

      {/* =====================================================
          BOTTOM SLOGAN
      ====================================================== */}
      <div className="w-full max-w-[620px] flex items-center justify-center gap-4 mt-12 mb-4">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <span className="text-xs sm:text-sm text-[#737373] tracking-wide font-normal">
          A better you for a brighter tomorrow.
        </span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

    </div>
  );
};

export default Setup;