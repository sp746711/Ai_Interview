import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import StatCard from "../../components/dashboard/StatCard";
import Table from "../../components/dashboard/Table";

import api from "../../services/api";

import {
  FileText,
  Star,
  Trophy,
  Target,
  Plus,
  Loader2,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Lightbulb,
  Clock,
  Eye,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  // =========================================================
  // GLOBAL DASHBOARD STATISTICS
  // Technical + Non-Technical combined
  // =========================================================

  const [stats, setStats] = useState({
    total: 0,
    avg_score: 0,
    completed: 0,
    best_score: 0,
  });

  // =========================================================
  // COMBINED HISTORY
  // Technical + Non-Technical
  // =========================================================

  const [history, setHistory] = useState([]);

  // =========================================================
  // SELECTOR 1
  // READY FOR YOUR NEXT INTERVIEW
  //
  // Existing interview flow - DO NOT CHANGE
  // =========================================================

  const [interviewType, setInterviewType] =
    useState("technical");

  // =========================================================
  // SELECTOR 2
  // ANALYTICS
  //
  // Controls:
  // - Score Overview
  // - Interviews By Role
  // - Your Performance
  //
  // IMPORTANT:
  // This selected value is persisted so that a page reload
  // does not automatically switch back to Technical.
  // =========================================================

  const [analyticsType, setAnalyticsType] = useState(() => {
    return (
      localStorage.getItem("dashboard_analytics_type") ||
      "technical"
    );
  });

  // =========================================================
  // ANALYTICS STATE
  //
  // Backend returns:
  //
  // score_overview = {
  //   labels: [],
  //   scores: [],
  //   count: 25
  // }
  //
  // interviews_by_role = {
  //   roles: []
  // }
  //
  // performance = {
  //   average_score: 12.1,
  //   completed_interviews: 25,
  //   best_score: 36,
  //   completion_rate: 28.1
  // }
  // =========================================================

  const [analytics, setAnalytics] = useState({
    interview_type: "technical",

    score_overview: {
      interview_type: "technical",
      labels: [],
      scores: [],
      count: 0,
    },

    interviews_by_role: {
      interview_type: "technical",
      total_interviews: 0,
      roles: [],
    },

    performance: {
      interview_type: "technical",
      total_interviews: 0,
      completed_interviews: 0,
      average_score: 0,
      best_score: 0,
      completion_rate: 0,
    },
  });

  const [loading, setLoading] = useState(true);

  const [analyticsLoading, setAnalyticsLoading] =
    useState(false);

  const [starting, setStarting] = useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // LOAD GLOBAL DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          overviewResponse,
          historyResponse,
        ] = await Promise.all([
          api.get("/dashboard/overview"),
          api.get("/dashboard/history"),
        ]);

        const overview =
          overviewResponse.data || {};

        const historyData =
          historyResponse.data || {};

        // -----------------------------------------------------
        // GLOBAL STATISTICS
        // -----------------------------------------------------

        const overviewStats =
          overview.stats || overview;

        setStats({
          total:
            overviewStats.total_interviews ??
            overviewStats.total ??
            0,

          avg_score:
            overviewStats.average_score ??
            overviewStats.avg_score ??
            0,

          completed:
            overviewStats.completed_interviews ??
            overviewStats.completed ??
            0,

          best_score:
            overviewStats.best_score ??
            0,
        });

        // -----------------------------------------------------
        // COMBINED HISTORY
        // -----------------------------------------------------

        const rawHistory = Array.isArray(historyData)
          ? historyData
          : Array.isArray(historyData.history)
          ? historyData.history
          : [];

        const mappedHistory = rawHistory.map(
          (item) => ({
            id:
              item?.id ||
              item?.interview_id ||
              "",

            date:
              item?.date ||
              item?.created_at ||
              new Date().toISOString(),

            role:
              item?.role ||
              item?.job_role ||
              item?.jobRole ||
              item?.domain ||
              "Role Not Selected",

            type:
              item?.interview_type ||
              item?.type ||
              "technical",

            score:
              item?.final_score ??
              item?.score ??
              0,

            status:
              item?.status ||
              "completed",

            actionUrl: `/feedback?id=${
              item?.id ||
              item?.interview_id ||
              ""
            }`,
          })
        );

        setHistory(mappedHistory);
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data?.detail ||
            "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // =========================================================
  // LOAD ANALYTICS
  //
  // Runs when Technical / Non-Technical changes
  // =========================================================

  useEffect(() => {
    const loadAnalytics = async () => {
      setAnalyticsLoading(true);

      try {
        const response = await api.get(
          "/dashboard/analytics",
          {
            params: {
              type: analyticsType,
            },
          }
        );

        const data = response.data || {};

        // =====================================================
        // IMPORTANT FIX
        //
        // Backend score_overview is OBJECT
        // NOT ARRAY
        // =====================================================

        const scoreOverview =
          data.score_overview &&
          typeof data.score_overview === "object" &&
          !Array.isArray(data.score_overview)
            ? data.score_overview
            : {
                interview_type:
                  analyticsType,
                labels: [],
                scores: [],
                count: 0,
              };

        // =====================================================
        // IMPORTANT FIX
        //
        // Backend interviews_by_role is OBJECT
        // NOT ARRAY
        // =====================================================

        const interviewsByRole =
          data.interviews_by_role &&
          typeof data.interviews_by_role === "object" &&
          !Array.isArray(
            data.interviews_by_role
          )
            ? data.interviews_by_role
            : {
                interview_type:
                  analyticsType,
                total_interviews: 0,
                roles: [],
              };

        // =====================================================
        // PERFORMANCE
        // =====================================================

        const performanceData =
          data.performance &&
          typeof data.performance === "object"
            ? data.performance
            : {
                interview_type:
                  analyticsType,
                total_interviews: 0,
                completed_interviews: 0,
                average_score: 0,
                best_score: 0,
                completion_rate: 0,
              };

        setAnalytics({
          interview_type:
            data.interview_type ||
            analyticsType,

          score_overview:
            scoreOverview,

          interviews_by_role:
            interviewsByRole,

          performance:
            performanceData,
        });
      } catch (err) {
        console.error(
          "Analytics error:",
          err.response?.data ||
            err.message
        );

        setAnalytics({
          interview_type: analyticsType,

          score_overview: {
            interview_type:
              analyticsType,
            labels: [],
            scores: [],
            count: 0,
          },

          interviews_by_role: {
            interview_type:
              analyticsType,
            total_interviews: 0,
            roles: [],
          },

          performance: {
            interview_type:
              analyticsType,
            total_interviews: 0,
            completed_interviews: 0,
            average_score: 0,
            best_score: 0,
            completion_rate: 0,
          },
        });
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [analyticsType]);

  // =========================================================
  // START INTERVIEW
  //
  // EXISTING CONNECTION - DO NOT CHANGE
  // =========================================================

  const handleStart = async () => {
    setStarting(true);
    setError("");

    try {
      const res = await api.post(
        "/interview/start",
        {
          interview_type:
            interviewType,
        }
      );

      localStorage.setItem(
        "current_interview",
        JSON.stringify({
          id:
            res.data.interview_id,

          interview_type:
            interviewType,

          stage: "round1",
        })
      );

      navigate("/round1");
    } catch (error) {
      console.error(
        "Failed to start interview:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.detail ||
          "Failed to start interview."
      );
    } finally {
      setStarting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />

          Loading dashboard...
        </div>
      </div>
    );
  }

  // =========================================================
  // SCORE OVERVIEW DATA
  //
  // Backend:
  //
  // score_overview: {
  //   labels: ["Interview 1", ...],
  //   scores: [26, 26, ...]
  // }
  // =========================================================

  const scoreOverview =
    analytics.score_overview || {};

  const scoreLabels =
    Array.isArray(
      scoreOverview.labels
    )
      ? scoreOverview.labels
      : [];

  const scoreValues =
    Array.isArray(
      scoreOverview.scores
    )
      ? scoreOverview.scores
          .map((value) =>
            Number(value)
          )
          .filter((value) =>
            Number.isFinite(value)
          )
      : [];

  // =========================================================
  // ROLE DATA
  //
  // Backend:
  //
  // interviews_by_role: {
  //   total_interviews: 89,
  //   roles: [
  //     {
  //       role: "...",
  //       count: 9,
  //       percentage: 10.1
  //     }
  //   ]
  // }
  // =========================================================

  const roleAnalytics =
    analytics.interviews_by_role ||
    {};

  const roleData =
    Array.isArray(
      roleAnalytics.roles
    )
      ? roleAnalytics.roles
      : [];

  // =========================================================
  // ROLE TOTAL
  //
  // Analytics should visually represent the completed
  // score/role dataset where possible.
  //
  // If backend supplies completed role data, use it.
  // Otherwise use role count sum.
  // =========================================================

  const roleCountTotal =
    roleData.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.count ??
          item?.total ??
          item?.value ??
          0
        ),
      0
    );

  // =========================================================
  // PERFORMANCE
  // =========================================================

  const performance =
    analytics.performance || {};

  const averageScore = Number(
    performance.average_score ??
      performance.percentage ??
      0
  );

  const performancePercentage =
    Math.min(
      100,
      Math.max(
        0,
        Number.isFinite(
          averageScore
        )
          ? averageScore
          : 0
      )
    );

  const completedInterviews =
    Number(
      performance.completed_interviews ??
        scoreOverview.count ??
        scoreValues.length ??
        0
    );

  const bestScore =
    Number(
      performance.best_score ?? 0
    );

  // =========================================================
  // MAX SCORE FOR BAR CHART
  // =========================================================

  const maxScore =
    scoreValues.length > 0
      ? Math.max(
          ...scoreValues,
          5
        )
      : 5;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full space-y-6 pb-10 bg-[#050b1c]">

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />

          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          4 GLOBAL STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <StatBox
          title="Total Interviews"
          value={stats.total}
          icon={FileText}
          gradient="from-blue-600 to-blue-800"
        />

        <StatBox
          title="Average Score"
          value={stats.avg_score}
          icon={Star}
          gradient="from-purple-600 to-purple-800"
        />

        <StatBox
          title="Interviews Completed"
          value={stats.completed}
          icon={Target}
          gradient="from-cyan-500 to-cyan-700"
        />

        <StatBox
          title="Best Score"
          value={stats.best_score}
          icon={Trophy}
          gradient="from-emerald-500 to-emerald-700"
        />

      </div>

      {/* =====================================================
          READY FOR YOUR NEXT INTERVIEW
      ====================================================== */}

      <section className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-[#11103b] via-[#15133d] to-[#11142e] p-5">

        <div className="flex flex-col xl:flex-row items-center gap-5">

          <div className="hidden md:flex w-32 h-24 items-center justify-center rounded-xl bg-purple-500/10">
            <div className="text-5xl">
              🤖
            </div>
          </div>

          <div className="flex-1 text-center xl:text-left">

            <h2 className="text-xl font-bold text-white">
              Ready for your next interview?
            </h2>

            <p className="text-slate-400 mt-1">
              Choose your interview type and
              start your AI interview.
            </p>

          </div>

          {/* INTERVIEW TYPE SELECTOR */}

          <div className="relative">

            <select
              value={interviewType}
              onChange={(e) =>
                setInterviewType(
                  e.target.value
                )
              }
              className="appearance-none min-w-[200px] rounded-xl border border-slate-700 bg-[#090d1c] px-5 py-3 pr-10 text-white outline-none focus:border-purple-500"
            >

              <option value="technical">
                Technical
              </option>

              <option value="non-technical">
                Non-Technical
              </option>

            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

          </div>

          {/* START BUTTON */}

          <button
            onClick={handleStart}
            disabled={starting}
            className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >

            {starting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />

                Starting...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />

                Start New Interview
              </>
            )}

          </button>

        </div>

      </section>

      {/* =====================================================
          ANALYTICS SELECTOR
      ====================================================== */}

      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div>

          <h2 className="text-xl font-bold text-white">
            Interview Analytics
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Analyze your performance by interview type.
          </p>

        </div>

        <div className="relative">

          <select
            value={analyticsType}
            onChange={(e) => {
              const value = e.target.value;

              setAnalyticsType(value);

              localStorage.setItem(
                "dashboard_analytics_type",
                value
              );
            }}
            className="appearance-none min-w-[220px] rounded-xl border border-purple-500/30 bg-[#0b1020] px-5 py-3 pr-10 text-white outline-none focus:border-purple-500"
          >

            <option value="technical">
              Technical
            </option>

            <option value="non-technical">
              Non-Technical
            </option>

          </select>

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

        </div>

      </section>

      {/* =====================================================
          ANALYTICS AREA
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* ===================================================
            LEFT SIDE
        ==================================================== */}

        <div className="xl:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* =================================================
              SCORE OVERVIEW
          ================================================== */}

          <section className="relative overflow-hidden rounded-2xl border border-cyan-500/10 bg-[#090e1e] p-5 min-h-[330px] shadow-lg shadow-cyan-950/10">

            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5 relative z-10">

              <div className="flex items-center gap-2">

                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">

                  <TrendingUp className="w-5 h-5 text-cyan-400" />

                </div>

                <div>

                  <h3 className="font-semibold text-white">
                    Score Overview
                  </h3>

                  <p className="text-[11px] text-slate-500">
                    Recent completed interviews
                  </p>

                </div>

              </div>

              <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">

                {analyticsType ===
                "technical"
                  ? "Technical"
                  : "Non-Technical"}

              </span>

            </div>

            {analyticsLoading ? (

              <div className="h-56 flex items-center justify-center">

                <Loader2 className="w-7 h-7 animate-spin text-purple-400" />

              </div>

            ) : scoreValues.length === 0 ? (

              <EmptyAnalytics
                text={`No ${analyticsType} score data available yet.`}
              />

            ) : (

              <div className="relative h-56">

                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">

                  <div className="border-t border-slate-800/70" />

                  <div className="border-t border-slate-800/50" />

                  <div className="border-t border-slate-800/50" />

                  <div className="border-t border-slate-800/50" />

                  <div className="border-t border-slate-800/70" />

                </div>

                <div className="relative h-full flex items-end gap-2 px-1 pt-5">

                  {scoreValues
                    .slice(-10)
                    .map(
                      (
                        value,
                        index
                      ) => {

                        const height =
                          Math.max(
                            8,
                            (value /
                              maxScore) *
                              100
                          );

                        const originalIndex =
                          Math.max(
                            0,
                            scoreValues.length -
                              10
                          ) +
                          index;

                        const label =
                          scoreLabels[
                            originalIndex
                          ] ||
                          `Interview ${
                            originalIndex +
                            1
                          }`;

                        return (
                          <div
                            key={`${label}-${index}`}
                            className="flex-1 h-full flex flex-col justify-end group min-w-0"
                          >

                            <div className="text-center text-xs font-semibold text-slate-300 mb-2 opacity-80 group-hover:opacity-100">

                              {value}

                            </div>

                            <div
                              className="relative w-full rounded-t-lg bg-gradient-to-t from-purple-700 via-purple-500 to-cyan-400 shadow-lg shadow-purple-900/10 transition-all duration-300 group-hover:from-purple-600 group-hover:to-cyan-300"
                              style={{
                                height: `${height}%`,
                              }}
                              title={`${label}: ${value}`}
                            >

                              <div className="absolute inset-x-0 top-0 h-1 rounded-full bg-white/20" />

                            </div>

                            <div className="mt-2 text-center text-[9px] text-slate-600 truncate">

                              {`I${
                                originalIndex +
                                1
                              }`}

                            </div>

                          </div>
                        );
                      }
                    )}

                </div>

              </div>

            )}

          </section>

          {/* =================================================
              INTERVIEWS BY ROLE
          ================================================== */}

          <section className="relative overflow-hidden rounded-2xl border border-purple-500/10 bg-[#090e1e] p-5 min-h-[330px] shadow-lg shadow-purple-950/10">

            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5 relative z-10">

              <div className="flex items-center gap-2">

                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">

                  <Briefcase className="w-5 h-5 text-purple-400" />

                </div>

                <div>

                  <h3 className="font-semibold text-white">
                    Interviews By Role
                  </h3>

                  <p className="text-[11px] text-slate-500">
                    Completed interview distribution
                  </p>

                </div>

              </div>

            </div>

            {analyticsLoading ? (

              <div className="h-56 flex items-center justify-center">

                <Loader2 className="w-7 h-7 animate-spin text-purple-400" />

              </div>

            ) : roleData.length === 0 ? (

              <EmptyAnalytics
                text={`No ${analyticsType} role data available yet.`}
              />

            ) : (

              <div className="space-y-4">

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">

                  <div>

                    <p className="text-xs text-slate-500">
                      Completed interviews
                    </p>

                    <p className="text-2xl font-bold text-white mt-1">
                      {completedInterviews ||
                        roleCountTotal}
                    </p>

                  </div>

                  <div className="w-11 h-11 rounded-full bg-purple-500/10 flex items-center justify-center">

                    <Target className="w-5 h-5 text-purple-400" />

                  </div>

                </div>

                <div className="space-y-3 max-h-[215px] overflow-y-auto pr-1">

                  {roleData
                    .slice(0, 8)
                    .map(
                      (
                        item,
                        index
                      ) => {

                        const count =
                          Number(
                            item?.count ??
                              item?.total ??
                              item?.value ??
                              0
                          );

                        const backendPercentage =
                          Number(
                            item?.percentage
                          );

                        const percentage =
                          Number.isFinite(
                            backendPercentage
                          )
                            ? backendPercentage
                            : roleCountTotal >
                              0
                            ? (
                                (count /
                                  roleCountTotal) *
                                100
                              )
                            : 0;

                        const role =
                          item?.role ||
                          item?.job_role ||
                          item?.jobRole ||
                          item?.name ||
                          "Role Not Selected";

                        return (
                          <div
                            key={`${role}-${index}`}
                            className="group"
                          >

                            <div className="flex items-center justify-between gap-3 mb-1.5">

                              <div className="flex items-center gap-2 min-w-0">

                                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 shrink-0" />

                                <span
                                  className="text-xs text-slate-300 leading-5"
                                  title={role}
                                >
                                  {role}
                                </span>

                              </div>

                              <div className="flex items-center gap-2 shrink-0">

                                <span className="text-[11px] text-slate-500">
                                  {count}
                                </span>

                                <span className="text-xs font-medium text-slate-300">
                                  {percentage.toFixed(
                                    1
                                  )}
                                  %
                                </span>

                              </div>

                            </div>

                            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">

                              <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-400 transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      percentage
                                    )
                                  )}%`,
                                }}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                </div>

                {roleData.length > 8 && (
                  <p className="text-[11px] text-slate-600 text-center pt-1">
                    Showing top 8 roles
                  </p>
                )}

              </div>

            )}

          </section>

        </div>

        {/* ===================================================
            YOUR PERFORMANCE
        ==================================================== */}

        <section className="xl:col-span-3 relative overflow-hidden rounded-2xl border border-cyan-500/10 bg-[#090e1e] p-5 min-h-[330px] shadow-lg shadow-cyan-950/10">

          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2 mb-7 relative z-10">

            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">

              <Target className="w-5 h-5 text-cyan-400" />

            </div>

            <div>

              <h3 className="font-semibold text-white">
                Your Performance
              </h3>

              <p className="text-[11px] text-slate-500">
                Average interview score
              </p>

            </div>

          </div>

          <div className="flex flex-col items-center">

            <div
              className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-xl shadow-purple-950/20"
              style={{
                background: `conic-gradient(
                  #7c3aed ${
                    performancePercentage *
                    3.6
                  }deg,
                  #172033 ${
                    performancePercentage *
                    3.6
                  }deg
                )`,
              }}
            >

              <div className="absolute inset-3 rounded-full bg-[#090e1e] flex flex-col items-center justify-center">

                <span className="text-3xl font-bold text-white">
                  {performancePercentage.toFixed(
                    1
                  )}
                  %
                </span>

                <span className="text-sm text-slate-500">
                  Performance
                </span>

              </div>

            </div>

            <h4 className="mt-6 text-lg font-semibold text-white">
              {performancePercentage > 0
                ? performancePercentage >=
                  70
                  ? "Excellent Performance"
                  : performancePercentage >=
                    50
                  ? "Good Progress"
                  : "Keep Practicing"
                : "Keep Practicing"}
            </h4>

            <p className="text-center text-sm text-slate-400 mt-2 leading-6">

              Average score from{" "}

              <span className="text-white font-medium">
                {completedInterviews}
              </span>{" "}

              completed interviews.

            </p>

            {bestScore > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-2">

                <Trophy className="w-4 h-4 text-emerald-400" />

                <span className="text-xs text-slate-400">
                  Best score:
                </span>

                <span className="text-xs font-bold text-emerald-400">
                  {bestScore}
                </span>

              </div>
            )}

          </div>

        </section>

      </div>

      {/* =====================================================
          RECENT INTERVIEWS + TIPS
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* ===================================================
            RECENT INTERVIEWS
        ==================================================== */}

        <section className="xl:col-span-9 rounded-2xl border border-slate-800 bg-[#090e1e] overflow-hidden">

          <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">

            <div className="flex items-center gap-2">

              <Clock className="w-5 h-5 text-purple-400" />

              <h3 className="font-semibold text-white">
                Recent Interviews
              </h3>

            </div>

            <button
              onClick={() =>
                navigate("/history")
              }
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              View All →
            </button>

          </div>

          {history.length === 0 ? (

            <div className="p-8 text-center text-slate-500">
              No interviews available yet.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4">
                      Type
                    </th>

                    <th className="px-5 py-4">
                      Role
                    </th>

                    <th className="px-5 py-4">
                      Score
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {history
                    .slice(0, 5)
                    .map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={
                            item?.id ||
                            index
                          }
                          className="border-b border-slate-800/70 last:border-0"
                        >

                          <td className="px-5 py-4 text-sm text-slate-300">

                            {formatDate(
                              item?.date
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs ${
                                item?.type ===
                                "technical"
                                  ? "bg-blue-500/10 text-blue-400"
                                  : "bg-purple-500/10 text-purple-400"
                              }`}
                            >

                              {item?.type ===
                              "technical"
                                ? "Technical"
                                : "Non-Technical"}

                            </span>

                          </td>

                          <td className="px-5 py-4 text-sm text-white max-w-[260px]">

                            <span
                              title={
                                item?.role
                              }
                              className="block truncate"
                            >
                              {item?.role}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            {item?.status ===
                            "completed" ? (

                              <>

                                <span className="font-semibold text-white">
                                  {item?.score ||
                                    0}
                                </span>

                                <span className="text-slate-500">
                                  {" "}
                                  / 100
                                </span>

                              </>

                            ) : (

                              <span className="text-slate-500">
                                --
                              </span>

                            )}

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs ${
                                item?.status ===
                                "completed"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-yellow-500/10 text-yellow-400"
                              }`}
                            >

                              {item?.status ===
                              "completed"
                                ? "Completed"
                                : "Incomplete"}

                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <button
                              onClick={() =>
                                navigate(
                                  item?.actionUrl
                                )
                              }
                              className="w-9 h-9 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition"
                            >

                              <Eye className="w-4 h-4" />

                            </button>

                          </td>

                        </tr>

                      )
                    )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ===================================================
            TIPS FOR SUCCESS
        ==================================================== */}

        <section className="xl:col-span-3 rounded-2xl border border-slate-800 bg-[#090e1e] p-5">

          <div className="flex items-center gap-2 mb-6">

            <Lightbulb className="w-5 h-5 text-cyan-400" />

            <h3 className="font-semibold text-white">
              Tips for Success
            </h3>

          </div>

          <div className="space-y-5">

            <Tip text="Practice regularly" />

            <Tip text="Analyze your interview feedback" />

            <Tip text="Focus on your weak areas" />

            <Tip text="Stay confident and calm" />

          </div>

        </section>

      </div>

    </div>
  );
};

// =============================================================
// STAT BOX
// =============================================================

const StatBox = ({
  title,
  value,
  icon: Icon,
  gradient,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 min-h-[140px]`}
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-wider text-white/80">
            {title}
          </p>

          <p className="text-3xl font-bold text-white mt-3">
            {value}
          </p>

        </div>

        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">

          <Icon className="w-6 h-6 text-white" />

        </div>

      </div>

    </div>
  );
};

