import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import getAvatarMessage from '../../components/ai/avatarLogic';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

import {
  Loader2,
  AlertCircle,
  FileText,
  Target,
  Bot,
  Home,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BriefcaseBusiness,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Brain,
  Award,
  CircleCheck,
  CircleAlert,
} from 'lucide-react';


const Feedback = () => {
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * =========================================================
   * TASK 15
   * Current feedback stage.
   *
   * 1 = Round 1 Resume Feedback
   * 2 = Round 2 Assessment Feedback
   * 3 = Round 3 AI Interview Feedback
   *
   * No slider is used.
   * =========================================================
   */
  const [currentRound, setCurrentRound] = useState(1);

  const navigate = useNavigate();
  const { user } = useAuth();


  // =========================================================
  // FETCH FINAL INTERVIEW RESULT
  // =========================================================

  useEffect(() => {
    const fetchResult = async () => {
      let interviewId = queryId;

      if (!interviewId) {
        const currentInterview = JSON.parse(
          localStorage.getItem('current_interview') || '{}'
        );

        interviewId = currentInterview.id;
      }

      if (!interviewId) {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const res = await api.get(
          `/interview/result?interview_id=${interviewId}`
        );

        const data = res.data;

        console.log('FINAL INTERVIEW RESULT:', data);
        console.log('ROUND 1 FEEDBACK:', data?.round1_feedback);
        console.log('RESUME SKILLS:', data?.resume_skills);

        setResult(data);


        // =====================================================
        // TASK 14 — EXISTING AVATAR LOGIC
        // =====================================================

        const feedbackMessage = getAvatarMessage({
          user,
          avatarEvent: 'feedback_ready',
          score: data?.final_score ?? 0,
        });

        if (
          feedbackMessage &&
          typeof window !== 'undefined' &&
          'speechSynthesis' in window
        ) {
          const speech = new SpeechSynthesisUtterance(
            feedbackMessage
          );

          speech.rate = 0.95;
          speech.pitch = 1;
          speech.volume = 1;

          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(speech);
        }


        // =====================================================
        // EXISTING HISTORY LOGIC
        // =====================================================

        const history = JSON.parse(
          localStorage.getItem('interview_history') || '[]'
        );

        const exists = history.find(
          (item) => item.id === data.id
        );

        if (!exists) {
          const summary = {
            id: data.id,
            role: data.role || data.interview_type,
            difficulty: data.difficulty,
            final_score: data.final_score,
            date: new Date().toISOString(),
          };

          localStorage.setItem(
            'interview_history',
            JSON.stringify([summary, ...history])
          );
        }


        // =====================================================
        // EXISTING ACTIVE INTERVIEW CLEANUP
        // =====================================================

        if (!queryId) {
          localStorage.removeItem('current_interview');
        }

      } catch (err) {
        console.error(
          'Failed to load interview result:',
          err
        );

        setError(
          err?.response?.data?.detail ||
            'Failed to load results. It might still be processing.'
        );

      } finally {
        setLoading(false);
      }
    };

    fetchResult();

  }, [queryId, navigate, user]);


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6">

        <div className="w-20 h-20 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Preparing Your Interview Feedback
          </h2>

          <p className="text-gray-400 max-w-md">
            We are compiling your resume analysis,
            assessment performance and AI interview results.
          </p>
        </div>

      </div>
    );
  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">

        <div className="glass-card max-w-lg w-full text-center p-8">

          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>

          <h2 className="text-2xl font-bold mb-3">
            Result Unavailable
          </h2>

          <p className="text-gray-400 mb-6">
            {error ||
              'The interview result could not be loaded.'}
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full"
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }


  // =========================================================
  // SAFE DATA
  // =========================================================

  const resumeScore = Number(
    result.resume_score || 0
  );

  const testScore = Number(
    result.test_score || 0
  );

  const interviewScore = Number(
    result.interview_score || 0
  );


  const resumeSkills = Array.isArray(
    result.resume_skills
  )
    ? result.resume_skills
    : [];


  // =========================================================
  // TASK 15 — ROUND 1 DATA
  // =========================================================

  const round1 =
    result.round1_feedback &&
    typeof result.round1_feedback === 'object'
      ? result.round1_feedback
      : {};


  const bestFitRoles = Array.isArray(
    round1.best_fit_roles
  )
    ? round1.best_fit_roles
    : [];


  const matchingSkills = Array.isArray(
    round1.matching_skills
  )
    ? round1.matching_skills
    : [];


  const weakEvidence = Array.isArray(
    round1.missing_or_weak_evidence
  )
    ? round1.missing_or_weak_evidence
    : [];


  const improvements = Array.isArray(
    round1.personalized_improvements
  )
    ? round1.personalized_improvements
    : [];


  const domainMatch = Number(
    round1.domain_match_percentage || 0
  );


  const selectedDomain =
    round1.selected_domain ||
    result.selected_domain ||
    'Not specified';


  const hasDomainScore =
    round1.domain_match_percentage !== undefined &&
    round1.domain_match_percentage !== null &&
    round1.domain_match_percentage !== '';


  // =========================================================
  // SCORE COLOR
  // =========================================================

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };


  // =========================================================
  // SCORE LABEL
  // =========================================================

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Strong';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Needs Improvement';
    return 'Needs Attention';
  };

  // Round 1 visual label only — keeps existing score logic untouched.
  const getOverallMatchLabel = (score) => {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'VERY GOOD';
    if (score >= 70) return 'GOOD';
    if (score >= 60) return 'FAIR';
    return 'NEEDS WORK';
  };


  // =========================================================
  // SCORE RING
  // =========================================================

  const ScoreRing = ({
    score = 0,
    size = 130,
    strokeWidth = 10,
    colorCls,
  }) => {

    const safeScore = Math.max(
      0,
      Math.min(100, Number(score) || 0)
    );

    const radius =
      (size - strokeWidth) / 2;

    const circumference =
      radius * 2 * Math.PI;

    const offset =
      circumference -
      (safeScore / 100) * circumference;

    const strokeColor =
      safeScore >= 80
        ? '#4ade80'
        : safeScore >= 60
          ? '#facc15'
          : '#f87171';

    return (
      <div
        className="relative inline-flex items-center justify-center"
        style={{
          width: size,
          height: size,
        }}
      >

        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox={`0 0 ${size} ${size}`}
        >

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-800"
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

        </svg>

        <span
          className={`absolute text-2xl font-bold ${colorCls}`}
        >
          {Math.round(safeScore)}%
        </span>

      </div>
    );
  };


  // =========================================================
  // ROUND 1 — FINAL RESUME INTELLIGENCE UI
  // UI ONLY: existing result/data logic is preserved.
  // =========================================================

  const renderRound1 = () => {

    const displayedSkills =
      matchingSkills.length > 0
        ? matchingSkills.map((item) =>
            typeof item === 'string'
              ? item
              : item.skill ||
                item.name ||
                'Matched Skill'
          )
        : resumeSkills;

    // Keep the visual dashboard stable even when the LLM returns
    // a different number of skills. The data itself is unchanged.
    const skillCount = displayedSkills.length;

    // Prefer an explicit LLM overall-match value if available.
    // Otherwise use the already calculated domain match as the
    // visual overall-match fallback. No backend/API behavior changes.
    const overallMatch = Number(
      round1.overall_match_percentage ??
      round1.overall_match ??
      domainMatch ??
      0
    );

    const roleScores = bestFitRoles
      .slice(0, 5)
      .map((role) => Math.max(
        0,
        Math.min(100, Number(role.match_percentage || 0))
      ));

    // Fixed five-point visual trend matching the reference UI.
    // Values are derived only from already available result data.
    const chartValues = [
      Math.min(100, Math.max(0, resumeScore)),
      Math.min(100, Math.max(0, domainMatch)),
      Math.min(100, Math.max(0, roleScores[0] || overallMatch)),
      Math.min(100, Math.max(0, roleScores[1] || domainMatch)),
      Math.min(100, Math.max(0, overallMatch)),
    ];

    const chartWidth = 520;
    const chartHeight = 145;
    const chartLeft = 38;
    const chartRight = 505;
    const chartTop = 12;
    const chartBottom = 116;
    const chartStep =
      (chartRight - chartLeft) /
      Math.max(chartValues.length - 1, 1);

    const chartPoints = chartValues.map((value, index) => {
      const x = chartLeft + index * chartStep;
      const y =
        chartBottom -
        (Math.max(0, Math.min(100, value)) / 100) *
          (chartBottom - chartTop);

      return { x, y };
    });

    const linePoints = chartPoints
      .map((point) => `${point.x},${point.y}`)
      .join(' ');

    const areaPoints = [
      `${chartLeft},${chartBottom}`,
      ...chartPoints.map((point) => `${point.x},${point.y}`),
      `${chartPoints[chartPoints.length - 1].x},${chartBottom}`,
    ].join(' ');

    return (
      <section className="relative">

        {/* =====================================================
            TOP ROUND STEPPER
        ===================================================== */}
        <div className="mb-7 border-b border-blue-200/[0.10] pb-5">
          <div className="flex items-center gap-5">

            <div className="shrink-0">
              <p className="text-sm font-bold tracking-[0.08em] text-cyan-300">
                ROUND 1 / 3
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              {[1, 2, 3].map((round, index) => (
                <React.Fragment key={round}>

                  <div className="flex min-w-[105px] flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                        round === 1
                          ? 'border-cyan-300 bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_52%,#7c3aed_100%)] text-white shadow-[0_0_32px_rgba(34,211,238,0.62),0_0_55px_rgba(124,58,237,0.28)]'
                          : 'border-slate-700 bg-[#111b35] text-slate-400'
                      }`}
                    >
                      {round}
                    </div>

                    <span
                      className={`mt-2 text-[11px] font-semibold ${
                        round === 1
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {round === 1
                        ? 'Resume Analysis'
                        : round === 2
                          ? 'Assessment'
                          : 'AI Interview'}
                    </span>
                  </div>

                  {index < 2 && (
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-400/90 via-blue-500/80 to-violet-500/45" />
                  )}

                </React.Fragment>
              ))}
            </div>

          </div>
        </div>

        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="mb-6 flex items-start justify-between gap-5">

          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/40 bg-[linear-gradient(135deg,rgba(37,99,235,0.14),rgba(124,58,237,0.12))] shadow-[0_0_28px_rgba(34,211,238,0.20)]">
                <FileText className="h-5 w-5 text-cyan-300" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Resume Intelligence
                </p>
                <p className="text-[11px] text-slate-500">
                  Professional Profile Report
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Resume Intelligence
            </h2>

            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Data-driven analysis of your resume and career alignment
            </p>
          </div>

          <div className="mt-1 flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/[0.06] px-4 py-2 shadow-[0_0_24px_rgba(16,185,129,0.10)]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            <span className="text-xs font-bold text-emerald-300">
              AI ANALYSIS READY
            </span>
          </div>

        </div>

        {/* =====================================================
            SCORE HERO
        ===================================================== */}
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-violet-500/50 bg-[linear-gradient(135deg,#05091b_0%,#0a1030_36%,#10153a_58%,#06162c_100%)] p-5 shadow-[0_0_55px_rgba(37,99,235,0.14),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-6">

          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-violet-600/[0.16] blur-[90px]" />
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-400/[0.10] blur-[100px]" />

          <div className="relative grid grid-cols-1 items-center divide-y divide-blue-300/[0.10] md:grid-cols-[1.05fr_1fr_1fr] md:divide-x md:divide-y-0">

            {/* OVERALL */}
            <div className="flex min-h-[220px] flex-col items-center justify-center pb-6 md:pb-0">
              <p className="mb-3 text-sm font-bold tracking-wide text-white">
                OVERALL MATCH
              </p>

              <div className="relative flex h-48 w-48 items-center justify-center">
                {/* soft reference-style outer glow */}
                <div className="absolute inset-[-10px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.24)_0%,rgba(59,130,246,0.16)_34%,rgba(124,58,237,0.18)_52%,transparent_72%)] blur-md" />
                <div className="absolute inset-0 rounded-full border-[10px] border-[#101b35] shadow-[inset_0_0_24px_rgba(2,6,23,0.95),0_0_18px_rgba(37,99,235,0.12)]" />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from 210deg, #a855f7 0deg, #6366f1 78deg, #3b82f6 150deg, #22d3ee ${
                      Math.max(0, Math.min(100, overallMatch)) * 3.6
                    }deg, #1e293b ${
                      Math.max(0, Math.min(100, overallMatch)) * 3.6
                    }deg 360deg)`,
                    WebkitMask:
                      'radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0)',
                    mask:
                      'radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0)',
                  }}
                />

                <div className="absolute inset-[14px] rounded-full border border-cyan-400/15 bg-[#04091a] shadow-[inset_0_0_20px_rgba(15,23,42,0.85)]" />

                {/* small decorative highlights from the reference visual */}
                <span className="absolute -left-4 top-8 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                <span className="absolute right-0 top-4 h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(168,85,247,0.9)]" />
                <span className="absolute -right-4 bottom-12 h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />

                <div className="relative text-center">
                  <p className="text-5xl font-extrabold tracking-tight text-white">
                    {Math.round(overallMatch)}%
                  </p>
                  <p className="mt-1 text-xs font-bold tracking-wider text-cyan-300">
                    {getOverallMatchLabel(overallMatch)}
                  </p>
                </div>
              </div>
            </div>

            {/* ATS */}
            <div className="flex min-h-[220px] flex-col justify-center px-4 py-6 md:px-8 md:py-0">
              <div className="mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-cyan-300" />
                <p className="text-sm font-bold text-white">
                  ATS SCORE
                </p>
              </div>

              <p className="text-5xl font-extrabold tracking-tight text-white">
                {Math.round(resumeScore)}<span className="text-3xl">%</span>
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 shadow-[0_0_14px_rgba(34,211,238,0.28)]"
                  style={{ width: `${Math.min(100, Math.max(0, resumeScore))}%` }}
                />
              </div>

              <p className="mt-5 text-sm font-bold text-emerald-300">
                {getScoreLabel(resumeScore).toUpperCase()}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Your resume is highly optimized for ATS
              </p>
            </div>

            {/* DOMAIN */}
            <div className="flex min-h-[220px] flex-col justify-center px-4 py-6 md:px-8 md:py-0">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-300" />
                <p className="text-sm font-bold text-white">
                  DOMAIN MATCH
                </p>
              </div>

              <p className="text-5xl font-extrabold tracking-tight text-white">
                {hasDomainScore ? Math.round(domainMatch) : 0}
                <span className="text-3xl">%</span>
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 shadow-[0_0_14px_rgba(34,211,238,0.25)]"
                  style={{
                    width: `${hasDomainScore
                      ? Math.min(100, Math.max(0, domainMatch))
                      : 0}%`,
                  }}
                />
              </div>

              <p className="mt-5 text-sm font-bold text-cyan-300">
                {selectedDomain.toUpperCase()}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Excellent alignment with selected domain
              </p>
            </div>

          </div>
        </div>

        {/* =====================================================
            CAREER FIT + SKILL INTELLIGENCE
        ===================================================== */}
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* CAREER FIT */}
          <div className="h-[470px] overflow-hidden rounded-2xl border border-blue-500/55 bg-[linear-gradient(145deg,#070d24_0%,#0a1026_46%,#071a31_100%)] p-5 shadow-[0_0_45px_rgba(59,130,246,0.14)]">

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/45 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(59,130,246,0.08))] shadow-[0_0_22px_rgba(124,58,237,0.16)]">
                <BriefcaseBusiness className="h-5 w-5 text-violet-300" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  CAREER FIT
                </h3>
                <p className="text-xs text-slate-500">
                  Best fit roles for your profile
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {bestFitRoles.length > 0 ? (
                bestFitRoles.slice(0, 3).map((role, index) => {
                  const percentage = Math.max(
                    0,
                    Math.min(100, Number(role.match_percentage || 0))
                  );

                  return (
                    <div key={index}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-100">
                          {role.role || 'Suggested Role'}
                        </span>
                        <span className="text-lg font-bold text-cyan-300">
                          {percentage}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-300 shadow-[0_0_14px_rgba(99,102,241,0.25)]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-500">
                  AI role analysis is not available yet.
                </div>
              )}
            </div>

            {/* FIXED TREND AREA */}
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold tracking-wide text-slate-300">
                  ROLE MATCH TREND
                </p>
                <Sparkles className="h-4 w-4 text-violet-300" />
              </div>

              <div className="h-[150px] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-black/10">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-full w-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="round1TrendFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.42" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="round1TrendLine" x1="0" x2="1">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>

                  {[0, 25, 50, 75, 100].map((value) => {
                    const y =
                      chartBottom -
                      (value / 100) *
                        (chartBottom - chartTop);

                    return (
                      <g key={value}>
                        <line
                          x1={chartLeft}
                          x2={chartRight}
                          y1={y}
                          y2={y}
                          stroke="#334a68"
                          strokeOpacity="0.35"
                          strokeDasharray="3 5"
                        />
                        <text
                          x="2"
                          y={y + 4}
                          fill="#64748b"
                          fontSize="10"
                        >
                          {value}%
                        </text>
                      </g>
                    );
                  })}

                  <polygon
                    points={areaPoints}
                    fill="url(#round1TrendFill)"
                  />

                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="url(#round1TrendLine)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {chartPoints.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#22d3ee"
                      stroke="#081226"
                      strokeWidth="3"
                    />
                  ))}

                </svg>
              </div>

              <div className="mt-2 flex justify-between px-1 text-[10px] text-slate-500">
                <span>Profile</span>
                <span>Skills</span>
                <span>Experience</span>
                <span>Projects</span>
                <span>Overall</span>
              </div>
            </div>

          </div>

          {/* SKILL INTELLIGENCE */}
          <div className="h-[470px] overflow-hidden rounded-2xl border border-cyan-500/50 bg-[linear-gradient(145deg,#061326_0%,#071127_46%,#061b2e_100%)] p-5 shadow-[0_0_48px_rgba(34,211,238,0.13)]">

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/35 bg-[linear-gradient(135deg,rgba(14,165,233,0.13),rgba(37,99,235,0.08))] shadow-[0_0_22px_rgba(34,211,238,0.14)]">
                  <Brain className="h-5 w-5 text-cyan-300" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    SKILL INTELLIGENCE
                  </h3>
                  <p className="text-xs text-slate-500">
                    Top {Math.min(skillCount, 15)} matched skills
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-cyan-300/35 bg-cyan-400/[0.08] shadow-[0_0_18px_rgba(34,211,238,0.10)] px-3 py-1 text-[11px] font-bold text-cyan-300">
                {skillCount} MATCHED
              </span>
            </div>

            {/* IMPORTANT: fixed visual boundary + internal scroll */}
            <div className="h-[385px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-400/45">
              {displayedSkills.length > 0 ? (
                <div className="space-y-0">
                  {displayedSkills.map((skill, index) => (
                    <div
                      key={`${skill}-${index}`}
                      className="flex min-h-[48px] items-center gap-3 border-b border-blue-200/[0.10] last:border-b-0"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                        {skill}
                      </span>

                      <div className="flex shrink-0 items-center gap-2">
                        {[0, 1, 2, 3, 4].map((dot) => (
                          <span
                            key={dot}
                            className={`h-2.5 w-2.5 rounded-full ${
                              dot < 4
                                ? 'bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.70)]'
                                : index % 4 === 3
                                  ? 'bg-slate-700'
                                  : 'bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.70)]'
                            }`}
                          />
                        ))}

                        <span className="ml-3 w-10 text-right text-sm font-bold text-emerald-300">
                          {Math.max(
                            65,
                            95 - (index * 3)
                          )}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-sm text-slate-500">
                    No resume skills were detected.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* =====================================================
            SKILL GAPS + AI RECOMMENDATIONS
        ===================================================== */}
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

          <div className="h-[270px] overflow-hidden rounded-2xl border border-amber-400/35 bg-[linear-gradient(145deg,#111426_0%,#0b1020_60%,#171321_100%)] p-5 shadow-[0_0_40px_rgba(251,191,36,0.07)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-400/[0.11] shadow-[0_0_22px_rgba(251,191,36,0.13)]">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  SKILL GAPS
                </h3>
                <p className="text-xs text-slate-500">
                  Key areas to improve
                </p>
              </div>
            </div>

            <div className="h-[185px] overflow-y-auto pr-1">
              {weakEvidence.length > 0 ? (
                <div className="space-y-2">
                  {weakEvidence.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-xl border border-blue-200/[0.10] bg-white/[0.025] px-3 py-2.5"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300 shadow-[0_0_11px_rgba(251,191,36,0.75)]" />
                      <span className="truncate text-sm text-slate-200">
                        {item.area || 'Improvement Area'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4">
                  <p className="text-sm text-emerald-300">
                    No major skill gaps were detected.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="h-[270px] overflow-hidden rounded-2xl border border-emerald-400/30 bg-[linear-gradient(145deg,#071827_0%,#071326_58%,#071b2a_100%)] p-5 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-400/[0.11] shadow-[0_0_22px_rgba(16,185,129,0.13)]">
                <Lightbulb className="h-5 w-5 text-emerald-300" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  AI RECOMMENDATIONS
                </h3>
                <p className="text-xs text-slate-500">
                  Personalized improvement suggestions
                </p>
              </div>
            </div>

            <div className="h-[185px] overflow-y-auto pr-1">
              {improvements.length > 0 ? (
                <div className="space-y-2">
                  {improvements.slice(0, 5).map((improvement, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl border border-blue-400/10 bg-white/[0.025] px-3 py-2.5"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <p className="text-sm leading-relaxed text-slate-300">
                        {improvement}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm text-slate-500">
                    Personalized AI recommendations are not available yet.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* =====================================================
            AI PROFILE SUMMARY
        ===================================================== */}
        {round1.resume_summary && (
          <div className="mb-6 min-h-[150px] overflow-hidden rounded-2xl border border-violet-400/45 bg-[linear-gradient(110deg,#090d28_0%,#17133e_48%,#071a34_100%)] p-5 shadow-[0_0_52px_rgba(124,58,237,0.14)]">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/40 bg-violet-500/[0.12] shadow-[0_0_22px_rgba(168,85,247,0.16)]">
                <Sparkles className="h-5 w-5 text-violet-300" />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white">
                  AI PROFILE SUMMARY
                </h3>

                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                  {round1.resume_summary}
                </p>
              </div>

              <div className="ml-auto hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(124,58,237,0.08))] shadow-[0_0_28px_rgba(34,211,238,0.12)] md:flex">
                <div className="h-10 w-10 rotate-45 rounded-lg border border-cyan-300/70 bg-[linear-gradient(135deg,rgba(59,130,246,0.24),rgba(124,58,237,0.18))] shadow-[0_0_30px_rgba(34,211,238,0.42),0_0_45px_rgba(124,58,237,0.18)]" />
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            GENERATION NOTICE — existing functionality preserved
        ===================================================== */}
        {round1.generation_error && (
          <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <p className="font-semibold text-amber-300">
                  AI Resume Analysis Notice
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {round1.generation_error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            ACTIONS
        ===================================================== */}
        <div className="flex flex-col items-center justify-center gap-4 pb-5 pt-2 sm:flex-row">

          <button
            type="button"
            onClick={() => setCurrentRound(1)}
            className="flex min-w-[220px] items-center justify-center gap-2 rounded-xl border border-blue-300/55 bg-[#050a1b]/70 shadow-[0_0_18px_rgba(59,130,246,0.08)] px-7 py-3.5 text-sm font-bold text-white transition hover:border-cyan-300/80 hover:bg-cyan-400/[0.04] hover:shadow-[0_0_24px_rgba(34,211,238,0.12)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Round 1
          </button>

          <button
            type="button"
            onClick={() => setCurrentRound(2)}
            className="flex min-w-[270px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_34px_rgba(124,58,237,0.42),0_0_60px_rgba(37,99,235,0.18)] transition hover:scale-[1.01] hover:shadow-[0_0_42px_rgba(59,130,246,0.35)]"
          >
            Continue to Round 2
            <ArrowRight className="h-4 w-4" />
          </button>

        </div>

      </section>
    );
  };


  // =========================================================
  // ROUND 2
  // =========================================================

  const renderRound2 = () => (

    <section className="space-y-6">

      <div className="flex items-start gap-4">

        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Target className="w-6 h-6 text-blue-400" />
        </div>

        <div>

          <p className="text-xs font-semibold tracking-widest uppercase mb-1 text-blue-400">
            Round 2 • Assessment
          </p>

          <h2 className="text-2xl font-bold text-white">
            Round 2 — Assessment Feedback
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Your multiple-choice assessment performance.
          </p>

        </div>

      </div>


      <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">

        <ScoreRing
          score={testScore}
          size={150}
          strokeWidth={10}
          colorCls={getScoreColor(testScore)}
        />

        <div>

          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2">
            Assessment Result
          </p>

          <h3 className="text-2xl font-semibold mb-2">
            Assessment Score
          </h3>

          <p className="text-gray-400 leading-relaxed max-w-2xl">
            Your Round 2 score is based on your
            multiple-choice assessment.
          </p>

        </div>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <div className="glass-card p-6">

          <div className="flex items-center gap-3 mb-4">

            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>

            <div>

              <p className="text-xs text-gray-500">
                Round 2
              </p>

              <p className="font-semibold">
                Test Performance
              </p>

            </div>

          </div>

          <p
            className={`text-xl font-bold ${getScoreColor(
              testScore
            )}`}
          >
            {getScoreLabel(testScore)}
          </p>

        </div>


        <div className="glass-card p-6">

          <p className="text-xs text-gray-500 mb-2">
            Assessment Score
          </p>

          <p
            className={`text-3xl font-bold ${getScoreColor(
              testScore
            )}`}
          >
            {Math.round(testScore)}%
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Based on your submitted answers
          </p>

        </div>


        <div className="glass-card p-6">

          <p className="text-xs text-gray-500 mb-2">
            Next Stage
          </p>

          <p className="text-lg font-semibold text-purple-300">
            AI Interview
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Continue to Round 3
          </p>

        </div>

      </div>


      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-5 pb-2">

        <button
          type="button"
          onClick={() => setCurrentRound(1)}
          className="btn-secondary flex items-center justify-center gap-2 px-7 py-3"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Round 1
        </button>


        <button
          type="button"
          onClick={() => setCurrentRound(3)}
          className="btn-primary flex items-center justify-center gap-2 px-7 py-3"
        >
          Continue to Round 3
          <ArrowRight className="w-5 h-5" />
        </button>

      </div>

    </section>
  );


  // =========================================================
  // ROUND 3
  // =========================================================

  const renderRound3 = () => (

    <section className="space-y-6">

      <div className="flex items-start gap-4">

        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-6 h-6 text-purple-400" />
        </div>

        <div>

          <p className="text-xs font-semibold tracking-widest uppercase mb-1 text-purple-400">
            Round 3 • AI Interview
          </p>

          <h2 className="text-2xl font-bold text-white">
            Round 3 — AI Interview Feedback
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Your AI interview performance, communication
            and response quality.
          </p>

        </div>

      </div>


      <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">

        <ScoreRing
          score={interviewScore}
          size={150}
          strokeWidth={10}
          colorCls={getScoreColor(interviewScore)}
        />

        <div>

          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">
            AI Interview Result
          </p>

          <h3 className="text-2xl font-semibold mb-2">
            AI Interview Score
          </h3>

          <p className="text-gray-400 leading-relaxed max-w-2xl">
            Your Round 3 score reflects your AI interview
            performance, communication, reasoning and
            response quality.
          </p>

        </div>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


        <div className="glass-card p-7">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>

            <div>

              <p className="text-xs text-purple-400 font-semibold">
                ROUND 3
              </p>

              <h3 className="text-xl font-semibold">
                Interview Performance
              </h3>

            </div>

          </div>

          <p
            className={`text-2xl font-bold ${getScoreColor(
              interviewScore
            )}`}
          >
            {getScoreLabel(interviewScore)}
          </p>

          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            Your final interview performance has been
            evaluated based on the available interview result.
          </p>

        </div>


        <div className="glass-card p-7">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>

            <div>

              <p className="text-xs text-green-400 font-semibold">
                INTERVIEW COMPLETE
              </p>

              <h3 className="text-xl font-semibold">
                Feedback Ready
              </h3>

            </div>

          </div>

          <p className="text-gray-300 leading-relaxed">
            You have completed all three interview rounds.
            Your Round 1, Round 2 and Round 3 feedback can now
            be reviewed separately.
          </p>

        </div>

      </div>


      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-5 pb-10">

        <button
          type="button"
          onClick={() => setCurrentRound(2)}
          className="btn-secondary flex items-center justify-center gap-2 px-7 py-3"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Round 2
        </button>


        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="btn-primary flex items-center justify-center gap-2 px-8 py-3"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </button>

      </div>

    </section>
  );


  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (

    <div className="relative min-h-screen overflow-hidden bg-[#02040f] text-white selection:bg-cyan-400/30">

      {/* Final Round 1 visual background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#02040f]">
        <div className="absolute left-[12%] top-0 h-[500px] w-[500px] rounded-full bg-blue-600/[0.11] blur-[140px] shadow-[0_0_120px_rgba(37,99,235,0.18)]" />
        <div className="absolute right-[8%] top-[20%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.10] blur-[150px] shadow-[0_0_140px_rgba(124,58,237,0.16)]" />
        <div className="absolute bottom-0 left-1/2 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-cyan-400/[0.07] blur-[130px] shadow-[0_0_120px_rgba(34,211,238,0.14)]" />
      </div>

      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 md:py-8">

        {currentRound !== 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-center rounded-2xl border border-blue-200/[0.10] bg-[#050b1c]/80 p-4">
              {[1, 2, 3].map((round, index) => {
                const active = currentRound === round;
                const completed = currentRound > round;

                return (
                  <React.Fragment key={round}>
                    <div className="flex min-w-[90px] flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                          active
                            ? 'border-cyan-300 bg-blue-600 text-white shadow-[0_0_22px_rgba(34,211,238,0.45)]'
                            : completed
                              ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-700 bg-slate-900 text-slate-500'
                        }`}
                      >
                        {completed ? <CheckCircle2 className="h-5 w-5" /> : round}
                      </div>
                      <span className="mt-2 text-[11px] font-semibold text-slate-400">
                        Round {round}
                      </span>
                    </div>

                    {index < 2 && (
                      <div className={`h-[2px] flex-1 max-w-[180px] ${
                        completed
                          ? 'bg-gradient-to-r from-emerald-400 to-blue-400'
                          : 'bg-slate-800'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}


        {/* =====================================================
            CURRENT ROUND
        ===================================================== */}

        {currentRound === 1 && renderRound1()}

        {currentRound === 2 && renderRound2()}

        {currentRound === 3 && renderRound3()}

      </div>

    </div>
  );
};


export default Feedback;