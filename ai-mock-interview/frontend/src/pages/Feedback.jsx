/**
 * Feedback page
 */
import { useState, useEffect } from 'react';

export default function Feedback() {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch feedback from API
    setLoading(false);
  }, []);

  if (loading) return <p>Loading feedback...</p>;

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <h1>Interview Feedback</h1>

        <section className="score-section">
          <h2>Overall Score</h2>
          <div className="score-display">
            <p className="score">{feedback?.score}%</p>
            <p className="status">{feedback?.status}</p>
          </div>
        </section>

        <section className="feedback-section">
          <h2>General Feedback</h2>
          <p>{feedback?.feedback}</p>
        </section>

        <section className="areas-section">
          <h2>Areas of Strength</h2>
          <ul>
            {feedback?.strengths?.map((strength, idx) => (
              <li key={idx}>{strength}</li>
            ))}
          </ul>
        </section>

        <section className="improvement-section">
          <h2>Areas for Improvement</h2>
          <ul>
            {feedback?.improvements?.map((improvement, idx) => (
              <li key={idx}>{improvement}</li>
            ))}
          </ul>
        </section>

        <div className="feedback-actions">
          <button className="btn btn-primary">Take Another Interview</button>
          <button className="btn btn-secondary">Download Report</button>
        </div>
      </div>
    </div>
  );
}
