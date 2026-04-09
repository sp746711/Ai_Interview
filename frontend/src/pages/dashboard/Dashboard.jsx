import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import Table from '../../components/dashboard/Table';
import { FileText, Star, Trophy, Plus } from 'lucide-react';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load history from localStorage or inject test data if requested
    const saved = localStorage.getItem('interview_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Backend history has 0-100 score, but prompt asks for 1-10
      // We will map 0-100 to 1-10 for display logic
      const mapped = parsed.map(item => ({
        date: item.date || new Date().toISOString(),
        role: item.role || 'Software Engineer',
        score: Math.round((item.final_score || 0) / 10),
        actionUrl: `/feedback?id=${item.id}`
      }));
      setHistory(mapped);
    } else {
      // Fallback example data to demonstrate the UI
      setHistory([
        { date: '2024-04-05T10:00:00', role: 'Frontend Developer', score: 8, actionUrl: '/dashboard' },
        { date: '2024-04-02T14:30:00', role: 'HR Manager', score: 7, actionUrl: '/dashboard' },
        { date: '2024-03-28T09:15:00', role: 'Backend Developer', score: 9, actionUrl: '/dashboard' },
        { date: '2024-03-25T16:45:00', role: 'Data Analyst', score: 6, actionUrl: '/dashboard' },
      ]);
    }
  }, []);

  const totalInterviews = history.length;
  const avgScore = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.score, 0) / history.length).toFixed(1)
    : 0;
  const bestScore = history.length > 0 
    ? Math.max(...history.map(h => h.score))
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Interviews" 
          value={totalInterviews.toString()} 
          icon={FileText} 
          gradientClass="bg-gradient-to-br from-blue-500 to-blue-700"
        />
        <StatCard 
          title="Average Score" 
          value={avgScore.toString()} 
          icon={Star} 
          gradientClass="bg-gradient-to-br from-purple-500 to-purple-700"
        />
        <StatCard 
          title="Best Score" 
          value={bestScore.toString()} 
          icon={Trophy} 
          gradientClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
      </div>

      {/* Action Button Section */}
      <div className="flex justify-center py-4">
        <button 
          onClick={() => navigate('/setup')}
          className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transform hover:-translate-y-0.5 transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Start New Interview
        </button>
      </div>

      {/* Table Section */}
      <div>
        <Table data={history} />
      </div>

    </div>
  );
};

export default Dashboard;
