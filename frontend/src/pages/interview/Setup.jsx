import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Settings, Loader2 } from 'lucide-react';

const Setup = () => {
  const [role, setRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('medium');
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const currentInterview = JSON.parse(localStorage.getItem('current_interview') || '{}');

  useEffect(() => {
    const validateStage = async () => {
      if (!currentInterview?.id) {
        navigate('/dashboard');
        return;
      }
      try {
        const res = await api.get(`/interview/stage?interview_id=${currentInterview.id}`);
        if (res.data.stage !== 'setup') {
          navigate('/dashboard');
        }
      } catch {
        navigate('/dashboard');
      }
    };
    validateStage();
  }, [navigate, currentInterview?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/interview/setup', {
        interview_id: currentInterview.id,
        role,
        difficulty,
        duration: Number(duration),
      });
      localStorage.setItem(
        'current_interview',
        JSON.stringify({ ...currentInterview, role, difficulty, duration: Number(duration), stage: 'ai' })
      );
      navigate('/ai-interview');
    } catch (err) {
      console.error(err);
      setError('Failed to setup interview.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary-500/20 blur-[60px] -z-10 rounded-full" />
        
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="p-2 bg-primary-500/10 rounded text-primary-400">
            <Settings className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">AI Interview Setup</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!currentInterview.id || currentInterview.stage !== 'setup' ? (
          <div className="text-center">
            <p className="text-gray-400 mb-6">Please complete Round 1 and Round 2 first.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
              Go to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label-text">Target Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
                placeholder="e.g., Frontend Developer"
                required
              />
            </div>

            <div>
              <label className="label-text">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-3 px-4 rounded-lg capitalize border font-medium transition-all duration-200
                      ${difficulty === level 
                        ? 'bg-primary-500/20 border-primary-500 text-primary-400' 
                        : 'bg-dark-800/50 border-white/10 text-gray-400 hover:border-white/30'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-text">Interview Duration (minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input-field"
                min="5"
                max="60"
                required
              />
            </div>

            <div className="pt-4 mt-8 border-t border-white/10 flex justify-end">
              <button 
                type="submit" 
                className="btn-primary w-full flex justify-center items-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start AI Interview'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Setup;
