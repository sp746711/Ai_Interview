import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Loader2, AlertCircle, FileText, Target, Bot, Award, Home } from 'lucide-react';

const Feedback = () => {
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResult = async () => {
      // If there's an ID in URL use it, otherwise use the current_interview
      let interviewId = queryId;
      if (!interviewId) {
        const currentInterview = JSON.parse(localStorage.getItem('current_interview') || '{}');
        interviewId = currentInterview.id;
      }

      if (!interviewId) {
        navigate('/dashboard');
        return;
      }

      try {
        const res = await api.get(`/interview/result?interview_id=${interviewId}`);
        const data = res.data;
        setResult(data);
        
        // Save to history in localStorage
        const history = JSON.parse(localStorage.getItem('interview_history') || '[]');
        // Check if already in history
        const exists = history.find(item => item.id === data.id);
        if (!exists) {
          const summary = {
            id: data.id,
            role: data.role,
            difficulty: data.difficulty,
            final_score: data.final_score,
            date: new Date().toISOString()
          };
          localStorage.setItem('interview_history', JSON.stringify([summary, ...history]));
        }
        
        // Clear current_interview if this was the active one
        if (!queryId) {
            localStorage.removeItem('current_interview');
        }

      } catch (err) {
        console.error(err);
        setError('Failed to load results. It might still be processing.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [queryId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-400 text-lg">Compiling your comprehensive feedback...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="glass-card max-w-lg text-center w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Result Unavailable</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const ScoreRing = ({ score, size = 120, strokeWidth = 8, colorCls }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    
    // Convert text class to stroke color approx
    const strokeColor = score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : '#f87171';

    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-dark-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute text-2xl font-bold ${colorCls}`}>{score}%</span>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 animate-fade-in-up">
      
      {/* Header & Overall Score */}
      <div className="glass-card relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[80px] -z-10 rounded-full" />
        
        <div>
          <h1 className="text-3xl font-bold mb-2 break-all">Interview Result: {result.role || result.interview_type}</h1>
          <div className="flex gap-4 text-sm text-gray-400 mb-6">
            <span className="capitalize bg-dark-800 px-3 py-1 rounded">Difficulty: {result.difficulty}</span>
          </div>
          <p className="text-gray-300 max-w-lg leading-relaxed">
            Your performance has been evaluated across three rounds: Resume, Technical Test, and AI Communication. Review your breakdown below to track areas for improvement.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-400 font-medium mb-4 uppercase tracking-wider">Final Score</p>
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full" />
            <ScoreRing 
              score={result.final_score} 
              size={160} 
              strokeWidth={12} 
              colorCls={getScoreColor(result.final_score)} 
            />
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Round 1 */}
        <div className="glass-card flex flex-col items-center text-center p-6">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-300 border border-white/10">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Resume Screening</h3>
          <p className="text-xs text-gray-400 mb-6">ATS Match & Skills</p>
          <ScoreRing score={result.resume_score || 0} size={100} strokeWidth={8} colorCls={getScoreColor(result.resume_score || 0)} />
        </div>

        {/* Round 2 */}
        <div className="glass-card flex flex-col items-center text-center p-6">
          <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center mb-4 text-primary-400 border border-primary-500/20">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Technical Test</h3>
          <p className="text-xs text-gray-400 mb-6">Multiple Choice Assessment</p>
          <ScoreRing score={result.test_score || 0} size={100} strokeWidth={8} colorCls={getScoreColor(result.test_score || 0)} />
        </div>

        {/* Round 3 */}
        <div className="glass-card flex flex-col items-center text-center p-6">
          <div className="w-12 h-12 bg-neon-purple/10 rounded-full flex items-center justify-center mb-4 text-neon-purple border border-neon-purple/20">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">AI Interview</h3>
          <p className="text-xs text-gray-400 mb-6">Communication & Reasoning</p>
          <ScoreRing score={result.interview_score || 0} size={100} strokeWidth={8} colorCls={getScoreColor(result.interview_score || 0)} />
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card">
          <h3 className="font-semibold mb-3">Strengths</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            {(result.strengths || []).map((item, idx) => <li key={idx}>- {item}</li>)}
          </ul>
        </div>
        <div className="glass-card">
          <h3 className="font-semibold mb-3">Weaknesses</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            {(result.weaknesses || []).map((item, idx) => <li key={idx}>- {item}</li>)}
          </ul>
        </div>
        <div className="glass-card">
          <h3 className="font-semibold mb-3">Suggestions</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            {(result.suggestions || []).map((item, idx) => <li key={idx}>- {item}</li>)}
          </ul>
        </div>
      </div>

      <div className="flex justify-center mt-8">
         <button onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center gap-2">
           <Home className="w-5 h-5"/> Return to Dashboard
         </button>
      </div>

    </div>
  );
};

export default Feedback;
