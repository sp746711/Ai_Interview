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
} from 'lucide-react';

const Feedback = () => {
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

        // =========================================================
        // TASK 14 ONLY — FEEDBACK READY AVATAR MESSAGE
        // Existing feedback/result logic remains unchanged.
        // =========================================================

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

        // -----------------------------------------------------
        // Save interview summary in localStorage history
        // -----------------------------------------------------

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

        // -----------------------------------------------------
        // Clear active interview
        // -----------------------------------------------------

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
  }, [queryId, navigate]);

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />

        <p className="text-gray-400 text-lg">
          Compiling your comprehensive feedback...
        </p>

        <p className="text-gray-500 text-sm text-center max-w-md">
          Your resume feedback may take a little longer while
          the AI analyzes your resume.
        </p>
      </div>
    );
  }

  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />

          <h2 className="text-2xl font-bold mb-3">
            Result Unavailable
          </h2>

          <p className="text-gray-400 mb-6">
            {error}
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

  const resumeScore = Number(result.resume_score || 0);
  const testScore = Number(result.test_score || 0);
  const interviewScore = Number(
    result.interview_score || 0
  );
  const finalScore = Number(result.final_score || 0);

  const resumeSkills = Array.isArray(result.resume_skills)
    ? result.resume_skills
    : [];

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

  // =========================================================
  // SCORE COLOR
  // =========================================================

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // =========================================================
  // SCORE RING
  // =========================================================

  const ScoreRing = ({
    score = 0,
    size = 120,
    strokeWidth = 8,
    colorCls,
  }) => {
    const safeScore = Math.max(
      0,
      Math.min(100, Number(score) || 0)
    );

    const radius = (size - strokeWidth) / 2;

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
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-dark-700"
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
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
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
  // PAGE
  // =========================================================

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* =====================================================
          OVERALL RESULT
      ====================================================== */}

      <div className="glass-card relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 p-8">

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[80px] -z-10 rounded-full" />

        <div>
          <p className="text-primary-400 text-sm font-semibold uppercase tracking-wider mb-2">
            Interview Completed
          </p>

          <h1 className="text-3xl font-bold mb-2 break-words">
            Interview Result:{' '}
            {result.role ||
              result.interview_type ||
              'Interview'}
          </h1>

          {result.difficulty && (
            <div className="flex gap-4 text-sm text-gray-400 mb-6">
              <span className="capitalize bg-dark-800 px-3 py-1 rounded">
                Difficulty: {result.difficulty}
              </span>
            </div>
          )}

          <p className="text-gray-300 max-w-lg leading-relaxed">
            Your performance has been evaluated across
            three rounds: Resume Screening, Technical
            Test, and AI Interview. Review each round
            below for detailed feedback.
          </p>
        </div>

        <div className="flex flex-col items-center">

          <p className="text-sm text-gray-400 font-medium mb-4 uppercase tracking-wider">
            Final Score
          </p>

          <div className="relative">

            <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full" />

            <ScoreRing
              score={finalScore}
              size={160}
              strokeWidth={12}
              colorCls={getScoreColor(finalScore)}
            />

          </div>

        </div>
      </div>

      {/* =====================================================
          THREE ROUND SCORE CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ROUND 1 */}

        <div className="glass-card flex flex-col items-center text-center p-6">

          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-300 border border-white/10">
            <FileText className="w-6 h-6" />
          </div>

          <p className="text-xs text-primary-400 font-semibold mb-1">
            ROUND 1
          </p>

          <h3 className="font-bold text-lg mb-1">
            Resume Screening
          </h3>

          <p className="text-xs text-gray-400 mb-6">
            ATS Match & Skills
          </p>

          <ScoreRing
            score={resumeScore}
            size={100}
            strokeWidth={8}
            colorCls={getScoreColor(resumeScore)}
          />

        </div>

        {/* ROUND 2 */}

        <div className="glass-card flex flex-col items-center text-center p-6">

          <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center mb-4 text-primary-400 border border-primary-500/20">
            <Target className="w-6 h-6" />
          </div>

          <p className="text-xs text-primary-400 font-semibold mb-1">
            ROUND 2
          </p>

          <h3 className="font-bold text-lg mb-1">
            Technical Test
          </h3>

          <p className="text-xs text-gray-400 mb-6">
            Multiple Choice Assessment
          </p>

          <ScoreRing
            score={testScore}
            size={100}
            strokeWidth={8}
            colorCls={getScoreColor(testScore)}
          />

        </div>

        {/* ROUND 3 */}

        <div className="glass-card flex flex-col items-center text-center p-6">

          <div className="w-12 h-12 bg-neon-purple/10 rounded-full flex items-center justify-center mb-4 text-neon-purple border border-neon-purple/20">
            <Bot className="w-6 h-6" />
          </div>

          <p className="text-xs text-neon-purple font-semibold mb-1">
            ROUND 3
          </p>

          <h3 className="font-bold text-lg mb-1">
            AI Interview
          </h3>

          <p className="text-xs text-gray-400 mb-6">
            Communication & Reasoning
          </p>

          <ScoreRing
            score={interviewScore}
            size={100}
            strokeWidth={8}
            colorCls={getScoreColor(interviewScore)}
          />

        </div>

      </div>

      {/* =====================================================
          ROUND 1 DETAILED FEEDBACK
      ====================================================== */}

      <section className="space-y-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 bg-primary-500/10 rounded-xl flex items-center justify-center border border-primary-500/20">
            <FileText className="w-6 h-6 text-primary-400" />
          </div>

          <div>
            <p className="text-xs text-primary-400 font-semibold tracking-wider">
              ROUND 1
            </p>

            <h2 className="text-2xl font-bold">
              Resume Screening Feedback
            </h2>
          </div>

        </div>

        {/* ATS + DOMAIN MATCH */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="glass-card p-6 flex flex-col items-center text-center">

            <h3 className="font-semibold text-lg mb-2">
              ATS Resume Score
            </h3>

            <p className="text-gray-400 text-sm mb-5">
              Resume screening score
            </p>

            <ScoreRing
              score={resumeScore}
              size={130}
              strokeWidth={10}
              colorCls={getScoreColor(resumeScore)}
            />

          </div>

          <div className="glass-card p-6 flex flex-col items-center text-center">

            <h3 className="font-semibold text-lg mb-2">
              Domain Match
            </h3>

            <p className="text-gray-400 text-sm mb-5">
              {round1.selected_domain
                ? `Target: ${round1.selected_domain}`
                : 'Selected target domain'}
            </p>

            <ScoreRing
              score={domainMatch}
              size={130}
              strokeWidth={10}
              colorCls={getScoreColor(domainMatch)}
            />

          </div>

        </div>

        {/* DETECTED SKILLS */}

        <div className="glass-card p-6">

          <div className="flex items-center gap-3 mb-5">

            <CheckCircle2 className="w-5 h-5 text-green-400" />

            <h3 className="text-lg font-semibold">
              Detected Resume Skills
            </h3>

          </div>

          {resumeSkills.length > 0 ? (

            <div className="flex flex-wrap gap-3">

              {resumeSkills.map((skill, index) => (

                <span
                  key={`${skill}-${index}`}
                  className="px-4 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm"
                >
                  {skill}
                </span>

              ))}

            </div>

          ) : (

            <p className="text-gray-400 text-sm">
              No skills were detected from the resume.
            </p>

          )}

        </div>

        {/* AI SUMMARY */}

        {round1.resume_summary && (

          <div className="glass-card p-6">

            <div className="flex items-center gap-3 mb-4">

              <Sparkles className="w-5 h-5 text-primary-400" />

              <h3 className="text-lg font-semibold">
                AI Resume Assessment
              </h3>

            </div>

            <p className="text-gray-300 leading-relaxed">
              {round1.resume_summary}
            </p>

          </div>

        )}

        {/* GENERATION ERROR */}

        {round1.generation_error && (

          <div className="glass-card p-6 border border-yellow-500/20">

            <div className="flex gap-3">

              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />

              <div>

                <h3 className="font-semibold text-yellow-400 mb-2">
                  Detailed AI Resume Analysis Unavailable
                </h3>

                <p className="text-gray-400 text-sm">
                  {round1.generation_error}
                </p>

              </div>

            </div>

          </div>

        )}

        {/* BEST FIT ROLES */}

        <div className="glass-card p-6">

          <div className="flex items-center gap-3 mb-5">

            <BriefcaseBusiness className="w-5 h-5 text-primary-400" />

            <h3 className="text-lg font-semibold">
              Best-Fit Job Roles
            </h3>

          </div>

          {bestFitRoles.length > 0 ? (

            <div className="space-y-4">

              {bestFitRoles.map((role, index) => {

                const percentage = Number(
                  role.match_percentage || 0
                );

                return (

                  <div
                    key={index}
                    className="bg-white/[0.03] border border-white/10 rounded-xl p-4"
                  >

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">

                      <h4 className="font-semibold text-white">
                        {role.role || 'Suggested Role'}
                      </h4>

                      <span
                        className={`font-bold ${getScoreColor(
                          percentage
                        )}`}
                      >
                        {percentage}% Match
                      </span>

                    </div>

                    <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden mb-3">

                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, percentage)
                          )}%`,
                        }}
                      />

                    </div>

                    {role.reason && (

                      <p className="text-sm text-gray-400 leading-relaxed">
                        {role.reason}
                      </p>

                    )}

                  </div>

                );
              })}

            </div>

          ) : (

            <p className="text-gray-400 text-sm">
              No best-fit role recommendations are available.
            </p>

          )}

        </div>

        {/* MATCHING SKILLS */}

        <div className="glass-card p-6">

          <div className="flex items-center gap-3 mb-5">

            <CheckCircle2 className="w-5 h-5 text-green-400" />

            <h3 className="text-lg font-semibold">
              Matching Skills & Evidence
            </h3>

          </div>

          {matchingSkills.length > 0 ? (

            <div className="space-y-4">

              {matchingSkills.map((item, index) => (

                <div
                  key={index}
                  className="bg-green-500/5 border border-green-500/10 rounded-xl p-4"
                >

                  <div className="flex items-start gap-3">

                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />

                    <div>

                      <h4 className="font-semibold text-green-300 mb-1">
                        {item.skill || 'Skill'}
                      </h4>

                      {item.evidence && (

                        <p className="text-sm text-gray-400 leading-relaxed">
                          {item.evidence}
                        </p>

                      )}

                    </div>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <p className="text-gray-400 text-sm">
              No detailed matching-skill evidence is available.
            </p>

          )}

        </div>

        {/* WEAK / MISSING EVIDENCE */}

        <div className="glass-card p-6">

          <div className="flex items-center gap-3 mb-5">

            <AlertTriangle className="w-5 h-5 text-yellow-400" />

            <h3 className="text-lg font-semibold">
              Missing or Weak Evidence
            </h3>

          </div>

          {weakEvidence.length > 0 ? (

            <div className="space-y-4">

              {weakEvidence.map((item, index) => (

                <div
                  key={index}
                  className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4"
                >

                  <div className="flex items-start gap-3">

                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />

                    <div>

                      <h4 className="font-semibold text-yellow-300 mb-1">
                        {item.area || 'Improvement Area'}
                      </h4>

                      {item.reason && (

                        <p className="text-sm text-gray-400 leading-relaxed">
                          {item.reason}
                        </p>

                      )}

                    </div>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <p className="text-gray-400 text-sm">
              No major weak areas were identified.
            </p>

          )}

        </div>

        {/* PERSONALIZED IMPROVEMENTS */}

        <div className="glass-card p-6">

          <div className="flex items-center gap-3 mb-5">

            <Lightbulb className="w-5 h-5 text-yellow-400" />

            <h3 className="text-lg font-semibold">
              Personalized Resume Improvements
            </h3>

          </div>

          {improvements.length > 0 ? (

            <div className="space-y-3">

              {improvements.map(
                (improvement, index) => (

                  <div
                    key={index}
                    className="flex items-start gap-4 bg-white/[0.03] border border-white/10 rounded-xl p-4"
                  >

                    <div className="w-7 h-7 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed">
                      {improvement}
                    </p>

                  </div>

                )
              )}

            </div>

          ) : (

            <p className="text-gray-400 text-sm">
              No personalized improvements are currently available.
            </p>

          )}

        </div>

      </section>

      {/* =====================================================
          ROUND 2 FEEDBACK
      ====================================================== */}

      <section className="space-y-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 bg-primary-500/10 rounded-xl flex items-center justify-center border border-primary-500/20">
            <Target className="w-6 h-6 text-primary-400" />
          </div>

          <div>

            <p className="text-xs text-primary-400 font-semibold tracking-wider">
              ROUND 2
            </p>

            <h2 className="text-2xl font-bold">
              Technical Test Feedback
            </h2>

          </div>

        </div>

        <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">

          <ScoreRing
            score={testScore}
            size={130}
            strokeWidth={10}
            colorCls={getScoreColor(testScore)}
          />

          <div>

            <h3 className="text-xl font-semibold mb-2">
              Technical Assessment Score
            </h3>

            <p className="text-gray-400 leading-relaxed">
              Your Round 2 score is based on your
              multiple-choice technical assessment.
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          ROUND 3 FEEDBACK
      ====================================================== */}

      <section className="space-y-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 bg-neon-purple/10 rounded-xl flex items-center justify-center border border-neon-purple/20">
            <Bot className="w-6 h-6 text-neon-purple" />
          </div>

          <div>

            <p className="text-xs text-neon-purple font-semibold tracking-wider">
              ROUND 3
            </p>

            <h2 className="text-2xl font-bold">
              AI Interview Feedback
            </h2>

          </div>

        </div>

        <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">

          <ScoreRing
            score={interviewScore}
            size={130}
            strokeWidth={10}
            colorCls={getScoreColor(interviewScore)}
          />

          <div>

            <h3 className="text-xl font-semibold mb-2">
              AI Interview Score
            </h3>

            <p className="text-gray-400 leading-relaxed">
              Your Round 3 score reflects your AI
              interview performance, communication,
              reasoning, and response quality.
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          OVERALL FEEDBACK
      ====================================================== */}

      <section className="space-y-6">

        <div>

          <p className="text-xs text-primary-400 font-semibold tracking-wider mb-1">
            FINAL ASSESSMENT
          </p>

          <h2 className="text-2xl font-bold">
            Overall Feedback
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* STRENGTHS */}

          <div className="glass-card p-6">

            <h3 className="font-semibold text-lg mb-4 text-green-400">
              Strengths
            </h3>

            <ul className="text-gray-300 space-y-3 text-sm">

              {(result.strengths || []).map(
                (item, idx) => (

                  <li
                    key={idx}
                    className="flex items-start gap-2"
                  >

                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />

                    <span>{item}</span>

                  </li>

                )
              )}

            </ul>

          </div>

          {/* WEAKNESSES */}

          <div className="glass-card p-6">

            <h3 className="font-semibold text-lg mb-4 text-yellow-400">
              Weaknesses
            </h3>

            <ul className="text-gray-300 space-y-3 text-sm">

              {(result.weaknesses || []).map(
                (item, idx) => (

                  <li
                    key={idx}
                    className="flex items-start gap-2"
                  >

                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />

                    <span>{item}</span>

                  </li>

                )
              )}

            </ul>

          </div>

          {/* SUGGESTIONS */}

          <div className="glass-card p-6">

            <h3 className="font-semibold text-lg mb-4 text-primary-400">
              Suggestions
            </h3>

            <ul className="text-gray-300 space-y-3 text-sm">

              {(result.suggestions || []).map(
                (item, idx) => (

                  <li
                    key={idx}
                    className="flex items-start gap-2"
                  >

                    <Lightbulb className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />

                    <span>{item}</span>

                  </li>

                )
              )}

            </ul>

          </div>

        </div>

      </section>

      {/* =====================================================
          RETURN BUTTON
      ====================================================== */}

      <div className="flex justify-center pt-4 pb-8">

        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Return to Dashboard
        </button>

      </div>

    </div>
  );
};

export default Feedback;