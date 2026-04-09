import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, FileText, Target, Play } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center -mt-16 sm:mt-0 p-4 relative">
      <div className="max-w-4xl w-full text-center space-y-8 z-10">
        
        <h1>Landing Page Working</h1>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-primary-500/30 text-primary-400 text-sm font-medium mb-4 animate-fade-in-up">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
          </span>
          AI-Powered Mock Interviews
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Master Your Next <br />
          <span className="neon-text">Tech Interview</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload your resume, take a customized skill test, and converse with an AI interviewer tailored to your target role. Get actionable feedback and level up.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link to="/register" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-lg px-8 py-4">
            Start Interview <Play className="w-5 h-5 fill-current" />
          </Link>
          <a href="#features" className="btn-secondary w-full sm:w-auto text-lg px-8 py-4">
            How it works
          </a>
        </div>

      </div>

      <div id="features" className="mt-32 max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 pb-16 z-10">
        <div className="glass-card flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mb-6 text-primary-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-3">Resume Analysis</h3>
          <p className="text-gray-400">Our AI scans your resume to match skills with job requirements and identify gaps.</p>
        </div>
        <div className="glass-card flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-neon-purple/10 flex items-center justify-center mb-6 text-neon-purple">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-3">Targeted Tech Test</h3>
          <p className="text-gray-400">Prove your knowledge with dynamic multiple-choice questions tailored to your level.</p>
        </div>
        <div className="glass-card flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-neon-blue/10 flex items-center justify-center mb-6 text-neon-blue">
            <Bot className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-3">AI Interviewer</h3>
          <p className="text-gray-400">Experience a realistic conversation with our advanced AI assessing your communication.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
