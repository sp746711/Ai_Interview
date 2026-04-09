import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Send, Bot, User, Loader2, ArrowRight } from 'lucide-react';

const AIInterview = () => {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  
  const MAX_QUESTIONS = 3;
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const currentInterview = JSON.parse(localStorage.getItem('current_interview') || '{}');

  useEffect(() => {
    if (!currentInterview.id) {
      navigate('/setup');
      return;
    }

    fetchNextQuestion();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchNextQuestion = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/interview/question?interview_id=${currentInterview.id}`);
      const aiResponse = res.data.question;
      
      setCurrentQuestion(aiResponse);
      setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { type: 'ai', content: "I'm having trouble connecting to the server. Please try again." }]);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || loading || questionsAnswered >= MAX_QUESTIONS) return;

    const userText = inputVal.trim();
    setInputVal('');
    setMessages(prev => [...prev, { type: 'user', content: userText }]);
    setLoading(true);

    try {
      // Submit answer
      await api.post('/interview/answer', {
        interview_id: currentInterview.id,
        question: currentQuestion,
        answer: userText
      });

      setQuestionsAnswered(prev => prev + 1);

      if (questionsAnswered + 1 >= MAX_QUESTIONS) {
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: "Thank you! That completes our AI interview section. Please proceed to see your feedback." 
        }]);
        setLoading(false);
      } else {
        await fetchNextQuestion();
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { type: 'ai', content: "Failed to record answer. Try again." }]);
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-neon-blue mb-4" />
        <p className="text-gray-400">Connecting to AI Interviewer...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8 h-[calc(100vh-80px)]">
      <div className="glass-panel p-4 rounded-t-2xl border-b border-white/5 flex justify-between items-center bg-dark-800/90 z-10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot className="text-neon-blue w-6 h-6" /> 
            AI Interviewer
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Question {Math.min(questionsAnswered + 1, MAX_QUESTIONS)} of {MAX_QUESTIONS}
          </p>
        </div>
        {questionsAnswered >= MAX_QUESTIONS && (
          <button 
            onClick={() => navigate('/feedback')}
            className="btn-primary py-2 px-4 flex items-center gap-2 text-sm animate-fade-in"
          >
            Finish & Get Feedback <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 glass-panel rounded-none border-t-0 border-b-0 bg-dark-900/40">
        <div className="text-center pb-4 border-b border-white/5 mb-4">
          <p className="text-sm text-gray-500">Interview Started. The AI will assess your communication and technical reasoning.</p>
        </div>

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              <div className="flex-shrink-0 mt-1">
                {msg.type === 'ai' ? (
                  <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue border border-neon-blue/30">
                    <Bot className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 border border-primary-500/30">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-2xl text-sm leading-relaxed
                ${msg.type === 'ai' 
                  ? 'bg-dark-800 border border-white/10 text-gray-200 rounded-tl-sm' 
                  : 'bg-primary-500 border border-primary-400/50 text-white rounded-tr-sm'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        
        {loading && questionsAnswered < MAX_QUESTIONS && (
           <div className="flex justify-start">
             <div className="flex gap-3 max-w-[80%] flex-row">
               <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue border border-neon-blue/30">
                    <Bot className="w-5 h-5" />
                  </div>
               </div>
               <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 rounded-tl-sm flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="glass-panel p-4 rounded-b-2xl border-t border-white/5 bg-dark-800/90 relative z-10">
        <form onSubmit={handleSend} className="relative">
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={questionsAnswered >= MAX_QUESTIONS ? "Interview complete." : "Type your response here..."}
            className="input-field pr-16 resize-none bg-dark-900 border-white/10"
            rows="3"
            disabled={loading || questionsAnswered >= MAX_QUESTIONS}
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading || questionsAnswered >= MAX_QUESTIONS}
            className="absolute bottom-3 right-3 p-2 rounded-lg bg-primary-500 text-white disabled:opacity-50 disabled:bg-gray-600 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIInterview;
