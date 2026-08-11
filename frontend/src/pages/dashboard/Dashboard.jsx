import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Bot,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  // =========================================================
  // DASHBOARD DATA
  // =========================================================

  const [stats, setStats] = useState({
    total: 0,
    avg_score: 0,
    completed: 0,
    best_score: 0,
  });

  const [history, setHistory] = useState([]);

  const [interviewType, setInterviewType] =
    useState("technical");

  const [analyticsType, setAnalyticsType] =
    useState("technical");

  const [analytics, setAnalytics] = useState({
    score_overview: [],
    interviews_by_role: [],
    performance: {
      percentage: 0,
      label: "No Data",
      description:
        "Complete an interview to see your performance.",
    },
  });

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] =
    useState(false);

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD OVERVIEW + HISTORY
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
              item?.domain ||
              "Interview",

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

        setAnalytics({
          score_overview:
            Array.isArray(
              data.score_overview
            )
              ? data.score_overview
              : [],

          interviews_by_role:
            Array.isArray(
              data.interviews_by_role
            )
              ? data.interviews_by_role
              : [],

          performance:
            data.performance &&
            typeof data.performance ===
              "object"
              ? data.performance
              : {
                  percentage: 0,
                  label: "No Data",
                  description:
                    "No analytics available yet.",
                },
        });
      } catch (err) {
        console.error(
          "Analytics error:",
          err.response?.data ||
            err.message
        );

        setAnalytics({
          score_overview: [],
          interviews_by_role: [],
          performance: {
            percentage: 0,
            label: "No Data",
            description:
              `No ${analyticsType} analytics available yet.`,
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
  // =========================================================

  const handleStart = async () => {
    setStarting(true);
    setError("");

    try {
      const res = await api.post(
        "/interview/start",
        {
          interview_type: interviewType,
        }
      );

      localStorage.setItem(
        "current_interview",
        JSON.stringify({
          id: res.data.interview_id,
          interview_type: interviewType,
          stage: "round1",
        })
      );

      navigate("/round1");
    } catch (err) {
      console.error(
        "Failed to start interview:",
        err.response?.data ||
          err.message
      );

      setError(
        err.response?.data?.detail ||
          "Failed to start interview."
      );
    } finally {
      setStarting(false);
    }
  };

  // =========================================================
  // NORMALIZE ANALYTICS
  // =========================================================

  const scoreData = useMemo(() => {
    const overview = analytics.score_overview;

    if (
      overview &&
      typeof overview === "object" &&
      Array.isArray(overview.scores)
    ) {
      return overview.scores;
    }

    return [];
  }, [analytics.score_overview]);

  const scoreValues = useMemo(() => {
    return scoreData
      .map((item) => {
        if (typeof item === "number") {
          return item;
        }

        return Number(
          item?.score ??
            item?.value ??
            item?.average_score ??
            item?.avg_score ??
            0
        );
      })
      .filter((value) =>
        Number.isFinite(value)
      );
  }, [scoreData]);

  const roleData = useMemo(() => {
    const completed = history.filter(
      (item) =>
        item?.status === "completed" &&
        item?.type === analyticsType
    );

    const roleCounts = {};

    completed.forEach((item) => {
      const role =
        item?.role ||
        "Role Not Selected";

      roleCounts[role] =
        (roleCounts[role] || 0) + 1;
    });

    return Object.entries(roleCounts)
      .map(([role, count]) => ({
        role,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [history, analyticsType]);

  const totalRoleInterviews = roleData.reduce(
    (sum, item) =>
      sum + Number(item?.count || 0),
    0
  );

  const performance =
    analytics.performance || {};

  const performancePercentage = Math.min(
    100,
    Math.max(
      0,
      Number(
        performance.average_score || 0
      )
    )
  );

  const performanceLabel =
    performancePercentage >= 80
      ? "Excellent Performance"
      : performancePercentage >= 60
      ? "Good Performance"
      : performancePercentage >= 40
      ? "Keep Improving"
      : "Keep Practicing";

  const performanceDescription =
    `Average score from ${performance.completed_interviews || 0} completed interviews.`;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN DASHBOARD
  // =========================================================

  return (
    <div className="space-y-6 pb-10">

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          4 STAT CARDS
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
          AI INTERVIEW CTA
      ====================================================== */}

      <section className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-[#171342] via-[#14113b] to-[#0d1532] p-5 shadow-[0_0_30px_rgba(124,58,237,0.08)]">

        <div className="flex flex-col xl:flex-row items-center gap-5">

          {/* AI ROBOT */}

          <div className="hidden md:flex w-36 h-28 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10">

            <div className="relative">

              <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-2xl" />

              <Bot className="relative w-20 h-20 text-purple-300 drop-shadow-[0_0_12px_rgba(139,92,246,0.8)]" />

            </div>

          </div>

          {/* TEXT */}

          <div className="flex-1 text-center xl:text-left">

            <h2 className="text-xl font-bold text-white">
              Ready for your next interview?
            </h2>

            <p className="text-slate-400 mt-2 leading-6">
              Choose your interview type and
              start your AI interview.
            </p>

          </div>

          {/* TYPE SELECTOR */}

          <div className="relative w-full xl:w-auto">

            <select
              value={interviewType}
              onChange={(e) =>
                setInterviewType(
                  e.target.value
                )
              }
              className="appearance-none w-full xl:min-w-[210px] rounded-xl border border-slate-700 bg-[#080d1d] px-5 py-3 pr-11 text-white outline-none focus:border-purple-500"
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
            className="inline-flex w-full xl:w-auto min-w-[250px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
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
          ANALYTICS HEADER
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
            onChange={(e) =>
              setAnalyticsType(
                e.target.value
              )
            }
            className="appearance-none min-w-[220px] rounded-xl border border-purple-500/30 bg-[#090d1d] px-5 py-3 pr-11 text-white outline-none focus:border-purple-500"
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
          ANALYTICS
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* SCORE OVERVIEW */}

        <section className="xl:col-span-5 rounded-2xl border border-slate-800 bg-[#090e1e] p-5 min-h-[330px]">

          <PanelTitle
            icon={
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            }
            title="Score Overview"
            badge={
              analyticsType ===
              "technical"
                ? "Technical"
                : "Non-Technical"
            }
          />

          {analyticsLoading ? (
            <AnalyticsLoader />
          ) : scoreValues.length === 0 ? (
            <EmptyAnalytics
              text={`No ${analyticsType} score data available yet.`}
            />
          ) : (
            <ScoreChart
              values={scoreValues.slice(-10)}
            />
          )}

        </section>

        {/* INTERVIEWS BY ROLE */}

        <section className="xl:col-span-4 rounded-2xl border border-slate-800 bg-[#090e1e] p-5 min-h-[330px]">

          <PanelTitle
            icon={
              <Briefcase className="w-5 h-5 text-purple-400" />
            }
            title="Interviews By Role"
          />

          {analyticsLoading ? (
            <AnalyticsLoader />
          ) : roleData.length === 0 ? (
            <EmptyAnalytics
              text={`No ${analyticsType} role data available yet.`}
            />
          ) : (
            <RoleChart
              roleData={roleData}
              total={totalRoleInterviews}
            />
          )}

        </section>

        {/* YOUR PERFORMANCE */}

        <section className="xl:col-span-3 rounded-2xl border border-slate-800 bg-[#090e1e] p-5 min-h-[330px]">

          <PanelTitle
            icon={
              <Target className="w-5 h-5 text-cyan-400" />
            }
            title="Your Performance"
          />

          <div className="flex flex-col items-center justify-center">

            <PerformanceRing
              percentage={
                performancePercentage
              }
            />

            <h4 className="mt-6 text-lg font-semibold text-white">
              {performanceLabel}
            </h4>

            <p className="text-center text-sm text-slate-400 mt-2 leading-6">
              {performanceDescription}
            </p>

          </div>

        </section>

      </div>

      {/* =====================================================
          RECENT INTERVIEWS + TIPS
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* RECENT INTERVIEWS */}

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
              className="text-sm text-purple-400 hover:text-purple-300 transition"
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

                    <th className="px-5 py-4 text-center">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {history
                    .slice(0, 5)
                    .map(
                      (item, index) => (
                        <tr
                          key={
                            item?.id ||
                            index
                          }
                          className="border-b border-slate-800/70 last:border-0 hover:bg-white/[0.02] transition"
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

                          <td className="px-5 py-4 text-sm text-white font-medium">
                            {item?.role}
                          </td>

                          <td className="px-5 py-4">

                            {item?.status ===
                            "completed" ? (
                              <>
                                <span className="font-semibold text-white">
                                  {item?.score ??
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

                          <td className="px-5 py-4 text-center">

                            <button
                              onClick={() =>
                                navigate(
                                  item?.actionUrl
                                )
                              }
                              className="mx-auto w-9 h-9 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition"
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

        {/* TIPS */}

        <section className="xl:col-span-3 rounded-2xl border border-slate-800 bg-[#090e1e] p-5">

          <div className="flex items-center gap-2 mb-6">

            <Lightbulb className="w-5 h-5 text-cyan-400" />

            <h3 className="font-semibold text-white">
              Tips for Success
            </h3>

          </div>

          <div className="space-y-6">

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
// STAT CARD
// =============================================================

const StatBox = ({
  title,
  value,
  icon: Icon,
  gradient,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 min-h-[145px] shadow-lg`}
    >

      <div className="relative z-10 flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-wider text-white/80">
            {title}
          </p>

          <p className="text-4xl font-bold text-white mt-3">
            {value}
          </p>

        </div>

        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">

          <Icon className="w-6 h-6 text-white" />

        </div>

      </div>

      <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/5" />

      <div className="absolute -bottom-10 right-10 w-20 h-20 rounded-full bg-white/5" />

    </div>
  );
};

// =============================================================
// PANEL TITLE
// =============================================================

const PanelTitle = ({
  icon,
  title,
  badge,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">

      <div className="flex items-center gap-2">

        {icon}

        <h3 className="font-semibold text-white">
          {title}
        </h3>

      </div>

      {badge && (
        <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-400">
          {badge}
        </span>
      )}

    </div>
  );
};

// =============================================================
// SCORE CHART
// =============================================================

const ScoreChart = ({ values }) => {

  const width = 520;
  const height = 230;

  const paddingX = 25;
  const paddingY = 25;

  const maxValue = Math.max(
    ...values,
    5
  );

  const minValue = Math.min(
    ...values,
    0
  );

  const range =
    maxValue - minValue === 0
      ? 1
      : maxValue - minValue;

  const points = values.map(
    (value, index) => {

      const x =
        values.length === 1
          ? width / 2
          : paddingX +
            (index /
              (values.length - 1)) *
              (width -
                paddingX * 2);

      const y =
        height -
        paddingY -
        ((value - minValue) /
          range) *
          (height -
            paddingY * 2);

      return {
        x,
        y,
        value,
      };
    }
  );

  const linePoints = points
    .map(
      (point) =>
        `${point.x},${point.y}`
    )
    .join(" ");

  const areaPoints = [
    `${points[0].x},${
      height - paddingY
    }`,

    ...points.map(
      (point) =>
        `${point.x},${point.y}`
    ),

    `${points[
      points.length - 1
    ].x},${height - paddingY}`,
  ].join(" ");

  return (
    <div className="h-[285px]">

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >

        <defs>

          <linearGradient
            id="scoreGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >

            <stop
              offset="0%"
              stopColor="#8b5cf6"
              stopOpacity="0.35"
            />

            <stop
              offset="100%"
              stopColor="#06b6d4"
              stopOpacity="0"
            />

          </linearGradient>

        </defs>

        {[0, 1, 2, 3].map(
          (row) => {

            const y =
              paddingY +
              (row / 3) *
                (height -
                  paddingY * 2);

            return (
              <line
                key={row}
                x1={paddingX}
                x2={
                  width -
                  paddingX
                }
                y1={y}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
              />
            );
          }
        )}

        <polygon
          points={areaPoints}
          fill="url(#scoreGradient)"
        />

        <polyline
          points={linePoints}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map(
          (point, index) => (
            <g key={index}>

              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#090e1e"
                stroke="#a78bfa"
                strokeWidth="3"
              />

              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="12"
              >
                {point.value}
              </text>

            </g>
          )
        )}

      </svg>

      <div className="flex justify-between px-2 text-xs text-slate-600">
        <span>Recent</span>
        <span>Latest</span>
      </div>

    </div>
  );
};

// =============================================================
// ROLE CHART
// =============================================================

const RoleChart = ({
  roleData,
  total,
}) => {

  const colors = [
    "#8b5cf6",
    "#3b82f6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ec4899",
  ];

  let current = 0;

  const segments = roleData.map(
    (item, index) => {

      const count = Number(
        item?.count ??
          item?.total ??
          item?.value ??
          0
      );

      const percentage =
        total > 0
          ? (count / total) * 100
          : 0;

      const start = current;

      current += percentage;

      return {
        name:
          item?.role ||
          item?.name ||
          "Role",

        count,

        percentage,

        start,

        color:
          colors[
            index % colors.length
          ],
      };
    }
  );

  const gradient =
    segments.length > 0
      ? `conic-gradient(${segments
          .map(
            (segment) =>
              `${segment.color} ${segment.start}% ${
                segment.start +
                segment.percentage
              }%`
          )
          .join(", ")})`
      : "#1e293b";

  return (
    <div className="min-h-[285px] flex flex-col justify-center">

      <div className="flex items-center justify-center gap-7">

        <div
          className="relative w-36 h-36 shrink-0 rounded-full"
          style={{
            background: gradient,
          }}
        >

          <div className="absolute inset-[14px] rounded-full bg-[#090e1e] flex flex-col items-center justify-center">

            <span className="text-2xl font-bold text-white">
              {total}
            </span>

            <span className="text-xs text-slate-500">
              Total
            </span>

          </div>

        </div>

        <div className="flex-1 space-y-3 min-w-0">

          {segments
            .slice(0, 5)
            .map(
              (segment, index) => (
                <div
                  key={`${segment.name}-${index}`}
                  className="flex items-center justify-between gap-3"
                >

                  <div className="flex items-center gap-2 min-w-0">

                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          segment.color,
                      }}
                    />

                    <span className="text-xs text-slate-300 truncate">
                      {segment.name}
                    </span>

                  </div>

                  <span className="text-xs text-slate-400">
                    {Math.round(
                      segment.percentage
                    )}
                    %
                  </span>

                </div>
              )
            )}

        </div>

      </div>

    </div>
  );
};

// =============================================================
// PERFORMANCE RING
// =============================================================

const PerformanceRing = ({
  percentage,
}) => {

  return (
    <div
      className="relative w-44 h-44 rounded-full flex items-center justify-center"
      style={{
        background: `conic-gradient(
          #7c3aed 0deg ${
            percentage * 3.6
          }deg,
          #172033 ${
            percentage * 3.6
          }deg 360deg
        )`,
      }}
    >

      <div className="absolute inset-3 rounded-full bg-[#090e1e] flex flex-col items-center justify-center">

        <span className="text-3xl font-bold text-white">
          {percentage}%
        </span>

        <span className="text-sm text-slate-500 mt-1">
          Performance
        </span>

      </div>

    </div>
  );
};

// =============================================================
// LOADER
// =============================================================

const AnalyticsLoader = () => {
  return (
    <div className="h-[285px] flex items-center justify-center">

      <Loader2 className="w-6 h-6 animate-spin text-purple-400" />

    </div>
  );
};

// =============================================================
// EMPTY
// =============================================================

const EmptyAnalytics = ({
  text,
}) => {

  return (
    <div className="h-[285px] flex flex-col items-center justify-center text-center">

      <AlertCircle className="w-8 h-8 text-slate-600 mb-3" />

      <p className="text-sm text-slate-500 max-w-xs">
        {text}
      </p>

    </div>
  );
};

// =============================================================
// TIP
// =============================================================

const Tip = ({ text }) => {

  return (
    <div className="flex items-start gap-3">

      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />

      <span className="text-sm text-slate-300 leading-6">
        {text}
      </span>

    </div>
  );
};

// =============================================================
// DATE
// =============================================================

const formatDate = (date) => {

  if (!date) {
    return "--";
  }

  try {
    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  } catch {
    return "--";
  }
};

export default Dashboard;
