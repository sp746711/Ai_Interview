import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Send, Bot, User, Loader2, ArrowRight, Camera, Mic } from 'lucide-react';

const AIInterview = () => {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [autoMoving, setAutoMoving] = useState(false);
  
  const MAX_QUESTIONS = 3;
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakingRef = useRef(false);
  
  const currentInterview = JSON.parse(localStorage.getItem('current_interview') || '{}');

  useEffect(() => {
    const init = async () => {
      if (!currentInterview.id) {
        navigate('/dashboard');
        return;
      }
      try {
        const stageRes = await api.get(`/interview/stage?interview_id=${currentInterview.id}`);
        if (stageRes.data.stage !== 'ai') {
          navigate('/dashboard');
          return;
        }
        await startCamera();
        setInitializing(false);
      } catch {
        navigate('/dashboard');
      }
    };

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setInputVal((prev) => `${prev} ${transcript}`.trim());
        setMessages((prev) => [...prev, { type: 'user', content: `[Voice] ${transcript}` }]);
      };
      recognition.onend = () => setRecording(false);
      recognitionRef.current = recognition;
    }

    init();
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current && recording) {
        recognitionRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!currentQuestion || questionsAnswered >= MAX_QUESTIONS) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          goToNextQuestion(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, questionsAnswered]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (error) {
      console.error('Unable to access webcam', error);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
      return;
    }
    setRecording(true);
    recognitionRef.current.start();
  };

  const startInterview = async () => {
    if (messages.length > 0) return;
    await fetchNextQuestion();
  };

  const speak = (text) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speakingRef.current = true;
    utterance.onend = () => {
      speakingRef.current = false;
    };
    window.speechSynthesis.speak(utterance);
  };

  const fetchNextQuestion = async () => {
    if (questionsAnswered >= MAX_QUESTIONS) return;
    setLoading(true);
    try {
      const res = await api.post(`/interview/question?interview_id=${currentInterview.id}`);
      const aiResponse = res.data.question || "Let's continue with the interview.";
      
      setCurrentQuestion(aiResponse);
      setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
      speak(aiResponse);
      setTimeLeft(60);
      setAwaitingNext(false);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { type: 'ai', content: "I'm having trouble connecting to the server. Please try again." }]);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const submitCurrentAnswer = async (autoSubmit = false) => {
    const userText = inputVal.trim();
    if (!autoSubmit && !userText) return;
    if (loading || questionsAnswered >= MAX_QUESTIONS || !currentQuestion) return;
    setInputVal('');
    setMessages(prev => [...prev, { type: 'user', content: userText || '[No answer submitted]' }]);
    setLoading(true);

    try {
      const evalRes = await api.post('/interview/answer', {
        interview_id: currentInterview.id,
        question: currentQuestion,
        answer: userText || ''
      });
      const evalData = evalRes.data || {};
      setMessages(prev => [
        ...prev,
        { type: 'ai', content: `Score: ${evalData.score ?? 0}/10. ${evalData.feedback || ''}` },
      ]);

      setQuestionsAnswered(prev => prev + 1);

      if (questionsAnswered + 1 >= MAX_QUESTIONS) {
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: "Thank you! That completes our AI interview section. Please proceed to see your feedback." 
        }]);
        localStorage.setItem(
          'current_interview',
          JSON.stringify({ ...currentInterview, stage: 'feedback' })
        );
        setLoading(false);
      } else {
        setAwaitingNext(true);
        setLoading(false);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { type: 'ai', content: "Failed to record answer. Try again." }]);
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    await submitCurrentAnswer(false);
  };

  const goToNextQuestion = async (autoSubmit = false) => {
    if (autoMoving || loading) return;
    setAutoMoving(true);
    try {
      if (!awaitingNext && questionsAnswered < MAX_QUESTIONS && currentQuestion) {
        await submitCurrentAnswer(autoSubmit);
      }
      if (questionsAnswered + 1 < MAX_QUESTIONS) {
        await fetchNextQuestion();
      }
    } finally {
      setAutoMoving(false);
    }
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto w-full p-4 md:p-8 h-[calc(100vh-80px)] bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-900 rounded-3xl border border-white/10">
      <div className="lg:col-span-2 w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-700" />
      </div>
      <div className="glass-panel rounded-2xl p-4 bg-dark-900/60 border border-white/10 shadow-[0_0_30px_rgba(56,189,248,0.12)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Camera className="w-4 h-4" /> Live Preview</h3>
          <button
            onClick={toggleVoiceInput}
            disabled={!voiceSupported}
            className="btn-secondary text-xs flex items-center gap-1"
          >
            <Mic className="w-4 h-4" /> {recording ? 'Stop Voice' : 'Record Voice'}
          </button>
        </div>
        <video ref={videoRef} autoPlay muted className="w-full h-[360px] object-cover rounded-xl bg-black/50" />
        <div className="mt-4">
          {!cameraOn && (
            <button onClick={startCamera} className="btn-primary w-full">
              Enable Webcam
            </button>
          )}
          {messages.length === 0 && (
            <button onClick={startInterview} className="btn-primary w-full mt-3">
              {initializing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Start Interview'}
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col">
      <div className="glass-panel p-4 rounded-t-2xl border-b border-white/5 flex justify-between items-center bg-dark-800/90 z-10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot className="text-neon-blue w-6 h-6" /> 
            AI Interviewer
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Question {Math.min(questionsAnswered + 1, MAX_QUESTIONS)} of {MAX_QUESTIONS}
          </p>
          <p className={`text-xs mt-1 ${timeLeft <= 10 ? 'text-red-400' : 'text-cyan-300'}`}>
            Time left: {timeLeft}s
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
        {awaitingNext && questionsAnswered < MAX_QUESTIONS && (
          <button onClick={() => goToNextQuestion(true)} className="btn-primary mb-3">
            Next Question
          </button>
        )}
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
    </div>
  );
};

export default AIInterview;
