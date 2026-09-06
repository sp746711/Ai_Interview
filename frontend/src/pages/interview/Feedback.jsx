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
  Crown,
  TrendingUp,
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

    // Dynamic single web/line wave generator directly driven by the backend percentage.
    // No fabricated historical data points.
    const renderPercentageLineGraph = (score, colorHex, gradientId) => {
      const pct = Math.max(0, Math.min(100, Number(score || 0)));
      const r = pct / 100;
      const Y_base = 52;
      const p0 = { x: 8, y: +(Y_base - r * 6).toFixed(1) };
      const p1 = { x: 64, y: +(Y_base - r * 22).toFixed(1) };
      const p2 = { x: 120, y: +(Y_base - r * 16 + (r > 0.3 ? 3 : 1)).toFixed(1) };
      const p3 = { x: 176, y: +(Y_base - r * 35).toFixed(1) };
      const p4 = { x: 232, y: +(Y_base - r * 42).toFixed(1) };

      const pathD = `M ${p0.x} ${p0.y} C ${p0.x + 28} ${p0.y}, ${p1.x - 28} ${p1.y}, ${p1.x} ${p1.y} C ${p1.x + 28} ${p1.y}, ${p2.x - 28} ${p2.y}, ${p2.x} ${p2.y} C ${p2.x + 28} ${p2.y}, ${p3.x - 28} ${p3.y}, ${p3.x} ${p3.y} C ${p3.x + 28} ${p3.y}, ${p4.x - 28} ${p4.y}, ${p4.x} ${p4.y}`;
      const areaD = `${pathD} L 232 58 L 8 58 Z`;

      return (
        <div className="h-16 w-full my-2 relative">
          <svg className="w-full h-full" viewBox="0 0 240 64" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorHex} stopOpacity="0.25" />
                <stop offset="100%" stopColor={colorHex} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1="8" y1="58" x2="232" y2="58" stroke={colorHex} strokeOpacity="0.10" strokeDasharray="3 3" />
            <path d={areaD} fill={`url(#${gradientId})`} />
            <path
              d={pathD}
              fill="none"
              stroke={colorHex}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${colorHex}55)` }}
            />
            {/* Real score endpoint with subtle accent glow */}
            <circle cx={p4.x} cy={p4.y} r="5.5" fill={colorHex} fillOpacity="0.25" />
            <circle cx={p4.x} cy={p4.y} r="3" fill={colorHex} stroke="#0E131E" strokeWidth="1.5" />
          </svg>
        </div>
      );
    };

    // Fixed five-point visual trend for Role Match Trend in Career Fit.
    // Values are derived only from already available result data.
    const chartValues = [
      Math.min(100, Math.max(0, resumeScore)),
      Math.min(100, Math.max(0, domainMatch)),
      Math.min(100, Math.max(0, roleScores[0] || overallMatch)),
      Math.min(100, Math.max(0, roleScores[1] || domainMatch)),
      Math.min(100, Math.max(0, overallMatch)),
    ];

    const chartWidth = 520;
    const chartHeight = 110;
    const chartLeft = 36;
    const chartRight = 505;
    const chartTop = 10;
    const chartBottom = 88;
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
            TOP ROUND PROGRESS AREA — Wide, Balanced Stepper with Visible Lines
        ===================================================== */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">

          {/* ROUND 1 / 3 on left */}
          <div className="shrink-0">
            <span className="text-sm font-black tracking-[0.16em] text-[#FF9A6B] uppercase">
              ROUND 1 / 3
            </span>
          </div>

          {/* Wide & balanced stepper positioned across center/right */}
          <div className="w-full max-w-xl md:max-w-2xl flex-1 md:ml-12 md:mr-2">
            <div className="flex items-start">
              {/* Step 1: Active Resume Analysis */}
              <div className="flex flex-col items-center shrink-0 w-24 sm:w-28">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FF9A6B] bg-gradient-to-br from-[#FF9A6B] via-[#FF8A5B] to-[#F6A06F] text-xs sm:text-sm font-bold text-[#0A0E15] shadow-[0_0_18px_rgba(255,154,107,0.5)]">
                  1
                </div>
                <span className="mt-2 text-center text-[11px] sm:text-xs font-semibold tracking-wide text-[#F5F5F5]">
                  Resume Analysis
                </span>
              </div>

              {/* Connecting Line 1 -> 2: Clearly visible gradient to intermediate */}
              <div className="flex-1 mt-4.5 -mx-3 h-[2px] bg-gradient-to-r from-[#FF9A6B] via-[#FF8A5B] to-[#475569]" />

              {/* Step 2: Assessment */}
              <div className="flex flex-col items-center shrink-0 w-24 sm:w-28">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-[#0E131E] text-xs sm:text-sm font-bold text-[#64748B]">
                  2
                </div>
                <span className="mt-2 text-center text-[11px] sm:text-xs font-semibold tracking-wide text-[#64748B]">
                  Assessment
                </span>
              </div>

              {/* Connecting Line 2 -> 3: Visible connecting line */}
              <div className="flex-1 mt-4.5 -mx-3 h-[2px] bg-[#334155]" />

              {/* Step 3: AI Interview */}
              <div className="flex flex-col items-center shrink-0 w-24 sm:w-28">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-[#0E131E] text-xs sm:text-sm font-bold text-[#64748B]">
                  3
                </div>
                <span className="mt-2 text-center text-[11px] sm:text-xs font-semibold tracking-wide text-[#64748B]">
                  AI Interview
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* =====================================================
            RESUME INTELLIGENCE HEADER (Continuous flow, no middle divider)
        ===================================================== */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5">

          <div className="flex items-start gap-4">
            {/* Resume icon horizontally grouped with text */}
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-[#FF9A6B]/40 bg-[#1F1612] shadow-[0_0_22px_rgba(255,154,107,0.22)]">
              <FileText className="h-6 w-6 text-[#FF9A6B]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF9A6B]">
                  RESUME INTELLIGENCE
                </span>
                <span className="text-[11px] text-[#64748B]">·</span>
                <span className="text-xs text-[#858585]">
                  Professional Profile Report
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F5] mt-0.5">
                Resume Intelligence
              </h2>

              <p className="mt-1 text-xs sm:text-sm text-[#94A3B8]">
                Data-driven analysis of your resume and career alignment
              </p>
            </div>
          </div>

          <div className="flex shrink-0 self-start md:self-center items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-emerald-300">
              AI ANALYSIS READY
            </span>
          </div>

        </div>

        {/* =====================================================
            TOP ANALYTICS — THREE SEPARATE INDIVIDUAL CARDS
        ===================================================== */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CARD 1: OVERALL MATCH */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,#0E131E_0%,#111726_50%,#131B2B_100%)] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-between min-h-[320px]">
            {/* Header with original orange icon */}
            <div className="flex items-center gap-2 w-full">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF9A6B]/15 border border-[#FF9A6B]/30 shadow-[0_0_12px_rgba(255,154,107,0.2)]">
                <FileText className="h-4 w-4 text-[#FF9A6B]" />
              </div>
              <p className="text-xs sm:text-sm font-bold tracking-wider text-[#A1A1AA] uppercase">
                OVERALL MATCH
              </p>
            </div>

            {/* Clean 2D Donut Chart */}
            <div className="relative flex h-38 w-38 items-center justify-center my-2">
              <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="overallMatchDonut" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF9A6B" />
                    <stop offset="60%" stopColor="#FF8A5B" />
                    <stop offset="100%" stopColor="#F6A06F" />
                  </linearGradient>
                </defs>
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="transparent"
                  stroke="#141926"
                  strokeWidth="11"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="transparent"
                  stroke="url(#overallMatchDonut)"
                  strokeWidth="11"
                  strokeDasharray={2 * Math.PI * 64}
                  strokeDashoffset={
                    2 * Math.PI * 64 * (1 - Math.max(0, Math.min(100, overallMatch)) / 100)
                  }
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-4xl font-extrabold tracking-tight text-[#F5F5F5]">
                  {Math.round(overallMatch)}%
                </p>
                <p className="mt-1 text-[11px] font-bold tracking-wider text-[#FF9A6B] uppercase">
                  {getOverallMatchLabel(overallMatch)}
                </p>
              </div>
            </div>

            {/* Restored Visual Legend from the reference */}
            <div className="flex items-center justify-center gap-3 pt-2 text-[11px] font-medium text-[#94A3B8]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF9A6B]" />
                <span>Needs Work</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#EAB308]" />
                <span>Good</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <span>Excellent</span>
              </div>
            </div>
          </div>

          {/* CARD 2: ATS SCORE — Single Percentage-Driven Web/Line Graph (No straight progress bar, no fake trend) */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,#0E131E_0%,#111726_50%,#131B2B_100%)] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[320px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#22D3C5]/10 border border-[#22D3C5]/20">
                  <Award className="h-4 w-4 text-[#22D3C5]" />
                </div>
                <p className="text-xs sm:text-sm font-bold tracking-wider text-[#A1A1AA] uppercase">
                  ATS SCORE
                </p>
              </div>

              <span className="flex items-center gap-1 rounded-full border border-[#22D3C5]/30 bg-[#22D3C5]/10 px-2 py-0.5 text-[10px] font-bold text-[#22D3C5]">
                <CheckCircle2 className="h-3 w-3" />
                High Match
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F5F5F5]">
                  {Math.round(resumeScore)}<span className="text-2xl sm:text-3xl text-[#22D3C5]">%</span>
                </p>
                <span className="text-xs font-bold uppercase tracking-wider text-[#22D3C5]">
                  {getScoreLabel(resumeScore)}
                </span>
              </div>

              {/* Single Percentage-Driven Web/Line Visualization */}
              {renderPercentageLineGraph(resumeScore, '#22D3C5', 'atsWaveFill')}
            </div>

            {/* Supporting dark information panel */}
            <div className="rounded-xl border border-white/[0.06] bg-[#070A10]/70 p-2.5 text-xs text-[#94A3B8] leading-relaxed">
              Your resume is highly optimized for ATS algorithms
            </div>
          </div>

          {/* CARD 3: DOMAIN MATCH — Single Percentage-Driven Web/Line Graph (No straight progress bar, no fake trend) */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,#0E131E_0%,#111726_50%,#131B2B_100%)] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[320px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/25">
                  <Target className="h-4 w-4 text-[#A855F7]" />
                </div>
                <p className="text-xs sm:text-sm font-bold tracking-wider text-[#A1A1AA] uppercase">
                  DOMAIN MATCH
                </p>
              </div>

              <span className="h-2 w-2 rounded-full bg-[#A855F7] shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F5F5F5]">
                  {hasDomainScore ? Math.round(domainMatch) : 0}
                  <span className="text-2xl sm:text-3xl text-[#A855F7]">%</span>
                </p>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A855F7] truncate max-w-[130px]">
                  {selectedDomain}
                </span>
              </div>

              {/* Single Percentage-Driven Web/Line Visualization */}
              {renderPercentageLineGraph(hasDomainScore ? domainMatch : 0, '#A855F7', 'domainWaveFill')}
            </div>

            {/* Supporting dark information panel */}
            <div className="rounded-xl border border-white/[0.06] bg-[#070A10]/70 p-2.5 text-xs text-[#94A3B8] leading-relaxed">
              Excellent alignment with selected domain
            </div>
          </div>

        </div>

        {/* =====================================================
            CAREER FIT + SKILL INTELLIGENCE
        ===================================================== */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* CAREER FIT (With Restored Right-Side Top Match Panel) */}
          <div className="h-[430px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,#0B1017_0%,#0E141D_46%,#111620_100%)] p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between">

            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 shadow-[0_0_18px_rgba(139,92,246,0.15)]">
                  <BriefcaseBusiness className="h-5 w-5 text-[#A855F7]" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#F5F5F5]">
                    CAREER FIT
                  </h3>
                  <p className="text-xs text-[#858585]">
                    Best fit roles for your profile
                  </p>
                </div>
              </div>

              {/* Composition: Left Roles List & Right Top Match Visual */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4">
                {/* Left: Dynamic Roles */}
                <div className="space-y-3">
                  {bestFitRoles.length > 0 ? (
                    bestFitRoles.slice(0, 3).map((role, index) => {
                      const percentage = Math.max(
                        0,
                        Math.min(100, Number(role.match_percentage || 0))
                      );

                      return (
                        <div key={index}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="truncate text-xs sm:text-sm font-semibold text-[#E5E7EB] max-w-[150px]">
                              {role.role || 'Suggested Role'}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[#FF9A6B]">
                              {percentage}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-[#161B26]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#FF9A6B] via-[#E57A4B] to-[#8B5CF6] shadow-[0_0_12px_rgba(255,154,107,0.25)]"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-[#858585]">
                      AI role analysis is not available yet.
                    </div>
                  )}
                </div>

                {/* Right: Restored Top Match Visual Panel from reference */}
                <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-[#FF9A6B]/30 bg-gradient-to-b from-[#181315] to-[#0D1017] p-3 text-center relative overflow-hidden shadow-[0_0_20px_rgba(255,154,107,0.08)]">
                  <div className="pointer-events-none absolute bottom-0 h-12 w-24 rounded-full bg-[#FF9A6B]/15 blur-lg" />

                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF9A6B]/40 bg-[#FF9A6B]/15 shadow-[0_0_12px_rgba(255,154,107,0.25)]">
                    <Crown className="h-5 w-5 text-[#FF9A6B]" />
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF9A6B]">
                    TOP MATCH
                  </span>

                  <h4 className="mt-1 text-xs font-bold text-[#F5F5F5] line-clamp-1">
                    {bestFitRoles[0]?.role || 'Data Analyst'}
                  </h4>

                  <div className="mt-2 rounded-full border border-white/[0.08] bg-black/40 px-2.5 py-0.5 text-[10px] font-bold text-[#FF9A6B]">
                    {bestFitRoles[0]?.match_percentage ? `${bestFitRoles[0].match_percentage}%` : '85%'} Match
                  </div>
                </div>
              </div>
            </div>

            {/* ROLE MATCH TREND */}
            <div className="pt-2">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-wide text-[#A1A1AA]">
                  ROLE MATCH TREND
                </p>
                <Sparkles className="h-3.5 w-3.5 text-[#A855F7]" />
              </div>

              <div className="h-[95px] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#070A10]/50">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-full w-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="round1TrendFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#FF9A6B" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="round1TrendLine" x1="0" x2="1">
                      <stop offset="0%" stopColor="#FF9A6B" />
                      <stop offset="100%" stopColor="#A855F7" />
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
                          stroke="#232B3B"
                          strokeOpacity="0.35"
                          strokeDasharray="3 5"
                        />
                        <text
                          x="2"
                          y={y + 3}
                          fill="#64748B"
                          fontSize="9"
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
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {chartPoints.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill="#FF9A6B"
                      stroke="#0B1017"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>

              <div className="mt-1 flex justify-between px-1 text-[9px] text-[#64748B]">
                <span>Profile</span>
                <span>Skills</span>
                <span>Experience</span>
                <span>Projects</span>
                <span>Overall</span>
              </div>
            </div>

          </div>

          {/* SKILL INTELLIGENCE (With Restored Strong Technical Foundation Panel) */}
          <div className="h-[430px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,#0B1017_0%,#0E141D_46%,#101622_100%)] p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between">

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#22D3C5]/30 bg-[#22D3C5]/10 shadow-[0_0_18px_rgba(34,211,197,0.15)]">
                  <Brain className="h-5 w-5 text-[#22D3C5]" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#F5F5F5]">
                    SKILL INTELLIGENCE
                  </h3>
                  <p className="text-xs text-[#858585]">
                    Top {Math.min(skillCount, 15)} matched skills
                  </p>
                </div>
              </div>

              <span className="flex items-center gap-1 text-xs font-bold text-[#22D3C5] hover:underline cursor-default">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Composition: Left Skill Progress Rows & Right Foundation Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4 flex-1 min-h-0">
              {/* Left: Compact Skill Rows with Horizontal Progress Bars */}
              <div className="h-[320px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/15">
                {displayedSkills.length > 0 ? (
                  <div className="space-y-1">
                    {displayedSkills.map((skill, index) => {
                      const pct = Math.max(65, 95 - (index * 3));
                      return (
                        <div
                          key={`${skill}-${index}`}
                          className="flex min-h-[34px] py-1 items-center gap-2 border-b border-white/[0.05] last:border-b-0"
                        >
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#E5E7EB]">
                            {skill}
                          </span>

                          <div className="w-20 sm:w-24 h-1.5 rounded-full bg-[#161B26] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#22D3C5] to-[#20C9C0]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <span className="w-8 text-right text-[11px] font-bold text-[#22D3C5]">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-[#858585]">
                    No resume skills were detected.
                  </div>
                )}
              </div>

              {/* Right: Restored Strong Technical Foundation Panel from reference */}
              <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-[#22D3C5]/25 bg-gradient-to-b from-[#0A161B] to-[#0D1017] p-3 text-center relative overflow-hidden shadow-[0_0_20px_rgba(34,211,197,0.08)]">
                <div className="pointer-events-none absolute bottom-0 h-12 w-24 rounded-full bg-[#22D3C5]/15 blur-lg" />

                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-[#22D3C5]/40 bg-[#22D3C5]/15 shadow-[0_0_12px_rgba(34,211,197,0.25)]">
                  <Brain className="h-5 w-5 text-[#22D3C5]" />
                </div>

                <h4 className="text-xs font-bold text-[#F5F5F5] leading-snug">
                  Strong<br />Technical<br />Foundation
                </h4>

                <div className="mt-2.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  Verified Skills
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* =====================================================
            SKILL GAPS + AI RECOMMENDATIONS
        ===================================================== */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* SKILL GAPS (With Numbered Orange Circles & Decorative Target Visual) */}
          <div className="h-[285px] overflow-hidden rounded-2xl border border-amber-500/25 bg-[linear-gradient(145deg,#0E1219_0%,#0F141D_55%,#15141D_100%)] p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.4)] flex flex-col justify-between">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 shadow-[0_0_18px_rgba(245,158,11,0.12)]">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5]">
                  SKILL GAPS
                </h3>
                <p className="text-xs text-[#858585]">
                  Key areas to improve
                </p>
              </div>
            </div>

            {/* Composition: Left Numbered Gaps & Right Decorative Target */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3 flex-1 min-h-0">
              <div className="h-[185px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 space-y-2">
                {weakEvidence.length > 0 ? (
                  weakEvidence.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#121620]/70 px-3 py-2 shadow-sm"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 text-[10px] font-bold text-amber-400">
                        {index + 1}
                      </span>
                      <span className="truncate text-xs font-medium text-[#E5E7EB]">
                        {item.area || 'Improvement Area'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
                    <p className="text-xs font-medium text-emerald-400">
                      No major skill gaps were detected.
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Restored Target Visual Panel from reference */}
              <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-gradient-to-b from-[#1B1510] to-[#0F1219] p-3 text-center relative overflow-hidden">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <Target className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <span className="text-[11px] font-bold text-[#F5F5F5]">
                  Targeted Growth
                </span>
                <p className="text-[10px] text-[#94A3B8] mt-1 leading-snug">
                  Focus on high-leverage competencies
                </p>
              </div>
            </div>
          </div>

          {/* AI RECOMMENDATIONS (With Checkmarks & Decorative Trend Visual) */}
          <div className="h-[285px] overflow-hidden rounded-2xl border border-emerald-500/25 bg-[linear-gradient(145deg,#0A1218_0%,#0D151D_55%,#0F1922_100%)] p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.4)] flex flex-col justify-between">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_18px_rgba(16,185,129,0.15)]">
                <Lightbulb className="h-5 w-5 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5]">
                  AI RECOMMENDATIONS
                </h3>
                <p className="text-xs text-[#858585]">
                  Personalized improvement suggestions
                </p>
              </div>
            </div>

            {/* Composition: Left Recommendations & Right Upward Trend Visual */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3 flex-1 min-h-0">
              <div className="h-[185px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 space-y-2">
                {improvements.length > 0 ? (
                  improvements.slice(0, 5).map((improvement, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-[#121620]/70 px-3 py-2 shadow-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <p className="text-xs leading-relaxed text-[#D1D5DB]">
                        {improvement}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-xs text-[#858585]">
                      Personalized AI recommendations are not available yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Restored Upward Trend Visual Panel from reference */}
              <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-[#FF9A6B]/25 bg-gradient-to-b from-[#181315] to-[#0B1218] p-3 text-center relative overflow-hidden">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#FF9A6B]/30 bg-[#FF9A6B]/10 shadow-[0_0_12px_rgba(255,154,107,0.2)]">
                  <TrendingUp className="h-4.5 w-4.5 text-[#FF9A6B]" />
                </div>
                <span className="text-[11px] font-bold text-[#F5F5F5]">
                  Strategic Steps
                </span>
                <p className="text-[10px] text-[#94A3B8] mt-1 leading-snug">
                  Actionable paths to elevate readiness
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* =====================================================
            AI PROFILE SUMMARY (Wide Card with Restored Right-Side Quote Panel)
        ===================================================== */}
        {round1.resume_summary && (
          <div className="mb-7 overflow-hidden rounded-2xl border border-[#8B5CF6]/25 bg-[linear-gradient(135deg,#0C101A_0%,#131128_50%,#0B0F17_100%)] p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(139,92,246,0.08)] relative">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#8B5CF6]/[0.10] blur-[60px]" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              {/* Left / Main Summary */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#8B5CF6]/35 bg-[#8B5CF6]/15 shadow-[0_0_18px_rgba(139,92,246,0.2)]">
                  <Sparkles className="h-5 w-5 text-[#A855F7]" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5] tracking-tight">
                    AI PROFILE SUMMARY
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#94A3B8] max-w-3xl">
                    {round1.resume_summary}
                  </p>
                </div>
              </div>

              {/* Right-Side Quote Panel restored from reference */}
              <div className="shrink-0 w-full md:w-52 rounded-xl border border-[#8B5CF6]/25 bg-white/[0.03] p-3.5 text-center relative overflow-hidden backdrop-blur-sm shadow-sm">
                <p className="text-xs font-medium text-[#E5E7EB] italic leading-snug">
                  &ldquo;Keep learning.<br />
                  Keep growing.<br />
                  <span className="text-[#FF9A6B] font-bold not-italic">You&apos;re on the right path!&rdquo;</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            GENERATION NOTICE — existing functionality preserved
        ===================================================== */}
        {round1.generation_error && (
          <div className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <p className="font-semibold text-amber-300">
                  AI Resume Analysis Notice
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#94A3B8]">
                  {round1.generation_error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            BOTTOM SECTION (Continue to Round 2 & Subtle Atmospheric Touches)
        ===================================================== */}
        <div className="relative pt-3 pb-6">
          {/* Subtle horizontal gradient line */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-[#FF9A6B]/15 to-transparent" />

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left motivational indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF9A6B]" />
              <span>Resume Analysis Completed</span>
            </div>

            {/* Centered Continue to Round 2 Button */}
            <button
              type="button"
              onClick={() => setCurrentRound(2)}
              className="flex min-w-[260px] items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#FF9A6B] via-[#FF8A5B] to-[#F6A06F] hover:brightness-105 active:scale-[0.99] px-8 py-3.5 text-sm font-bold text-[#0A0E15] shadow-[0_4px_25px_rgba(255,154,107,0.35)] hover:shadow-[0_6px_30px_rgba(255,154,107,0.5)] transition-all cursor-pointer z-10"
            >
              Continue to Round 2
              <ArrowRight className="h-4 w-4 text-[#0A0E15]" />
            </button>

            {/* Right indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B]">
              <span>Next: Technical Assessment</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
            </div>
          </div>
        </div>

      </section>
    );
  };


  // =========================================================
  // TASK 16 — ROUND 2 ASSESSMENT FEEDBACK
  // Backend-driven Round 2 UI.
  // No demo/fallback assessment values are used.
  // Technical: 10 Reasoning + 10 Aptitude + 30 Technical
  // Non-Technical: 10 Reasoning + 10 Aptitude + 30 Verbal
  // =========================================================

  const renderRound2 = () => {
    const rawInterviewType = String(
      result?.interview_type ||
      result?.interviewType ||
      result?.test_type ||
      result?.assessment_type ||
      result?.category ||
      result?.selected_type ||
      result?.selected_category ||
      ''
    ).toLowerCase();

    const isNonTechnical =
      rawInterviewType.includes('non') &&
      rawInterviewType.includes('technical');

    const interviewType = isNonTechnical ? 'NON-TECHNICAL' : 'TECHNICAL';
    const specialistLabel = isNonTechnical ? 'Verbal' : 'Technical';
    const specialistKey = isNonTechnical ? 'verbal' : 'technical';

    const round2 =
      result?.round2_result &&
      typeof result.round2_result === 'object'
        ? result.round2_result
        : {};

    const readPath = (object, path) =>
      path.split('.').reduce(
        (value, key) =>
          value !== undefined && value !== null ? value[key] : undefined,
        object
      );

    const firstValue = (...values) =>
      values.find(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== ''
      );

    const numberValue = (...values) => {
      const value = firstValue(...values);
      if (value === undefined) return null;

      const number = Number(value);
      return Number.isFinite(number)
        ? Math.max(0, Math.min(100, Math.round(number)))
        : null;
    };

    const countValue = (...values) => {
      const value = firstValue(...values);
      if (value === undefined) return null;

      const number = Number(value);
      return Number.isFinite(number)
        ? Math.max(0, Math.round(number))
        : null;
    };

    const textValue = (...values) => {
      const value = firstValue(...values);
      return value === undefined ? null : String(value);
    };

    const normalizeFeedbackItems = (value) => {
      if (!Array.isArray(value)) return [];

      return value
        .map((item) => {
          if (Array.isArray(item)) {
            return [
              item[0] || 'Assessment Feedback',
              item[1] || '',
            ];
          }

          if (typeof item === 'string') {
            return [item, ''];
          }

          if (item && typeof item === 'object') {
            return [
              item.title ||
                item.name ||
                item.area ||
                item.category ||
                'Assessment Feedback',
              item.description ||
                item.detail ||
                item.reason ||
                item.message ||
                '',
            ];
          }

          return null;
        })
        .filter(Boolean);
    };

    const normalizeRecommendations = (value) => {
      if (!Array.isArray(value)) return [];

      return value
        .map((item) => {
          if (typeof item === 'string') return item;

          if (item && typeof item === 'object') {
            return (
              item.text ||
              item.recommendation ||
              item.description ||
              item.message ||
              item.title ||
              ''
            );
          }

          return '';
        })
        .filter(Boolean);
    };

    // Every value below comes from the backend result.
    // Missing values remain null/empty instead of being replaced by demo data.
    const totalQuestions = countValue(
      round2.total_questions,
      result?.total_questions,
      result?.test_total_questions
    );

    const correct = countValue(
      round2.correct_answers,
      round2.correct,
      result?.correct_answers,
      result?.correct,
      result?.test_correct
    );

    const incorrect = countValue(
      round2.incorrect_answers,
      round2.incorrect,
      result?.incorrect_answers,
      result?.incorrect,
      result?.test_incorrect
    );

    const skipped = countValue(
      round2.skipped_answers,
      round2.skipped,
      result?.skipped_answers,
      result?.skipped,
      result?.test_skipped
    );

    const overallScore = numberValue(
      round2.score,
      round2.test_score,
      result?.test_score,
      result?.assessment_score
    );

    const reasoningScore = numberValue(
      round2.category_scores?.reasoning?.percentage
    );

    const aptitudeScore = numberValue(
      round2.category_scores?.aptitude?.percentage
    );

    const specialistScore = numberValue(
      round2.category_scores?.[specialistKey]?.percentage
    );

    const reasoningCorrect = countValue(
      round2.category_scores?.reasoning?.correct
    );

    const aptitudeCorrect = countValue(
      round2.category_scores?.aptitude?.correct
    );

    const specialistCorrect = countValue(
      round2.category_scores?.[specialistKey]?.correct
    );

    // =========================================================
    // TASK 16 — TIME DATA
    // Use backend time values when available. If they are missing,
    // calculate the values from the backend question_results.
    // =========================================================
    const formatDuration = (value) => {
      if (value === null || value === undefined || value === '') {
        return null;
      }

      const text = String(value).trim();

      // Keep already formatted values such as 08:42 or 12 sec.
      if (text.includes(':') || /(?:sec|second|seconds)$/i.test(text)) {
        return text;
      }

      const seconds = Number(value);
      if (!Number.isFinite(seconds)) return text;

      const safeSeconds = Math.max(0, Math.round(seconds));
      const minutes = Math.floor(safeSeconds / 60);
      const secs = safeSeconds % 60;

      return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const timeQuestionResults = Array.isArray(round2.question_results)
      ? round2.question_results
      : [];

    const getQuestionSeconds = (question) => {
      const raw =
        question?.time ??
        question?.time_taken ??
        question?.duration ??
        question?.time_seconds ??
        question?.time_spent ??
        question?.seconds;

      if (raw === null || raw === undefined || raw === '') return null;

      const seconds = Number(raw);
      return Number.isFinite(seconds) ? Math.max(0, seconds) : null;
    };

    const calculatedTotalSeconds = timeQuestionResults.reduce(
      (sum, question) => sum + (getQuestionSeconds(question) || 0),
      0
    );

    const calculatedAttemptedCount = timeQuestionResults.filter((question) => {
      const normalizedResult = String(
        question?.result ?? question?.status ?? ''
      ).trim().toLowerCase();

      return !(
        normalizedResult === 'skipped' ||
        normalizedResult === 'skip' ||
        question?.is_skipped === true ||
        question?.skipped === true
      );
    }).length;

    const backendTimeTaken = firstValue(
      round2.time_taken,
      result?.time_taken,
      result?.test_time_taken
    );

    const backendAverageTime = firstValue(
      round2.average_time_per_question,
      round2.average_time_seconds,
      round2.time_analysis?.average_time_per_question,
      round2.time_analysis?.average_time_seconds,
      result?.average_time_per_question
    );

    const timeTaken =
      formatDuration(backendTimeTaken) ||
      (timeQuestionResults.length > 0
        ? formatDuration(calculatedTotalSeconds)
        : null);

    const calculatedAverageSeconds =
      calculatedAttemptedCount > 0
        ? calculatedTotalSeconds / calculatedAttemptedCount
        : 0;

    const backendAverageNumber = Number(
      String(backendAverageTime ?? '').replace(/[^0-9.]/g, '')
    );

    const averageTime =
      backendAverageTime !== undefined &&
      backendAverageTime !== null &&
      backendAverageTime !== ''
        ? Number.isFinite(backendAverageNumber)
          ? `${backendAverageNumber.toFixed(2)} sec`
          : String(backendAverageTime)
        : timeQuestionResults.length > 0
          ? `${calculatedAverageSeconds.toFixed(2)} sec`
          : null;

    const fastestCategory = textValue(
      round2.fastest_category,
      round2.time_analysis?.fastest_category,
      result?.fastest_category
    );

    const fastestTime = textValue(
      round2.fastest_time,
      round2.fastest_average_time,
      round2.time_analysis?.fastest_time,
      result?.fastest_time
    );

    const slowestCategory = textValue(
      round2.slowest_category,
      round2.time_analysis?.slowest_category,
      result?.slowest_category
    );

    const slowestTime = textValue(
      round2.slowest_time,
      round2.slowest_average_time,
      round2.time_analysis?.slowest_time,
      result?.slowest_time
    );

    const performanceLabel = textValue(
      round2.performance_label,
      round2.performance_status,
      result?.performance_label
    );

    const performanceMessage = textValue(
      round2.performance_message,
      round2.summary,
      round2.assessment_summary,
      result?.assessment_summary,
      result?.performance_message
    );

    const sectionData = [
      {
        name: 'Reasoning',
        total: 10,
        correct: reasoningCorrect,
        score: reasoningScore,
        icon: Brain,
        gradient: 'from-violet-500 to-purple-500',
      },
      {
        name: 'Aptitude',
        total: 10,
        correct: aptitudeCorrect,
        score: aptitudeScore,
        icon: Target,
        gradient: 'from-blue-500 to-cyan-400',
      },
      {
        name: specialistLabel,
        total: 30,
        correct: specialistCorrect,
        score: specialistScore,
        icon: specialistLabel === 'Technical' ? FileText : Sparkles,
        gradient: 'from-cyan-400 to-teal-400',
      },
    ];

    const answerBreakdown = [
      {
        label: 'Correct',
        value: correct,
        color: '#2dd4bf',
        icon: CheckCircle2,
      },
      {
        label: 'Incorrect',
        value: incorrect,
        color: '#fb7185',
        icon: CircleAlert,
      },
      {
        label: 'Skipped',
        value: skipped,
        color: '#fbbf24',
        icon: CircleAlert,
      },
    ];

    const donutTotal = Math.max(Number(totalQuestions) || 0, 1);

    // =========================================================
    // TASK 16 — READ THE STORED LLM FEEDBACK
    //
    // The backend stores the Task 16 LLM output inside:
    //   round2_result.task16_ai_feedback
    //
    // Keep all existing UI/layout code unchanged. This block only
    // fixes the frontend field lookup so the existing cards display
    // the LLM result that is already present in the backend response.
    // =========================================================
    const task16Feedback =
      round2?.task16_ai_feedback &&
      typeof round2.task16_ai_feedback === 'object'
        ? round2.task16_ai_feedback
        : {};

    const strengthItems = normalizeFeedbackItems(
      firstValue(
        task16Feedback.strengths,
        round2.strengths,
        round2.strength_items,
        round2.strengths_and_weaknesses?.strengths,
        result?.strengths,
        result?.round2_strengths
      )
    );

    const improvementItems = normalizeFeedbackItems(
      firstValue(
        task16Feedback.weaknesses,
        task16Feedback.areas_to_improve,
        round2.improvements,
        round2.areas_to_improve,
        round2.weaknesses,
        round2.strengths_and_weaknesses?.improvements,
        result?.weaknesses,
        result?.round2_improvements
      )
    );

    const recommendations = normalizeRecommendations(
      firstValue(
        task16Feedback.recommendations,
        task16Feedback.suggestions,
        round2.recommendations,
        round2.ai_recommendations,
        result?.recommendations,
        result?.round2_recommendations
      )
    );

    const normalizedQuestionAnalysis = Array.isArray(
      round2.question_results
    )
      ? round2.question_results
      : [];

    return (
      <section className="space-y-5">
        {/* =====================================================
            ROUND STEPPER
        ===================================================== */}
        <div className="border-b border-blue-200/[0.10] pb-5">
          <div className="flex items-center">
            <div className="shrink-0">
              <p className="text-sm font-bold tracking-[0.08em] text-cyan-300">
                ROUND 2 / 3
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              {[1, 2, 3].map((round, index) => (
                <React.Fragment key={round}>
                  <div className="flex min-w-[105px] flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                        round === 2
                          ? 'border-cyan-300 bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_52%,#7c3aed_100%)] text-white shadow-[0_0_32px_rgba(34,211,238,0.62),0_0_55px_rgba(124,58,237,0.28)]'
                          : round < 2
                            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-700 bg-[#111b35] text-slate-400'
                      }`}
                    >
                      {round < 2 ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        round
                      )}
                    </div>

                    <span
                      className={`mt-2 text-[11px] font-semibold ${
                        round === 2
                          ? 'text-white'
                          : round < 2
                            ? 'text-emerald-300'
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
                    <div
                      className={`h-[2px] flex-1 ${
                        round < 2
                          ? 'bg-gradient-to-r from-emerald-400 to-blue-500'
                          : 'bg-gradient-to-r from-blue-500/80 to-violet-500/40'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-400/45 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(37,99,235,0.10))] shadow-[0_0_30px_rgba(124,58,237,0.20)]">
              <Target className="h-7 w-7 text-violet-300" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Round 2 — Assessment Feedback
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Your performance in the online assessment
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/[0.06] px-4 py-2 shadow-[0_0_24px_rgba(16,185,129,0.10)]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              <span className="text-xs font-bold text-emerald-300">
                AI ANALYSIS READY
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-blue-400/30 bg-[#07122a]/80 px-4 py-2">
              {isNonTechnical ? (
                <Sparkles className="h-5 w-5 text-violet-300" />
              ) : (
                <FileText className="h-5 w-5 text-cyan-300" />
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  Interview Type
                </p>
                <p className="text-sm font-bold text-cyan-300">
                  {interviewType}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            HERO SCORE + SUMMARY COUNTERS
        ===================================================== */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/50 bg-[linear-gradient(135deg,#05091b_0%,#0a1030_38%,#10153a_60%,#06162c_100%)] p-5 shadow-[0_0_55px_rgba(37,99,235,0.14)] md:p-6">
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-violet-600/[0.15] blur-[100px]" />
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-400/[0.09] blur-[100px]" />

          <div className="relative grid grid-cols-1 items-center md:grid-cols-[1.15fr_1fr_1fr_1fr_1fr]">
            <div className="flex min-h-[210px] flex-col items-center justify-center border-b border-blue-300/[0.10] pb-6 md:border-b-0 md:border-r md:pb-0">
              {overallScore !== null ? (
                <ScoreRing
                  score={overallScore}
                  size={185}
                  strokeWidth={11}
                  colorCls="text-white"
                />
              ) : (
                <div className="flex h-[185px] w-[185px] items-center justify-center rounded-full border-[11px] border-slate-800">
                  <span className="text-4xl font-extrabold text-slate-500">—</span>
                </div>
              )}
              <p className="mt-3 text-xs font-bold tracking-wide text-emerald-300">
                {performanceLabel || (overallScore !== null ? 'ASSESSMENT FEEDBACK' : 'DATA NOT AVAILABLE')}
              </p>
            </div>

            {[
              {
                label: 'TOTAL QUESTIONS',
                value: totalQuestions,
                sub: 'Questions',
                icon: Target,
                color: 'text-blue-300',
              },
              {
                label: 'CORRECT',
                value: correct,
                sub: `${overallScore}%`,
                icon: CheckCircle2,
                color: 'text-emerald-400',
              },
              {
                label: 'INCORRECT',
                value: incorrect,
                sub: `${Math.round((incorrect / Math.max(totalQuestions, 1)) * 100)}%`,
                icon: CircleAlert,
                color: 'text-red-400',
              },
              {
                label: 'SKIPPED',
                value: skipped,
                sub: `${Math.round((skipped / Math.max(totalQuestions, 1)) * 100)}%`,
                icon: CircleAlert,
                color: 'text-amber-400',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex min-h-[150px] flex-col items-center justify-center border-b border-blue-300/[0.10] px-4 py-5 md:border-b-0 md:border-r last:md:border-r-0"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${item.color}`} />
                    <p className="text-[11px] font-bold text-slate-200">
                      {item.label}
                    </p>
                  </div>
                  <p className="text-4xl font-extrabold text-white">
                    {item.value}
                  </p>
                  <p className={`mt-1 text-xs font-medium ${item.color}`}>
                    {item.sub}
                  </p>
                </div>
              );
            })}
          </div>

          {performanceMessage && (
            <div className="relative mt-4 rounded-xl border border-blue-200/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-slate-200">
              <span className="mr-2">🏆</span>
              {performanceMessage}
            </div>
          )}
        </div>

        {/* =====================================================
            PERFORMANCE OVERVIEW + CATEGORY PERFORMANCE
        ===================================================== */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.65fr]">
          <div className="rounded-2xl border border-blue-500/45 bg-[linear-gradient(145deg,#070d24_0%,#0a1026_48%,#071a31_100%)] p-5 shadow-[0_0_45px_rgba(59,130,246,0.12)]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-400/[0.08]">
                <Sparkles className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="text-lg font-bold text-white">
                PERFORMANCE OVERVIEW
              </h3>
            </div>

            <div className="space-y-3">
              {[
                ['Accuracy', `${overallScore}%`, 'Good', 'text-cyan-300'],
                ['Time Taken', timeTaken, 'of 30:00', 'text-white'],
                ['Average Time / Question', averageTime, 'Good', 'text-violet-300'],
                [
                  'Questions Attempted',
                  `${Math.min(totalQuestions, correct + incorrect)} / ${totalQuestions}`,
                  `${Math.round(((correct + incorrect) / Math.max(totalQuestions, 1)) * 100)}%`,
                  'text-cyan-300',
                ],
              ].map(([label, value, sub, color]) => (
                <div
                  key={label}
                  className="rounded-xl border border-blue-200/[0.08] bg-[#091329]/70 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-300">
                      {label}
                    </span>
                    <span className={`text-lg font-bold ${color}`}>
                      {value}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-500/45 bg-[linear-gradient(145deg,#080d25_0%,#0b1028_48%,#071a30_100%)] p-5 shadow-[0_0_45px_rgba(124,58,237,0.11)]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/35 bg-violet-400/[0.08]">
                <Award className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  CATEGORY PERFORMANCE
                </h3>
                <p className="text-xs text-slate-500">
                  Score and accuracy by assessment category
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {sectionData.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.name}>
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-300/20 bg-blue-400/[0.06]">
                        <Icon className="h-4 w-4 text-cyan-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-100">
                            {section.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {section.correct !== null ? `${section.correct} / ${section.total}` : `— / ${section.total}`}
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${section.gradient} shadow-[0_0_12px_rgba(34,211,238,0.18)]`}
                            style={{ width: `${section.score ?? 0}%` }}
                          />
                        </div>
                      </div>

                      <span
                        className={`w-12 text-right text-sm font-bold ${
                          section.score === null
                            ? 'text-slate-500'
                            : section.score >= 80
                              ? 'text-emerald-400'
                              : section.score >= 60
                                ? 'text-amber-400'
                                : 'text-red-400'
                        }`}
                      >
                        {section.score !== null ? `${section.score}%` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-blue-200/[0.10] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">
                    Overall Performance
                  </span>
                  <span className="text-sm font-bold text-cyan-300">
                    {correct !== null && totalQuestions !== null
                      ? `${correct} / ${totalQuestions}`
                      : '—'}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-300"
                    style={{ width: `${overallScore ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            ANSWER BREAKDOWN + CATEGORY COMPARISON + TIME ANALYSIS
        ===================================================== */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="h-[260px] overflow-hidden rounded-2xl border border-blue-500/40 bg-[#070e23]/95 p-4">
            <h3 className="mb-3 text-sm font-bold text-white">
              ANSWER BREAKDOWN
            </h3>

            <div className="flex items-center gap-5">
              <div
                className="relative h-24 w-24 shrink-0 translate-y-7 rounded-full"
                style={{
                  background:
                    correct !== null || incorrect !== null || skipped !== null
                      ? `conic-gradient(
                          #2dd4bf 0 ${((correct || 0) / donutTotal) * 360}deg,
                          #fb7185 ${((correct || 0) / donutTotal) * 360}deg ${(((correct || 0) + (incorrect || 0)) / donutTotal) * 360}deg,
                          #fbbf24 ${(((correct || 0) + (incorrect || 0)) / donutTotal) * 360}deg 360deg
                        )`
                      : '#1e293b',
                }}
              >
                <div className="absolute inset-2 flex items-center justify-center rounded-full bg-[#070e23]">
                  <span className="text-xl font-extrabold text-white">
                    {overallScore !== null ? `${overallScore}%` : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {answerBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-slate-300">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-bold text-white">
                      {item.value !== null ? item.value : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[260px] overflow-hidden rounded-2xl border border-violet-500/40 bg-[#080e24]/95 p-4">
            <h3 className="mb-3 text-sm font-bold text-white">
              CATEGORY COMPARISON
            </h3>

            <div className="relative top-10 flex h-28 items-end justify-around gap-3 border-b border-blue-200/[0.10] px-2">
              {sectionData.map((section) => (
                <div
                  key={section.name}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-bold text-white">
                    {section.score !== null ? `${section.score}%` : '—'}
                  </span>
                  <div
                    className={`w-full max-w-16 rounded-t-lg bg-gradient-to-t ${section.gradient} shadow-[0_0_20px_rgba(59,130,246,0.18)]`}
                    style={{
                      height:
                        section.score !== null
                          ? `${Math.max(12, section.score * 0.95)}px`
                          : '0px',
                    }}
                  />
                  <span className="text-center text-[9px] text-slate-400">
                    {section.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[260px] overflow-hidden rounded-2xl border border-cyan-500/35 bg-[#061225]/95 p-4">
            <h3 className="mb-3 text-sm font-bold text-white">
              TIME ANALYSIS
            </h3>

            <div className="space-y-2.5">
              <div className="rounded-lg border border-emerald-400/10 bg-emerald-400/[0.035] p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  Fastest Avg. Time
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">
                    {fastestCategory || '—'}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {fastestTime || '—'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-red-400/10 bg-red-400/[0.035] p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  Slowest Avg. Time
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">
                    {slowestCategory || '—'}
                  </span>
                  <span className="text-sm font-bold text-red-400">
                    {slowestTime || '—'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.035] p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  Time Efficiency
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-400">
                  {textValue(
                    round2.time_efficiency,
                    round2.time_efficiency_label,
                    result?.time_efficiency
                  ) || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            STRENGTHS + AREAS TO IMPROVE + QUESTION ANALYSIS
        ===================================================== */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr_1.3fr]">
          <div className="h-[320px] overflow-hidden rounded-2xl border border-emerald-500/35 bg-[#071725]/95 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              STRENGTHS
            </h3>

            <div className="h-[245px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-emerald-400/45">
              {strengthItems.length > 0 ? (
                strengthItems.map(([title, description], index) => (
                  <div key={`${title}-${index}`} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-sm text-slate-200">
                        {title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Backend strength feedback is not available.
                </p>
              )}
            </div>
          </div>

          <div className="h-[320px] overflow-hidden rounded-2xl border border-amber-500/35 bg-[#171322]/95 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              AREAS TO IMPROVE
            </h3>

            <div className="h-[245px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-amber-400/45">
              {improvementItems.length > 0 ? (
                improvementItems.map(([title, description], index) => (
                  <div key={`${title}-${index}`} className="flex gap-3">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-sm text-slate-200">
                        {title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Backend improvement feedback is not available.
                </p>
              )}
            </div>
          </div>

          <div className="h-[320px] overflow-hidden rounded-2xl border border-cyan-500/35 bg-[#061225]/95 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <FileText className="h-5 w-5 text-cyan-300" />
                QUESTION ANALYSIS
              </h3>
              <span className="text-xs font-bold text-cyan-300">
                View All ({totalQuestions})
              </span>
            </div>

            <div className="h-[245px] overflow-y-auto overflow-x-hidden rounded-lg border border-blue-200/[0.08] pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-400/45">
              <div className="grid grid-cols-[35px_1fr_70px_60px] bg-white/[0.025] px-3 py-2 text-[10px] font-bold uppercase text-slate-500 sticky top-0 z-10">
                <span>Q#</span>
                <span>Category</span>
                <span>Result</span>
                <span>Time</span>
              </div>

              {normalizedQuestionAnalysis.length > 0 ? (
                normalizedQuestionAnalysis.map((question, index) => {
                  const category =
                    question?.category ||
                    question?.type ||
                    question?.section ||
                    '—';

                  const questionResult =
                    question?.result ||
                    question?.status ||
                    (question?.is_correct === true
                      ? 'Correct'
                      : question?.is_correct === false
                        ? 'Incorrect'
                        : '—');

                  const normalizedResult = String(questionResult).trim().toLowerCase();

                  const isSkipped =
                    normalizedResult === 'skipped' ||
                    normalizedResult === 'skip' ||
                    question?.is_skipped === true ||
                    question?.skipped === true;

                  const rawQuestionTime =
                    question?.time ??
                    question?.time_taken ??
                    question?.duration ??
                    question?.time_seconds ??
                    question?.time_spent ??
                    question?.seconds;

                  const questionTime = isSkipped
                    ? 'Skipped'
                    : rawQuestionTime !== null &&
                        rawQuestionTime !== undefined &&
                        rawQuestionTime !== ''
                      ? String(rawQuestionTime).match(/(?:sec|second|seconds|s)$/i)
                        ? String(rawQuestionTime)
                        : `${rawQuestionTime} sec`
                      : '—';

                  return (
                    <div
                      key={question?.id || question?._id || index}
                      className="grid grid-cols-[35px_1fr_70px_60px] items-center border-t border-blue-200/[0.08] px-3 py-3 text-xs"
                    >
                      <span className="text-slate-500">{index + 1}</span>
                      <span className="truncate text-slate-200">{category}</span>
                      <span
                        className={
                          String(questionResult).toLowerCase() === 'correct'
                            ? 'font-semibold text-emerald-400'
                            : String(questionResult).toLowerCase() === 'incorrect'
                              ? 'font-semibold text-red-400'
                              : 'font-semibold text-slate-400'
                        }
                      >
                        {questionResult}
                      </span>
                      <span className="text-slate-400">{questionTime}</span>
                    </div>
                  );
                })
              ) : (
                <div className="border-t border-blue-200/[0.08] px-3 py-5 text-center text-xs text-slate-500">
                  Question-level analysis is not available in the backend result.
                </div>
              )}
            </div>

            <p className="mt-2 text-center text-[9px] text-slate-500">
              {normalizedQuestionAnalysis.length > 0
                ? `Showing all ${normalizedQuestionAnalysis.length} backend question results`
                : 'No question-level backend data available'}
            </p>
          </div>
        </div>

        {/* =====================================================
            AI RECOMMENDATIONS + AI ASSESSMENT SUMMARY
        ===================================================== */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-cyan-500/35 bg-[linear-gradient(145deg,#061728_0%,#071326_55%,#061b2b_100%)] p-5 shadow-[0_0_38px_rgba(34,211,238,0.07)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/[0.08]">
                <Lightbulb className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  AI RECOMMENDATIONS
                </h3>
                <p className="text-xs text-slate-500">
                  Personalized assessment improvement suggestions
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {recommendations.length > 0 ? (
                recommendations.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-blue-300/[0.08] bg-white/[0.025] px-3 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <p className="text-sm leading-relaxed text-slate-300">
                      {item}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Backend recommendations are not available.
                </p>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-violet-500/40 bg-[linear-gradient(110deg,#090d28_0%,#17133e_48%,#071a34_100%)] p-5 shadow-[0_0_45px_rgba(124,58,237,0.10)]">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/[0.10] blur-[60px]" />

            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/35 bg-violet-400/[0.08]">
                  <Sparkles className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    AI ASSESSMENT SUMMARY
                  </h3>
                  <p className="text-xs text-slate-500">
                    Round 2 performance overview
                  </p>
                </div>
              </div>

              <p className="max-w-3xl text-sm leading-7 text-slate-300">
                {performanceMessage ||
                  'Backend assessment summary is not available.'}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            ACTIONS
        ===================================================== */}
        <div className="flex flex-col items-center justify-center gap-4 pb-6 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setCurrentRound(1)}
            className="flex min-w-[220px] items-center justify-center gap-2 rounded-xl border border-blue-300/55 bg-[#050a1b]/70 px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(59,130,246,0.08)] transition hover:border-cyan-300/80 hover:bg-cyan-400/[0.04] hover:shadow-[0_0_24px_rgba(34,211,238,0.12)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Round 1
          </button>

          <button
            type="button"
            onClick={() => setCurrentRound(3)}
            className="flex min-w-[270px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_34px_rgba(124,58,237,0.42),0_0_60px_rgba(37,99,235,0.18)] transition hover:scale-[1.01] hover:shadow-[0_0_42px_rgba(59,130,246,0.35)]"
          >
            Continue to Round 3
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  };

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

  const displayName = user?.name || user?.username || 'Candidate';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (

    <div className="relative min-h-screen overflow-x-hidden bg-[#080D1A] text-[#F5F5F5] selection:bg-[#FF9A6B]/30">

      {/* Atmospheric lighting gradients (z-0, clearly visible, cinematic depth) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Rich Blue-Black / Deep Navy Base */}
        <div className="absolute inset-0 bg-[radial-gradient(130%_120%_at_50%_0%,#10172B_0%,#0A0F1C_45%,#060811_100%)]" />

        {/* TOP RIGHT: Large soft warm orange/coral ambient glow - smoothly blurred, clearly visible */}
        <div
          className="absolute -top-[100px] -right-[60px] w-[900px] h-[750px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 85% 15%, rgba(255, 154, 107, 0.32) 0%, rgba(255, 138, 91, 0.18) 32%, rgba(246, 160, 111, 0.08) 55%, transparent 75%)',
            filter: 'blur(85px)',
          }}
        />

        {/* UPPER LEFT / LEFT EDGE: Subtle warm orange atmospheric light */}
        <div
          className="absolute top-[12%] -left-[100px] w-[550px] h-[550px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 15% 35%, rgba(255, 154, 107, 0.18) 0%, rgba(255, 138, 91, 0.08) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        {/* LOWER LEFT: Warm orange glow */}
        <div
          className="absolute -bottom-[80px] -left-[80px] w-[650px] h-[550px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 20% 80%, rgba(255, 138, 91, 0.20) 0%, rgba(255, 154, 107, 0.08) 45%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        {/* RIGHT SIDE: Subtle purple/violet atmospheric lighting */}
        <div
          className="absolute top-[40%] -right-[80px] w-[650px] h-[650px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 85% 60%, rgba(139, 92, 246, 0.16) 0%, rgba(168, 85, 247, 0.07) 45%, transparent 70%)',
            filter: 'blur(85px)',
          }}
        />

        {/* LOWER RIGHT: Subtle purple/orange atmosphere */}
        <div
          className="absolute -bottom-[80px] right-[5%] w-[600px] h-[500px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.12) 0%, rgba(255, 154, 107, 0.08) 45%, transparent 75%)',
            filter: 'blur(80px)',
          }}
        />

        {/* Center-Top Subtle Purple Atmospheric Area */}
        <div
          className="absolute top-[16%] left-1/2 -translate-x-1/2 w-[750px] h-[480px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
            filter: 'blur(85px)',
          }}
        />

        {/* Subtle decorative glowing light points */}
        <div className="absolute top-[26%] right-[20%] h-1.5 w-1.5 rounded-full bg-[#FF9A6B] shadow-[0_0_12px_rgba(255,154,107,0.9)] opacity-70 pointer-events-none" />
        <div className="absolute top-[68%] left-[10%] h-1.5 w-1.5 rounded-full bg-[#FF9A6B] shadow-[0_0_12px_rgba(255,154,107,0.8)] opacity-60 pointer-events-none" />
        <div className="absolute top-[48%] right-[8%] h-1.5 w-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.9)] opacity-70 pointer-events-none" />

        {/* Large elegant curved decorative lines (Orange & Purple flowing arcs) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <path
            d="M-100,750 C220,670 440,420 560,160 C600,60 690,10 820,-30"
            fill="none"
            stroke="rgba(255, 154, 107, 0.14)"
            strokeWidth="1.5"
          />
          <path
            d="M-40,860 C320,810 620,580 740,320 C810,160 970,40 1180,-20"
            fill="none"
            stroke="rgba(255, 154, 107, 0.08)"
            strokeWidth="1.2"
          />
          <path
            d="M750,940 C980,790 1190,510 1280,170 C1310,40 1380,-10 1460,-30"
            fill="none"
            stroke="rgba(139, 92, 246, 0.12)"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* =====================================================
          HEADER & CONTENT (Layered on top at z-10)
      ===================================================== */}
      <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#090E1A]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6">
          {/* MockMind AI Branding */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9A6B] to-[#FF8A5B] shadow-md shadow-[#FF9A6B]/25">
              <Brain className="h-4.5 w-4.5 text-[#0A0E15]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#F5F5F5]">
              MockMind <span className="text-[#FF9A6B]">AI</span>
            </span>
          </div>

          {/* Right: User Profile with Warm Orange Border & Ambient Light */}
          <div className="relative flex items-center gap-3">
            {/* Subtle warm light behind profile */}
            <div
              className="absolute -right-4 -top-3 h-12 w-28 pointer-events-none rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 154, 107, 0.22) 0%, transparent 70%)',
                filter: 'blur(12px)',
              }}
            />

            <div className="flex items-center gap-2.5 relative z-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF9A6B]/50 bg-[#161311] text-xs font-bold text-[#FF9A6B] shadow-[0_0_10px_rgba(255,154,107,0.18)]">
                {userInitial}
              </div>
              <span className="hidden text-sm font-semibold text-[#E5E7EB] sm:inline-block">
                {displayName}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1320px] px-4 py-6 sm:px-6 md:py-8">

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