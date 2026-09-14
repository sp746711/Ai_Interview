import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import getAvatarMessage from '../../components/ai/avatarLogic';
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  Expand,
  Globe2,
  Info,
  Lightbulb,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  Wifi,
  Camera,
  CheckCircle2,
  CircleHelp,
  Flag,
  AlertTriangle,
  RefreshCw,
  Loader2,
  LogOut,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  SkipForward,
  Square,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react';

/* =========================================================
   MOCKMIND AI - ROUND 3
   RESPONSIVE FULLSCREEN INTERVIEW ROOM

   GOALS:
   - Automatically fit PC / laptop viewport
   - Full AI robot always visible
   - Robot automatically scales with viewport height
   - Camera automatically scales with viewport
   - Left interview context stays visible on desktop
   - Right answer area scrolls internally only if necessary
   - Mobile/tablet use stacked responsive layout
   - Preserve camera / mic / TTS / voice / timer / controls
   ========================================================= */

const QUESTION_TIME = 60;

// Round 3 questions are owned by the backend QuestionBankService.
// Q1 is fixed by the backend; Q2-Q21 are randomly selected from the
// selected domain CSV and persisted on the interview document.
const DEFAULT_TOTAL_QUESTIONS = 21;

const normalizeQuestions = (value) => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray(value?.questions)
      ? value.questions
      : Array.isArray(value?.items)
        ? value.items
        : [];

  return source
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return String(item.question || item.text || item.prompt || '').trim();
      }
      return '';
    })
    .filter(Boolean);
};

/* =========================================================
   ANIMATED AI INTERVIEWER
   ========================================================= */

