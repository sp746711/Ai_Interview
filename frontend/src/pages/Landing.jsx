/**
 * Landing page
 */
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing-page">
      <section className="hero">
        <h1>Welcome to AI Mock Interview</h1>
        <p>Practice interview questions powered by artificial intelligence</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn btn-primary">Get Started</Link>
          <Link to="/register" className="btn btn-secondary">Sign Up</Link>
        </div>
      </section>
      
      <section className="features">
        <div className="feature-card">
          <h3>AI-Powered Questions</h3>
          <p>Get interview questions tailored to your job role</p>
        </div>
        <div className="feature-card">
          <h3>Real-time Feedback</h3>
          <p>Receive instant feedback on your answers</p>
        </div>
        <div className="feature-card">
          <h3>Performance Tracking</h3>
          <p>Track your progress and identify improvement areas</p>
        </div>
      </section>
    </div>
  );
}
