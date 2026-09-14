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
    <div className="w-full flex-1 flex flex-col items-center justify-center py-8 px-4 relative z-10 overflow-hidden bg-[#05080D] text-[#F5F7FA]">
      {/* =====================================================
          MOCKMIND AI — CONSISTENT ATMOSPHERIC BACKGROUND SYSTEM
          Deep Black/Navy base (#05080D / #071019) + Soft Cyan/Blue Glow + Soft Orange Glow + Waves + Dots
      ====================================================== */}
      {/* Base dark canvas */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: 'radial-gradient(1300px 900px at 50% 30%, #071019 0%, #05080D 65%, #030508 100%)',
        }}
      />

      {/* LAYER 1: Soft Cyan / Blue Atmospheric Glow (Top-Left & Edge illumination) */}
      <div 
        className="fixed -top-[140px] -left-[120px] w-[1000px] h-[800px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 25% 22%, rgba(0, 191, 255, 0.14) 0%, rgba(8, 126, 164, 0.06) 45%, transparent 75%)',
          filter: 'blur(75px)',
        }}
      />

      {/* LAYER 2: Soft Warm Orange Atmospheric Glow (Upper-Right & subtle right-side illumination) */}
      <div 
        className="fixed -top-[130px] -right-[100px] w-[950px] h-[780px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(255, 138, 61, 0.13) 0%, rgba(244, 124, 53, 0.05) 45%, transparent 75%)',
          filter: 'blur(75px)',
        }}
      />

      {/* LAYER 3: Lower Ambient Anchors (Soft Cyan lower-center/left + Faint warm orange lower-right) */}
      <div 
        className="fixed -bottom-[120px] left-[15%] w-[800px] h-[500px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(0, 174, 239, 0.08) 0%, rgba(18, 59, 82, 0.03) 50%, transparent 75%)',
          filter: 'blur(70px)',
        }}
      />
      <div 
        className="fixed -bottom-[80px] -right-[60px] w-[650px] h-[450px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 80%, rgba(255, 155, 98, 0.08) 0%, rgba(198, 95, 42, 0.02) 45%, transparent 70%)',
          filter: 'blur(65px)',
        }}
      />

      {/* LAYER 4: Dark Vignette Mask (Preserves deep black/navy dominance 80-85%) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(1400px 950px at 50% 45%, transparent 45%, rgba(5, 8, 13, 0.72) 80%, #05080D 100%)',
        }}
      />

      {/* LAYER 5: Subtle Flowing Waves (Cyan & Orange) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20 select-none" aria-hidden="true">
        {/* Upper Cyan Flowing Wave */}
        <svg className="absolute w-[150%] h-[480px] top-[8%] -left-[15%]" viewBox="0 0 1440 450" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="setupCyanWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00BFFF" stopOpacity="0" />
              <stop offset="30%" stopColor="#00AEEF" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#087EA4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,220 C320,320 420,120 720,240 C1020,360 1120,160 1440,260" stroke="url(#setupCyanWave)" strokeWidth="1.8" />
        </svg>

        {/* Upper Orange Flowing Wave */}
        <svg className="absolute w-[150%] h-[460px] top-[16%] -right-[15%]" viewBox="0 0 1440 450" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="setupOrangeWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0" />
              <stop offset="35%" stopColor="#FF9B62" stopOpacity="0.45" />
              <stop offset="75%" stopColor="#F47C35" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF8A3D" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,280 C360,160 500,340 820,200 C1140,60 1260,300 1440,180" stroke="url(#setupOrangeWave)" strokeWidth="1.6" />
        </svg>

        {/* Lower Ambient Wave */}
        <svg className="absolute w-[150%] h-[320px] -bottom-[30px] -left-[10%]" viewBox="0 0 1440 320" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="setupLowerWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00AEEF" stopOpacity="0" />
              <stop offset="35%" stopColor="#087EA4" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#FF8A3D" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF9B62" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,160 C380,80 620,240 980,120 C1200,40 1340,180 1440,100" stroke="url(#setupLowerWave)" strokeWidth="1.5" />
        </svg>
      </div>

      {/* LAYER 6: Subtle Dot Matrix System */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.045] select-none" 
        style={{
          backgroundImage: 'radial-gradient(circle, #00BFFF 0.9px, transparent 0.9px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      {/* =====================================================
          PAGE INTRODUCTION
      ====================================================== */}
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-9 flex flex-col items-center relative z-10">
        {/* Small Rounded AI INTERVIEW Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 shadow-[0_0_15px_rgba(0,229,255,0.15)] mb-4 sm:mb-5">
          <Video className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span className="text-xs font-semibold tracking-wider text-[#00E5FF] uppercase">
            AI Interview
          </span>
        </div>

        {/* Large Centered Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#F5F7FA] mb-3">
          AI Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#FF8A00]">Setup</span>
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-[#A5AFBC] leading-relaxed max-w-lg">
          Configure your interview preferences and start a personalized AI-powered mock interview.
        </p>
      </div>

      {/* =====================================================
          MAIN SETUP CARD
      ====================================================== */}
      <div className="w-full max-w-[620px] rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_24px_55px_rgba(0,0,0,0.75),0_0_30px_rgba(0,229,255,0.04)] p-6 sm:p-9 relative overflow-hidden transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00E5FF]/45 before:via-[#08C8FF]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10 z-10">
        
        {/* Subtle Ambient Glows inside Card */}
        <div 
          className="absolute -top-16 -right-16 w-56 h-56 pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 138, 0, 0.14) 0%, transparent 70%)',
            filter: 'blur(35px)',
          }}
        />
        <div 
          className="absolute -bottom-16 -left-16 w-56 h-56 pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.12) 0%, transparent 70%)',
            filter: 'blur(35px)',
          }}
        />

        {/* ===================================================
            CARD HEADER
        ==================================================== */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#0877B8]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.2)] flex-shrink-0">
            <Settings className="w-6 h-6 text-[#00E5FF]" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F7FA] tracking-tight">
              AI Interview Setup
            </h2>

            {interviewType && (
              <p className="text-xs sm:text-sm text-[#A5AFBC] mt-0.5 font-medium">
                {interviewType === 'technical'
                  ? 'Technical Interview'
                  : 'Non-Technical Interview'}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-white/[0.07] my-6 relative z-10" />

        {/* ===================================================
            ERROR MESSAGE
        ==================================================== */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#FF4545]/10 border border-[#FF4545]/25 text-[#FF4545] text-sm flex items-start gap-3 relative z-10">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF4545] mt-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ===================================================
            SETUP FORM
        ==================================================== */}
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

          {/* Target Role / Domain */}
          <div>
            <label className="block text-sm font-medium text-[#A5AFBC] mb-2.5">
              Target Role / Domain
            </label>

            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#687483] pointer-events-none" />

              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#071019] border border-white/[0.12] hover:border-[#00E5FF]/40 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/25 rounded-xl py-3.5 pl-11 pr-11 text-sm sm:text-base text-[#F5F7FA] appearance-none cursor-pointer outline-none transition-all duration-200"
                required
              >
                <option value="" className="bg-[#0D131B] text-[#687483]">
                  Select Target Role / Domain
                </option>

                {availableRoles.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-[#0D131B] text-[#F5F7FA] py-1.5"
                  >
                    {item}
                  </option>
                ))}
              </select>

              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#687483] pointer-events-none" />
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-white/[0.07] my-6" />

          {/* =================================================
              START AI INTERVIEW BUTTON
          ================================================== */}
          <div>
            <button
              type="submit"
              disabled={loading || !role || !interviewType}
              className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-bold text-sm sm:text-base text-black bg-gradient-to-r from-[#FF8A00] via-[#FF9D2E] to-[#D96A00] hover:from-[#FFA742] hover:via-[#FFB347] hover:to-[#E07200] hover:brightness-105 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_25px_rgba(255,138,0,0.42)] hover:shadow-[0_6px_34px_rgba(255,138,0,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span>Starting Interview...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black text-black" />
                  <span>Start AI Interview</span>
                  <ArrowRight className="w-4.5 h-4.5 text-black ml-1" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* =====================================================
          FOUR BENEFIT ITEMS - DASHBOARD STATBOX THEMES
      ====================================================== */}
      <div className="w-full max-w-[840px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-10 relative z-10">
        
        {/* 1. Realistic Questions - Orange / Amber */}
        <div className="relative overflow-hidden flex items-start gap-3 p-4 rounded-xl bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] border border-[#FF8A00]/30 shadow-[0_4px_18px_rgba(0,0,0,0.4),0_0_18px_rgba(255,138,0,0.08)] hover:border-[#FF8A00]/50 transition-all duration-200 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-[#FF8A00]/12 to-transparent pointer-events-none rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-xl bg-[#101720] border border-[#FF8A00]/35 flex items-center justify-center text-[#FF8A00] flex-shrink-0 shadow-[0_0_12px_rgba(255,138,0,0.22)] relative z-10">
            <HelpCircle className="w-4.5 h-4.5 text-[#FF8A00]" />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-semibold text-[#F5F7FA] group-hover:text-white transition-colors">Realistic Questions</h4>
            <p className="text-xs text-[#A5AFBC] mt-0.5 leading-relaxed">
              Get industry-relevant questions
            </p>
          </div>
        </div>

        {/* 2. Instant Feedback - Cyan / Sky */}
        <div className="relative overflow-hidden flex items-start gap-3 p-4 rounded-xl bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] border border-[#00E5FF]/30 shadow-[0_4px_18px_rgba(0,0,0,0.4),0_0_18px_rgba(0,229,255,0.08)] hover:border-[#00E5FF]/50 transition-all duration-200 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-[#00E5FF]/12 to-transparent pointer-events-none rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-xl bg-[#101720] border border-[#00E5FF]/35 flex items-center justify-center text-[#00E5FF] flex-shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.22)] relative z-10">
            <Zap className="w-4.5 h-4.5 text-[#00E5FF]" />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-semibold text-[#F5F7FA] group-hover:text-white transition-colors">Instant Feedback</h4>
            <p className="text-xs text-[#A5AFBC] mt-0.5 leading-relaxed">
              Receive detailed performance analysis
            </p>
          </div>
        </div>

        {/* 3. Improve Skills - Emerald / Teal */}
        <div className="relative overflow-hidden flex items-start gap-3 p-4 rounded-xl bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] border border-[#19D98B]/30 shadow-[0_4px_18px_rgba(0,0,0,0.4),0_0_18px_rgba(25,217,139,0.08)] hover:border-[#19D98B]/50 transition-all duration-200 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-[#19D98B]/12 to-transparent pointer-events-none rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-xl bg-[#101720] border border-[#19D98B]/35 flex items-center justify-center text-[#19D98B] flex-shrink-0 shadow-[0_0_12px_rgba(25,217,139,0.22)] relative z-10">
            <TrendingUp className="w-4.5 h-4.5 text-[#19D98B]" />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-semibold text-[#F5F7FA] group-hover:text-white transition-colors">Improve Skills</h4>
            <p className="text-xs text-[#A5AFBC] mt-0.5 leading-relaxed">
              Identify strengths and areas to grow
            </p>
          </div>
        </div>

        {/* 4. Build Confidence - Gold / Amber */}
        <div className="relative overflow-hidden flex items-start gap-3 p-4 rounded-xl bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] border border-[#F5A623]/30 shadow-[0_4px_18px_rgba(0,0,0,0.4),0_0_18px_rgba(245,166,35,0.08)] hover:border-[#F5A623]/50 transition-all duration-200 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-[#F5A623]/12 to-transparent pointer-events-none rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-xl bg-[#101720] border border-[#F5A623]/35 flex items-center justify-center text-[#F5A623] flex-shrink-0 shadow-[0_0_12px_rgba(245,166,35,0.22)] relative z-10">
            <ShieldCheck className="w-4.5 h-4.5 text-[#F5A623]" />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-semibold text-[#F5F7FA] group-hover:text-white transition-colors">Build Confidence</h4>
            <p className="text-xs text-[#A5AFBC] mt-0.5 leading-relaxed">
              Practice in a safe environment
            </p>
          </div>
        </div>

      </div>

      {/* =====================================================
          BOTTOM SLOGAN
      ====================================================== */}
      <div className="w-full max-w-[620px] flex items-center justify-center gap-4 mt-12 mb-4 relative z-10">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <span className="text-xs sm:text-sm text-[#687483] tracking-wide font-normal">
          A better you for a brighter tomorrow.
        </span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

    </div>
  );
};

export default Setup;