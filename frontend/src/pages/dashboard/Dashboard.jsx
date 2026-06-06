import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import StatCard from '../../components/dashboard/StatCard';
import Table from '../../components/dashboard/Table';

import api from '../../services/api';

import {
FileText,
Star,
Trophy,
Plus,
Loader2,
AlertCircle,
} from 'lucide-react';

const Dashboard = () => {
const [stats, setStats] = useState({
total: 0,
avg_score: 0,
best_score: 0,
});

const [history, setHistory] = useState([]);
const [interviewType, setInterviewType] = useState('technical');
const [starting, setStarting] = useState(false);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const navigate = useNavigate();

useEffect(() => {
const fetchHistory = async () => {
setLoading(true);
setError('');


  try {
    const res = await api.get('/interview/history');
    const data = res.data;

    setStats({
      total: data.total || 0,
      avg_score: data.avg_score || 0,
      best_score: data.best_score || 0,
    });

    const mapped = (data.history || []).map((item) => ({
      date: item.date || new Date().toISOString(),
      role: item.role || 'Software Engineer',
      score: Math.round((item.final_score || 0) / 10),
      actionUrl: `/feedback?id=${item.id}`,
    }));

    setHistory(mapped);
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
        'Failed to load interview history.'
    );
  } finally {
    setLoading(false);
  }
};

fetchHistory();


}, []);

const handleStart = async () => {
setStarting(true);


try {
  const res = await api.post('/interview/start', {
    interview_type: interviewType,
  });

  localStorage.setItem(
    'current_interview',
    JSON.stringify({
      id: res.data.interview_id,
      interview_type: interviewType,
      stage: 'round1',
    })
  );

  navigate('/round1');
} catch (error) {
  console.error('Failed to start interview', error);
} finally {
  setStarting(false);
}


};

if (loading) {
return ( <div className="min-h-[50vh] flex items-center justify-center"> <Loader2 className="w-8 h-8 animate-spin text-primary-500" /> </div>
);
}

return ( <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up rounded-2xl p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]">

```
  {error && (
    <div className="glass-card border border-red-500/30 text-red-300 flex items-center gap-2">
      <AlertCircle className="w-4 h-4" />
      {error}
    </div>
  )}

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatCard
      title="Total Interviews"
      value={stats.total.toString()}
      icon={FileText}
      gradientClass="bg-gradient-to-br from-blue-500 to-blue-700"
    />

    <StatCard
      title="Average Score"
      value={stats.avg_score.toString()}
      icon={Star}
      gradientClass="bg-gradient-to-br from-purple-500 to-purple-700"
    />

    <StatCard
      title="Best Score"
      value={stats.best_score.toString()}
      icon={Trophy}
      gradientClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
    />
  </div>

  <div className="flex flex-col items-center gap-4 py-4">
    <select
      value={interviewType}
      onChange={(e) => setInterviewType(e.target.value)}
      className="input-field max-w-xs"
    >
      <option value="technical">Technical</option>
      <option value="non-technical">Non-Technical</option>
    </select>

    <button
      onClick={handleStart}
      disabled={starting}
      className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transform hover:-translate-y-0.5 transition-all duration-300"
    >
      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
      {starting ? 'Starting...' : 'Start New Interview'}
    </button>
  </div>

  <div>
    <Table data={history} />
  </div>
</div>

);
};

export default Dashboard;
