/**
 * Dashboard page
 */
import { useState, useEffect } from 'react';
import InterviewCard from '../components/InterviewCard';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch interviews from API
    setLoading(false);
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <h1>Dashboard</h1>
        
        <section className="new-interview">
          <h2>Create New Interview</h2>
          <form>
            <div className="form-group">
              <label>Job Title:</label>
              <input type="text" placeholder="e.g., Software Engineer" />
            </div>
            <div className="form-group">
              <label>Difficulty:</label>
              <select>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Start Interview</button>
          </form>
        </section>

        <section className="interviews-list">
          <h2>Recent Interviews</h2>
          {loading ? (
            <p>Loading...</p>
          ) : interviews.length > 0 ? (
            <div className="interviews-grid">
              {interviews.map(interview => (
                <InterviewCard key={interview._id} interview={interview} />
              ))}
            </div>
          ) : (
            <p>No interviews yet. Create one to get started!</p>
          )}
        </section>
      </div>
    </div>
  );
}
