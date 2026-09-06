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
    <div className="w-full flex-1 flex flex-col justify-between py-4">

      <div className="w-full">

        {/* =====================================================
            ROUND 1 INTRO — CENTERED
        ====================================================== */}

        <div className="text-center max-w-3xl mx-auto mb-8">

          {/* EYEBROW BADGE */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[rgba(229,138,85,0.16)] border border-[rgba(243,160,120,0.45)]">
            <FileText className="w-4 h-4 text-[#f3a078]" />
            <span className="text-xs font-bold text-[#f3a078] tracking-widest uppercase">
              ROUND 1
            </span>
          </div>

          {/* MAIN HEADING */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight mt-4 text-[#f5f1ec]">
            Resume <span className="text-[#f3a078]">Screening</span>
          </h1>

          {/* SUPPORTING TEXT */}
          <p className="text-[#b0aaa5] text-base sm:text-lg mt-3.5 max-w-2xl mx-auto leading-relaxed font-normal">
            Upload your resume and let MockMind AI analyze your skills,
            experience, and technologies to help you prepare for the next stages.
          </p>

        </div>

        {/* =====================================================
            MAIN RESUME UPLOAD CARD
        ====================================================== */}

        <div className="max-w-3xl w-full mx-auto">

          {!scoreData ? (

            <div className="relative rounded-2xl border border-[rgba(243,160,120,0.50)] bg-[rgba(15,16,16,0.92)] p-8 sm:p-9 shadow-[0_0_40px_rgba(229,138,85,0.10),0_20px_45px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-300">

              {/* Subtle ambient warm corner light */}
              <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f3a078]/10 rounded-full blur-3xl pointer-events-none" />

              {/* DROP ZONE */}
              <div
                className={`border-2 border-dashed rounded-xl py-12 px-8 text-center transition-all duration-200 cursor-pointer group relative ${
                  isDragging
                    ? 'border-[#f3a078] bg-[#f3a078]/10 shadow-[0_0_24px_rgba(243,160,120,0.2)]'
                    : file
                    ? 'border-[rgba(243,160,120,0.75)] bg-[#090a0a]'
                    : 'border-[rgba(243,160,120,0.75)] hover:border-[#f3a078] bg-[#090a0a] hover:bg-[#0c0d0e]'
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

            <div className="relative rounded-2xl border border-[rgba(243,160,120,0.50)] bg-[rgba(15,16,16,0.92)] p-8 sm:p-10 shadow-[0_0_40px_rgba(229,138,85,0.10),0_20px_45px_rgba(0,0,0,0.65)] text-center animate-fade-in-up">

              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#f3a078]/10 border-4 border-[#f3a078] shadow-[0_0_24px_rgba(243,160,120,0.3)] mb-5">

                <span className="text-3xl font-bold text-[#f3a078]">
                  {scoreData.resume_score}%
                </span>

              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-[#f5f1ec] mb-1.5">
                Resume Analyzed!
              </h3>

              <p className="text-[#b0aaa5] text-sm sm:text-base mb-6">
                Here's what our AI found in your resume.
              </p>

              <div className="bg-[#090a0a] rounded-xl p-5 border border-white/[0.06] text-left mb-6">

                <h4 className="font-semibold text-xs text-[#9e9e9e] uppercase tracking-wider mb-3">
                  Extracted Skills
                </h4>

                <div className="flex flex-wrap gap-2">

                  {scoreData.skills_extracted?.map(
                    (skill, index) => (

                      <span
                        key={index}
                        className="px-3 py-1 bg-[#f3a078]/10 border border-[#f3a078]/25 rounded-full text-xs font-medium text-[#f5f1ec]"
                      >
                        {skill}
                      </span>

                    )
                  )}

                  {(
                    !scoreData.skills_extracted ||
                    scoreData.skills_extracted.length === 0
                  ) && (

                    <span className="text-[#777777] text-xs">
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
              <div className="w-11 h-11 rounded-xl bg-[rgba(229,138,85,0.15)] border border-[rgba(243,160,120,0.25)] flex items-center justify-center text-[#f3a078] shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm sm:text-[15px] font-semibold text-[#f5f1ec]">
                  Skills Detection
                </h4>
                <p className="text-xs sm:text-[13px] text-[#a09b96] mt-1 leading-relaxed">
                  Identifies core technical & soft proficiencies
                </p>
              </div>
            </div>

            {/* 2. Experience Review */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[rgba(229,138,85,0.15)] border border-[rgba(243,160,120,0.25)] flex items-center justify-center text-[#f3a078] shrink-0 mt-0.5 shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm sm:text-[15px] font-semibold text-[#f5f1ec]">
                  Experience Review
                </h4>
                <p className="text-xs sm:text-[13px] text-[#a09b96] mt-1 leading-relaxed">
                  Evaluates career history & project impact
                </p>
              </div>
            </div>

            {/* 3. Education Analysis */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[rgba(229,138,85,0.15)] border border-[rgba(243,160,120,0.25)] flex items-center justify-center text-[#f3a078] shrink-0 mt-0.5 shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm sm:text-[15px] font-semibold text-[#f5f1ec]">
                  Education Analysis
                </h4>
                <p className="text-xs sm:text-[13px] text-[#a09b96] mt-1 leading-relaxed">
                  Validates degrees & relevant coursework
                </p>
              </div>
            </div>

            {/* 4. Role Fit Insights */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[rgba(229,138,85,0.15)] border border-[rgba(243,160,120,0.25)] flex items-center justify-center text-[#f3a078] shrink-0 mt-0.5 shadow-sm">
                <Target className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm sm:text-[15px] font-semibold text-[#f5f1ec]">
                  Role Fit Insights
                </h4>
                <p className="text-xs sm:text-[13px] text-[#a09b96] mt-1 leading-relaxed">
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

        <p className="text-sm text-[#a09b96] font-medium tracking-wide whitespace-nowrap">
          A better you for a brighter tomorrow.
        </p>

        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />
      </div>

    </div>
  );
};

export default Round1;