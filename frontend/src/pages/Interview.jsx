/**
 * Interview page
 */
import { useState, useEffect } from 'react';

export default function Interview() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [interview, setInterview] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch interview from API
    setLoading(false);
  }, []);

  const handleStartRecording = () => {
    setRecording(true);
    // TODO: Start audio recording
  };

  const handleStopRecording = () => {
    setRecording(false);
    // TODO: Stop audio recording
  };

  const handleSubmitAnswer = async () => {
    // TODO: Submit answer to API
    console.log('Submitting answer:', answer);
    setAnswer('');
    setCurrentQuestion(currentQuestion + 1);
  };

  if (loading) return <p>Loading interview...</p>;

  return (
    <div className="interview-page">
      <div className="interview-container">
        <h1>Interview: {interview?.job_title}</h1>

        <div className="interview-progress">
          <p>Question {currentQuestion + 1} of {interview?.questions.length}</p>
        </div>

        <div className="question-section">
          <h2>{interview?.questions[currentQuestion]}</h2>
        </div>

        <div className="answer-section">
          <div className="recording-controls">
            <button
              className={`btn ${recording ? 'btn-danger' : 'btn-primary'}`}
              onClick={recording ? handleStopRecording : handleStartRecording}
            >
              {recording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type or speak your answer here..."
            rows={6}
          ></textarea>
        </div>

        <div className="interview-controls">
          <button
            className="btn btn-secondary"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
          >
            Previous
          </button>

          {currentQuestion < interview?.questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmitAnswer}
            >
              Next Question
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSubmitAnswer}
            >
              Finish Interview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
