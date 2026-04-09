/**
 * Test page
 */
import { useState, useEffect } from 'react';

export default function Test() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch test from API
    setLoading(false);
  }, []);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmit = async () => {
    // TODO: Submit test answers to API
    console.log('Submitting answers:', answers);
  };

  if (loading) return <p>Loading test...</p>;

  return (
    <div className="test-page">
      <div className="test-container">
        <h1>{test?.title}</h1>
        
        <div className="test-progress">
          <p>Question {currentQuestion + 1} of {test?.questions.length}</p>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / test?.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="question">
          <h2>{test?.questions[currentQuestion]?.question_text}</h2>
          <div className="options">
            {test?.questions[currentQuestion]?.options.map((option, idx) => (
              <label key={idx}>
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  onChange={(e) => handleAnswerChange(
                    test.questions[currentQuestion]._id,
                    e.target.value
                  )}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div className="test-controls">
          <button
            className="btn btn-secondary"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
          >
            Previous
          </button>
          
          {currentQuestion < test?.questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
            >
              Next
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleSubmit}>
              Submit Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
