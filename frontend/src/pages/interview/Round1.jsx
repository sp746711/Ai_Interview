import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Target,
} from 'lucide-react';

const AVATAR_EVENT_KEY = 'mockmind_avatar_event';

const Round1 = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // ============================================================
  // TASK 14 ONLY
  // Send an avatar situation without changing existing logic.
  // ============================================================

  const setAvatarEvent = (event) => {
    try {
      // Store event so it can be consumed when Dashboard returns.
      localStorage.setItem(
        AVATAR_EVENT_KEY,
        event
      );

      // TASK 14 ONLY:
      // Also send the event immediately in the same browser tab.
      window.dispatchEvent(
        new CustomEvent(
          'mockmind-avatar-event',
          {
            detail: event,
          }
        )
      );
    } catch (error) {
      console.error(
        'Avatar event error:',
        error
      );
    }
  };

  // ============================================================
  // EXISTING STAGE VALIDATION
  // ============================================================

  useEffect(() => {
    const validateStage = async () => {
      const currentInterview = JSON.parse(
        localStorage.getItem(
          'current_interview'
        ) || '{}'
      );

      if (!currentInterview?.id) {
        navigate('/dashboard');
        return;
      }

      try {
        const res = await api.get(
          `/interview/stage?interview_id=${currentInterview.id}`
        );

        if (res.data.stage !== 'round1') {
          navigate('/dashboard');
          return;
        }

        // ======================================================
        // TASK 14
        // Round 1 has actually started.
        // ======================================================

        setAvatarEvent(
          'round1_start'
        );
      } catch {
        navigate('/dashboard');
      }
    };

    validateStage();
  }, [navigate]);

  // ============================================================
  // FILE VALIDATION & SELECTION
  // ============================================================

  const validateAndSetFile = (selected) => {
    if (!selected) {
      return;
    }

    const isPdf =
      selected.type === 'application/pdf' ||
      selected.name?.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setError('Please upload a valid PDF file.');
      setFile(null);
      return;
    }

    // 5MB validation
    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      setFile(null);
      return;
    }

    setFile(selected);
    setError('');

    // ==========================================================
    // TASK 14
    // A valid resume has been selected.
    // ==========================================================

    setAvatarEvent(
      'round1_resume_required'
    );
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
  };

  // ============================================================
  // DRAG & DROP HANDLERS
  // ============================================================

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    validateAndSetFile(droppedFile);
  };

  // ============================================================
  // EXISTING UPLOAD
  // ============================================================

  const handleUpload = async () => {
    if (!file) {
      setError(
        'Please select a file to upload.'
      );
      return;
    }

    const currentInterview = JSON.parse(
      localStorage.getItem(
        'current_interview'
      )
    );

    if (
      !currentInterview ||
      !currentInterview.id ||
      currentInterview.stage !== 'round1'
    ) {
      setError(
        'Interview ID not found. Please start over.'
      );
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    setError('');

    // ==========================================================
    // TASK 14
    // Resume analysis starts.
    // ==========================================================

    setAvatarEvent(
      'round1_resume_analysis'
    );

    const formData = new FormData();

    formData.append(
      'file',
      file
    );

    formData.append(
      'interview_id',
      currentInterview.id
    );

    formData.append(
      'interview_type',
      currentInterview.interview_type ||
        'technical'
    );

    try {
      const res = await api.post(
        '/interview/round1',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

      setScoreData(res.data);

      // ========================================================
      // TASK 14
      // Resume was successfully received.
      // ========================================================

      setAvatarEvent(
        'round1_resume_uploaded'
      );

      localStorage.setItem(
        'current_interview',
        JSON.stringify({
          ...currentInterview,
          stage: 'test',
        })
      );
    } catch (err) {
      console.error(err);

      // ====================================================
      // TASK 10 ONLY
      // Existing backend validation handling.
      // ====================================================

      const backendMessage =
        err.response?.data?.detail ||
        err.response?.data?.message;

      setError(
        backendMessage ||
          'Please upload a valid resume/CV.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="w-full flex-1 flex flex-col justify-between py-4 relative text-[#F5F7FA]">

      {/* =====================================================
          MOCKMIND AI — CONSISTENT ATMOSPHERIC BACKGROUND SYSTEM
          Deep Black/Navy base (#05080D / #071019) + Soft Cyan/Blue Glow + Soft Orange Glow + Waves + Dots
      ====================================================== */}
      {/* Base dark canvas */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: 'radial-gradient(1300px 900px at 50% 30%, #071019 0%, #05080D 65%, #030508 100%)',
        }}
      />

      {/* LAYER 1: Soft Cyan / Blue Atmospheric Glow (Top-Left & Edge illumination) */}
      <div 
        className="fixed -top-[140px] -left-[120px] w-[1000px] h-[800px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 25% 22%, rgba(0, 191, 255, 0.14) 0%, rgba(8, 126, 164, 0.06) 45%, transparent 75%)',
          filter: 'blur(75px)',
        }}
      />

      {/* LAYER 2: Soft Warm Orange Atmospheric Glow (Upper-Right & subtle right-side illumination) */}
      <div 
        className="fixed -top-[130px] -right-[100px] w-[950px] h-[780px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(255, 138, 61, 0.13) 0%, rgba(244, 124, 53, 0.05) 45%, transparent 75%)',
          filter: 'blur(75px)',
        }}
      />

      {/* LAYER 3: Lower Ambient Anchors (Soft Cyan lower-center/left + Faint warm orange lower-right) */}
      <div 
        className="fixed -bottom-[120px] left-[15%] w-[800px] h-[500px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(0, 174, 239, 0.08) 0%, rgba(18, 59, 82, 0.03) 50%, transparent 75%)',
          filter: 'blur(70px)',
        }}
      />
      <div 
        className="fixed -bottom-[80px] -right-[60px] w-[650px] h-[450px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 80%, rgba(255, 155, 98, 0.08) 0%, rgba(198, 95, 42, 0.02) 45%, transparent 70%)',
          filter: 'blur(65px)',
        }}
      />

      {/* LAYER 4: Dark Vignette Mask (Preserves deep black/navy dominance 80-85%) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(1400px 950px at 50% 45%, transparent 45%, rgba(5, 8, 13, 0.72) 80%, #05080D 100%)',
        }}
      />

      {/* LAYER 5: Subtle Flowing Waves (Cyan & Orange) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20 select-none" aria-hidden="true">
        {/* Upper Cyan Flowing Wave */}
        <svg className="absolute w-[150%] h-[480px] top-[8%] -left-[15%]" viewBox="0 0 1440 450" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="r1CyanWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00BFFF" stopOpacity="0" />
              <stop offset="30%" stopColor="#00AEEF" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#087EA4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,220 C320,320 420,120 720,240 C1020,360 1120,160 1440,260" stroke="url(#r1CyanWave)" strokeWidth="1.8" />
        </svg>

        {/* Upper Orange Flowing Wave */}
        <svg className="absolute w-[150%] h-[460px] top-[16%] -right-[15%]" viewBox="0 0 1440 450" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="r1OrangeWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0" />
              <stop offset="35%" stopColor="#FF9B62" stopOpacity="0.45" />
              <stop offset="75%" stopColor="#F47C35" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF8A3D" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,280 C360,160 500,340 820,200 C1140,60 1260,300 1440,180" stroke="url(#r1OrangeWave)" strokeWidth="1.6" />
        </svg>

        {/* Lower Ambient Wave */}
        <svg className="absolute w-[150%] h-[320px] -bottom-[30px] -left-[10%]" viewBox="0 0 1440 320" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="r1LowerWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00AEEF" stopOpacity="0" />
              <stop offset="35%" stopColor="#087EA4" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#FF8A3D" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF9B62" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,160 C380,80 620,240 980,120 C1200,40 1340,180 1440,100" stroke="url(#r1LowerWave)" strokeWidth="1.5" />
        </svg>
      </div>

      {/* LAYER 6: Subtle Dot Matrix System */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.045] select-none" 
        style={{
          backgroundImage: 'radial-gradient(circle, #00BFFF 0.9px, transparent 0.9px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full flex-1 flex flex-col justify-between">

        <div className="w-full">

          {/* =====================================================
              ROUND 1 INTRO — CENTERED
          ====================================================== */}

          <div className="text-center max-w-3xl mx-auto mb-8">

            {/* EYEBROW BADGE */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[rgba(255,138,61,0.12)] border border-[rgba(255,138,61,0.35)] shadow-sm">
              <FileText className="w-4 h-4 text-[#FF8A3D]" />
              <span className="text-xs font-bold text-[#FF8A3D] tracking-widest uppercase">
                ROUND 1
              </span>
            </div>

            {/* MAIN HEADING */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight mt-4 text-[#F5F7FA]">
              Resume <span className="text-[#FF8A3D]">Screening</span>
            </h1>

            {/* SUPPORTING TEXT */}
            <p className="text-[#9AA6B2] text-base sm:text-lg mt-3.5 max-w-2xl mx-auto leading-relaxed font-normal">
              Upload your resume and let MockMind AI analyze your skills,
              experience, and technologies to help you prepare for the next stages.
            </p>

          </div>

          {/* =====================================================
              MAIN RESUME UPLOAD CARD
          ====================================================== */}

          <div className="max-w-3xl w-full mx-auto">

            {!scoreData ? (

              <div className="relative rounded-2xl border border-[#1E293B]/80 bg-[#0B0F14]/95 p-8 sm:p-9 shadow-[0_0_40px_rgba(0,191,255,0.06),0_20px_45px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-300">

                {/* Subtle ambient warm corner light */}
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#FF8A3D]/10 rounded-full blur-3xl pointer-events-none" />

              {/* DROP ZONE */}
              <div
                className={`border-2 border-dashed rounded-xl py-12 px-8 text-center transition-all duration-200 cursor-pointer group relative ${
                  isDragging
                    ? 'border-[#FF8A3D] bg-[#FF8A3D]/10 shadow-[0_0_24px_rgba(255,138,61,0.2)]'
                    : file
                    ? 'border-[rgba(255,138,61,0.65)] bg-[#070A0F]'
                    : 'border-[#1E293B] hover:border-[#FF8A3D]/60 bg-[#070A0F] hover:bg-[#0A0F16]'
                }`}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />

                {file ? (

                  <div className="flex flex-col items-center">

                    <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-[#f3a078] mb-4 stroke-[1.5]" />

                    <p className="font-bold text-[#f5f1ec] text-lg sm:text-xl truncate max-w-lg">
                      {file.name}
                    </p>

                    <p className="text-sm text-[#a09b96] mt-1.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                    </p>

                    <span className="mt-3 text-sm text-[#f3a078] hover:text-[#f29a72] font-semibold transition-colors">
                      Click or drop another file to replace
                    </span>

                  </div>

                ) : (

                  <div className="flex flex-col items-center">

                    <UploadCloud className="w-16 h-16 sm:w-20 sm:h-20 text-[#f3a078] mb-4 stroke-[1.5] group-hover:scale-105 transition-transform duration-200" />

                    <p className="text-lg sm:text-xl font-bold text-[#f5f1ec] mb-1.5 group-hover:text-white transition-colors">
                      Click to upload your resume
                    </p>

                    <p className="text-sm text-[#a09b96]">
                      PDF format only (Max 5MB)
                    </p>

                  </div>

                )}

              </div>

              {/* ERROR STATE */}
              {error && (

                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm flex items-center gap-2.5">

                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />

                  <span>{error}</span>

                </div>

              )}

              {/* ANALYZE RESUME BUTTON */}
              <div className="mt-6">

                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className={`w-full py-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                    !file || loading
                      ? 'bg-[#161718] border border-white/[0.08] text-[#555555] cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-[#f6ad82] to-[#f08d67] text-[#080909] shadow-[0_4px_28px_rgba(243,160,120,0.35)] hover:shadow-[0_6px_36px_rgba(243,160,120,0.5)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                  }`}
                >

                  {loading ? (

                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#080909]" />
                      <span className="text-[#080909]">Analyzing Resume...</span>
                    </>

                  ) : (

                    <>
                      <Sparkles className="w-5 h-5 text-[#080909]" />
                      <span className="text-[#080909]">Analyze Resume</span>
                      <ArrowRight className="w-5 h-5 text-[#080909]" />
                    </>

                  )}

                </button>

              </div>

            </div>

          ) : (

            /* ===================================================
               COMPLETED ANALYSIS VIEW
            ==================================================== */

            <div className="relative rounded-2xl border border-[#1E293B]/80 bg-[#0B0F14]/95 p-8 sm:p-10 shadow-[0_0_40px_rgba(255,138,61,0.08),0_20px_45px_rgba(0,0,0,0.7)] text-center animate-fade-in-up">

              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FF8A3D]/10 border-4 border-[#FF8A3D] shadow-[0_0_24px_rgba(255,138,61,0.25)] mb-5">

                <span className="text-3xl font-bold text-[#FF8A3D]">
                  {scoreData.resume_score}%
                </span>

              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mb-1.5">
                Resume Analyzed!
              </h3>

              <p className="text-[#9AA6B2] text-sm sm:text-base mb-6">
                Here's what our AI found in your resume.
              </p>

              <div className="bg-[#070A0F] rounded-xl p-5 border border-white/[0.06] text-left mb-6">

                <h4 className="font-semibold text-xs text-[#9AA6B2] uppercase tracking-wider mb-3">
                  Extracted Skills
                </h4>

                <div className="flex flex-wrap gap-2">

                  {scoreData.skills_extracted?.map(
                    (skill, index) => (

                      <span
                        key={index}
                        className="px-3 py-1 bg-[#FF8A3D]/10 border border-[#FF8A3D]/25 rounded-full text-xs font-medium text-[#F5F7FA]"
                      >
                        {skill}
                      </span>

                    )
                  )}

                  {(
                    !scoreData.skills_extracted ||
                    scoreData.skills_extracted.length === 0
                  ) && (

                    <span className="text-[#66727E] text-xs">
                      No skills found or failed to parse.
                    </span>

                  )}

                </div>

              </div>

              <button
                onClick={() => {

                  // ==============================================
                  // TASK 14
                  // Round 1 is complete.
                  // ==============================================

                  setAvatarEvent(
                    'round1_complete'
                  );

                  // ==============================================
                  // TASK 15
                  // DO NOT show Round 1 feedback here.
                  // Continue directly to Round 2.
                  // ==============================================

                  navigate('/test');

                }}
                className="w-full py-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 bg-gradient-to-r from-[#f6ad82] to-[#f08d67] text-[#080909] shadow-[0_4px_28px_rgba(243,160,120,0.35)] hover:shadow-[0_6px_36px_rgba(243,160,120,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
              >
                <span>Proceed to Next Round (Online Test)</span>
                <ArrowRight className="w-5 h-5 text-[#080909]" />
              </button>

            </div>

          )}

        </div>

        {/* =====================================================
            FOUR HORIZONTAL SUPPORTING FEATURE BLOCKS
        ====================================================== */}

        {!scoreData && (

          <div className="max-w-4xl w-full mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">

            {/* 1. Skills Detection */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[rgba(255,138,61,0.12)] border border-[rgba(255,138,61,0.22)] flex items-center justify-center text-[#FF8A3D] shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm sm:text-[15px] font-semibold text-[#F5F7FA]">
                  Skills Detection
                </h4>
                <p className="text-xs sm:text-[13px] text-[#9AA6B2] mt-1 leading-relaxed">
                  Identifies core technical & soft proficiencies
                </p>
              </div>
            </div>

            {/* 2. Experience Review */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[rgba(255,138,61,0.12)] border border-[rgba(255,138,61,0.22)] flex items-center justify-center text-[#FF8A3D] shrink-0 mt-0.5 shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm sm:text-[15px] font-semibold text-[#F5F7FA]">
                  Experience Review
                </h4>
                <p className="text-xs sm:text-[13px] text-[#9AA6B2] mt-1 leading-relaxed">
                  Evaluates career history & project impact
                </p>
              </div>
            </div>

            {/* 3. Education Analysis */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[rgba(255,138,61,0.12)] border border-[rgba(255,138,61,0.22)] flex items-center justify-center text-[#FF8A3D] shrink-0 mt-0.5 shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm sm:text-[15px] font-semibold text-[#F5F7FA]">
                  Education Analysis
                </h4>
                <p className="text-xs sm:text-[13px] text-[#9AA6B2] mt-1 leading-relaxed">
                  Validates degrees & relevant coursework
                </p>
              </div>
            </div>

            {/* 4. Role Fit Insights */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[rgba(255,138,61,0.12)] border border-[rgba(255,138,61,0.22)] flex items-center justify-center text-[#FF8A3D] shrink-0 mt-0.5 shadow-sm">
                <Target className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm sm:text-[15px] font-semibold text-[#F5F7FA]">
                  Role Fit Insights
                </h4>
                <p className="text-xs sm:text-[13px] text-[#9AA6B2] mt-1 leading-relaxed">
                  Matches qualifications with interview target
                </p>
              </div>
            </div>

          </div>

        )}

      </div>

      {/* =====================================================
          FOOTER / CLOSING LINE
      ====================================================== */}

      <div className="mt-14 mb-4 flex items-center justify-center gap-6 text-center max-w-lg mx-auto w-full px-4">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

        <p className="text-sm text-[#9AA6B2] font-medium tracking-wide whitespace-nowrap">
          A better you for a brighter tomorrow.
        </p>

        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />
      </div>

      </div>

    </div>
  );
};

export default Round1;