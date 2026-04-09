/**
 * Interview Card component
 */
export default function InterviewCard({ interview }) {
  return (
    <div className="interview-card">
      <div className="card-header">
        <h3>{interview.job_title}</h3>
        <span className={`difficulty ${interview.difficulty}`}>
          {interview.difficulty}
        </span>
      </div>
      <div className="card-body">
        <p>Status: <strong>{interview.status}</strong></p>
        {interview.score && (
          <p>Score: <strong>{interview.score}%</strong></p>
        )}
        <p>Created: {new Date(interview.created_at).toLocaleDateString()}</p>
      </div>
      <div className="card-footer">
        <button className="btn btn-primary">View Details</button>
        {interview.status === 'scheduled' && (
          <button className="btn btn-success">Start Interview</button>
        )}
      </div>
    </div>
  );
}
