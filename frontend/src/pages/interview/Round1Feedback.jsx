import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";

import {
  Loader2,
  AlertCircle,
  FileText,
  Target,
  BriefcaseBusiness,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const Round1Feedback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryId = searchParams.get("id");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // GET CURRENT INTERVIEW ID
  // =========================================================

  const getInterviewId = () => {
    if (queryId) {
      return queryId;
    }

    try {
      const currentInterview = JSON.parse(
        localStorage.getItem("current_interview") || "{}"
      );

      return currentInterview?.id || null;
    } catch {
      return null;
    }
  };

  // =========================================================
  // FETCH EXISTING ROUND 1 DATA
  // =========================================================

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const fetchResult = async () => {
      const interviewId = getInterviewId();

      if (!interviewId) {
        if (!cancelled) {
          setError("Interview ID not found.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get(
          `/interview/result?interview_id=${interviewId}`
        );

        if (cancelled) return;

        console.log("ROUND 1 FEEDBACK RESULT:", response.data);

        setResult(response.data);

        /*
         * Qwen feedback is generated in the background.
         * If it is still processing, check again after a short delay.
         */
        const status =
          response.data?.round1_feedback_status ||
          response.data?.resume_data?.feedback_status;

        if (
          status === "pending" ||
          status === "processing"
        ) {
          timer = setTimeout(fetchResult, 2500);
        }

        setLoading(false);
      } catch (err) {
        console.error(
          "Failed to load Round 1 feedback:",
          err
        );

        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              "Unable to load Round 1 feedback."
          );
          setLoading(false);
        }
      }
    };

    fetchResult();

    return () => {
      cancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [queryId]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading && !result) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 mx-auto text-blue-400 animate-spin" />

          <h2 className="mt-5 text-xl font-semibold text-white">
            Loading Round 1 feedback...
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Preparing your resume analysis.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !result) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-7 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-red-400" />

          <h2 className="mt-4 text-xl font-semibold text-white">
            Unable to load feedback
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate("/round1")}
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Round 1
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // EXISTING DATA
  // =========================================================

  const resumeData =
    result?.resume_data || {};

  const round1Feedback =
    result?.round1_feedback ||
    resumeData?.round1_feedback ||
    {};

  const resumeScore =
    result?.resume_score ??
    resumeData?.score ??
    0;

  const resumeSkills =
    result?.resume_skills ||
    resumeData?.skills ||
    [];

  const interviewType =
    result?.interview_type ||
    "technical";

  const selectedDomain =
    round1Feedback?.selected_domain ||
    resumeData?.selected_domain ||
    result?.role ||
    "Not specified";

  const feedbackStatus =
    result?.round1_feedback_status ||
    resumeData?.feedback_status ||
    "completed";

  const feedbackError =
    result?.round1_feedback_error ||
    resumeData?.feedback_error ||
    "";

  const isProcessing =
    feedbackStatus === "pending" ||
    feedbackStatus === "processing";

  // =========================================================
  // LLM DATA HELPERS
  // =========================================================

  const bestFitRoles =
    Array.isArray(round1Feedback?.best_fit_roles)
      ? round1Feedback.best_fit_roles
      : [];

  const matchingSkills =
    Array.isArray(round1Feedback?.matching_skills)
      ? round1Feedback.matching_skills
      : [];

  const weakEvidence =
    Array.isArray(
      round1Feedback?.missing_or_weak_evidence
    )
      ? round1Feedback.missing_or_weak_evidence
      : [];

  const improvements =
    Array.isArray(
      round1Feedback?.personalized_improvements
    )
      ? round1Feedback.personalized_improvements
      : [];

  const aiSummary =
    round1Feedback?.ai_resume_summary ||
    round1Feedback?.summary ||
    "";

  const domainMatch =
    round1Feedback?.domain_match_percentage ??
    round1Feedback?.domain_match ??
    null;

  // =========================================================
  // NORMALIZE ROLE
  // =========================================================

  const getRoleName = (role) => {
    if (typeof role === "string") {
      return role;
    }

    return (
      role?.role ||
      role?.title ||
      role?.name ||
      "Recommended Role"
    );
  };

  const getRoleMatch = (role) => {
    if (typeof role === "object") {
      return (
        role?.match_percentage ??
        role?.match ??
        role?.score ??
        null
      );
    }

    return null;
  };

  // =========================================================
  // NORMALIZE SKILL
  // =========================================================

  const getSkillName = (skill) => {
    if (typeof skill === "string") {
      return skill;
    }

    return (
      skill?.skill ||
      skill?.name ||
      "Skill"
    );
  };

  const getSkillEvidence = (skill) => {
    if (typeof skill === "object") {
      return skill?.evidence || "";
    }

    return "";
  };

  // =========================================================
  // NORMALIZE WEAK AREA
  // =========================================================

  const getWeakArea = (item) => {
    if (typeof item === "string") {
      return item;
    }

    return (
      item?.area ||
      item?.skill ||
      item?.name ||
      "Improvement area"
    );
  };

  const getWeakReason = (item) => {
    if (typeof item === "object") {
      return item?.reason || "";
    }

    return "";
  };

  // =========================================================
  // NORMALIZE IMPROVEMENT
  // =========================================================

  const getImprovementText = (item) => {
    if (typeof item === "string") {
      return item;
    }

    return (
      item?.recommendation ||
      item?.improvement ||
      item?.text ||
      item?.description ||
      "Improve this area."
    );
  };

  // =========================================================
  // CONTINUE TO ROUND 2
  // =========================================================

  const handleContinue = () => {
    const interviewId = getInterviewId();

    if (interviewId) {
      navigate(`/test?id=${interviewId}`);
    } else {
      navigate("/test");
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-7">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section>
        <div className="flex items-center justify-between gap-4">

          <div>
            <div className="flex items-center gap-2 text-sm text-blue-400 font-medium">
              <FileText className="w-4 h-4" />
              ROUND 1 • RESUME REVIEW
            </div>

            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-white">
              Resume Intelligence Report
            </h1>

            <p className="mt-2 text-slate-400">
              AI-powered analysis of your resume and interview fit.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300">
            {interviewType === "technical"
              ? "Technical Interview"
              : "Non-Technical Interview"}
          </div>

        </div>
      </section>

      {/* =====================================================
          PROCESSING
      ===================================================== */}

      {isProcessing && (
        <section className="rounded-2xl border border-blue-400/20 bg-blue-500/5 p-6">

          <div className="flex items-start gap-4">

            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>

            <div>
              <h3 className="font-semibold text-white">
                AI is analyzing your resume
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                Your resume has been processed. Qwen3 is preparing
                the domain match, job-role analysis and skill-gap
                recommendations.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">

                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                  ✓ Resume scanned
                </span>

                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                  ✓ ATS analyzed
                </span>

                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                  ✓ Skills extracted
                </span>

                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                  ⏳ AI analysis
                </span>

              </div>
            </div>

          </div>

        </section>
      )}

      {/* =====================================================
          PROCESSING ERROR
      ===================================================== */}

      {feedbackStatus === "failed" && (
        <section className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">

          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />

            <div>
              <h3 className="font-semibold text-white">
                AI analysis could not be completed
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                {feedbackError ||
                  "The resume was processed, but the AI analysis is currently unavailable."}
              </p>
            </div>
          </div>

        </section>
      )}

      {/* =====================================================
          SCORE CARDS
      ===================================================== */}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* ATS */}

        <div className="rounded-2xl border border-white/10 bg-[#0b1024] p-6">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                ATS Resume Score
              </p>

              <p className="mt-2 text-4xl font-bold text-white">
                {resumeScore}%
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Based on the existing resume analyzer.
          </p>

        </div>

        {/* DOMAIN */}

        <div className="rounded-2xl border border-white/10 bg-[#0b1024] p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Domain Match
              </p>

              <p className="mt-2 text-4xl font-bold text-white">
                {domainMatch !== null
                  ? `${domainMatch}%`
                  : "—"}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-400" />
            </div>

          </div>

          <p className="mt-3 text-xs text-slate-500">
            AI comparison with the selected target.
          </p>

        </div>

        {/* DOMAIN */}

        <div className="rounded-2xl border border-white/10 bg-[#0b1024] p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Selected Domain
              </p>

              <p className="mt-2 text-xl font-bold text-white">
                {selectedDomain}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-cyan-400" />
            </div>

          </div>

          <p className="mt-3 text-xs text-slate-500">
            Target used for AI resume comparison.
          </p>

        </div>

      </section>

      {/* =====================================================
          AI SUMMARY
      ===================================================== */}

      {aiSummary && (
        <section className="rounded-2xl border border-blue-400/10 bg-gradient-to-br from-blue-500/10 to-purple-500/5 p-7">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                AI Resume Summary
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Generated from your actual resume.
              </p>
            </div>

          </div>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            {aiSummary}
          </p>

        </section>
      )}

      {/* =====================================================
          SKILLS
      ===================================================== */}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* DETECTED */}

        <div className="rounded-2xl border border-white/10 bg-[#0b1024] p-6">

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Detected Resume Skills
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Skills found by the existing resume analyzer.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">

            {resumeSkills.length > 0 ? (
              resumeSkills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200"
                >
                  {typeof skill === "string"
                    ? skill
                    : skill?.skill || skill?.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No detected skills available.
              </p>
            )}

          </div>

        </div>

        {/* MATCHING */}

        <div className="rounded-2xl border border-white/10 bg-[#0b1024] p-6">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Matching Skills
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Skills that support your selected domain.
              </p>
            </div>

          </div>

          {matchingSkills.length > 0 ? (
            <div className="space-y-3">

              {matchingSkills.map((skill, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-green-500/5 border border-green-500/10 p-4"
                >

                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />

                    <span className="font-medium text-white">
                      {getSkillName(skill)}
                    </span>
                  </div>

                  {getSkillEvidence(skill) && (
                    <p className="text-xs text-slate-400 mt-2 pl-6">
                      {getSkillEvidence(skill)}
                    </p>
                  )}

                </div>
              ))}

            </div>
          ) : (
            <p className="text-sm text-slate-500">
              AI matching skills are not available yet.
            </p>
          )}

        </div>

      </section>

      {/* =====================================================
          BEST FIT ROLES
      ===================================================== */}

      <section className="rounded-2xl border border-white/10 bg-[#0b1024] p-6">

        <div className="flex items-center gap-3 mb-6">

          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <BriefcaseBusiness className="w-5 h-5 text-purple-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              AI Best-Fit Job Roles
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Roles recommended from your actual resume.
            </p>
          </div>

        </div>

        {bestFitRoles.length > 0 ? (
          <div className="space-y-4">

            {bestFitRoles.map((role, index) => {

              const name = getRoleName(role);
              const match = getRoleMatch(role);

              return (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >

                  <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-sm font-bold text-purple-400">
                        {index + 1}
                      </div>

                      <span className="font-semibold text-white">
                        {name}
                      </span>

                    </div>

                    {match !== null && (
                      <span className="font-bold text-purple-400">
                        {match}%
                      </span>
                    )}

                  </div>

                  {match !== null && (
                    <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, Number(match))
                          )}%`,
                        }}
                      />
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-500">
            AI best-fit role recommendations are not available yet.
          </div>
        )}

      </section>

      {/* =====================================================
          MISSING / WEAK
      ===================================================== */}

      <section className="rounded-2xl border border-white/10 bg-[#0b1024] p-6">

        <div className="flex items-center gap-3 mb-6">

          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              Skills / Evidence to Improve
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Areas where your resume needs stronger evidence for the selected domain.
            </p>
          </div>

        </div>

        {weakEvidence.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {weakEvidence.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-5"
              >

                <div className="flex items-center gap-2">

                  <AlertTriangle className="w-4 h-4 text-yellow-400" />

                  <h3 className="font-semibold text-white">
                    {getWeakArea(item)}
                  </h3>

                </div>

                {getWeakReason(item) && (
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {getWeakReason(item)}
                  </p>
                )}

              </div>
            ))}

          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No missing or weak evidence was reported.
          </p>
        )}

      </section>

      {/* =====================================================
          IMPROVEMENTS
      ===================================================== */}

      <section className="rounded-2xl border border-white/10 bg-[#0b1024] p-6">

        <div className="flex items-center gap-3 mb-6">

          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-cyan-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              Personalized Improvements
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              AI recommendations based on your resume and selected domain.
            </p>
          </div>

        </div>

        {improvements.length > 0 ? (
          <div className="space-y-3">

            {improvements.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >

                <div className="w-8 h-8 shrink-0 rounded-lg bg-cyan-500/10 flex items-center justify-center text-sm font-bold text-cyan-400">
                  {index + 1}
                </div>

                <p className="text-sm leading-6 text-slate-300">
                  {getImprovementText(item)}
                </p>

              </div>
            ))}

          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Personalized improvements are not available yet.
          </p>
        )}

      </section>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-4">

        <button
          type="button"
          onClick={() => navigate("/round1")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Round 1
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
        >
          Continue to Round 2
          <ArrowRight className="w-4 h-4" />
        </button>

      </section>

    </div>
  );
};

export default Round1Feedback;