const AIInterviewerAvatar = ({ speaking = false }) => {
  return (
    /*
     * IMPORTANT:
     * This inner component keeps its natural dimensions.
     *
     * Responsive scaling is applied OUTSIDE this component.
     * That prevents our responsive transform from conflicting
     * with the robot's own head/body speaking animations.
     */
    <div className="relative flex h-[190px] w-[230px] items-center justify-center">
      {/* Background glow */}
      <div
        className={`absolute h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl transition-all duration-500 ${
          speaking
            ? 'scale-125 opacity-100'
            : 'scale-100 opacity-60'
        }`}
      />

      {/* AI VOICE WAVEFORM — restored without changing robot structure */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-1/2 z-0 flex h-16 -translate-y-1/2 items-center justify-center gap-1.5 opacity-80"
      >
        {[24, 38, 52, 68, 46, 74, 58, 36, 62, 44, 70, 50, 30].map((height, index) => (
          <span
            key={index}
            className={`mockmind-wave-bar w-1 rounded-full bg-gradient-to-t from-violet-500/30 via-cyan-400/80 to-cyan-200 ${speaking ? 'opacity-100' : 'opacity-50'}`}
            style={{
              height: `${height}%`,
              animationDelay: `${index * 0.06}s`,
              animationPlayState: speaking ? 'running' : 'paused',
            }}
          />
        ))}
      </div>

      {/* ROBOT */}
      <div
        className={`relative z-10 flex flex-col items-center ${
          speaking
            ? 'mockmind-robot-speaking'
            : 'mockmind-robot-idle'
        }`}
      >
        {/* Antenna */}
        <div className="flex flex-col items-center">
          <div
            className={`h-4 w-4 rounded-full border-2 border-cyan-100 bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.95)] ${
              speaking ? 'mockmind-antenna-speaking' : ''
            }`}
          />

          <div className="h-6 w-[3px] bg-gradient-to-b from-cyan-300 to-cyan-700" />
        </div>

        {/* Head */}
        <div
          className={`relative flex h-[112px] w-[150px] items-center justify-center rounded-[38px] border-[4px] bg-gradient-to-br from-slate-100 via-slate-300 to-slate-600 shadow-2xl transition-all duration-300 ${
            speaking
              ? 'border-cyan-200 shadow-[0_0_50px_rgba(34,211,238,0.4)]'
              : 'border-slate-300 shadow-[0_0_30px_rgba(34,211,238,0.15)]'
          }`}
        >
          {/* Left ear */}
          <div className="absolute -left-5 top-[30px] h-[52px] w-[22px] rounded-l-2xl border-2 border-cyan-300/60 bg-gradient-to-b from-slate-300 to-slate-600">
            <div className="absolute inset-y-2 right-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          </div>

          {/* Right ear */}
          <div className="absolute -right-5 top-[30px] h-[52px] w-[22px] rounded-r-2xl border-2 border-cyan-300/60 bg-gradient-to-b from-slate-300 to-slate-600">
            <div className="absolute inset-y-2 left-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          </div>

          {/* Face */}
          <div className="relative h-[82px] w-[120px] overflow-hidden rounded-[28px] border border-cyan-400/40 bg-gradient-to-b from-[#061827] to-[#020817] shadow-inner">
            {/* Face glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent" />

            {/* Eyes */}
            <div className="absolute left-0 right-0 top-[25px] flex justify-center gap-8">
              <div className="mockmind-robot-eye h-[15px] w-[15px] rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,1)]" />

              <div
                className="mockmind-robot-eye h-[15px] w-[15px] rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,1)]"
                style={{ animationDelay: '0.05s' }}
              />
            </div>

            {/* Mouth */}
            <div className="absolute bottom-[15px] left-1/2 -translate-x-1/2">
              {speaking ? (
                <div className="mockmind-robot-mouth h-[12px] w-[28px] rounded-full border-2 border-cyan-300 bg-cyan-400/10 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
              ) : (
                <div className="h-[9px] w-[28px] rounded-b-full border-b-[3px] border-cyan-300 shadow-[0_3px_8px_rgba(34,211,238,0.6)]" />
              )}
            </div>
          </div>
        </div>

        {/* Neck */}
        <div className="h-3 w-8 bg-gradient-to-b from-slate-300 to-slate-600" />

        {/* Body */}
        <div className="relative -mt-1 h-[46px] w-[105px] rounded-t-[38px] border-2 border-slate-300 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-600 shadow-xl">
          {/* Chest light */}
          <div
            className={`absolute left-1/2 top-3 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-cyan-100 bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.95)] ${
              speaking ? 'mockmind-chest-speaking' : ''
            }`}
          />
        </div>
      </div>

      {/* ROBOT ANIMATION CSS */}
      <style>{`
        .mockmind-robot-idle {
          animation: mockmindRobotIdle 4s ease-in-out infinite;
          transform-origin: center bottom;
        }

        @keyframes mockmindRobotIdle {
          0% {
            transform: translateY(0px) rotate(0deg);
          }

          25% {
            transform: translateY(-2px) rotate(-0.4deg);
          }

          50% {
            transform: translateY(-4px) rotate(0deg);
          }

          75% {
            transform: translateY(-2px) rotate(0.4deg);
          }

          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }

        .mockmind-robot-speaking {
          animation: mockmindRobotSpeaking 0.9s ease-in-out infinite;
          transform-origin: center bottom;
        }

        @keyframes mockmindRobotSpeaking {
          0% {
            transform: translateY(0px) rotate(0deg);
          }

          25% {
            transform: translateY(-3px) rotate(-0.8deg);
          }

          50% {
            transform: translateY(-5px) rotate(0deg);
          }

          75% {
            transform: translateY(-3px) rotate(0.8deg);
          }

          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }

        .mockmind-robot-eye {
          transform-origin: center;
          animation: mockmindRobotBlink 4.5s infinite;
        }

        @keyframes mockmindRobotBlink {
          0%,
          43%,
          48%,
          100% {
            transform: scaleY(1);
          }

          44%,
          47% {
            transform: scaleY(0.08);
          }
        }

        .mockmind-robot-mouth {
          animation: mockmindRobotTalk 0.22s ease-in-out infinite alternate;
          transform-origin: center;
        }

        @keyframes mockmindRobotTalk {
          0% {
            height: 4px;
            width: 25px;
            border-radius: 9999px;
          }

          35% {
            height: 8px;
            width: 21px;
          }

          70% {
            height: 15px;
            width: 25px;
          }

          100% {
            height: 9px;
            width: 29px;
          }
        }

        .mockmind-antenna-speaking {
          animation: mockmindAntennaPulse 0.6s ease-in-out infinite alternate;
        }

        @keyframes mockmindAntennaPulse {
          from {
            transform: scale(0.85);
            opacity: 0.65;
          }

          to {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .mockmind-chest-speaking {
          animation: mockmindChestPulse 0.65s ease-in-out infinite alternate;
        }

        @keyframes mockmindChestPulse {
          from {
            transform: translateX(-50%) scale(0.85);
            opacity: 0.6;
          }

          to {
            transform: translateX(-50%) scale(1.15);
            opacity: 1;
          }
        }

        .mockmind-preflight-wave-bar {
          animation: mockmindPreflightWave 1.15s ease-in-out infinite alternate;
          transform-origin: center;
          min-height: 5px;
        }

        @keyframes mockmindPreflightWave {
          0% {
            transform: scaleY(0.55);
            filter: brightness(0.85);
          }
          100% {
            transform: scaleY(1);
            filter: brightness(1.2);
          }
        }

        .mockmind-wave-bar {
          animation: mockmindWave 0.7s ease-in-out infinite alternate;
          transform-origin: center;
        }

        @keyframes mockmindWave {
          from {
            transform: scaleY(0.35);
            opacity: 0.35;
          }

          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        /*
         * =====================================================
         * RESPONSIVE INTERVIEW ROOM
         * =====================================================
         */

        .mockmind-robot-responsive {
          --robot-scale: clamp(0.66, calc(100dvh / 900), 1);
          transform: scale(var(--robot-scale));
          transform-origin: center center;
        }

        /*
         * Short laptop screens.
         * Keep the full robot but reduce it as one complete object.
         */
        @media (min-width: 1024px) and (max-height: 820px) {
          .mockmind-robot-responsive {
            --robot-scale: 0.82;
          }
        }

        @media (min-width: 1024px) and (max-height: 740px) {
          .mockmind-robot-responsive {
            --robot-scale: 0.72;
          }
        }

        @media (min-width: 1024px) and (max-height: 660px) {
          .mockmind-robot-responsive {
            --robot-scale: 0.64;
          }
        }

        /*
         * Mobile/tablet:
         * don't over-shrink the robot.
         */
        @media (max-width: 1023px) {
          .mockmind-robot-responsive {
            --robot-scale: 0.9;
          }
        }

        @media (max-width: 480px) {
          .mockmind-robot-responsive {
            --robot-scale: 0.76;
          }
        }

        /*
         * Scrollbar styling for right answer area.
         */
        .mockmind-answer-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
        }

        .mockmind-answer-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .mockmind-answer-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .mockmind-answer-scroll::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.45);
          border-radius: 9999px;
        }

        /*
         * Scrollbar styling for Round 3 Interview Progress questions list
         */
        .mockmind-progress-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(30, 174, 255, 0.4) transparent;
        }

        .mockmind-progress-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .mockmind-progress-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .mockmind-progress-scroll::-webkit-scrollbar-thumb {
          background: rgba(30, 174, 255, 0.35);
          border-radius: 9999px;
        }

        .mockmind-progress-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(30, 174, 255, 0.65);
        }

        .mockmind-orange-wave-bar {
          animation: mockmindOrangeWave 0.7s ease-in-out infinite alternate;
          transform-origin: center;
        }

        @keyframes mockmindOrangeWave {
          from {
            transform: scaleY(0.35);
            opacity: 0.4;
          }

          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        /*
         * Reduced motion accessibility.
         */
        @media (prefers-reduced-motion: reduce) {
          .mockmind-robot-idle,
          .mockmind-robot-speaking,
          .mockmind-robot-eye,
          .mockmind-robot-mouth,
          .mockmind-antenna-speaking,
          .mockmind-chest-speaking,
          .mockmind-wave-bar,
          .mockmind-preflight-wave-bar,
          .mockmind-orange-wave-bar {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

/* =========================================================
   MAIN AI INTERVIEW
   ========================================================= */

const AIInterview = () => {
  const navigate = useNavigate();

  const currentInterview = JSON.parse(
    localStorage.getItem('current_interview') || '{}'
  );

  const selectedRole =
    currentInterview?.role ||
    currentInterview?.domain ||
    (String(currentInterview?.interview_type || '').toLowerCase() === 'non-technical'
      ? 'Non-Technical Interview'
      : 'Technical Interview');

  /* =======================================================
     ROUND 3 QUESTION SOURCE — BACKEND
     -------------------------------------------------------
     The backend owns the complete 21-question sequence.
     The frontend only displays the current server question and
     uses the server-provided total question count.
     ======================================================= */
  const [totalQuestions, setTotalQuestions] = useState(DEFAULT_TOTAL_QUESTIONS);
  const totalInterviewTime = totalQuestions * QUESTION_TIME;

  /* =======================================================
     STATE
     ======================================================= */

  const [interviewStarted, setInterviewStarted] = useState(false);

  // Final Round state machine: Pre-Interview -> readiness -> active interview -> completed.
  const [round3State, setRound3State] = useState('waiting_for_ready');
  const [readinessListening, setReadinessListening] = useState(false);
  const [readinessTranscript, setReadinessTranscript] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [currentQuestion, setCurrentQuestion] = useState('');

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const [totalTimeLeft, setTotalTimeLeft] = useState(totalInterviewTime);

  const [voiceTranscript, setVoiceTranscript] = useState('');

  const [recording, setRecording] = useState(false);

  const [cameraOn, setCameraOn] = useState(false);

  const [micAvailable, setMicAvailable] = useState(false);

  const [voiceSupported, setVoiceSupported] = useState(false);

  const [aiSpeaking, setAiSpeaking] = useState(false);

  const [loading, setLoading] = useState(false);

  const [interviewComplete, setInterviewComplete] =
    useState(false);

  const [error, setError] = useState('');

  const [isFullscreen, setIsFullscreen] = useState(false);


  /* =======================================================
     PRE-INTERVIEW READINESS
     These checks are Round 3 only. They do not change Round 1/2.
     ======================================================= */
  const [aiVoiceReady, setAiVoiceReady] = useState(false);
  const [internetStatus, setInternetStatus] = useState('checking');
  const [backendLatency, setBackendLatency] = useState(null);
  const [faceStatus, setFaceStatus] = useState('checking');
  const [lightingStatus, setLightingStatus] = useState('checking');
  const [environmentStatus, setEnvironmentStatus] = useState('checking');
  const [preflightMessage, setPreflightMessage] = useState('');
  const [micTestStatus, setMicTestStatus] = useState('idle');
  const [micTestTranscript, setMicTestTranscript] = useState('');
  // Becomes true only after the post-microphone AI confirmation has finished.
  // This guarantees the final all-checks instruction plays afterward.
  const [micConfirmationDone, setMicConfirmationDone] = useState(false);
  const [aiGreetingText, setAiGreetingText] = useState('Welcome to your AI interview. Please complete the setup checks, then click Start Interview when you are ready. Good luck!');
  const [showEnvironmentDetails, setShowEnvironmentDetails] = useState(false);

  const faceLandmarkerRef = useRef(null);
  const faceDetectionTimestampRef = useRef(0);
  const faceCheckBusyRef = useRef(false);
  // Face detection runs in a Web Worker so MediaPipe never blocks the live
  // camera preview or the main React UI thread.
  const faceWorkerRef = useRef(null);
  const faceWorkerReadyRef = useRef(false);
  const faceWorkerBusyRef = useRef(false);
  const faceWorkerInitRef = useRef(null);
  const cameraFrameTimerRef = useRef(null);
  const preflightCanvasRef = useRef(null);
  const preflightAudioContextRef = useRef(null);
  const micTestRecognitionRef = useRef(null);
  const greetingSpokenRef = useRef(false);
  const micConfirmationSpokenRef = useRef(false);
  const micConfirmationInProgressRef = useRef(false);
  const setupCompletionSpokenRef = useRef(false);

  /* =======================================================
     REFS
     ======================================================= */

  const videoRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const recognitionRef = useRef(null);
  const readinessRecognitionRef = useRef(null);
  const readinessInProgressRef = useRef(false);

  const timerRef = useRef(null);

  // Camera initialization is shared between the automatic Round 3
  // pre-warm and the Start Interview button. This prevents duplicate
  // getUserMedia() calls and avoids making the Start button wait.
  const cameraInitPromiseRef = useRef(null);

  // Speech state is serialized so Chrome does not receive overlapping
  // cancel()/speak() calls that can produce broken or clipped audio.
  const speechSequenceRef = useRef(0);
  const speechVoicesRef = useRef([]);
  const speechVoiceRef = useRef(null);
  const speechReadyPromiseRef = useRef(null);
  const speechTimerRef = useRef(null);
  const speechHardTimeoutRef = useRef(null);
  const aiSpeakingRef = useRef(false);
  const questionTransitionRef = useRef(false);
  const finishInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  // Keep latest interview state available inside fullscreen event handlers.
  const interviewStartedRef = useRef(false);
  const intentionalFullscreenExitRef = useRef(false);
  const escExitProcessingRef = useRef(false);

  useEffect(() => {
    interviewStartedRef.current = interviewStarted;
  }, [interviewStarted]);

  // Keep active question in view in the Interview Progress list
  const activeQuestionRef = useRef(null);
  useEffect(() => {
    if (interviewStarted) {
      const scrollTimer = window.setTimeout(() => {
        if (activeQuestionRef.current) {
          try {
            activeQuestionRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          } catch {}
        }
      }, 50);
      return () => window.clearTimeout(scrollTimer);
    }
  }, [currentQuestionIndex, interviewStarted]);

  // Enter must never bypass the Final Round readiness conversation or
  // accidentally activate an interview control while the candidate is typing.
  useEffect(() => {
    const preventAccidentalEnter = (event) => {
      if (event.key !== 'Enter') return;
      const target = event.target;
      if (target instanceof HTMLButtonElement) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', preventAccidentalEnter, true);
    return () => window.removeEventListener('keydown', preventAccidentalEnter, true);
  }, []);

  useEffect(() => {
    aiSpeakingRef.current = aiSpeaking;
  }, [aiSpeaking]);

  useEffect(() => {
    // Keep the timer/question state aligned with the actual source.
    setTotalTimeLeft(totalInterviewTime);
    setTimeLeft(QUESTION_TIME);
  }, [totalInterviewTime]);

  /* =======================================================
     FULLSCREEN
     ======================================================= */

  const enterFullscreen = async () => {
    try {
      const element = document.documentElement;

      if (document.fullscreenElement) {
        return;
      }

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      }

      setIsFullscreen(true);
    } catch (err) {
      console.warn(
        'Fullscreen could not be enabled:',
        err
      );

      /*
       * Fullscreen failure should not stop the interview.
       */
      setIsFullscreen(false);
    }
  };

  const handleFullscreenButton = async () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      intentionalFullscreenExitRef.current = true;
      await exitFullscreen();
      return;
    }

    try {
      await enterFullscreen();
    } catch (err) {
      console.warn('Fullscreen button failed:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (
        document.fullscreenElement &&
        document.exitFullscreen
      ) {
        await document.exitFullscreen();
      } else if (
        document.webkitFullscreenElement &&
        document.webkitExitFullscreen
      ) {
        await document.webkitExitFullscreen();
      }
    } catch (err) {
      console.warn(
        'Unable to exit fullscreen:',
        err
      );
    } finally {
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = async () => {
      const fullscreenActive = Boolean(
        document.fullscreenElement ||
          document.webkitFullscreenElement
      );

      setIsFullscreen(fullscreenActive);

      if (fullscreenActive) return;

      // Normal application-controlled fullscreen exit.
      if (intentionalFullscreenExitRef.current) {
        intentionalFullscreenExitRef.current = false;
        return;
      }

      // If the interview is not active, leaving fullscreen needs no action.
      if (!interviewStartedRef.current) return;

      // Prevent duplicate fullscreenchange/webkitfullscreenchange processing.
      if (escExitProcessingRef.current) return;
      escExitProcessingRef.current = true;

      try {
        // ESC/browser fullscreen exit during an active interview = strict exit.
        finishInProgressRef.current = true;
        questionTransitionRef.current = false;

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // Recognition may already be stopped.
          }
        }

        speechSequenceRef.current += 1;
        if (speechTimerRef.current) {
          window.clearTimeout(speechTimerRef.current);
          speechTimerRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setAiSpeaking(false);
        setRecording(false);

        stopMediaStream();

        // Persist the interruption locally for the existing exit flow.
        const interruptedInterview = {
          interviewId:
            currentInterview?.id ||
            currentInterview?.interview_id ||
            null,
          role: selectedRole,
          status: 'interrupted',
          exitReason: 'fullscreen_exit',
          completedQuestions: currentQuestionIndex,
          currentQuestionNumber: currentQuestionIndex + 1,
          currentQuestion,
          currentAnswer:
            voiceTranscript.trim() ||
            '',
          timeRemaining: timeLeft,
          exitedAt: new Date().toISOString(),
        };

        localStorage.setItem(
          'interrupted_interview',
          JSON.stringify(interruptedInterview)
        );

        interviewStartedRef.current = false;
        setInterviewStarted(false);

        // ESC/fullscreen exit restores the normal navbar.
        setAIInterviewActive(false);

        navigate('/dashboard', {
          replace: true,
          state: {
            interviewInterrupted: true,
            reason: 'fullscreen_exit',
          },
        });
      } finally {
        escExitProcessingRef.current = false;
      }
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    document.addEventListener(
      'webkitfullscreenchange',
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );

      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      );
    };
  }, [
    navigate,
    currentInterview?.id,
    currentInterview?.interview_id,
    selectedRole,
    currentQuestionIndex,
    currentQuestion,
    voiceTranscript,
    timeLeft,
  ]);

  /* =======================================================
     CAMERA / MICROPHONE
     ======================================================= */

  /*
   * IMPORTANT PERFORMANCE FIX
   * --------------------------
   * Round 3 renders first, then camera/microphone initialization
   * starts asynchronously in the background. The Start Interview
   * button never waits for getUserMedia(). The same stream is reused
   * if initialization is already in progress or already completed.
   */

  /* -------------------------------------------------------
     CAMERA PREVIEW ATTACHMENT
     -------------------------------------------------------
     The MediaStream is attached only when the actual <video> element changes.
     Face detection, lighting and React state never replace srcObject while the
     same video element is already playing. This keeps the webcam preview live.
  ------------------------------------------------------- */
  const attachCameraStream = async (stream, targetVideo = null) => {
    const video = targetVideo || videoRef.current;
    if (!video || !stream) return false;

    try {
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');

      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }

      // Some Chromium builds do not start a newly-mounted srcObject video
      // until metadata is available. Listen once and explicitly play it.
      const playVideo = async () => {
        try {
          await video.play();
        } catch (playError) {
          // Autoplay should be allowed because the video is muted, but retry
          // on the next frame in case the element has just mounted.
          window.requestAnimationFrame(() => {
            video.play().catch(() => {});
          });
        }
      };

      if (video.readyState >= 2) {
        await playVideo();
      } else {
        video.onloadedmetadata = () => {
          void playVideo();
        };
        video.oncanplay = () => {
          void playVideo();
        };
      }

      return true;
    } catch (err) {
      console.warn('Camera preview attach failed:', err);
      return false;
    }
  };

  // IMPORTANT: React's normal useRef does not run an effect when the actual
  // <video> DOM node is replaced. Pre-Interview and Active Interview render
  // different video elements, so the MediaStream must be reattached at the
  // exact moment the new DOM node mounts.
  const handleVideoElementRef = useCallback((node) => {
    videoRef.current = node;

    if (!node) return;

    node.autoplay = true;
    node.playsInline = true;
    node.muted = true;

    const stream = mediaStreamRef.current;
    if (stream) {
      // Wait one frame so React has completed the DOM insertion/layout.
      window.requestAnimationFrame(() => {
        if (videoRef.current === node && mediaStreamRef.current === stream) {
          void attachCameraStream(stream, node);
        }
      });
    }
  }, []);

  const startCamera = (options = {}) => {
    const { force = false } = options;

    const existingStream = mediaStreamRef.current;

    if (!force && existingStream) {
      const videoTrack = existingStream.getVideoTracks()?.[0];
      if (videoTrack && videoTrack.readyState === 'live') {
        void attachCameraStream(existingStream);
        setCameraOn(videoTrack.enabled);
        return Promise.resolve(existingStream);
      }

      existingStream.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (cameraInitPromiseRef.current) {
      return cameraInitPromiseRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraOn(false);
      setError('Camera access is not available in this browser.');
      return Promise.resolve(null);
    }

    setError('');
    setFaceStatus('checking');
    setLightingStatus('checking');

    // IMPORTANT: camera startup requests VIDEO ONLY. Microphone permission is
    // tested separately by the real microphone verification flow. Combining
    // camera + microphone here can make getUserMedia wait on either device and
    // makes the whole Round 3 page feel frozen.
    const initPromise = (async () => {
      let stream = null;
      try {
        stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'user' },
              // Preview/readiness does not need HD. Lower startup constraints
              // make webcam negotiation much faster and reduce CPU usage.
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 30, min: 24, max: 30 },
            },
          }),
          new Promise((_, reject) =>
            window.setTimeout(
              () => reject(new Error('CAMERA_REQUEST_TIMEOUT')),
              10000
            )
          ),
        ]);

        mediaStreamRef.current = stream;

        const videoTrack = stream.getVideoTracks()?.[0];
        if (!videoTrack || videoTrack.readyState !== 'live') {
          throw new Error('CAMERA_TRACK_NOT_LIVE');
        }

        await attachCameraStream(stream);

        setCameraOn(videoTrack.enabled);
        setMicAvailable(false);
        return stream;
      } catch (err) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        mediaStreamRef.current = null;
        setCameraOn(false);
        setFaceStatus('checking');
        setLightingStatus('checking');

        const name = err?.name || '';
        let message = 'Camera could not be started. Please allow camera access and try again.';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          message = 'Camera permission is blocked. Allow camera access for localhost, then click Enable Camera again.';
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          message = 'No camera was found. Connect a camera and try again.';
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
          message = 'The camera is being used by another application or tab. Close it and try again.';
        } else if (err?.message === 'CAMERA_REQUEST_TIMEOUT') {
          message = 'Camera startup timed out. Close other camera-using tabs/apps, then click Enable Camera again.';
        }

        console.error('Round 3 camera startup failed:', err);
        setError(message);
        return null;
      }
    })();

    cameraInitPromiseRef.current = initPromise;
    initPromise.finally(() => {
      if (cameraInitPromiseRef.current === initPromise) {
        cameraInitPromiseRef.current = null;
      }
    });

    return initPromise;
  };

  /* =======================================================
     CAMERA PRE-WARM
     ======================================================= */

  useEffect(() => {
    // Let the first paint complete before asking for the camera. This keeps
    // the Round 3 page responsive while still starting the preview quickly.
    const timer = window.setTimeout(() => {
      // Give React one or two frames to paint the complete Round 3 shell
      // before touching camera hardware. This prevents the first screen from
      // feeling frozen when the domain-selection route changes.
      void startCamera();
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    /*
     * Keep a second safety net in addition to the callback ref. When the
     * interview state changes, React may replace the video DOM node. The
     * callback ref normally handles this immediately; this effect verifies
     * the final mounted node and starts playback again.
     */
    const stream = mediaStreamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;

    const timer = window.setTimeout(() => {
      if (videoRef.current === video && mediaStreamRef.current === stream) {
        void attachCameraStream(stream, video);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [interviewStarted, round3State, cameraOn]);

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      videoRef.current.oncanplay = null;
    }

    if (faceWorkerRef.current) {
      try { faceWorkerRef.current.terminate(); } catch {}
      faceWorkerRef.current = null;
      faceWorkerReadyRef.current = false;
      faceWorkerBusyRef.current = false;
      faceWorkerInitRef.current = null;
    }

    setCameraOn(false);
    setMicAvailable(false);
  };

  /* =======================================================
     CAMERA TOGGLE
     ======================================================= */

  const toggleCamera = async () => {
    const stream = mediaStreamRef.current;

    if (!stream) {
      await startCamera({ force: true });
      return;
    }

    const videoTrack = stream.getVideoTracks()?.[0];

    if (!videoTrack || videoTrack.readyState !== 'live') {
      await startCamera({ force: true });
      return;
    }

    if (!videoTrack.enabled) {
      videoTrack.enabled = true;
      setCameraOn(true);
      void attachCameraStream(stream);
      return;
    }

    videoTrack.enabled = false;
    setCameraOn(false);
  };

  /* =======================================================
     AI TEXT TO SPEECH
     ======================================================= */

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      speechVoicesRef.current = voices;

      speechVoiceRef.current =
        voices.find(
          (voice) =>
            voice.lang?.toLowerCase() === 'en-us' &&
            voice.localService
        ) ||
        voices.find(
          (voice) =>
            voice.lang?.toLowerCase().startsWith('en-us')
        ) ||
        voices.find(
          (voice) =>
            voice.lang?.toLowerCase().startsWith('en')
        ) ||
        null;
    };

    loadVoices();

    window.speechSynthesis.addEventListener(
      'voiceschanged',
      loadVoices
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        loadVoices
      );
    };
  }, []);

  const waitForSpeechVoice = () => {
    if (!('speechSynthesis' in window)) {
      return Promise.resolve(null);
    }

    const refreshVoices = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      speechVoicesRef.current = voices;

      const preferred =
        voices.find(
          (voice) =>
            voice.lang?.toLowerCase() === 'en-us' &&
            voice.localService
        ) ||
        voices.find(
          (voice) =>
            voice.lang?.toLowerCase().startsWith('en-us')
        ) ||
        voices.find(
          (voice) =>
            voice.lang?.toLowerCase().startsWith('en')
        ) ||
        null;

      speechVoiceRef.current = preferred;
      return preferred;
    };

    const immediateVoice = refreshVoices();

    if (immediateVoice || speechVoicesRef.current.length > 0) {
      return Promise.resolve(immediateVoice);
    }

    if (speechReadyPromiseRef.current) {
      return speechReadyPromiseRef.current;
    }

    speechReadyPromiseRef.current = new Promise((resolve) => {
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;

        window.speechSynthesis.removeEventListener(
          'voiceschanged',
          finish
        );

        resolve(refreshVoices());
      };

      window.speechSynthesis.addEventListener(
        'voiceschanged',
        finish
      );

      window.setTimeout(finish, 350);
    }).finally(() => {
      speechReadyPromiseRef.current = null;
    });

    return speechReadyPromiseRef.current;
  };

  // Speak text and resolve only after the browser has actually finished
  // the utterance. This is important for the microphone pre-check: the
  // SpeechRecognition listener must NEVER start while the AI is speaking.
  const speakQuestion = async (question) => {
    if (!question || !('speechSynthesis' in window)) return false;

    const sequence = ++speechSequenceRef.current;

    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }

    setAiSpeaking(false);
    window.speechSynthesis.cancel();

    const voice = await waitForSpeechVoice();

    if (sequence !== speechSequenceRef.current) return false;

    // Keep the pause extremely short so the AI starts speaking
    // immediately after the browser voice is available.
    await new Promise((resolve) => {
      speechTimerRef.current = window.setTimeout(() => {
        speechTimerRef.current = null;
        resolve();
      }, 0);
    });

    if (sequence !== speechSequenceRef.current) return false;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.lang = voice?.lang || 'en-US';
      if (voice) utterance.voice = voice;
      // Slightly faster, natural interview pace.
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.volume = 1;

      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        if (speechHardTimeoutRef.current) {
          window.clearTimeout(speechHardTimeoutRef.current);
          speechHardTimeoutRef.current = null;
        }
        if (sequence === speechSequenceRef.current) {
          aiSpeakingRef.current = false;
          setAiSpeaking(false);
        }
        resolve(ok);
      };

      utterance.onstart = () => {
        if (sequence !== speechSequenceRef.current) {
          finish(false);
          return;
        }
        aiSpeakingRef.current = true;
        setAiSpeaking(true);
      };

      utterance.onend = () => finish(true);

      utterance.onerror = (event) => {
        console.warn('AI speech synthesis error:', event?.error || 'unknown');
        finish(false);
      };

      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Unable to start AI speech:', err);
        finish(false);
      }

      // Strong safety timeout: Chromium can occasionally miss onend or leave
      // speechSynthesis in a stuck state. Never let one TTS call freeze the
      // microphone test, question flow, or readiness screen indefinitely.
      const estimatedDuration = Math.max(4500, question.length * 115);
      speechHardTimeoutRef.current = window.setTimeout(() => {
        if (settled || sequence !== speechSequenceRef.current) return;
        console.warn('AI speech timeout; releasing the interview flow.');
        try {
          window.speechSynthesis.cancel();
        } catch {}
        finish(false);
      }, Math.min(20000, estimatedDuration));
    });
  };

  /* =======================================================
     FAST ROUND 3 AI GREETING
     -------------------------------------------------------
     The first greeting must not wait for camera, MediaPipe,
     face detection, lighting, internet checks, or microphone
     verification. The UI gets a chance to paint first, then
     speech starts immediately.

     Chrome can block autoplay speech. If that happens, the
     first user interaction retries the greeting.
     ======================================================= */
  useEffect(() => {
    const greeting =
      'Welcome to your AI interview. I am ready to conduct your interview. Please complete your camera, microphone, and environment checks, then click Start Interview when you are ready. Good luck!';

    let disposed = false;

    const speakGreetingImmediately = async () => {
      if (
        disposed ||
        greetingSpokenRef.current ||
        interviewStartedRef.current
      ) {
        return;
      }

      setAiGreetingText(
        'Welcome to your AI interview. I am ready to conduct your interview. Please complete the setup checks, then click Start Interview when you are ready. Good luck!'
      );

      // Do not wait for any preflight check here.
      const spoken = await speakQuestion(greeting);

      if (!disposed && spoken) {
        greetingSpokenRef.current = true;
      }
    };

    // Give React a tiny amount of time to paint the Round 3 UI.
    const timer = window.setTimeout(() => {
      void speakGreetingImmediately();
    }, 250);

    // Browser autoplay fallback.
    const fallback = () => {
      if (
        !greetingSpokenRef.current &&
        !interviewStartedRef.current
      ) {
        void speakGreetingImmediately();
      }
    };

    window.addEventListener('pointerdown', fallback);
    window.addEventListener('keydown', fallback);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', fallback);
      window.removeEventListener('keydown', fallback);
    };
  }, []);

  /* =======================================================
     REPLAY QUESTION
     ======================================================= */

  const replayQuestion = () => {
    if (!currentQuestion) return;

    speakQuestion(currentQuestion);
  };

  /* =======================================================
     SPEECH RECOGNITION
     ======================================================= */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);

    const recognition =
      new SpeechRecognition();

    recognition.lang = 'en-US';

    recognition.continuous = true;

    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onstart = () => {
      setRecording(true);

      finalTranscript = '';
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += transcript;
        }
      }

      const combined =
        `${finalTranscript}${interimTranscript}`.trim();

      setVoiceTranscript(combined);
    };

    recognition.onerror = (event) => {
      console.error(
        'Speech recognition error:',
        event.error
      );

      setRecording(false);

      if (event.error !== 'no-speech') {
        setError(
          'Voice recognition stopped. Please try speaking again.'
        );
      }
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
    };
  }, []);

  /* =======================================================
     START / STOP VOICE ANSWER
     ======================================================= */

  const toggleVoiceRecording = () => {
    if (!voiceSupported) {
      setError(
        'Speech recognition is not supported in this browser. Please use Chrome or Edge with microphone access.'
      );

      return;
    }

    if (!recognitionRef.current) {
      return;
    }

    try {
      if (recording) {
        recognitionRef.current.stop();

        setRecording(false);
      } else {
        setError('');

        setVoiceTranscript('');

        recognitionRef.current.start();
      }
    } catch (err) {
      console.error(
        'Voice recognition error:',
        err
      );
    }
  };

  /* =======================================================
     MAIN NAVBAR / INTERVIEW MODE
     ======================================================= */

  const setAIInterviewActive = (active) => {
    if (active) {
      sessionStorage.setItem('ai_interview_active', 'true');
    } else {
      sessionStorage.removeItem('ai_interview_active');
    }

    window.dispatchEvent(
      new Event('ai-interview-state-change')
    );
  };

  /* Round 3 owns the full page from entry, so the global MainLayout
     navbar is hidden while this page is mounted. Round 1/2 are untouched. */
  useEffect(() => {
    setAIInterviewActive(true);
    return () => setAIInterviewActive(false);
  }, []);

  /* =======================================================
     ROUND 3 PRE-INTERVIEW CHECKS
     ======================================================= */

  const API_BASE_URL = (
    import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8001'
  ).replace(/\/$/, '');

  const interviewId = currentInterview?.id || currentInterview?._id || currentInterview?.interview_id || currentInterview?.interviewId || null;
  const getAuthToken = () => localStorage.getItem('access_token') || localStorage.getItem('token') || '';
  const apiRequest = async (path, options = {}) => {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof data === 'object' ? data?.detail || data?.message || data?.error : data;
      throw new Error(message || `Request failed with status ${response.status}`);
    }
    return data;
  };
  const getRound3Answers = () => {
    try { const data = JSON.parse(sessionStorage.getItem('round3_answers') || '[]'); return Array.isArray(data) ? data : []; }
    catch { return []; }
  };
  const persistRound3Answer = async (payload) => {
    const answers = getRound3Answers();
    answers[payload.questionNumber - 1] = payload;
    sessionStorage.setItem('round3_answers', JSON.stringify(answers));

    // Phase 1 uses the audited FastAPI Round 3 endpoint:
    // POST /api/interview/answer with { interview_id, question, answer }.
    if (!interviewId) return { localOnly: true };

    const body = {
      interview_id: interviewId,
      question: payload.question,
      answer: payload.answer,
    };

    return apiRequest('/api/interview/answer', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  const fetchRound3Question = async () => {
    if (!interviewId) {
      throw new Error('Interview ID is missing. Please restart the interview.');
    }

    return apiRequest(
      `/api/interview/question?interview_id=${encodeURIComponent(interviewId)}`,
      { method: 'POST' }
    );
  };

  const persistRound3Completion = async (backendResponse = null) => {
    const payload = {
      interview_id: interviewId,
      round: 3,
      total_questions: totalQuestions,
      answers: getRound3Answers(),
      completed_at: new Date().toISOString(),
      backend_response: backendResponse,
    };
    sessionStorage.setItem('round3_result', JSON.stringify(payload));
    return payload;
  };

  const checkAIVoice = () => {
    if (!('speechSynthesis' in window)) {
      setAiVoiceReady(false);
      return;
    }

    const voices = window.speechSynthesis.getVoices() || [];
    setAiVoiceReady(voices.length > 0);
  };

  const checkInternet = async () => {
    if (!navigator.onLine) {
      setInternetStatus('offline');
      setBackendLatency(null);
      return;
    }

    const startedAt = performance.now();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      const latency = Math.round(performance.now() - startedAt);
      setBackendLatency(latency);

      if (!response.ok) {
        setInternetStatus('slow');
        return;
      }

      setInternetStatus(latency <= 900 ? 'stable' : 'slow');
    } catch (err) {
      console.warn('Round 3 connection check failed:', err);
      setBackendLatency(null);
      setInternetStatus(navigator.onLine ? 'offline' : 'offline');
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const checkLighting = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      setLightingStatus('checking');
      return;
    }

    if (!preflightCanvasRef.current) {
      preflightCanvasRef.current = document.createElement('canvas');
    }

    const canvas = preflightCanvasRef.current;
    const sampleWidth = 160;
    const sampleHeight = Math.max(
      90,
      Math.round((sampleWidth * video.videoHeight) / video.videoWidth)
    );

    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      setLightingStatus('unknown');
      return;
    }

    context.drawImage(video, 0, 0, sampleWidth, sampleHeight);

    const { data } = context.getImageData(
      0,
      0,
      sampleWidth,
      sampleHeight
    );

    let brightness = 0;
    let samples = 0;

    // Sample every 8th pixel to keep this lightweight.
    for (let i = 0; i < data.length; i += 32) {
      brightness +=
        0.2126 * data[i] +
        0.7152 * data[i + 1] +
        0.0722 * data[i + 2];
      samples += 1;
    }

    const averageBrightness = samples ? brightness / samples : 0;

    if (averageBrightness < 45) {
      setLightingStatus('poor');
    } else if (averageBrightness > 220) {
      setLightingStatus('bright');
    } else {
      setLightingStatus('good');
    }
  };

  /* =======================================================
     FACE DETECTION ONLY
     -------------------------------------------------------
     IMPORTANT:
     - This is the ONLY functional block changed.
     - Camera start/stop/toggle code is untouched.
     - The live <video> stream is never replaced or restarted here.
     - No eye-landmark/face-size validation is used because those checks
       were causing a clearly visible face to remain "Auto check unavailable".
     - MediaPipe FaceDetector only answers the required question:
       Is there one face visible in the current camera frame?
     ======================================================= */
  const createFaceWorker = () => {
    // Keep the existing function name so the rest of the pre-flight flow
    // remains completely unchanged.
    if (faceLandmarkerRef.current) {
      return Promise.resolve(faceLandmarkerRef.current);
    }

    if (faceWorkerInitRef.current) {
      return faceWorkerInitRef.current;
    }

    faceWorkerInitRef.current = (async () => {
      try {
        // FaceDetector is intentionally used instead of FaceLandmarker.
        // We only need reliable face presence; landmarks/eye checks are not
        // required for the Round 3 environment check.
        const { FaceDetector, FilesetResolver } = await import(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm'
        );

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
        );

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.25,
        });

        faceLandmarkerRef.current = detector;
        faceWorkerReadyRef.current = true;

        return detector;
      } catch (error) {
        faceWorkerReadyRef.current = false;
        faceLandmarkerRef.current = null;
        console.error('Face detector initialization failed:', error);
        setFaceStatus('unsupported');
        return null;
      } finally {
        faceWorkerInitRef.current = null;
      }
    })();

    return faceWorkerInitRef.current;
  };

  const checkFace = async () => {
    const video = videoRef.current;

    // Do not touch the camera stream here. This function only reads the
    // already-running video element.
    if (!video || !cameraOn || video.readyState < 2 || video.videoWidth < 2) {
      setFaceStatus('checking');
      return;
    }

    if (faceCheckBusyRef.current) return;

    // Do not let an AI speech event interrupt an already-running detection.
    if (aiSpeakingRef.current) return;

    try {
      faceCheckBusyRef.current = true;

      const detector = await createFaceWorker();

      if (!detector) {
        faceCheckBusyRef.current = false;
        return;
      }

      // Take a lightweight snapshot of the EXISTING video frame.
      // No srcObject, MediaStreamTrack, cameraOn state, or camera function
      // is changed here.
      const canvas = preflightCanvasRef.current || document.createElement('canvas');
      preflightCanvasRef.current = canvas;

      const sampleWidth = 480;
      const aspect =
        video.videoWidth > 0 && video.videoHeight > 0
          ? video.videoHeight / video.videoWidth
          : 3 / 4;

      const sampleHeight = Math.max(270, Math.round(sampleWidth * aspect));

      canvas.width = sampleWidth;
      canvas.height = sampleHeight;

      const context = canvas.getContext('2d', {
        alpha: false,
        willReadFrequently: false,
      });

      if (!context) {
        setFaceStatus('unsupported');
        faceCheckBusyRef.current = false;
        return;
      }

      context.drawImage(video, 0, 0, sampleWidth, sampleHeight);

      const result = detector.detect(canvas);
      const detections = result?.detections || [];

      if (detections.length === 0) {
        setFaceStatus('none');
      } else if (detections.length > 1) {
        setFaceStatus('multiple');
      } else {
        // A valid MediaPipe face detection is enough. Do not require
        // 400+ landmarks, eye ratios, face-size thresholds, or other
        // secondary checks that can reject a clearly visible candidate.
        setFaceStatus('detected');
      }
    } catch (error) {
      console.error('Face detection check failed:', error);
      setFaceStatus('unsupported');
    } finally {
      faceCheckBusyRef.current = false;
    }
  };

  const updateEnvironmentStatus = () => {
    const lightingReady = lightingStatus === 'good';
    const faceReady = faceStatus === 'detected';

    if (lightingStatus === 'checking' || faceStatus === 'checking') {
      setEnvironmentStatus('checking');
      return;
    }

    if (faceStatus === 'multiple') {
      setEnvironmentStatus('multiple');
      return;
    }

    if (faceStatus === 'none') {
      setEnvironmentStatus('no-face');
      return;
    }

    if (faceStatus === 'far' || faceStatus === 'eyes') {
      setEnvironmentStatus('attention');
      return;
    }

    if (!lightingReady) {
      setEnvironmentStatus('lighting');
      return;
    }

    setEnvironmentStatus(faceReady ? 'good' : 'attention');
  };

  useEffect(() => {
    checkAIVoice();

    if (!('speechSynthesis' in window)) return undefined;

    const handleVoicesChanged = () => checkAIVoice();
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      handleVoicesChanged
    );

    const timer = window.setTimeout(checkAIVoice, 1000);

    return () => {
      window.clearTimeout(timer);
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        handleVoicesChanged
      );
    };
  }, []);

  /* =======================================================
     NON-BLOCKING PRE-FLIGHT LOOP
     -------------------------------------------------------
     Camera rendering is completely independent from face detection. The
     detector is loaded in a worker after the page/camera are ready and only
     receives occasional image snapshots.
     ======================================================= */
  useEffect(() => {
    if (!cameraOn) return undefined;

    let disposed = false;
    let faceTimer = null;
    let lightTimer = null;

    const runLighting = () => {
      if (!disposed) checkLighting();
    };

    const lightingDelay = window.setTimeout(runLighting, 1000);
    lightTimer = window.setInterval(runLighting, 5000);

    // Start the worker only after the microphone test is complete. Loading and
    // running MediaPipe is then fully off the main thread.
    if (micAvailable) {
      const startWorker = () => {
        if (disposed) return;
        void createFaceWorker().then(() => {
          if (disposed) return;
          void checkFace();
          faceTimer = window.setInterval(() => {
            if (!disposed && document.visibilityState === 'visible') {
              void checkFace();
            }
          }, 1800);
        });
      };

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(startWorker, { timeout: 2500 });
      } else {
        window.setTimeout(startWorker, 900);
      }
    }

    return () => {
      disposed = true;
      window.clearTimeout(lightingDelay);
      if (lightTimer) window.clearInterval(lightTimer);
      if (faceTimer) window.clearInterval(faceTimer);
    };
  }, [cameraOn, micAvailable]);

  useEffect(() => {
    updateEnvironmentStatus();
  }, [faceStatus, lightingStatus]);

  useEffect(() => {
    // Connection status is informative; it must never compete with the first
    // render/camera startup. Run it after the page has settled.
    const initialCheck = window.setTimeout(checkInternet, 900);

    const handleOnline = () => checkInternet();
    const handleOffline = () => {
      setInternetStatus('offline');
      setBackendLatency(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = window.setInterval(checkInternet, 15000);

    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const faceReady = faceStatus === 'detected';
  const environmentReady = environmentStatus === 'good';
  const coreChecksReady =
    cameraOn &&
    micAvailable &&
    micTestStatus === 'ready' &&
    aiVoiceReady &&
    internetStatus === 'stable';

  const canStartInterview = coreChecksReady && environmentReady;

  /* =======================================================
     ALL SETUP CHECKS COMPLETE — AI FINAL INSTRUCTION
     Runs only when every Round 3 pre-interview requirement is ready.
     It waits until any current AI speech has finished so messages never
     overlap, then tells the candidate exactly what to do next.
     ======================================================= */
  useEffect(() => {
    if (!canStartInterview || interviewStarted || setupCompletionSpokenRef.current) {
      return undefined;
    }

    // The final AI announcement MUST come after the microphone-success
    // announcement. Do not let the two TTS messages overlap.
    if (!micConfirmationDone) return undefined;
    if (aiSpeaking || micConfirmationInProgressRef.current) return undefined;

    let disposed = false;

    const speakFinalSetupMessage = async () => {
      const completionMessage =
        'Perfect. All your setup checks are complete. Your camera, microphone, AI voice, internet connection, and interview environment are ready. Click Start Interview to begin. Good luck!';

      setAiGreetingText(
        'Perfect. All your setup checks are complete. Your camera, microphone, AI voice, internet connection, and interview environment are ready. Click Start Interview to begin. Good luck!'
      );

      // At this point the candidate has already interacted with the microphone
      // test, so browser speech autoplay is normally permitted. Only mark the
      // announcement as spoken after speechSynthesis actually accepts it.
      const spoken = await speakQuestion(completionMessage);

      if (!disposed && spoken) {
        setupCompletionSpokenRef.current = true;
      }
    };

    void speakFinalSetupMessage();

    return () => {
      disposed = true;
    };
  }, [canStartInterview, aiSpeaking, interviewStarted, micConfirmationDone]);

  const getPreflightStatus = (status) => {
    const map = {
      ready: { label: 'Ready', className: 'text-emerald-400' },
      waiting: { label: 'Waiting', className: 'text-amber-400' },
      test: { label: 'Click to test', className: 'text-amber-300' },
      listening: { label: 'Listening…', className: 'text-cyan-300' },
      prompting: { label: 'AI prompt…', className: 'text-violet-300' },
      failed: { label: 'Voice Not Detected', className: 'text-red-400' },
      checking: { label: 'Checking…', className: 'text-amber-300' },
      none: { label: 'No face detected', className: 'text-amber-300' },
      detected: { label: 'Face detected', className: 'text-emerald-400' },
      far: { label: 'Move closer', className: 'text-amber-300' },
      eyes: { label: 'Make your eyes visible', className: 'text-amber-300' },
      multiple: { label: 'Multiple faces', className: 'text-red-400' },
      unsupported: { label: 'Auto check unavailable', className: 'text-red-400' },
      good: { label: 'Good', className: 'text-emerald-400' },
      poor: { label: 'Too dark', className: 'text-red-400' },
      bright: { label: 'Too bright', className: 'text-amber-300' },
      unknown: { label: 'Unavailable', className: 'text-amber-300' },
      stable: { label: 'Stable', className: 'text-emerald-400' },
      slow: { label: 'Slow', className: 'text-amber-300' },
      offline: { label: 'Offline', className: 'text-red-400' },
      'no-face': { label: 'No face', className: 'text-amber-300' },
      lighting: { label: 'Improve lighting', className: 'text-amber-300' },
      attention: { label: 'Needs attention', className: 'text-amber-300' },
    };

    return map[status] || map.checking;
  };

  const checklistItems = [
    {
      Icon: Video,
      label: 'Camera',
      status: cameraOn ? 'ready' : 'waiting',
      ready: cameraOn,
    },
    {
      Icon: Mic,
      label: 'Microphone',
      status:
        micTestStatus === 'ready'
          ? 'ready'
          : micTestStatus === 'listening'
            ? 'listening'
            : micTestStatus === 'failed'
              ? 'failed'
              : 'test',
      ready: micTestStatus === 'ready',
    },
    {
      Icon: Volume2,
      label: 'AI Voice',
      status: aiVoiceReady ? 'ready' : 'waiting',
      ready: aiVoiceReady,
    },
    {
      Icon: Wifi,
      label: 'Internet Connection',
      status: internetStatus,
      ready: internetStatus === 'stable',
    },
    {
      Icon: UserRound,
      label: 'Environment',
      status: environmentStatus,
      ready: environmentReady,
    },
  ];

  /* =======================================================
     REAL MICROPHONE TEST
     User clicks the microphone card -> AI asks for the phrase ->
     browser speech recognition verifies the spoken phrase.
     ======================================================= */
  const startMicrophoneTest = async () => {
    // Camera is intentionally opened separately for performance. The first
    // microphone click acquires audio permission and attaches the live audio
    // track to the existing camera stream.
    if (!micAvailable) {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('MIC_API_UNAVAILABLE');
        }

        setMicTestStatus('prompting');
        setPreflightMessage('Requesting microphone access…');

        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });

        const audioTrack = audioStream.getAudioTracks()?.[0];
        if (!audioTrack || audioTrack.readyState !== 'live') {
          audioStream.getTracks().forEach((track) => track.stop());
          throw new Error('MIC_TRACK_NOT_LIVE');
        }

        if (mediaStreamRef.current) {
          // Avoid duplicate audio tracks when the user retries.
          mediaStreamRef.current.getAudioTracks().forEach((track) => track.stop());
          mediaStreamRef.current.addTrack(audioTrack);
        } else {
          mediaStreamRef.current = audioStream;
        }

        setMicAvailable(true);
      } catch (err) {
        console.error('Round 3 microphone permission failed:', err);
        setMicTestStatus('failed');
        setPreflightMessage(
          err?.name === 'NotAllowedError'
            ? 'Microphone permission is blocked. Allow microphone access for localhost, then try again.'
            : 'Microphone could not be accessed. Check your microphone and try again.'
        );
        return;
      }
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicTestStatus('failed');
      setPreflightMessage('This browser does not support microphone speech recognition. Please use current Chrome or Edge.');
      return;
    }

    if (micTestRecognitionRef.current) {
      try { micTestRecognitionRef.current.stop(); } catch {}
      micTestRecognitionRef.current = null;
    }

    setMicTestStatus('prompting');
    setMicTestTranscript('');
    setPreflightMessage('');
    micConfirmationSpokenRef.current = false;
    micConfirmationInProgressRef.current = false;
    setMicConfirmationDone(false);

    // IMPORTANT: AI finishes speaking first. Only then do we start
    // SpeechRecognition, so the browser cannot mistake the AI voice for
    // the candidate's microphone response.
    const spoken = await speakQuestion('Please say: Ready for the interview.');

    const recognition = new SpeechRecognition();
    micTestRecognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    setMicTestStatus('listening');
    setPreflightMessage('Listening… Please say: “Ready for the interview.”');

    const expected = [
      'ready for the interview',
      'ready for interview',
      'ready to interview',
    ];

    let timeoutId = null;
    let matched = false;

    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (micTestRecognitionRef.current === recognition) {
        micTestRecognitionRef.current = null;
      }
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += ` ${event.results[i][0].transcript}`;
      }

      const clean = transcript
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      setMicTestTranscript(transcript.trim());

      if (expected.some((phrase) => clean.includes(phrase))) {
        matched = true;
        cleanup();
        setMicTestStatus('ready');
        setPreflightMessage('Microphone verified successfully.');
        try { recognition.stop(); } catch {}

        // IMPORTANT: the AI robot MUST speak immediately after the candidate
        // successfully completes the microphone test. Do this only after the
        // recognition result has matched and the recognition session is stopped.
        // A tiny next-task delay lets Chrome finish releasing SpeechRecognition
        // before SpeechSynthesis starts, which prevents the confirmation from
        // being swallowed/interrupted on some browsers.
        if (!micConfirmationSpokenRef.current) {
          micConfirmationSpokenRef.current = true;
          micConfirmationInProgressRef.current = true;

          const microphoneSuccessMessage =
            'Perfect. Your microphone is working correctly. Your voice has been detected successfully.';

          setAiGreetingText(microphoneSuccessMessage);

          window.setTimeout(() => {
            if (interviewStartedRef.current) {
              micConfirmationInProgressRef.current = false;
              setMicConfirmationDone(true);
              return;
            }

            void speakQuestion(microphoneSuccessMessage).finally(() => {
              micConfirmationInProgressRef.current = false;
              setMicConfirmationDone(true);
            });
          }, 120);
        }

        // The final all-checks confirmation is handled centrally below.
        // It waits until this confirmation has finished before speaking.
      }
    };

    recognition.onerror = (event) => {
      if (matched) return;
      cleanup();
      setMicTestStatus('failed');
      setPreflightMessage(
        event?.error === 'not-allowed'
          ? 'Microphone permission was blocked. Allow microphone access and try again.'
          : 'Voice was not detected. Click the microphone card and try again.'
      );
    };

    recognition.onend = () => {
      if (matched) return;
      cleanup();
      setMicTestStatus('failed');
      setPreflightMessage('Voice was not detected. Click the microphone card and try again.');
    };

    timeoutId = window.setTimeout(() => {
      if (matched) return;
      cleanup();
      try { recognition.stop(); } catch {}
      setMicTestStatus('failed');
      setPreflightMessage('Voice was not detected within 8 seconds. Click the microphone card and try again.');
    }, 8000);

    // If TTS failed, still allow the microphone check to proceed.
    if (!spoken) {
      setPreflightMessage('AI voice prompt could not be played. Listening for your microphone response…');
    }

    try {
      recognition.start();
    } catch (err) {
      console.warn('Unable to start microphone recognition:', err);
      cleanup();
      setMicTestStatus('failed');
      setPreflightMessage('Unable to start voice detection. Please try the microphone check again.');
    }
  };

  /* =======================================================
     FINAL ROUND READINESS CONVERSATION
     -------------------------------------------------------
     Pre-Interview checks are locked. Clicking Start Interview
     NEVER jumps directly to Q1. It enters the readiness state,
     asks the candidate verbally if they are ready, and only then
     requests the first question from the audited backend.
     ======================================================= */

  const localReadinessDecision = (text) => {
    const value = String(text || '').trim().toLowerCase();
    const normalized = value.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

    const negative = [
      'not ready',
      'not yet',
      'wait',
      'no',
      'nope',
      'not now',
      'give me a minute',
    ];
    const positive = [
      'yes',
      'yeah',
      'yep',
      'sure',
      'ready',
      'i am ready',
      'im ready',
      'i m ready',
      'lets start',
      'let s start',
    ];

    if (negative.some((x) => normalized.includes(x))) return false;
    if (positive.some((x) => normalized.includes(x))) return true;
    return null;
  };

  const activateFirstQuestion = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetchRound3Question();
      const question = String(response?.question || '').trim();

      if (!question) {
        throw new Error('The interview server did not return the first question.');
      }

      const serverTotal = Number(response?.total_questions);
      const resolvedTotalQuestions =
        Number.isFinite(serverTotal) && serverTotal > 0
          ? serverTotal
          : DEFAULT_TOTAL_QUESTIONS;

      const serverIndex = Number(response?.question_number);
      const nextIndex = Number.isFinite(serverIndex) && serverIndex > 0
        ? serverIndex - 1
        : 0;

      setTotalQuestions(resolvedTotalQuestions);
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(question);
      setVoiceTranscript('');
      setReadinessTranscript('');
      setRound3State('interview_active');
      setTimeLeft(QUESTION_TIME);
      setTotalTimeLeft(resolvedTotalQuestions * QUESTION_TIME);

      window.requestAnimationFrame(() => {
        void speakQuestion(question);
      });
    } finally {
      setLoading(false);
    }
  };

  const startReadinessListening = () => {
    if (readinessInProgressRef.current || interviewComplete || !interviewStartedRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      readinessRecognitionRef.current?.stop();
    } catch {}

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    let transcript = '';
    let settled = false;

    readinessRecognitionRef.current = recognition;
    readinessInProgressRef.current = true;
    setReadinessListening(true);
    setReadinessTranscript('');
    setError('');

    const cleanup = () => {
      readinessInProgressRef.current = false;
      setReadinessListening(false);
      if (readinessRecognitionRef.current === recognition) {
        readinessRecognitionRef.current = null;
      }
    };

    recognition.onstart = () => {
      setReadinessListening(true);
    };

    recognition.onresult = (event) => {
      let combined = transcript;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        combined += ` ${event.results[i][0].transcript}`;
      }
      transcript = combined.trim();
      setReadinessTranscript(transcript);
    };

    recognition.onerror = (event) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (event?.error !== 'no-speech') {
        setError('I could not hear your readiness response. Please try again.');
      }
    };

    recognition.onend = async () => {
      if (settled) return;
      settled = true;
      cleanup();

      const responseText = transcript.trim();
      if (!responseText) {
        setError('I did not hear a response. Please say yes when you are ready.');
        return;
      }

      setLoading(true);

      try {
        let response = null;

        if (interviewId) {
          response = await apiRequest('/api/interview/readiness', {
            method: 'POST',
            body: JSON.stringify({
              interview_id: interviewId,
              response: responseText,
            }),
          });
        } else {
          const decision = localReadinessDecision(responseText);
          response = {
            ready: decision === true,
            state: decision === true ? 'interview_active' : 'waiting_for_ready',
            message: decision === false
              ? 'No problem. Take your time. Let me know when you are ready.'
              : decision === true
                ? 'Okay, now let us start the interview. Good luck!'
                : 'Please say yes when you are ready to begin the interview.',
          };
        }

        const isReady = Boolean(response?.ready) || response?.state === 'interview_active';
        const message = String(response?.message || '').trim();

        if (!isReady) {
          setRound3State('waiting_for_ready');
          if (message) {
            setAiGreetingText(message);
            const spoken = await speakQuestion(message);
            if (spoken && interviewStartedRef.current) {
              window.setTimeout(() => startReadinessListening(), 250);
            }
          } else {
            window.setTimeout(() => startReadinessListening(), 250);
          }
          return;
        }

        setRound3State('interview_active');
        if (message) {
          setAiGreetingText(message);
          await speakQuestion(message);
        }
        await activateFirstQuestion();
      } catch (err) {
        console.error('Readiness request failed:', err);
        const decision = localReadinessDecision(responseText);

        if (decision === true) {
          setRound3State('interview_active');
          await activateFirstQuestion();
        } else {
          const message = decision === false
            ? 'No problem. Take your time. Let me know when you are ready.'
            : 'Please say yes when you are ready to begin the interview.';
          setRound3State('waiting_for_ready');
          setAiGreetingText(message);
          await speakQuestion(message);
          if (interviewStartedRef.current) {
            window.setTimeout(() => startReadinessListening(), 250);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      cleanup();
      setError('Unable to start readiness listening. Please try again.');
      console.error('Readiness recognition start failed:', err);
    }
  };

  const startReadinessConversation = async () => {
    setRound3State('waiting_for_ready');
    setCurrentQuestion('');
    setCurrentQuestionIndex(0);
    setVoiceTranscript('');
    setReadinessTranscript('');
    setTimeLeft(QUESTION_TIME);
    setError('');

    const prompt = 'Before we begin, I need to confirm that you are ready. Are you ready for the interview?';
    setAiGreetingText(prompt);

    const spoken = await speakQuestion(prompt);
    if (interviewStartedRef.current) {
      window.setTimeout(() => startReadinessListening(), spoken ? 250 : 100);
    }
  };

  const startInterview = async () => {
    setError('');
    setPreflightMessage('');

    if (!canStartInterview) {
      let message = 'Please complete the required setup checks before starting.';

      if (!cameraOn) {
        message = 'Camera is not ready. Please allow camera access.';
      } else if (!micAvailable) {
        message = 'Microphone is not ready. Please allow microphone access.';
      } else if (!aiVoiceReady) {
        message = 'AI voice is not available in this browser yet.';
      } else if (internetStatus !== 'stable') {
        message = 'Your connection to the interview server is not stable.';
      } else if (environmentStatus === 'no-face') {
        message = 'Please position your face in front of the camera.';
      } else if (environmentStatus === 'multiple') {
        message = 'Only one person should be visible during the interview.';
      } else if (
        environmentStatus === 'lighting' ||
        lightingStatus === 'poor' ||
        lightingStatus === 'bright'
      ) {
        message = 'Please adjust the lighting so your face is clearly visible.';
      }

      setPreflightMessage(message);
      return;
    }

    /*
     * CRITICAL: request fullscreen FIRST while the browser still has the
     * original Start button user gesture.
     */
    const fullscreenPromise = enterFullscreen();

    setAIInterviewActive(true);

    if (!mediaStreamRef.current) {
      startCamera().catch((err) => {
        console.warn('Camera initialization is still pending:', err);
      });
    }

    await fullscreenPromise;

    setInterviewStarted(true);
    interviewStartedRef.current = true;

    setInterviewComplete(false);
    setRound3State('waiting_for_ready');
    setCurrentQuestionIndex(0);
    setCurrentQuestion('');
    setVoiceTranscript('');
    setReadinessTranscript('');
    setTimeLeft(QUESTION_TIME);
    setTotalTimeLeft(totalInterviewTime);

    // IMPORTANT: Start Interview never jumps directly to Q1.
    // The candidate must first complete the Final Round readiness conversation.
    window.requestAnimationFrame(() => {
      void startReadinessConversation();
    });
  };

  /* =======================================================
     TIMER
     ======================================================= */

  useEffect(() => {
    if (
      !interviewStarted ||
      round3State !== 'interview_active' ||
      interviewComplete ||
      !currentQuestion
    ) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timerRef.current);
          window.setTimeout(() => { void handleQuestionTimeout(); }, 0);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      mountedRef.current = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    currentQuestionIndex,
    interviewStarted,
    round3State,
    interviewComplete,
    currentQuestion,
  ]);

  /* =======================================================
     TOTAL INTERVIEW TIMER
     ======================================================= */

  useEffect(() => {
    if (!interviewStarted || round3State !== 'interview_active' || interviewComplete) return undefined;

    const totalTimer = window.setInterval(() => {
      setTotalTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(totalTimer);
          window.setTimeout(() => finishInterview(), 0);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(totalTimer);
  }, [interviewStarted, round3State, interviewComplete]);

  /* =======================================================
     NEXT QUESTION
     ======================================================= */

  const moveToNextQuestion = async () => {
    if (finishInProgressRef.current || questionTransitionRef.current) return;
    if (!interviewStartedRef.current || interviewComplete) return;

    questionTransitionRef.current = true;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      speechSequenceRef.current += 1;
      if (speechTimerRef.current) { window.clearTimeout(speechTimerRef.current); speechTimerRef.current = null; }
      if (speechHardTimeoutRef.current) { window.clearTimeout(speechHardTimeoutRef.current); speechHardTimeoutRef.current = null; }
      window.speechSynthesis?.cancel();
      aiSpeakingRef.current = false;
      setAiSpeaking(false);
      setRecording(false);

      const response = await fetchRound3Question();

      const serverTotal = Number(response?.total_questions);
      const resolvedTotalQuestions =
        Number.isFinite(serverTotal) && serverTotal > 0
          ? serverTotal
          : totalQuestions;

      const nextQuestion = String(response?.question || '').trim();
      const serverNumber = Number(response?.question_number);
      const nextIndex = Number.isFinite(serverNumber) && serverNumber > 0
        ? serverNumber - 1
        : currentQuestionIndex + 1;

      setTotalQuestions(resolvedTotalQuestions);

      if (!nextQuestion || nextIndex >= resolvedTotalQuestions) {
        await finishInterview();
        return;
      }

      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(nextQuestion);
      setVoiceTranscript('');
      setTimeLeft(QUESTION_TIME);

      window.requestAnimationFrame(() => {
        if (!finishInProgressRef.current && interviewStartedRef.current) {
          void speakQuestion(nextQuestion);
        }
      });
    } catch (err) {
      console.error('Unable to load next question:', err);
      setError(err?.message || 'Interview server did not return the next question. Please try again.');
    } finally {
      questionTransitionRef.current = false;
    }
  };

  /* =======================================================
     SAVE / SUBMIT ROUND 3 ANSWER
     ======================================================= */

  const saveCurrentAnswer = async (status = 'answered') => {
    const answer = voiceTranscript.trim();
    const payload = {
      interview_id: interviewId,
      round: 3,
      questionNumber: currentQuestionIndex + 1,
      question: currentQuestion,
      answer,
      transcript: answer,
      status,
      time_remaining: timeLeft,
      submitted_at: new Date().toISOString(),
    };

    const response = await persistRound3Answer(payload);
    return { payload, response };
  };

  const handleSubmitAndNext = async () => {
    if (loading || finishInProgressRef.current || round3State !== 'interview_active') return;
    if (recording) { try { recognitionRef.current?.stop(); } catch {} setRecording(false); }
    if (!voiceTranscript.trim()) { setError('Please answer using your voice before continuing.'); return; }

    setError('');
    setLoading(true);
    try {
      const result = await saveCurrentAnswer('answered');
      if (currentQuestionIndex >= totalQuestions - 1 || result.response?.completed === true) {
        await finishInterview(result.response);
      } else {
        await moveToNextQuestion();
      }
    } catch (err) {
      console.error('Unable to submit answer:', err);
      setError(err?.message || 'Unable to save your answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInterview = async () => {
    if (loading || finishInProgressRef.current || round3State !== 'interview_active') return;
    if (recording) { try { recognitionRef.current?.stop(); } catch {} setRecording(false); }
    if (!voiceTranscript.trim()) { setError('Please answer the current question using your voice before submitting.'); return; }

    setError('');
    setLoading(true);
    try {
      const result = await saveCurrentAnswer('answered');
      await finishInterview(result.response);
    } catch (err) {
      console.error('Unable to submit the interview:', err);
      setError(err?.message || 'Unable to submit the interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionTimeout = async () => {
    if (finishInProgressRef.current || questionTransitionRef.current || round3State !== 'interview_active') return;
    setError('');

    try {
      // The audited backend rejects empty answers. If the candidate said
      // nothing before the 60-second timer expired, record it as a skip.
      if (voiceTranscript.trim()) {
        await saveCurrentAnswer('answered');
      } else if (interviewId) {
        await apiRequest('/api/interview/skip', {
          method: 'POST',
          body: JSON.stringify({
            interview_id: interviewId,
            question: currentQuestion,
          }),
        });
      } else {
        const answers = getRound3Answers();
        answers[currentQuestionIndex] = {
          interview_id: interviewId,
          round: 3,
          questionNumber: currentQuestionIndex + 1,
          question: currentQuestion,
          answer: '',
          transcript: '',
          status: 'timeout',
          score: 0,
          score_10: 0,
          feedback: 'No answer was submitted before the timer expired.',
          submitted_at: new Date().toISOString(),
        };
        sessionStorage.setItem('round3_answers', JSON.stringify(answers));
      }
    } catch (err) {
      console.warn('Timeout answer sync failed:', err);
    }

    await moveToNextQuestion();
  };

  /* =======================================================
     SKIP
     ======================================================= */

  const handleSkipQuestion = async () => {
    if (loading || finishInProgressRef.current || round3State !== 'interview_active') return;
    setError('');
    setLoading(true);

    try {
      if (recording) { try { recognitionRef.current?.stop(); } catch {} setRecording(false); }

      if (interviewId) {
        await apiRequest('/api/interview/skip', {
          method: 'POST',
          body: JSON.stringify({
            interview_id: interviewId,
            question: currentQuestion,
          }),
        });
      } else {
        const answers = getRound3Answers();
        answers[currentQuestionIndex] = {
          interview_id: interviewId,
          round: 3,
          questionNumber: currentQuestionIndex + 1,
          question: currentQuestion,
          answer: '',
          transcript: '',
          status: 'skipped',
          score: 0,
          score_10: 0,
          feedback: 'Question skipped.',
          submitted_at: new Date().toISOString(),
        };
        sessionStorage.setItem('round3_answers', JSON.stringify(answers));
      }

      if (currentQuestionIndex >= totalQuestions - 1) {
        await finishInterview();
      } else {
        await moveToNextQuestion();
      }
    } catch (err) {
      console.error('Unable to record skipped question:', err);
      setError(err?.message || 'Unable to record the skipped question.');
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FINISH INTERVIEW
     ======================================================= */

  const finishInterview = async (backendResponse = null) => {
    if (finishInProgressRef.current) return;
    finishInProgressRef.current = true;
    questionTransitionRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      recognitionRef.current &&
      recording
    ) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore.
      }
    }

    speechSequenceRef.current += 1;
    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (speechHardTimeoutRef.current) {
      window.clearTimeout(speechHardTimeoutRef.current);
      speechHardTimeoutRef.current = null;
    }
    window.speechSynthesis?.cancel();

    setAiSpeaking(false);

    setRecording(false);

    try { await persistRound3Completion(backendResponse); }
    catch (err) { console.warn('Round 3 completion persistence failed:', err); }

    interviewStartedRef.current = false;

    setInterviewComplete(true);
    setRound3State('completed');

    // ============================================================
    // TASK 14 ONLY — FINAL INTERVIEW COMPLETED MESSAGE
    // Existing Round 3 interview functionality remains unchanged.
    // ============================================================

    const finalMessage = getAvatarMessage({
      user: { name: userName },
      avatarEvent: 'final_interview_completed',
    });

    if (finalMessage && 'speechSynthesis' in window) {
      window.setTimeout(() => {
        void speakQuestion(finalMessage);
      }, 300);
    }

    setInterviewStarted(false);

    setCurrentQuestion('');

    // Release camera/microphone before leaving the interview room.
    stopMediaStream();

    // Normal completion restores the normal navbar.
    setAIInterviewActive(false);

    intentionalFullscreenExitRef.current = true;
    await exitFullscreen();
  };

  /* =======================================================
     END INTERVIEW
     ======================================================= */

  const handleEndInterview = async () => {
    const shouldExit = window.confirm(
      'Are you sure you want to end this interview?'
    );

    if (!shouldExit) return;
    if (finishInProgressRef.current) return;
    finishInProgressRef.current = true;
    questionTransitionRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      recognitionRef.current &&
      recording
    ) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore.
      }
    }

    speechSequenceRef.current += 1;
    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (speechHardTimeoutRef.current) {
      window.clearTimeout(speechHardTimeoutRef.current);
      speechHardTimeoutRef.current = null;
    }
    window.speechSynthesis?.cancel();
    aiSpeakingRef.current = false;

    setAiSpeaking(false);
    setRecording(false);
    setRound3State('completed');

    if (readinessRecognitionRef.current) {
      try { readinessRecognitionRef.current.stop(); } catch {}
      readinessRecognitionRef.current = null;
    }

    interviewStartedRef.current = false;

    // Release camera/microphone immediately.
    stopMediaStream();

    // Exit Interview restores the normal navbar.
    setAIInterviewActive(false);

    intentionalFullscreenExitRef.current = true;
    await exitFullscreen();

    navigate('/dashboard');
  };

  /* =======================================================
     CLEANUP
     ======================================================= */

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      speechSequenceRef.current += 1;
      if (speechTimerRef.current) {
        window.clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }
      if (speechHardTimeoutRef.current) {
        window.clearTimeout(speechHardTimeoutRef.current);
        speechHardTimeoutRef.current = null;
      }
      window.speechSynthesis?.cancel();

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (readinessRecognitionRef.current) {
        try { readinessRecognitionRef.current.stop(); } catch {}
        readinessRecognitionRef.current = null;
      }

      stopMediaStream();

      // Safety: if this page unmounts, restore MainLayout navbar.
      sessionStorage.removeItem('ai_interview_active');
      window.dispatchEvent(
        new Event('ai-interview-state-change')
      );
    };
  }, []);

  /* =======================================================
     FORMAT TIMER
     ======================================================= */

  const formatTime = (seconds) => {
    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      '0'
    )}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  };

  const progress =
    ((currentQuestionIndex + 1) /
      totalQuestions) *
    100;

  /* =======================================================
     FINAL UI
     IMPORTANT: Existing fullscreen / ESC / responsive rules above
     are intentionally preserved. Only the presentation is updated.
     ======================================================= */

  const interviewType =
    currentInterview?.interview_type ||
    currentInterview?.type ||
    'technical';

  const interviewTypeLabel =
    interviewType.toLowerCase() === 'non-technical'
      ? 'Non-Technical Interview'
      : 'Technical Interview';

  const { logout } = useAuth();

  const userName =
    currentInterview?.name ||
    JSON.parse(localStorage.getItem('user') || '{}')?.name ||
    'Candidate';

  // ======================================================
  // TASK 11 — STEP 2: USER MENU FOR PRE / FINAL INTERVIEW
  // Only the user-menu behavior is added here.
  // ======================================================
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleUserMenuOutsideClick = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleUserMenuOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleUserMenuOutsideClick);
    };
  }, []);

  const handleUserProfile = () => {
    setIsUserMenuOpen(false);
    navigate('/profile');
  };

  const handleUserLogout = () => {
    setIsUserMenuOpen(false);

    try {
      logout();
    } catch (error) {
      console.warn('Logout handler failed:', error);
    }

    setAIInterviewActive(false);
    stopMediaStream();

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      intentionalFullscreenExitRef.current = true;
      void exitFullscreen();
    }

    navigate('/login', { replace: true });
  };

  const totalTimeLabel = formatTime(totalTimeLeft);
  const answerProgress = Math.max(
    0,
    Math.min(100, (timeLeft / QUESTION_TIME) * 100)
  );

  const questionStatus = (index) => {
    if (!interviewStarted) return 'Pending';
    if (index < currentQuestionIndex) return 'Completed';
    if (index === currentQuestionIndex) return 'In Progress';
    return 'Pending';
  };

  const statusClass = (index) => {
    if (index < currentQuestionIndex)
      return 'border-emerald-400/20 bg-emerald-500/5';
    if (index === currentQuestionIndex)
      return 'border-violet-500/50 bg-violet-600/30';
    return 'border-white/5 bg-slate-950/40';
  };

  useEffect(() => {
    return () => {
      if (speechTimerRef.current) {
        window.clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }
      try { window.speechSynthesis?.cancel(); } catch {}
      if (micTestRecognitionRef.current) {
        try { micTestRecognitionRef.current.stop(); } catch {}
        micTestRecognitionRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020508] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(24,213,255,0.07),transparent_70%),radial-gradient(ellipse_60%_50%_at_85%_75%,rgba(255,154,46,0.035),transparent_60%),radial-gradient(ellipse_70%_50%_at_15%_65%,rgba(22,139,255,0.05),transparent_60%)] text-white relative">
      {/* GLOBAL STUDIO BACKGROUND ATMOSPHERIC WAVE (COHESIVE ACROSS PRE-INTERVIEW & ACTIVE INTERVIEW) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-25 z-0" aria-hidden="true">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1440 900">
          <defs>
            <linearGradient id="mockmindStudioAtmosphereWave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#18D5FF" stopOpacity="0" />
              <stop offset="25%" stopColor="#168BFF" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#22D3EE" stopOpacity="0.08" />
              <stop offset="85%" stopColor="#FF9A2E" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#FF9A2E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-100,250 C300,100 600,420 1000,200 C1250,80 1400,320 1600,220"
            fill="none"
            stroke="url(#mockmindStudioAtmosphereWave)"
            strokeWidth="2.5"
          />
          <path
            d="M-50,600 C250,750 700,500 1100,680 C1350,800 1500,620 1600,700"
            fill="none"
            stroke="url(#mockmindStudioAtmosphereWave)"
            strokeWidth="1.8"
          />
        </svg>
      </div>

      {interviewComplete ? (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-3xl border border-emerald-400/20 bg-slate-950/90 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10"><CheckCircle2 className="h-8 w-8 text-emerald-400" /></div>
            <h1 className="text-3xl font-bold">Interview Complete</h1>
            <p className="mt-3 text-gray-400">You completed all {totalQuestions} questions in your {selectedRole} interview.</p>
            <p className="mt-2 text-sm text-gray-500">Your Round 3 responses have been saved for feedback generation.</p>
            <button type="button" onClick={() => navigate('/feedback')} className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-3.5 font-semibold text-white transition hover:opacity-90">Continue to Feedback</button>
          </div>
        </div>
      ) : (
        <>
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl relative overflow-hidden transition-all ${interviewStarted ? 'border-[#168BFF]/20 bg-[#071019]/95 h-[62px] shadow-[0_4px_30px_rgba(0,0,0,0.8)]' : 'border-[#168BFF]/15 bg-[#071019]/90 h-[58px]'}`}>
        {/* WIDE FLOWING CYAN, BLUE & AMBER AI ENERGY FIELD ACROSS ACTIVE HEADER WITH SUBTLE PARTICLES */}
        {interviewStarted && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <svg className="h-full w-full opacity-45" preserveAspectRatio="none" viewBox="0 0 1440 62">
              <defs>
                <linearGradient id="mockmindAiEnergyField" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#18D5FF" stopOpacity="0" />
                  <stop offset="15%" stopColor="#18D5FF" stopOpacity="0.35" />
                  <stop offset="38%" stopColor="#168BFF" stopOpacity="0.75" />
                  <stop offset="62%" stopColor="#29A8FF" stopOpacity="0.7" />
                  <stop offset="80%" stopColor="#FF9A2E" stopOpacity="0.45" />
                  <stop offset="92%" stopColor="#F27A18" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#F27A18" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="mockmindCyanAccentRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
                  <stop offset="25%" stopColor="#22D3EE" stopOpacity="0.3" />
                  <stop offset="60%" stopColor="#168BFF" stopOpacity="0.25" />
                  <stop offset="85%" stopColor="#FFB84D" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,32 Q220,10 440,34 T880,26 T1320,38 T1440,28"
                fill="none"
                stroke="url(#mockmindAiEnergyField)"
                strokeWidth="2.5"
              />
              <path
                d="M0,38 Q280,52 560,28 T1120,42 T1440,32"
                fill="none"
                stroke="url(#mockmindCyanAccentRibbon)"
                strokeWidth="1.5"
              />
              {/* Subtle particle/dot accents along the flowing wave */}
              <circle cx="280" cy="22" r="1.5" fill="#22D3EE" opacity="0.6" />
              <circle cx="560" cy="28" r="2" fill="#168BFF" opacity="0.5" />
              <circle cx="840" cy="30" r="1.5" fill="#29A8FF" opacity="0.6" />
              <circle cx="1120" cy="40" r="2" fill="#FF9A2E" opacity="0.45" />
              <circle cx="1300" cy="28" r="1.5" fill="#FFB84D" opacity="0.35" />
            </svg>
          </div>
        )}

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1550px] items-center justify-between px-[clamp(14px,1.7vw,28px)]">
          {/* LEFT: BRAND */}
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${interviewStarted ? 'bg-gradient-to-br from-[#168BFF] via-[#22D3EE] to-[#FF9A2E] shadow-[0_0_15px_rgba(22,139,255,0.3)]' : 'bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg'}`}>
              <Bot className={`h-5 w-5 ${interviewStarted ? 'text-[#05080D] font-bold' : 'text-white'}`} />
            </div>
            {interviewStarted ? (
              <span className="text-[clamp(19px,1.5vw,22px)] font-black tracking-tight text-[#F5F7FA]">
                Mock<span className="bg-gradient-to-r from-[#22D3EE] to-[#168BFF] bg-clip-text text-transparent">Mind</span> <span className="text-[#FF9A2E]">AI</span>
              </span>
            ) : (
              <span className="text-[clamp(18px,1.5vw,24px)] font-bold">MockMind AI</span>
            )}
          </div>

          {/* CENTER NAVIGATION ONLY FOR PRE-INTERVIEW */}
          {!interviewStarted && (
            <div className="hidden items-center gap-3 text-[clamp(13px,1.1vw,17px)] font-medium md:flex">
              <span className="text-violet-300">▥▥▥</span>
              <span>AI Interview</span>
              <span className="text-gray-500">•</span>
              <span>Round 3</span>
            </div>
          )}

          {/* RIGHT: ACTIONS & USER PROFILE */}
          <div className="flex items-center gap-3">
            {!interviewStarted && (
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden rounded-xl border border-blue-400/30 bg-slate-900/60 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-blue-400/60 hover:bg-blue-500/10 sm:block"
              >
                Dashboard
              </button>
            )}

            {interviewStarted && (
              <button
                onClick={handleEndInterview}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-1.5 text-sm font-medium text-red-400 transition hover:border-red-500/70 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Exit Interview</span>
              </button>
            )}

            {/* =================================================
                TASK 11 — STEP 2: WORKING USER MENU
                Pre-Interview + Final AI Interview
                ================================================= */}
            <div
              ref={userMenuRef}
              className="relative hidden sm:block"
            >
              <button
                type="button"
                onClick={() =>
                  setIsUserMenuOpen((previous) => !previous)
                }
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                  interviewStarted
                    ? 'border-[#168BFF]/25 bg-[#071019] hover:border-[#168BFF]/50'
                    : 'border-white/10 bg-slate-900/70 hover:border-white/20 hover:bg-slate-800/80'
                }`}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  interviewStarted
                    ? 'bg-gradient-to-br from-[#168BFF] to-[#22D3EE] text-black shadow-[0_0_10px_rgba(22,139,255,0.25)]'
                    : 'bg-gradient-to-br from-amber-200 to-orange-500 text-slate-900'
                }`}>
                  {userName.charAt(0).toUpperCase()}
                </div>

                <span className="max-w-[110px] truncate text-sm font-medium text-[#F5F7FA]">
                  {userName}
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-[#A8B3BF] transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div
                  role="menu"
                  className={`absolute right-0 top-full z-[200] mt-3 w-56 overflow-hidden rounded-xl border shadow-2xl ${
                    interviewStarted
                      ? 'border-[#1EAEFF]/20 bg-[#0A1016] shadow-black/80'
                      : 'border-white/10 bg-[#0b1024] shadow-black/50'
                  }`}
                >
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-white">
                      {userName}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {JSON.parse(localStorage.getItem('user') || '{}')?.email || ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleUserProfile}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <UserRound className="h-4 w-4 text-slate-400" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleUserLogout}
                    className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* PRE-INTERVIEW */}
      {!interviewStarted && (
        <main className="mx-auto w-full max-w-[1500px] px-[clamp(14px,1.7vw,28px)] pb-8 pt-6">
          <section className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                <ShieldCheck className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-[clamp(20px,1.8vw,28px)] font-bold">Get Ready for Your AI Interview</h1>
                  <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-300">Round 3</span>
                </div>
                <p className="text-sm text-gray-300">Check your camera, microphone, voice, connection and interview environment before starting.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/5 px-4 py-3">
              <Clock3 className="h-9 w-9 text-violet-400" />
              <div className="text-right">
                <p className="text-xs text-gray-400">Interview Duration</p>
                <p className="font-mono text-2xl font-bold">{formatTime(totalInterviewTime)}</p>
              </div>
            </div>
          </section>

          {preflightMessage && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Setup attention required</p>
                <p className="mt-0.5 text-amber-100/80">{preflightMessage}</p>
              </div>
              <button type="button" onClick={() => setPreflightMessage('')} className="text-xs text-amber-300 hover:text-white">Dismiss</button>
            </div>
          )}

          <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr_0.75fr]">
            {/* CAMERA */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold"><Video className="h-5 w-5 text-violet-400" />Your Camera</h2>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cameraOn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    ● {cameraOn ? 'LIVE' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { void toggleCamera(); }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${cameraOn ? 'border-red-400/30 text-red-300 hover:bg-red-500/10' : 'border-violet-400/30 text-violet-300 hover:bg-violet-500/10'}`}
                    aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
                  >
                    {cameraOn ? 'Turn Off Camera' : 'Enable Camera'}
                  </button>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl bg-black">
                <video ref={handleVideoElementRef} autoPlay playsInline muted className={`aspect-[16/9] w-full object-cover transition-opacity ${cameraOn ? 'opacity-100' : 'opacity-0'}`} />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                    <VideoOff className="mb-3 h-12 w-12" />
                    <p>Camera is turned off</p>
                    <button type="button" onClick={() => startCamera({ force: true })} className="mt-3 rounded-lg border border-violet-400/30 px-3 py-2 text-xs text-violet-300 hover:bg-violet-500/10">Enable Camera</button>
                  </div>
                )}
                {cameraOn && faceStatus === 'none' && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-amber-300/30 bg-black/65 px-3 py-2 text-center text-xs text-amber-200 backdrop-blur">Position your face clearly in the camera frame.</div>
                )}
                {cameraOn && faceStatus === 'multiple' && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-red-300/30 bg-black/70 px-3 py-2 text-center text-xs text-red-200 backdrop-blur">Only one person should be visible.</div>
                )}
                {cameraOn && faceStatus === 'far' && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-amber-300/30 bg-black/70 px-3 py-2 text-center text-xs text-amber-200 backdrop-blur">Move a little closer so your face is clearly visible.</div>
                )}
                {cameraOn && faceStatus === 'eyes' && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-amber-300/30 bg-black/70 px-3 py-2 text-center text-xs text-amber-200 backdrop-blur">Keep both eyes visible and face the camera.</div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-center">
                  <Video className={`mx-auto h-5 w-5 ${cameraOn ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <p className="mt-1 text-xs text-gray-300">Camera</p>
                  <p className={`text-sm font-semibold ${cameraOn ? 'text-emerald-400' : 'text-amber-400'}`}>{cameraOn ? 'Connected' : 'Not Ready'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-center">
                  <UserRound className={`mx-auto h-5 w-5 ${faceReady ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <p className="mt-1 text-xs text-gray-300">Face Detection</p>
                  <p className={`text-sm font-semibold ${getPreflightStatus(faceStatus).className}`}>{getPreflightStatus(faceStatus).label}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-center">
                  <Lightbulb className={`mx-auto h-5 w-5 ${lightingStatus === 'good' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <p className="mt-1 text-xs text-gray-300">Lighting</p>
                  <p className={`text-sm font-semibold ${getPreflightStatus(lightingStatus).className}`}>{getPreflightStatus(lightingStatus).label}</p>
                </div>
              </div>
            </div>

            {/* AI */}
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-center shadow-xl">
              <div className="mb-3 flex w-full items-center justify-between text-left font-semibold">
                <span className="flex items-center gap-2"><Bot className="h-5 w-5 text-violet-400" />AI Interviewer</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${aiVoiceReady ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-300'}`}>{aiVoiceReady ? 'VOICE READY' : 'VOICE CHECKING'}</span>
              </div>
              <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden">
                {/* Permanent left/right AI voice waveform. It stays visible even while idle. */}
                <div className="pointer-events-none absolute inset-x-2 top-1/2 z-0 flex -translate-y-1/2 items-center justify-center gap-2">
                  <div className="flex h-20 w-[31%] items-center justify-end gap-1 overflow-hidden">
                    {[18, 30, 44, 62, 38, 72, 50, 30, 58, 42, 68, 34, 52, 26, 46].map((height, i) => (
                      <span
                        key={`left-wave-${i}`}
                        className="mockmind-preflight-wave-bar w-1 rounded-full bg-gradient-to-t from-violet-500/40 via-violet-400 to-cyan-300"
                        style={{ height: `${height}%`, animationDelay: `${i * 0.055}s`, opacity: aiSpeaking ? 1 : 0.7 }}
                      />
                    ))}
                  </div>
                  <div className="relative z-10 shrink-0 scale-[0.88] sm:scale-100"><AIInterviewerAvatar speaking={aiSpeaking} /></div>
                  <div className="flex h-20 w-[31%] items-center justify-start gap-1 overflow-hidden">
                    {[46, 26, 52, 34, 68, 42, 58, 30, 50, 72, 38, 62, 44, 30, 18].map((height, i) => (
                      <span
                        key={`right-wave-${i}`}
                        className="mockmind-preflight-wave-bar w-1 rounded-full bg-gradient-to-t from-cyan-400 via-cyan-300 to-violet-400"
                        style={{ height: `${height}%`, animationDelay: `${i * 0.055}s`, opacity: aiSpeaking ? 1 : 0.7 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className={`rounded-full border px-5 py-2 text-sm font-semibold ${aiVoiceReady ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-400/30 bg-amber-500/10 text-amber-300'}`}>
                {aiVoiceReady ? <CircleCheck className="mr-2 inline h-5 w-5" /> : <RefreshCw className="mr-2 inline h-5 w-5 animate-spin" />}
                {aiVoiceReady ? 'AI Voice Ready' : 'Checking AI Voice'}
              </div>
              <p className="mt-4 text-gray-200">{aiGreetingText}</p>
            </div>

            {/* OVERVIEW */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-xl">
              <h2 className="mb-5 font-semibold">Interview Overview</h2>
              <div className="space-y-5">
                <div className="flex gap-3"><ClipboardCheck className="h-6 w-6 text-violet-400" /><div><p className="text-xs text-gray-400">Interview Type</p><p className="font-medium">{interviewTypeLabel}</p></div></div>
                <div className="flex gap-3"><CheckCircle2 className="h-6 w-6 text-blue-400" /><div><p className="text-xs text-gray-400">Total Questions</p><p className="font-medium">{totalQuestions} Questions</p></div></div>
                <div className="flex gap-3"><Clock3 className="h-6 w-6 text-amber-400" /><div><p className="text-xs text-gray-400">Time per Question</p><p className="font-medium">{QUESTION_TIME} Seconds</p></div></div>
                <div className="flex gap-3"><Clock3 className="h-6 w-6 text-cyan-400" /><div><p className="text-xs text-gray-400">Total Duration</p><p className="font-medium">{formatTime(totalInterviewTime)}</p></div></div>
                <div className="flex gap-3"><Globe2 className="h-6 w-6 text-cyan-400" /><div><p className="text-xs text-gray-400">Language</p><p className="font-medium">English</p></div></div>
                <div className="flex gap-3"><Volume2 className="h-6 w-6 text-emerald-400" /><div><p className="text-xs text-gray-400">AI Voice</p><p className={`font-medium ${aiVoiceReady ? 'text-emerald-400' : 'text-amber-300'}`}>{aiVoiceReady ? 'Enabled' : 'Checking'}</p></div></div>
              </div>
            </div>
          </section>

          {/* CHECKLIST */}
          <section className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><ClipboardCheck className="h-5 w-5 text-blue-400" />Pre-Interview Checklist</h2>
              <span className={`text-xs font-semibold ${canStartInterview ? 'text-emerald-400' : 'text-amber-300'}`}>{canStartInterview ? 'All required checks passed' : 'Complete required checks to continue'}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {checklistItems.map(({ Icon, label, status, ready }) => {
                const meta = getPreflightStatus(status);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={label === 'Microphone' ? startMicrophoneTest : undefined}
                    disabled={label === 'Microphone' && (micTestStatus === 'listening' || micTestStatus === 'prompting')}
                    className={`flex w-full items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-left ${label === 'Microphone' ? 'cursor-pointer hover:border-violet-400/40 hover:bg-violet-500/5' : ''} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <Icon className={`h-6 w-6 shrink-0 ${ready ? 'text-emerald-400' : meta.className}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className={`text-sm font-semibold ${meta.className}`}>{meta.label}</p>
                      {label === 'Microphone' && micTestTranscript && <p className="mt-0.5 truncate text-[10px] text-gray-500">“{micTestTranscript}”</p>}
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-600" />
                  </button>
                );
              })}
            </div>
            <div className={`mt-4 rounded-xl border px-4 py-3 text-center text-sm font-semibold ${canStartInterview ? 'border-emerald-400/20 bg-emerald-500/5 text-emerald-400' : 'border-amber-400/20 bg-amber-500/5 text-amber-300'}`}>
              {canStartInterview ? <><CircleCheck className="mr-2 inline h-5 w-5" />You're all set! Good luck with your interview.</> : <><AlertTriangle className="mr-2 inline h-5 w-5" />Please complete the required checks before starting.</>}
              {backendLatency !== null && <span className="ml-2 text-xs font-normal text-gray-500">Server response: {backendLatency} ms</span>}
            </div>
          </section>

          {/* ENVIRONMENT DETAILS — REAL CURRENT CHECK RESULTS */}
          <section className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Environment Analysis</p>
                <p className="mt-1 text-xs text-gray-500">Current browser/camera observations. No value is hard-coded as Good.</p>
              </div>
              <button type="button" onClick={() => setShowEnvironmentDetails((v) => !v)} className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10">{showEnvironmentDetails ? 'Hide Environment Details' : 'Get Environment Details'}</button>
            </div>
            {showEnvironmentDetails && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-gray-500">Face</p><p className={`font-semibold ${getPreflightStatus(faceStatus).className}`}>{getPreflightStatus(faceStatus).label}</p></div>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-gray-500">Lighting</p><p className={`font-semibold ${getPreflightStatus(lightingStatus).className}`}>{getPreflightStatus(lightingStatus).label}</p></div>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-gray-500">People</p><p className={`font-semibold ${faceStatus === 'multiple' ? 'text-red-400' : faceStatus === 'detected' ? 'text-emerald-400' : 'text-gray-300'}`}>{faceStatus === 'multiple' ? 'Multiple' : faceStatus === 'detected' ? '1 detected' : 'Not verified'}</p></div>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-gray-500">Connection</p><p className={`font-semibold ${getPreflightStatus(internetStatus).className}`}>{getPreflightStatus(internetStatus).label}{backendLatency !== null ? ` • ${backendLatency} ms` : ''}</p></div>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-gray-500">Overall</p><p className={`font-semibold ${getPreflightStatus(environmentStatus).className}`}>{getPreflightStatus(environmentStatus).label}</p></div>
              </div>
            )}
          </section>

          {/* LOWER PREP AREA */}
          <section className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.25fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><Lightbulb className="h-5 w-5 text-amber-300" />Interview Tips</h2>
              <ul className="space-y-3 text-sm text-gray-300">
                {['Speak clearly and at a normal pace', 'Maintain good eye contact', 'Take your time to think', 'Be honest and confident', 'Ensure a quiet environment', 'Dress professionally'].map((x) => <li key={x}><Check className="mr-2 inline h-4 w-4 text-violet-400" />{x}</li>)}
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-center">
              <button
                type="button"
                onClick={startInterview}
                disabled={!canStartInterview}
                className={`w-full max-w-md rounded-2xl px-8 py-5 text-[clamp(20px,2vw,30px)] font-bold shadow-xl transition ${canStartInterview ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:scale-[1.01] hover:opacity-95' : 'cursor-not-allowed bg-slate-800 text-gray-500'}`}
              >
                {canStartInterview ? <>Start Interview <span className="ml-3">→</span></> : <>Complete Setup <span className="ml-3">🔒</span></>}
              </button>
              <p className="mt-4 text-sm text-gray-400"><LockKeyhole className="mr-2 inline h-4 w-4" />Your interview will start in fullscreen mode</p>
              <p className="mt-2 text-xs text-gray-500">Once started, the session timer begins and fullscreen rules apply.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><CircleHelp className="h-5 w-5 text-blue-400" />What to Expect</h2>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><Check className="mr-2 inline h-4 w-4 text-violet-400" />AI will ask you {totalQuestions} questions</li>
                <li><Check className="mr-2 inline h-4 w-4 text-violet-400" />{QUESTION_TIME} seconds to answer each</li>
                <li><Check className="mr-2 inline h-4 w-4 text-violet-400" />You will answer every question using your voice</li>
                <li><Check className="mr-2 inline h-4 w-4 text-violet-400" />AI will evaluate your responses</li>
                <li><Check className="mr-2 inline h-4 w-4 text-violet-400" />Detailed feedback after completion</li>
              </ul>
            </div>
          </section>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-center text-sm text-gray-400"><Info className="mr-2 inline h-5 w-5" />Once you click “Start Interview”, the session will begin and you cannot pause or go back.</div>
        </main>
      )}

      {/* ACTIVE INTERVIEW */}
      {interviewStarted && (
        <main className="mx-auto flex w-full max-w-[1550px] flex-col px-4 sm:px-6 pt-2 pb-3 min-h-[calc(100dvh-52px)] justify-between">
          {/* HEADER STATUS BAR */}
          <section className="mb-2 flex shrink-0 items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#19D98B]/30 bg-[#19D98B]/10">
                <ShieldCheck className="h-4 w-4 text-[#19D98B]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-[#19D98B] leading-tight">Interview in Progress</h1>
                <p className="text-[11px] text-[#A8B3BF]">Answer clearly and confidently. You're doing great!</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#168BFF]/20 bg-[#091018] px-3 py-1 shadow-[0_0_15px_rgba(22,139,255,0.04)]">
              <Clock3 className="h-4 w-4 text-[#22D3EE]" />
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-[#74808C]">Total Time Left</p>
                <p className="font-mono text-base font-bold text-[#F5F7FA] leading-none">{totalTimeLabel}</p>
              </div>
            </div>
          </section>

          {/* READINESS CHECK BEFORE Q1 OR ACTIVE INTERVIEW ROOM */}
          {round3State === 'waiting_for_ready' && !currentQuestion ? (
            <section className="grid min-h-[min(560px,calc(100vh-140px))] flex-1 place-items-center py-4">
              <div className="w-full max-w-2xl rounded-3xl border border-[#168BFF]/25 bg-[#091018] p-6 sm:p-8 text-center shadow-[0_0_30px_rgba(22,139,255,0.06)]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#168BFF]/35 bg-[#168BFF]/10 shadow-[0_0_20px_rgba(22,139,255,0.15)]">
                  <Bot className="h-8 w-8 text-[#22D3EE]" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#55E6FF]">Final Round Readiness</p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#F5F7FA]">Are you ready for the interview?</h1>
                <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-[#A8B3BF]">
                  The AI interviewer will listen to your voice. Say <span className="font-semibold text-white">yes, I am ready</span> when you are ready to begin.
                </p>

                <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-white/10 bg-[#04080D] p-4">
                  <div className="flex items-center justify-center gap-2.5 text-[#55E6FF]">
                    <Volume2 className="h-4 w-4" />
                    <span className="font-semibold text-sm">
                      {aiSpeaking ? 'AI is speaking...' : readinessListening ? 'Listening for your answer...' : 'Waiting for your response'}
                    </span>
                  </div>
                  {readinessTranscript && (
                    <p className="mt-3 rounded-xl border border-white/10 bg-[#0B131B] p-2.5 text-left text-sm text-[#F5F7FA]">
                      {readinessTranscript}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={startReadinessListening}
                    disabled={aiSpeaking || loading || readinessListening}
                    className="rounded-xl border border-[#168BFF]/40 bg-[#168BFF]/10 px-5 py-2.5 font-semibold text-sm text-[#55E6FF] transition hover:bg-[#168BFF]/20 disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_0_15px_rgba(22,139,255,0.1)]"
                  >
                    <Mic className="mr-2 inline h-4 w-4" />
                    {readinessListening ? 'Listening...' : 'Answer Ready Check'}
                  </button>
                </div>

                {error && <p className="mt-3 text-xs text-[#FF4545]">{error}</p>}
              </div>
            </section>
          ) : (
            <>
              {/* ACTIVE INTERVIEW ROOM WORKSPACE */}
              {/* TOP WORKSPACE: LEFT (CAMERA + AI + CURRENT QUESTION + YOUR ANSWER) & RIGHT (PROGRESS + TIPS) */}
              <section className="grid items-stretch gap-3.5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
                {/* LEFT WORKSPACE */}
                <div className="flex flex-col gap-3.5 min-w-0">
                  {/* TOP ROW: YOUR CAMERA & AI INTERVIEWER */}
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {/* YOUR CAMERA */}
                    <div className="flex flex-col h-[290px] rounded-2xl border border-[#168BFF]/25 hover:border-[#168BFF]/40 bg-[#0B131B] p-3.5 shadow-[0_0_20px_rgba(22,139,255,0.04)] transition-colors relative overflow-hidden">
                      {/* Subtle warm amber edge highlight */}
                      <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#FF9A2E]/5 blur-xl" aria-hidden="true" />

                      <div className="mb-2 flex shrink-0 items-center justify-between">
                        <h2 className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#F5F7FA]">
                          <Camera className="h-4 w-4 text-[#22D3EE]" />
                          Your Camera
                        </h2>
                        {cameraOn ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-[#FF4545]/30 bg-[#2A0808]/80 px-2.5 py-0.5 text-[11px] font-bold text-[#FF4545] shadow-[0_0_10px_rgba(255,69,69,0.25)]">
                            <span className="h-2 w-2 rounded-full bg-[#FF4545] animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="rounded-full border border-[#FF4545]/20 bg-[#2A0808]/40 px-2 py-0.5 text-[11px] font-medium text-[#FF4545]/80">
                            OFF
                          </span>
                        )}
                      </div>

                      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-[#04080D] border border-white/5">
                        <video
                          ref={handleVideoElementRef}
                          autoPlay
                          playsInline
                          muted
                          className={`absolute inset-0 h-full w-full object-cover object-[center_25%] ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {!cameraOn && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#74808C]">
                            <VideoOff className="mb-2 h-8 w-8 text-[#74808C]" />
                            <p className="text-xs">Camera is turned off</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleFullscreenButton}
                          className="absolute right-2.5 top-2.5 rounded-lg border border-white/10 bg-black/60 p-1.5 text-[#F5F7FA] backdrop-blur transition hover:bg-black/80 hover:text-white"
                          aria-label="Fullscreen camera"
                        >
                          <Expand className="h-3.5 w-3.5" />
                        </button>
                        <div
                          className={`absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur shadow-sm ${
                            faceStatus === 'detected'
                              ? 'border-[#168BFF]/30 bg-[#071019]/85 text-[#19D98B] shadow-[0_0_10px_rgba(25,217,139,0.15)]'
                              : faceStatus === 'multiple'
                                ? 'border-[#FF4545]/40 bg-[#071019]/85 text-[#FF4545] shadow-[0_0_10px_rgba(255,69,69,0.2)]'
                                : faceStatus === 'none'
                                  ? 'border-[#FFB020]/40 bg-[#071019]/85 text-[#FFB020] shadow-[0_0_10px_rgba(255,176,32,0.15)]'
                                  : 'border-[#168BFF]/25 bg-[#071019]/85 text-[#22D3EE]'
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3 text-[#22D3EE]" />
                          <span>
                            {faceStatus === 'detected'
                              ? 'Face Detected'
                              : faceStatus === 'multiple'
                                ? 'Multiple Faces'
                                : faceStatus === 'none'
                                  ? 'Face Not Detected'
                                  : 'Face Detection…'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${cameraOn ? 'bg-[#19D98B] shadow-[0_0_8px_rgba(25,217,139,0.5)]' : 'bg-[#FF4545]'}`} />
                          <span className="text-[#D7DEE6]">Camera: <strong className={cameraOn ? 'text-[#19D98B]' : 'text-[#FF4545]'}>{cameraOn ? 'On' : 'Off'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${micAvailable ? 'bg-[#19D98B] shadow-[0_0_8px_rgba(25,217,139,0.5)]' : 'bg-[#FF4545]'}`} />
                          <span className="text-[#D7DEE6]">Mic: <strong className={micAvailable ? 'text-[#19D98B]' : 'text-[#FF4545]'}>{micAvailable ? 'Active' : 'Off'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#74808C]">Face:</span>
                          <span className={`font-semibold ${faceStatus === 'detected' ? 'text-[#19D98B]' : faceStatus === 'multiple' ? 'text-[#FF4545]' : 'text-[#FFB020]'}`}>
                            {faceStatus === 'detected' ? 'Detected' : faceStatus === 'multiple' ? 'Multiple' : faceStatus === 'none' ? 'Not detected' : 'Checking'}
                          </span>
                        </div>
                        <div className="hidden sm:flex items-center gap-0.5" aria-hidden="true">
                          {[6, 14, 18, 11, 16, 9, 14, 6].map((h, idx) => (
                            <span
                              key={idx}
                              className={`w-0.5 rounded-full transition-all duration-150 ${micAvailable ? 'bg-[#22D3EE]' : 'bg-[#74808C]'}`}
                              style={{ height: `${micAvailable ? h : 3}px` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI INTERVIEWER */}
                    <div className="relative flex flex-col h-[290px] items-center justify-between overflow-hidden rounded-2xl border border-[#168BFF]/25 hover:border-[#168BFF]/40 bg-[radial-gradient(ellipse_at_50%_45%,rgba(22,139,255,0.08)_0%,rgba(34,211,238,0.03)_35%,rgba(255,154,46,0.02)_60%,#0B131B_85%)] p-3.5 text-center shadow-[0_0_20px_rgba(22,139,255,0.05),0_0_12px_rgba(255,154,46,0.02)] transition-colors">
                      {/* Subtle warm amber corner highlight */}
                      <div className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full bg-[#FF9A2E]/5 blur-xl" aria-hidden="true" />

                      <div className="flex w-full shrink-0 items-center justify-between font-bold text-xs sm:text-sm text-[#F5F7FA]">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-[#22D3EE]" />
                          <span>AI Interviewer</span>
                        </div>
                        <span className="flex items-center gap-1.5 rounded-full border border-[#168BFF]/35 bg-[#071019] px-2.5 py-0.5 text-[11px] font-bold text-[#F5F7FA] shadow-[0_0_10px_rgba(22,139,255,0.12)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#FF9A2E] shadow-[0_0_5px_#FF9A2E]" />
                          Round 3
                        </span>
                      </div>

                      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
                        {/* Futuristic waveforms flanking the robot: left = cyan/blue dominant, right = blue + subtle amber */}
                        <div className="pointer-events-none absolute inset-x-2 top-1/2 flex -translate-y-1/2 items-center justify-between opacity-80" aria-hidden="true">
                          {/* Left waveform cluster (cyan/blue dominant) */}
                          <div className="flex items-center gap-1">
                            {[12, 22, 34, 18, 28, 40, 24, 36, 16, 8].map((h, i) => (
                              <span
                                key={`l-${i}`}
                                className={`w-1 rounded-full bg-gradient-to-t from-[#168BFF] via-[#2196F3] to-[#22D3EE] ${aiSpeaking ? 'mockmind-orange-wave-bar' : 'opacity-40'}`}
                                style={{
                                  height: `${h}px`,
                                  animationDelay: `${(i % 5) * 0.08}s`,
                                }}
                              />
                            ))}
                          </div>
                          {/* Right waveform cluster (blue + subtle amber) */}
                          <div className="flex items-center gap-1">
                            {[8, 16, 36, 24, 40, 28, 18, 34, 22, 12].map((h, i) => (
                              <span
                                key={`r-${i}`}
                                className={`w-1 rounded-full bg-gradient-to-t from-[#168BFF] via-[#2AA7FF] to-[#FF9A2E] ${aiSpeaking ? 'mockmind-orange-wave-bar' : 'opacity-40'}`}
                                style={{
                                  height: `${h}px`,
                                  animationDelay: `${(i % 5) * 0.08}s`,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Large Robot Avatar */}
                        <div className="relative z-10 scale-[1.12] transition-transform duration-300">
                          <AIInterviewerAvatar speaking={aiSpeaking} />
                        </div>
                      </div>

                      {/* Reference box: Listen carefully and answer when you're ready */}
                      <div className="shrink-0 w-full rounded-xl border border-[#168BFF]/25 bg-[#071019]/90 px-4 py-2 text-center text-xs sm:text-[13px] font-medium text-[#D7DEE6] shadow-[0_0_12px_rgba(22,139,255,0.04)]">
                        {aiSpeaking ? '🔊 AI is speaking...' : "Listen carefully and answer when you're ready."}
                      </div>

                      {/* 5 Subtle Dots */}
                      <div className="flex items-center justify-center gap-1.5 pt-1" aria-hidden="true">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#168BFF] shadow-[0_0_6px_#168BFF]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2196F3]/80"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]/70"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2AA7FF]/50"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF9A2E]/50"></span>
                      </div>
                    </div>
                  </div>

                  {/* CURRENT QUESTION */}
                  <section className="rounded-2xl border border-[#168BFF]/25 hover:border-[#168BFF]/40 bg-[#0B131B] p-4 shadow-[0_0_20px_rgba(22,139,255,0.04)] transition-colors relative overflow-hidden">
                    {/* Subtle warm amber ambient edge glow */}
                    <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-[#FF9A2E]/5 blur-xl" aria-hidden="true" />

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#F5F7FA]">
                        <CircleHelp className="h-4 w-4 text-[#22D3EE]" />
                        <span>Current Question</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-[#168BFF]/35 bg-[#071019] px-3 py-0.5 text-xs font-bold text-[#22D3EE] shadow-[0_0_10px_rgba(22,139,255,0.12)]">
                          Question {currentQuestionIndex + 1} of {totalQuestions}
                        </span>
                        {interviewTypeLabel && (
                          <span className="hidden sm:inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[#A8B3BF]">
                            {interviewTypeLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-2.5 break-words text-base sm:text-lg lg:text-xl font-bold leading-relaxed text-[#F5F7FA]">
                      {currentQuestion}
                    </p>

                    {/* QUESTION TIP ROW & REPLAY */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-[#FF9A2E]/20 bg-[#071019] px-3.5 py-2 text-xs sm:text-[13px] text-[#D7DEE6] shadow-[inset_0_1px_10px_rgba(255,154,46,0.02)]">
                        <Lightbulb className="h-4 w-4 shrink-0 text-[#FF9A2E]" />
                        <div>
                          <strong className="text-[#FF9A2E]">Tip: </strong>
                          <span>Structure your thoughts clearly. State your approach, then give a concise example.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={replayQuestion}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#168BFF]/30 bg-[#071019] px-3.5 py-2 text-xs font-semibold text-[#22D3EE] transition hover:bg-[#168BFF]/15 hover:border-[#168BFF]/60 shadow-[0_0_10px_rgba(22,139,255,0.08)]"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-[#22D3EE]" />
                        <span>Replay Question</span>
                      </button>
                    </div>
                  </section>

                  {/* YOUR ANSWER / VOICE-TO-TEXT (SPLIT: LEFT = LISTENING/WAVEFORM, RIGHT = LIVE TRANSCRIPT) */}
                  <section className="rounded-2xl border border-[#168BFF]/25 hover:border-[#168BFF]/35 bg-[#0B131B] p-4 shadow-[0_0_20px_rgba(22,139,255,0.04)] transition-colors relative overflow-hidden">
                    {/* Subtle warm amber ambient accent */}
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#FF9A2E]/4 blur-xl" aria-hidden="true" />

                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#F5F7FA]">
                        <Mic className="h-4 w-4 text-[#22D3EE]" />
                        Your Answer
                      </h2>
                      <span className="flex items-center gap-1.5 rounded-full border border-[#168BFF]/30 bg-[#071019] px-3 py-0.5 text-xs font-bold text-[#22D3EE] shadow-[0_0_10px_rgba(22,139,255,0.1)]">
                        <Mic className="h-3.5 w-3.5" />
                        Voice-to-Text Enabled
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
                      {/* LEFT: MIC BUTTON, STATUS, WAVEFORM */}
                      <div className="flex flex-col justify-between rounded-xl border border-[#168BFF]/20 bg-[#071019] p-3 shadow-[0_0_15px_rgba(22,139,255,0.03)]">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={toggleVoiceRecording}
                            disabled={!voiceSupported || loading || aiSpeaking}
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${
                              recording
                                ? 'border-[#FF4545] bg-[#FF4545]/20 text-[#FF4545] shadow-[0_0_20px_rgba(255,69,69,0.4)] animate-pulse'
                                : 'border-[#168BFF]/50 bg-[#168BFF]/15 text-[#22D3EE] hover:bg-[#168BFF]/25 shadow-[0_0_15px_rgba(22,139,255,0.2)]'
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                            aria-label={recording ? 'Stop answering' : 'Start voice answer'}
                          >
                            {recording ? (
                              <Square className="h-5 w-5 fill-current text-[#FF4545]" />
                            ) : (
                              <Mic className="h-5 w-5 text-[#22D3EE]" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-sm text-[#F5F7FA]">
                              {recording ? 'Listening...' : voiceTranscript ? 'Answer captured' : 'Ready for answer'}
                            </p>
                            <p className="text-[11px] text-[#A8B3BF] truncate">
                              {recording ? 'Speak now clearly' : voiceTranscript ? 'Voice captured' : 'Click mic to answer'}
                            </p>
                          </div>
                        </div>

                        {/* WAVEFORM */}
                        <div className="mt-3 flex h-7 items-center justify-center gap-1 rounded-lg bg-[#04080D] px-2.5 border border-white/5" aria-hidden="true">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-0.5 rounded-full ${
                                recording
                                  ? 'mockmind-orange-wave-bar bg-gradient-to-t from-[#168BFF] via-[#22D3EE] to-[#FF9A2E]'
                                  : 'bg-[#168BFF]/25'
                              }`}
                              style={{
                                height: `${5 + ((i * 7) % 18)}px`,
                                animationDelay: `${(i % 8) * 0.06}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* RIGHT: LIVE TRANSCRIPT */}
                      <div className="flex flex-col min-h-[105px] rounded-xl border border-[#168BFF]/20 bg-[#071019] p-3 shadow-[0_0_15px_rgba(22,139,255,0.03)]">
                        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#A8B3BF]">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
                            Live Transcript
                          </span>
                          {voiceTranscript && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#19D98B]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#19D98B] animate-pulse" />
                              Real-time Active
                            </span>
                          )}
                        </div>
                        {voiceTranscript ? (
                          <div className="flex-1 overflow-y-auto max-h-[85px] text-xs sm:text-sm leading-relaxed text-[#F5F7FA] mockmind-progress-scroll pr-1">
                            {voiceTranscript}
                          </div>
                        ) : (
                          <div className="flex flex-1 items-center justify-center text-center text-xs sm:text-[13px] text-[#74808C] italic">
                            Your voice response will transcribe here in real time...
                          </div>
                        )}
                      </div>
                    </div>

                    {error && <p className="mt-1.5 text-center text-xs text-[#FF4545]">{error}</p>}
                  </section>
                </div>

                {/* RIGHT WORKSPACE: PROGRESS + TIPS */}
                <div className="flex flex-col gap-3.5 min-w-0 h-full">
                  {/* INTERVIEW PROGRESS (FIXED HEIGHT CARD WITH INTERNAL AUTO-SCROLL) */}
                  <div className="flex h-[390px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#168BFF]/25 bg-[#0B131B] p-4 shadow-[0_0_20px_rgba(22,139,255,0.04)]">
                    <div className="flex shrink-0 items-center justify-between">
                      <h2 className="font-bold text-xs sm:text-sm text-[#F5F7FA]">Interview Progress</h2>
                      <span className="rounded-full border border-[#168BFF]/35 bg-[#071019] px-2.5 py-0.5 text-[11px] font-bold text-[#22D3EE] shadow-[0_0_10px_rgba(22,139,255,0.12)]">
                        {Math.round(((currentQuestionIndex) / totalQuestions) * 100)}%
                      </span>
                    </div>

                    {/* Circular Progress Indicator */}
                    <div className="relative mx-auto my-2.5 flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="mockmindBlueProgress" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#168BFF" />
                            <stop offset="80%" stopColor="#22D3EE" />
                            <stop offset="100%" stopColor="#FF9A2E" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="rgba(22, 139, 255, 0.12)"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="url(#mockmindBlueProgress)"
                          strokeWidth="6"
                          strokeDasharray={238.76}
                          strokeDashoffset={238.76 - (238.76 * (currentQuestionIndex + 1)) / totalQuestions}
                          strokeLinecap="round"
                          fill="none"
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <p className="text-lg font-extrabold text-[#F5F7FA] leading-none">{currentQuestionIndex + 1} / {totalQuestions}</p>
                        <p className="text-[10px] uppercase tracking-wider text-[#A8B3BF] mt-1 font-medium">Questions</p>
                      </div>
                    </div>

                    {/* Questions list title */}
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#A8B3BF]">
                      <span>Questions</span>
                      <span className="text-[#74808C]">{currentQuestionIndex + 1} of {totalQuestions}</span>
                    </div>

                    {/* Questions scrollable list (Internal scroll only, auto-scrolls to active question) */}
                    <div
                      className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-1 mockmind-progress-scroll"
                      aria-label="Interview question progress"
                    >
                      {Array.from({ length: totalQuestions }).map((_, i) => {
                        const isActive = i === currentQuestionIndex;
                        const isCompleted = i < currentQuestionIndex;

                        return (
                          <div
                            key={i}
                            ref={isActive ? activeQuestionRef : null}
                            className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-colors ${
                              isActive
                                ? 'border-[#168BFF] bg-[#168BFF]/15 shadow-[0_0_12px_rgba(22,139,255,0.15)]'
                                : isCompleted
                                  ? 'border-[#19D98B]/20 bg-[#19D98B]/5'
                                  : 'border-white/5 bg-[#091018]/60'
                            }`}
                          >
                            {isCompleted ? (
                              <CircleCheck className="h-4 w-4 shrink-0 text-[#19D98B]" />
                            ) : isActive ? (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FFB84D] to-[#FF9A2E] text-[10px] font-bold text-black shadow-[0_0_8px_rgba(255,154,46,0.35)]">
                                {i + 1}
                              </span>
                            ) : (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] text-[#74808C]">
                                {i + 1}
                              </span>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className={`text-xs ${isActive ? 'font-bold text-[#F5F7FA]' : isCompleted ? 'text-[#D7DEE6]' : 'text-[#74808C]'}`}>
                                Question {i + 1}
                              </p>
                              <p className={`text-[10px] ${isActive ? 'text-[#FF9A2E] font-medium' : isCompleted ? 'text-[#19D98B]/80' : 'text-[#74808C]'}`}>
                                {isActive ? 'In Progress' : isCompleted ? 'Completed' : 'Pending'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Answer Time */}
                    <div className="mt-2.5 shrink-0 rounded-xl border border-[#168BFF]/20 bg-[#071019] p-2.5">
                      <div className="flex items-center justify-between text-xs text-[#A8B3BF]">
                        <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                          <Clock3 className="h-3.5 w-3.5 text-[#22D3EE]" />
                          Answer Time
                        </span>
                        <span className="font-mono font-bold text-xs text-[#22D3EE]">
                          {formatTime(timeLeft)} <span className="text-[10px] font-normal text-[#74808C]">/ 01:00</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#168BFF] via-[#22D3EE] to-[#FF9A2E] transition-all duration-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                          style={{ width: `${answerProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* TIPS FOR A GREAT ANSWER (RESPONSIVE FLEXIBLE HEIGHT) */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#168BFF]/25 bg-[#0B131B] p-4 shadow-[0_0_20px_rgba(22,139,255,0.04)] flex-1 min-h-[185px] flex flex-col justify-between">
                    {/* Subtle cyan/blue dotted technology pattern */}
                    <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(#168BFF_1px,transparent_1px)] [background-size:12px_12px]" aria-hidden="true" />

                    {/* Subtle decorative flowing wave in corner behind content */}
                    <svg className="pointer-events-none absolute -bottom-2 -right-2 h-36 w-48 opacity-25" viewBox="0 0 200 120" fill="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="mockmindTipsWaveBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#18D5FF" stopOpacity="0" />
                          <stop offset="50%" stopColor="#168BFF" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.4" />
                        </linearGradient>
                        <linearGradient id="mockmindTipsWaveAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#FF9A2E" stopOpacity="0" />
                          <stop offset="60%" stopColor="#FF9A2E" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#FFB84D" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,80 Q50,40 100,70 T200,45" stroke="url(#mockmindTipsWaveBlue)" strokeWidth="2" />
                      <path d="M0,95 Q60,60 120,85 T200,65" stroke="url(#mockmindTipsWaveAmber)" strokeWidth="1.5" />
                    </svg>

                    <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-gradient-to-tl from-[#22D3EE]/15 via-[#168BFF]/10 to-[#FF9A2E]/5 blur-xl" aria-hidden="true" />
                    
                    {/* Reference decorative "Good Luck!" stamp */}
                    <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col items-center justify-center rounded-xl border border-[#168BFF]/25 bg-[#071019]/85 px-3 py-1.5 backdrop-blur-sm shadow-[0_0_15px_rgba(22,139,255,0.1)] select-none" aria-hidden="true">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#22D3EE] leading-none">GOOD</span>
                      <span className="text-[13px] font-black uppercase tracking-wider text-[#FF9A2E] leading-tight">LUCK!</span>
                    </div>

                    <div className="relative z-10">
                      <div className="mb-2.5 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#168BFF]/35 bg-[#168BFF]/15 shadow-[0_0_10px_rgba(22,139,255,0.15)]">
                          <Lightbulb className="h-3.5 w-3.5 text-[#22D3EE]" />
                        </div>
                        <h2 className="font-bold text-xs sm:text-sm text-[#F5F7FA]">
                          Tips for a Great Answer
                        </h2>
                      </div>

                      <ul className="space-y-1.5 text-xs text-[#D7DEE6] max-w-[220px]">
                        {[
                          'Speak clearly and confidently',
                          'Maintain good eye contact',
                          'Take your time',
                          'Be confident',
                          'Give structured answers',
                        ].map((tip) => (
                          <li key={tip} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative z-10 mt-auto pt-3">
                      <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-[#168BFF]/40 via-[#22D3EE]/20 to-transparent" />
                    </div>
                  </div>
                </div>
              </section>

              {/* BOTTOM ACTION BAR */}
              <section className="mt-3.5 grid gap-3 sm:grid-cols-[1fr_1.6fr_1fr]">
                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 rounded-2xl border border-[#168BFF]/35 bg-[#091018] px-5 py-3 text-xs sm:text-sm font-bold text-[#F5F7FA] transition hover:bg-[#168BFF]/15 hover:border-[#168BFF]/60 disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_0_15px_rgba(22,139,255,0.06)] min-h-[64px]"
                >
                  <SkipForward className="h-5 w-5 shrink-0 text-[#22D3EE]" />
                  <div className="text-left">
                    <p className="font-bold leading-tight text-[#F5F7FA]">Skip Question</p>
                    <p className="text-[11px] font-normal text-[#A8B3BF]">Skip and move to next</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAndNext}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#FFB84D] via-[#FF9A2E] to-[#F27A18] px-5 py-3 text-xs sm:text-sm font-extrabold text-black shadow-[0_0_25px_rgba(255,154,46,0.35)] transition hover:brightness-110 hover:shadow-[0_0_35px_rgba(255,154,46,0.5)] disabled:cursor-not-allowed disabled:opacity-40 min-h-[64px]"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-black" />
                  ) : (
                    <div className="text-center">
                      <p className="font-extrabold text-sm sm:text-base leading-tight">
                        {currentQuestionIndex === totalQuestions - 1 ? 'Submit & Finish Interview' : 'Next Question →'}
                      </p>
                      <p className="text-[11px] font-medium text-black/80">
                        {currentQuestionIndex === totalQuestions - 1 ? 'Final submission' : 'Save answer and go to next'}
                      </p>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitInterview}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 rounded-2xl border border-[#19D98B]/40 bg-[#091018] px-5 py-3 text-xs sm:text-sm font-bold text-[#19D98B] transition hover:bg-[#19D98B]/15 hover:border-[#19D98B]/70 disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_0_15px_rgba(25,217,139,0.08)] min-h-[64px]"
                >
                  <Check className="h-5 w-5 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold leading-tight">Submit Interview</p>
                    <p className="text-[11px] font-normal text-[#19D98B]/75">Submit and finish interview</p>
                  </div>
                </button>
              </section>

              {/* SECURITY FOOTER */}
              <div className="mt-2.5 flex items-center justify-center gap-2 text-center text-xs text-[#74808C]">
                <LockKeyhole className="h-3.5 w-3.5 text-[#22D3EE]" />
                <span>Your video and audio are secure and encrypted. Only used for this interview session.</span>
              </div>
            </>
          )}
        </main>
      )}
        </>
      )}
    </div>
  );
};

export default AIInterview;