// =============================================================
// EMPTY ANALYTICS
// =============================================================

const EmptyAnalytics = ({
  text,
}) => {
  return (
    <div className="h-56 flex flex-col items-center justify-center text-center">

      <div className="w-14 h-14 rounded-2xl bg-slate-800/70 flex items-center justify-center mb-4">

        <AlertCircle className="w-7 h-7 text-slate-600" />

      </div>

      <p className="text-sm text-slate-500">
        {text}
      </p>

    </div>
  );
};

// =============================================================
// TIP
// =============================================================

const Tip = ({
  text,
}) => {
  return (
    <div className="flex items-start gap-3">

      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />

      <span className="text-sm text-slate-300">
        {text}
      </span>

    </div>
  );
};

// =============================================================
// DATE FORMATTER
// =============================================================

const formatDate = (date) => {
  if (!date) {
    return "--";
  }

  try {
    let dateString = String(date).trim();

    // Backend/MongoDB timestamps may sometimes arrive
    // without timezone information. Treat those timestamps
    // as UTC so the correct India date is calculated.
    if (
      !dateString.endsWith("Z") &&
      !/[+-]\d{2}:\d{2}$/.test(dateString)
    ) {
      dateString += "Z";
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
      return "--";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "--";
  }
};


export default Dashboard;