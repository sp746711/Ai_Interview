import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  History as HistoryIcon,
  CheckCircle2,
  Clock3,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8001";

const History = () => {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/overview`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      /*
       * Backend may return recent interviews using
       * recent_interviews.
       */
      const recent =
        data?.recent_interviews ||
        data?.recentInterviews ||
        data?.interviews ||
        [];

      setInterviews(Array.isArray(recent) ? recent : []);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Unable to load interview history.");
    } finally {
      setLoading(false);
    }
  };

  const normalizedInterviews = useMemo(() => {
    return interviews.map((item, index) => {
      const score =
        item?.score ??
        item?.final_score ??
        item?.total_score ??
        item?.percentage ??
        null;

      const status =
        item?.status ||
        (item?.completed ? "Completed" : "Incomplete");

      return {
        id: item?.id || item?._id || item?.interview_id || index,
        date:
          item?.date ||
          item?.created_at ||
          item?.createdAt ||
          item?.timestamp ||
          null,
        type:
          item?.type ||
          item?.interview_type ||
          item?.interviewType ||
          "Technical",
        role:
          item?.role ||
          item?.job_role ||
          item?.target_role ||
          "Interview",
        score,
        status,
      };
    });
  }, [interviews]);

  const formatDate = (date) => {
    if (!date) return "--";

    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "--";
    }
  };

  const getScore = (score) => {
    if (score === null || score === undefined || score === "") {
      return "--";
    }

    const numericScore = Number(score);

    if (Number.isNaN(numericScore)) {
      return score;
    }

    return Number.isInteger(numericScore)
      ? numericScore
      : numericScore.toFixed(1);
  };

  const isCompleted = (status) => {
    return String(status).toLowerCase() === "completed";
  };

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <div>
          <div className="history-title-row">
            <HistoryIcon size={28} />
            <h1>Interview History</h1>
          </div>

          <p>
            View and review all your previous AI mock interviews.
          </p>
        </div>

        <div className="history-header-actions">
          <button
            className="history-refresh-btn"
            onClick={fetchHistory}
            disabled={loading}
            title="Refresh history"
          >
            <RefreshCw
              size={18}
              className={loading ? "history-spin" : ""}
            />
            Refresh
          </button>

          <button
            className="history-back-btn"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="history-card">
        <div className="history-card-header">
          <div>
            <h2>All Interviews</h2>
            <span>
              {normalizedInterviews.length} interview
              {normalizedInterviews.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="history-state">
            <RefreshCw size={34} className="history-spin" />
            <h3>Loading interview history...</h3>
            <p>Please wait.</p>
          </div>
        ) : error ? (
          <div className="history-state error-state">
            <AlertCircle size={40} />
            <h3>{error}</h3>
            <p>Check that your backend is running and try again.</p>

            <button
              className="history-retry-btn"
              onClick={fetchHistory}
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        ) : normalizedInterviews.length === 0 ? (
          <div className="history-state">
            <HistoryIcon size={42} />
            <h3>No interviews found</h3>
            <p>
              Complete your first mock interview and it will
              appear here.
            </p>

            <button
              className="history-start-btn"
              onClick={() => navigate("/setup")}
            >
              Start Interview
            </button>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>ROLE</th>
                  <th>SCORE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {normalizedInterviews.map((interview) => (
                  <tr key={interview.id}>
                    <td>
                      <div className="history-date">
                        {formatDate(interview.date)}
                      </div>
                    </td>

                    <td>
                      <span className="history-type">
                        {interview.type}
                      </span>
                    </td>

                    <td>
                      <span className="history-role">
                        {interview.role}
                      </span>
                    </td>

                    <td>
                      <span className="history-score">
                        {getScore(interview.score)}
                      </span>

                      {interview.score !== null &&
                        interview.score !== undefined &&
                        interview.score !== "" && (
                          <span className="history-score-total">
                            {" "}
                            / 100
                          </span>
                        )}
                    </td>

                    <td>
                      {isCompleted(interview.status) ? (
                        <span className="history-status completed">
                          <CheckCircle2 size={15} />
                          Completed
                        </span>
                      ) : (
                        <span className="history-status incomplete">
                          <Clock3 size={15} />
                          Incomplete
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        className="history-view-btn"
                        title="View interview"
                        onClick={() => {
                          /*
                           * For now this safely returns to dashboard.
                           * We can connect this later to the detailed
                           * feedback/interview result page.
                           */
                          navigate("/dashboard");
                        }}
                      >
                        <Eye size={19} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;