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

        // =========================================================
        // TASK 13 ONLY — AVATAR DASHBOARD DATA BRIDGE
        // Only Task 13 data preparation is changed here.
        // Existing Dashboard UI, API calls, functions and interview flow remain unchanged.

        // Only the MOST RECENT interview controls the incomplete message.
        const latestInterview = mappedHistory[0] || null;

        const latestIsCompleted =
          latestInterview?.status === "completed";

        const latestIsIncomplete =
          Boolean(latestInterview) && !latestIsCompleted;

        const completedHistory = mappedHistory.filter(
          (item) => item?.status === "completed"
        );

        const technicalCompleted = completedHistory.filter(
          (item) => item?.type === "technical"
        ).length;

        const nonTechnicalCompleted = completedHistory.filter(
          (item) => item?.type === "non-technical"
        ).length;

        const latestCompletedInterview =
          latestIsCompleted
            ? latestInterview
            : completedHistory[0] || null;

        const previousCompletedInterview =
          latestIsCompleted
            ? completedHistory[1] || null
            : completedHistory[0] || null;

        const latestScore =
          latestCompletedInterview?.score ?? null;

        const previousScore =
          previousCompletedInterview?.score ?? null;

        const bestScore = Number(
          overviewStats.best_score ?? 0
        );

        const previousBest =
          completedHistory.length > 1
            ? Math.max(
                ...completedHistory
                  .slice(latestIsCompleted ? 1 : 0)
                  .map((item) => Number(item?.score ?? 0))
              )
            : 0;

        const avatarDashboardData = {
          totalInterviews: Number(
            overviewStats.total_interviews ??
              overviewStats.total ??
              mappedHistory.length
          ),

          completedInterviews: Number(
            overviewStats.completed_interviews ??
              overviewStats.completed ??
              completedHistory.length
          ),

          technicalInterviews: technicalCompleted,
          nonTechnicalInterviews: nonTechnicalCompleted,

          // Task 13: only the latest interview can trigger incomplete.
          hasIncompleteInterview: latestIsIncomplete,
          interviewCompleted: latestIsCompleted,

          score: latestScore,
          previousScore: previousScore,
          previousBest: previousBest,
          bestScore: bestScore,

          interviewType:
            latestCompletedInterview?.type ||
            latestInterview?.type ||
            null,

          // Task 13 scheduler state.
          latestInterviewId: latestInterview?.id || null,
          latestInterviewStatus: latestInterview?.status || null,
        };

        localStorage.setItem(
          "mockmind_dashboard_avatar_data",
          JSON.stringify(avatarDashboardData)
        );

        window.dispatchEvent(
          new CustomEvent(
            "mockmind-dashboard-data",
            {
              detail: avatarDashboardData,
            }
          )
        );
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
    <div className="min-h-full space-y-6 pb-10 bg-transparent">

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
          DESKTOP ALIGNMENT: 4 CARDS IN ONE ROW
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <StatBox
          title="Total Interviews"
          value={stats.total}
          icon={FileText}
          variant="peach"
        />

        <StatBox
          title="Average Score"
          value={stats.avg_score}
          icon={Star}
          variant="purple"
        />

        <StatBox
          title="Interviews Completed"
          value={stats.completed}
          icon={Target}
          variant="teal"
        />

        <StatBox
          title="Best Score"
          value={stats.best_score}
          icon={Trophy}
          variant="gold"
        />

      </div>

      {/* =====================================================
          READY FOR YOUR NEXT INTERVIEW
          DESKTOP ALIGNMENT: IMAGE | TEXT | SELECT | BUTTON
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl border border-[#f3a078]/35 bg-gradient-to-r from-[#131518] via-[#17191d] to-[#121417] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_16px_36px_rgba(0,0,0,0.6)]">

        {/* Soft warm ambient glow behind robot and CTA */}
        <div className="absolute top-1/2 left-10 -translate-y-1/2 w-56 h-56 bg-[#f3a078]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_600px_220px_at_25%_50%,rgba(243,160,120,0.08),transparent_70%)] pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center gap-6 relative z-10">

          <div className="hidden md:flex w-24 h-24 items-center justify-center rounded-2xl bg-[#f3a078]/10 border border-[#f3a078]/25 shadow-[0_0_20px_rgba(243,160,120,0.15)] shrink-0">
            <div className="text-5xl filter drop-shadow-[0_0_16px_rgba(243,160,120,0.4)]">
              🤖
            </div>
          </div>

          <div className="flex-1 text-center lg:text-left">

            <h2 className="text-xl font-bold text-[#f5f1ec] tracking-tight">
              Ready for your next interview?
            </h2>

            <p className="text-[#9a9a9a] mt-1 text-sm">
              Choose your interview type and start your AI interview.
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
              className="appearance-none min-w-[200px] rounded-xl border border-white/[0.12] bg-[#0e1013] px-5 py-3 pr-10 text-[#f5f1ec] text-sm font-medium outline-none focus:border-[#f3a078]/70 hover:border-white/20 transition cursor-pointer shadow-inner"
            >

              <option value="technical">
                Technical
              </option>

              <option value="non-technical">
                Non-Technical
              </option>

            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a] pointer-events-none" />

          </div>

          {/* START BUTTON */}

          <button
            onClick={handleStart}
            disabled={starting}
            className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f3a078] via-[#f29a72] to-[#e88c68] px-7 py-3.5 font-bold text-[#0d0f10] shadow-[0_4px_20px_rgba(243,160,120,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(243,160,120,0.42)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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

          <h2 className="text-xl font-bold text-[#f5f1ec] tracking-tight">
            Interview Analytics
          </h2>

          <p className="text-sm text-[#9a9a9a] mt-1">
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
            className="appearance-none min-w-[220px] rounded-xl border border-white/[0.12] bg-[#111316] px-5 py-3 pr-10 text-[#f5f1ec] text-sm font-medium outline-none focus:border-[#f3a078]/70 hover:border-white/20 transition cursor-pointer"
          >

            <option value="technical">
              Technical
            </option>

            <option value="non-technical">
              Non-Technical
            </option>

          </select>

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a] pointer-events-none" />

        </div>

      </section>

      {/* =====================================================
          ANALYTICS AREA
          DESKTOP ALIGNMENT: 9-COLUMN LEFT + 3-COLUMN RIGHT
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ===================================================
            LEFT SIDE
        ==================================================== */}

        <div className="lg:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* =================================================
              SCORE OVERVIEW
          ================================================== */}

          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#131518] to-[#0f1013] p-5 min-h-[330px] shadow-2xl shadow-black/40">

            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#f3a078]/5 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5 relative z-10">

              <div className="flex items-center gap-2.5">

                <div className="w-9 h-9 rounded-xl bg-[#f3a078]/10 border border-[#f3a078]/25 flex items-center justify-center">

                  <TrendingUp className="w-5 h-5 text-[#f3a078]" />

                </div>

                <div>

                  <h3 className="font-semibold text-[#f5f1ec] text-sm">
                    Score Overview
                  </h3>

                  <p className="text-[11px] text-[#9a9a9a]">
                    Recent completed interviews
                  </p>

                </div>

              </div>

              <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-[#d1ccc7] font-medium">

                {analyticsType ===
                "technical"
                  ? "Technical"
                  : "Non-Technical"}

              </span>

            </div>

            {analyticsLoading ? (

              <div className="h-56 flex items-center justify-center">

                <Loader2 className="w-7 h-7 animate-spin text-[#f3a078]" />

              </div>

            ) : scoreValues.length === 0 ? (

              <EmptyAnalytics
                text={`No ${analyticsType} score data available yet.`}
              />

            ) : (

              <div className="relative h-56">

                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">

                  <div className="border-t border-white/[0.04]" />

                  <div className="border-t border-white/[0.02]" />

                  <div className="border-t border-white/[0.02]" />

                  <div className="border-t border-white/[0.02]" />

                  <div className="border-t border-white/[0.04]" />

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

                            <div className="text-center text-xs font-semibold text-[#d1ccc7] mb-2 opacity-80 group-hover:opacity-100 group-hover:text-[#f5f1ec] transition-colors">

                              {value}

                            </div>

                            <div
                              className="relative w-full rounded-t-lg bg-gradient-to-t from-[#e88c68] via-[#f29a72] to-[#f3a078] shadow-md shadow-[#e88c68]/20 transition-all duration-300 group-hover:from-[#f29a72] group-hover:to-[#fcd1bd]"
                              style={{
                                height: `${height}%`,
                              }}
                              title={`${label}: ${value}`}
                            >

                              <div className="absolute inset-x-0 top-0 h-1 rounded-full bg-white/40" />

                            </div>

                            <div className="mt-2 text-center text-[9px] text-[#9a9a9a] truncate font-medium">

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

          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#131518] to-[#0f1013] p-5 min-h-[330px] shadow-2xl shadow-black/40">

            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#c4b5fd]/5 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5 relative z-10">

              <div className="flex items-center gap-2.5">

                <div className="w-9 h-9 rounded-xl bg-[#c4b5fd]/10 border border-[#c4b5fd]/25 flex items-center justify-center">

                  <Briefcase className="w-5 h-5 text-[#c4b5fd]" />

                </div>

                <div>

                  <h3 className="font-semibold text-[#f5f1ec] text-sm">
                    Interviews By Role
                  </h3>

                  <p className="text-[11px] text-[#9a9a9a]">
                    Completed interview distribution
                  </p>

                </div>

              </div>

            </div>

            {analyticsLoading ? (

              <div className="h-56 flex items-center justify-center">

                <Loader2 className="w-7 h-7 animate-spin text-[#c4b5fd]" />

              </div>

            ) : roleData.length === 0 ? (

              <EmptyAnalytics
                text={`No ${analyticsType} role data available yet.`}
              />

            ) : (

              <div className="space-y-4">

                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">

                  <div>

                    <p className="text-xs text-[#9a9a9a]">
                      Completed interviews
                    </p>

                    <p className="text-2xl font-bold text-[#f5f1ec] mt-1">
                      {completedInterviews ||
                        roleCountTotal}
                    </p>

                  </div>

                  <div className="w-11 h-11 rounded-full bg-[#c4b5fd]/10 border border-[#c4b5fd]/20 flex items-center justify-center">

                    <Target className="w-5 h-5 text-[#c4b5fd]" />

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

                        const rolePalettes = [
                          { dot: "bg-[#f3a078]", bar: "from-[#e88c68] to-[#f3a078]" },
                          { dot: "bg-[#c4b5fd]", bar: "from-[#8b5cf6] to-[#c4b5fd]" },
                          { dot: "bg-[#5eead4]", bar: "from-[#0d9488] to-[#5eead4]" },
                          { dot: "bg-[#93c5fd]", bar: "from-[#3b82f6] to-[#93c5fd]" },
                          { dot: "bg-[#fbbf24]", bar: "from-[#d97706] to-[#fbbf24]" },
                        ];
                        const palette = rolePalettes[index % rolePalettes.length];

                        return (
                          <div
                            key={`${role}-${index}`}
                            className="group"
                          >

                            <div className="flex items-center justify-between gap-3 mb-1.5">

                              <div className="flex items-center gap-2 min-w-0">

                                <span className={`w-2 h-2 rounded-full ${palette.dot} shrink-0`} />

                                <span
                                  className="text-xs text-[#f5f1ec] leading-5 truncate font-medium"
                                  title={role}
                                >
                                  {role}
                                </span>

                              </div>

                              <div className="flex items-center gap-2 shrink-0">

                                <span className="text-[11px] text-[#9a9a9a]">
                                  {count}
                                </span>

                                <span className="text-xs font-semibold text-[#f5f1ec]">
                                  {percentage.toFixed(
                                    1
                                  )}
                                  %
                                </span>

                              </div>

                            </div>

                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">

                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${palette.bar} transition-all duration-500`}
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
                  <p className="text-[11px] text-[#9a9a9a] text-center pt-1">
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

        <section className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#131518] to-[#0f1013] p-5 min-h-[330px] shadow-2xl shadow-black/40">

          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#5eead4]/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5 mb-7 relative z-10">

            <div className="w-9 h-9 rounded-xl bg-[#5eead4]/10 border border-[#5eead4]/25 flex items-center justify-center">

              <Target className="w-5 h-5 text-[#5eead4]" />

            </div>

            <div>

              <h3 className="font-semibold text-[#f5f1ec] text-sm">
                Your Performance
              </h3>

              <p className="text-[11px] text-[#9a9a9a]">
                Average interview score
              </p>

            </div>

          </div>

          <div className="flex flex-col items-center">

            <div
              className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-xl shadow-black/40"
              style={{
                background: `conic-gradient(
                  #f3a078 ${
                    performancePercentage *
                    3.6
                  }deg,
                  #1a1c20 ${
                    performancePercentage *
                    3.6
                  }deg
                )`,
              }}
            >

              <div className="absolute inset-3 rounded-full bg-[#111316] flex flex-col items-center justify-center border border-white/[0.04]">

                <span className="text-3xl font-bold text-[#f5f1ec]">
                  {performancePercentage.toFixed(
                    1
                  )}
                  %
                </span>

                <span className="text-xs text-[#9a9a9a] mt-0.5">
                  Performance
                </span>

              </div>

            </div>

            <h4 className="mt-6 text-base font-semibold text-[#f5f1ec]">
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

            <p className="text-center text-xs text-[#9a9a9a] mt-1.5 leading-5">

              Average score from{" "}

              <span className="text-[#f5f1ec] font-semibold">
                {completedInterviews}
              </span>{" "}

              completed interviews.

            </p>

            {bestScore > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#fbbf24]/25 bg-[#fbbf24]/5 px-3 py-1.5">

                <Trophy className="w-4 h-4 text-[#fbbf24]" />

                <span className="text-xs text-[#9a9a9a]">
                  Best score:
                </span>

                <span className="text-xs font-bold text-[#fbbf24]">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ===================================================
            RECENT INTERVIEWS
        ==================================================== */}

        <section className="lg:col-span-9 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#131518] to-[#0f1013] overflow-hidden shadow-2xl shadow-black/40">

          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">

            <div className="flex items-center gap-2.5">

              <div className="w-9 h-9 rounded-xl bg-[#f3a078]/10 border border-[#f3a078]/25 flex items-center justify-center">

                <Clock className="w-5 h-5 text-[#f3a078]" />

              </div>

              <h3 className="font-semibold text-[#f5f1ec] text-sm">
                Recent Interviews
              </h3>

            </div>

            <button
              onClick={() =>
                navigate("/history")
              }
              className="text-xs font-semibold text-[#f3a078] hover:text-[#f29a72] transition-colors cursor-pointer"
            >
              View All →
            </button>

          </div>

          {history.length === 0 ? (

            <div className="p-8 text-center text-[#9a9a9a] text-sm">
              No interviews available yet.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="text-left text-xs uppercase tracking-wider text-[#9a9a9a] border-b border-white/[0.06] bg-white/[0.01]">

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
                          className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                        >

                          <td className="px-5 py-4 text-xs text-[#d1ccc7]">

                            {formatDate(
                              item?.date
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                item?.type ===
                                "technical"
                                  ? "bg-[#5eead4]/10 text-[#5eead4] border-[#5eead4]/25"
                                  : "bg-[#c4b5fd]/10 text-[#c4b5fd] border-[#c4b5fd]/25"
                              }`}
                            >

                              {item?.type ===
                              "technical"
                                ? "Technical"
                                : "Non-Technical"}

                            </span>

                          </td>

                          <td className="px-5 py-4 text-xs text-[#f5f1ec] max-w-[260px]">

                            <span
                              title={
                                item?.role
                              }
                              className="block truncate font-medium"
                            >
                              {item?.role}
                            </span>

                          </td>

                          <td className="px-5 py-4 text-xs">

                            {item?.status ===
                            "completed" ? (

                              <>

                                <span className="font-semibold text-[#f5f1ec]">
                                  {item?.score ||
                                    0}
                                </span>

                                <span className="text-[#9a9a9a]">
                                  {" "}
                                  / 100
                                </span>

                              </>

                            ) : (

                              <span className="text-[#9a9a9a]">
                                --
                              </span>

                            )}

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                item?.status ===
                                "completed"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/25"
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
                              className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-[#9a9a9a] hover:text-[#f3a078] hover:border-[#f3a078]/40 hover:bg-[#f3a078]/5 transition-all cursor-pointer"
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

        <section className="lg:col-span-3 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#131518] to-[#0f1013] p-5 shadow-2xl shadow-black/40">

          <div className="flex items-center gap-2.5 mb-6">

            <div className="w-9 h-9 rounded-xl bg-[#f3a078]/10 border border-[#f3a078]/25 flex items-center justify-center">

              <Lightbulb className="w-5 h-5 text-[#f3a078]" />

            </div>

            <h3 className="font-semibold text-[#f5f1ec] text-sm">
              Tips for Success
            </h3>

          </div>

          <div className="space-y-4">

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
  variant = "peach",
}) => {
  const themes = {
    peach: {
      cornerLight: "from-[#f3a078]/25 via-[#f3a078]/6 to-transparent",
      border: "border-[#f3a078]/30 hover:border-[#f3a078]/55",
      iconBg: "bg-[#f3a078]/10",
      iconBorder: "border-[#f3a078]/30",
      iconColor: "text-[#f3a078]",
      glowStyle: {
        background: "radial-gradient(ellipse 260px 140px at 0% 0%, rgba(243, 160, 120, 0.10) 0%, transparent 80%)",
      },
    },
    purple: {
      cornerLight: "from-[#c4b5fd]/25 via-[#c4b5fd]/6 to-transparent",
      border: "border-[#c4b5fd]/30 hover:border-[#c4b5fd]/55",
      iconBg: "bg-[#c4b5fd]/10",
      iconBorder: "border-[#c4b5fd]/30",
      iconColor: "text-[#c4b5fd]",
      glowStyle: {
        background: "radial-gradient(ellipse 260px 140px at 0% 0%, rgba(196, 181, 253, 0.10) 0%, transparent 80%)",
      },
    },
    teal: {
      cornerLight: "from-[#5eead4]/25 via-[#5eead4]/6 to-transparent",
      border: "border-[#5eead4]/30 hover:border-[#5eead4]/55",
      iconBg: "bg-[#5eead4]/10",
      iconBorder: "border-[#5eead4]/30",
      iconColor: "text-[#5eead4]",
      glowStyle: {
        background: "radial-gradient(ellipse 260px 140px at 0% 0%, rgba(94, 234, 212, 0.10) 0%, transparent 80%)",
      },
    },
    gold: {
      cornerLight: "from-[#fbbf24]/25 via-[#fbbf24]/6 to-transparent",
      border: "border-[#fbbf24]/30 hover:border-[#fbbf24]/55",
      iconBg: "bg-[#fbbf24]/10",
      iconBorder: "border-[#fbbf24]/30",
      iconColor: "text-[#fbbf24]",
      glowStyle: {
        background: "radial-gradient(ellipse 260px 140px at 0% 0%, rgba(251, 191, 36, 0.10) 0%, transparent 80%)",
      },
    },
  };

  const current = themes[variant] || themes.peach;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${current.border} bg-gradient-to-b from-[#141619] via-[#101214] to-[#0c0d0f] p-5 min-h-[140px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-0.5`}
    >
      {/* Subtle internal accent glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={current.glowStyle}
      />

      {/* Subtle soft corner lighting */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-bl ${current.cornerLight} rounded-full blur-xl pointer-events-none`} />

      <div className="flex items-start justify-between relative z-10">

        <div>

          <p className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
            {title}
          </p>

          <p className="text-3xl font-bold text-[#f5f1ec] mt-3 tracking-tight">
            {value}
          </p>

        </div>

        <div className={`w-12 h-12 rounded-xl ${current.iconBg} border ${current.iconBorder} flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]`}>

          <Icon className={`w-6 h-6 ${current.iconColor}`} />

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

      <div className="w-12 h-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center mb-3">

        <AlertCircle className="w-6 h-6 text-[#9a9a9a]" />

      </div>

      <p className="text-xs text-[#9a9a9a]">
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

      <CheckCircle2 className="w-4 h-4 text-[#f3a078] shrink-0 mt-0.5" />

      <span className="text-xs text-[#d1ccc7] leading-relaxed">
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