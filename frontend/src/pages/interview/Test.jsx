import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Clock, Loader2, AlertCircle } from 'lucide-react';

const Test = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  
  const navigate = useNavigate();
  const currentInterview = JSON.parse(localStorage.getItem('current_interview') || '{}');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const stageRes = await api.get(`/interview/stage?interview_id=${currentInterview.id}`);
        if (stageRes.data.stage !== 'test') {
          navigate('/dashboard');
          return;
        }
        const response = await api.get(`/test/questions?interview_type=${currentInterview.interview_type || 'technical'}&difficulty=easy`);
        // Ensure returning questions handle format correctly
        let qData = response.data.questions || [];
        // If it's a string, try parsing it
        if (typeof qData === 'string') {
          try { qData = JSON.parse(qData); } catch (e) {
             console.error("Could not parse stringified questions", qData)
             qData = [];
           }
        }
        setQuestions(qData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch questions.');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [navigate, currentInterview.id, currentInterview.interview_type]);

  // Timer logic
  useEffect(() => {
    if (loading || submitting) return;

    if (timeLeft <= 0) {
      handleSubmit(); // Auto submit when time is up
      return;
    }

    const timerInt = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerInt);
  }, [timeLeft, loading, submitting]);

  const handleOptionSelect = (index, optionIndex) => {
    setAnswers({
      ...answers,
      [index.toString()]: optionIndex.toString(),
    });
  };

  const handleSubmit = async () => {
    if (!currentInterview.id) return;
    setSubmitting(true);
    
    // Mapping answer index to actual text selection if backend needs text, or let backend evaluate index. 
    // Usually tests expect the id or the actual text. In backend test_schema: Dict[str, str] (question -> selected_option)
    // We will send index mapping for simplicity, assuming backend evaluates it.
    
    // Convert to what backend expects
    const submitPayload = {
      interview_id: currentInterview.id,
      answers: {}
    };

    questions.forEach((q, idx) => {
      const selectedOptIdx = answers[idx.toString()];
      const opts = Array.isArray(q.options) ? q.options : [];
      const selectedValue = selectedOptIdx !== undefined ? opts[parseInt(selectedOptIdx, 10)] : null;
      submitPayload.answers[String(q.question || `q_${idx}`)] = selectedValue ?? '';
    });

    try {
      await api.post('/test/submit', submitPayload);
      localStorage.setItem(
        'current_interview',
        JSON.stringify({ ...currentInterview, stage: 'setup', difficulty: 'easy' })
      );
      navigate('/setup');
    } catch (err) {
      console.error(err);
      setError('Failed to submit test.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-400">Preparing your test environment...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-card max-w-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate('/setup')} className="btn-secondary">Back to Setup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.12)]">
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-4">
        <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-700" />
      </div>
      <div className="flex justify-between items-center bg-dark-800/80 p-4 rounded-xl border border-white/10 mb-8 sticky top-20 z-10 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold">Round 2: Technical Test</h2>
          <p className="text-sm text-gray-400">Answer all questions to the best of your ability.</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl
          ${timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-dark-900 border border-white/10'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="space-y-8 flex-1 pb-24">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="glass-card">
            <h3 className="text-lg font-medium mb-4 text-white">
              <span className="text-primary-400 mr-2">{qIndex + 1}.</span>
              {q.question}
            </h3>
            
            <div className="space-y-3">
              {q.options && q.options.map((option, optIndex) => {
                const isSelected = answers[qIndex.toString()] === optIndex.toString();
                return (
                  <div 
                    key={optIndex}
                    onClick={() => handleOptionSelect(qIndex, optIndex)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center
                      ${isSelected 
                        ? 'border-primary-500 bg-primary-500/10' 
                        : 'border-white/5 bg-dark-900/50 hover:border-white/20 hover:bg-dark-800'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex-shrink-0 mr-4 flex items-center justify-center
                      ${isSelected ? 'border-primary-500' : 'border-gray-500'}`}>
                      {isSelected && <div className="w-3 h-3 bg-primary-500 rounded-full" />}
                    </div>
                    <span className={isSelected ? 'text-white' : 'text-gray-300'}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-dark-900/95 border-t border-white/10 p-4 backdrop-blur-md z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <p className="text-gray-400">
            Answered: <span className="text-white font-medium">{Object.keys(answers).length}</span> / {questions.length}
          </p>
          <button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="btn-primary min-w-[200px] flex justify-center"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Test & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Test;
