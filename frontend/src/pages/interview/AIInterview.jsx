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
      {/* Background glow matching dark cinematic Cyan + Orange depth */}
      <div
        className={`absolute h-44 w-44 rounded-full bg-gradient-to-r from-cyan-500/25 via-sky-500/10 to-orange-500/20 blur-3xl transition-all duration-700 ${
          speaking
            ? 'scale-125 opacity-100'
            : 'scale-100 opacity-75'
        }`}
      />

      {/* AI VOICE WAVEFORM — dual-color spectrum: Cyan on left, Orange on right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-1/2 z-0 flex h-16 -translate-y-1/2 items-center justify-center gap-1.5 opacity-85"
      >
        {[24, 38, 52, 68, 46, 74, 58, 36, 62, 44, 70, 50, 30].map((height, index) => {
          const isLeft = index < 6;
          const isCenter = index === 6;
          const barGradient = isLeft
            ? 'from-[#00BFFF]/30 via-[#00E5FF] to-[#08C8FF]'
            : isCenter
              ? 'from-[#00E5FF] via-[#FF9D2E] to-[#FF8A00]'
              : 'from-[#FF8A00]/30 via-[#FF9D2E] to-[#FFB347]';

          return (
            <span
              key={index}
              className={`mockmind-wave-bar w-1 rounded-full bg-gradient-to-t ${barGradient} ${speaking ? 'opacity-100' : 'opacity-50'}`}
              style={{
                height: `${height}%`,
                animationDelay: `${index * 0.06}s`,
                animationPlayState: speaking ? 'running' : 'paused',
              }}
            />
          );
        })}
      </div>

      {/* ROBOT */}
      <div
        className={`relative z-10 flex flex-col items-center ${
          speaking
            ? 'mockmind-robot-speaking'
            : 'mockmind-robot-idle'
        }`}
      >
        {/* Antenna — Warm Orange Accent matching Reference #4 */}
        <div className="flex flex-col items-center">
          <div
            className={`h-4 w-4 rounded-full border-2 border-orange-100 bg-[#FF8A00] shadow-[0_0_18px_rgba(255,138,0,0.95)] ${
              speaking ? 'mockmind-antenna-speaking' : ''
            }`}
          />

          <div className="h-6 w-[3px] bg-gradient-to-b from-[#FF8A00] via-[#D96A00] to-slate-500" />
        </div>

        {/* Head */}
        <div
          className={`relative flex h-[112px] w-[150px] items-center justify-center rounded-[38px] border-[4px] bg-gradient-to-br from-slate-100 via-slate-300 to-slate-600 shadow-2xl transition-all duration-300 ${
            speaking
              ? 'border-cyan-200 shadow-[0_0_50px_rgba(0,229,255,0.4)]'
              : 'border-slate-300 shadow-[0_0_30px_rgba(0,229,255,0.15)]'
          }`}
        >
          {/* Left ear — Cyan */}
          <div className="absolute -left-5 top-[30px] h-[52px] w-[22px] rounded-l-2xl border-2 border-cyan-300/60 bg-gradient-to-b from-slate-300 to-slate-600">
            <div className="absolute inset-y-2 right-1 w-1 rounded-full bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.85)]" />
          </div>

          {/* Right ear — Warm Orange */}
          <div className="absolute -right-5 top-[30px] h-[52px] w-[22px] rounded-r-2xl border-2 border-amber-400/50 bg-gradient-to-b from-slate-300 to-slate-600">
            <div className="absolute inset-y-2 left-1 w-1 rounded-full bg-[#FF8A00] shadow-[0_0_10px_rgba(255,138,0,0.9)]" />
          </div>

          {/* Face */}
          <div className="relative h-[82px] w-[120px] overflow-hidden rounded-[28px] border border-cyan-400/40 bg-gradient-to-b from-[#061827] to-[#020817] shadow-inner">
            {/* Face glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent" />

            {/* Eyes */}
            <div className="absolute left-0 right-0 top-[25px] flex justify-center gap-8">
              <div className="mockmind-robot-eye h-[15px] w-[15px] rounded-full bg-[#00E5FF] shadow-[0_0_16px_rgba(0,229,255,1)]" />

              <div
                className="mockmind-robot-eye h-[15px] w-[15px] rounded-full bg-[#00E5FF] shadow-[0_0_16px_rgba(0,229,255,1)]"
                style={{ animationDelay: '0.05s' }}
              />
            </div>

            {/* Mouth */}
            <div className="absolute bottom-[15px] left-1/2 -translate-x-1/2">
              {speaking ? (
                <div className="mockmind-robot-mouth h-[12px] w-[28px] rounded-full border-2 border-cyan-300 bg-cyan-400/10 shadow-[0_0_12px_rgba(0,229,255,0.9)]" />
              ) : (
                <div className="h-[9px] w-[28px] rounded-b-full border-b-[3px] border-cyan-300 shadow-[0_3px_8px_rgba(0,229,255,0.6)]" />
              )}
            </div>
          </div>
        </div>

        {/* Neck */}
        <div className="h-3 w-8 bg-gradient-to-b from-slate-300 to-slate-600" />

        {/* Body */}
        <div className="relative -mt-1 h-[46px] w-[105px] rounded-t-[38px] border-2 border-slate-300 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-600 shadow-xl">
          {/* Small Warm Orange Body Accent + Cyan Core Light */}
          <div
            className={`absolute left-1/2 top-2.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-amber-200 bg-gradient-to-br from-[#00E5FF] via-[#FF9D2E] to-[#FF8A00] shadow-[0_0_16px_rgba(0,229,255,0.85),0_0_10px_rgba(255,138,0,0.7)] ${
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
          scrollbar-color: rgba(0, 210, 255, 0.4) transparent;
        }

        .mockmind-progress-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .mockmind-progress-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .mockmind-progress-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 210, 255, 0.35);
          border-radius: 9999px;
        }

        .mockmind-progress-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 136, 0, 0.65);
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

        @keyframes mockmindAmbientBreathe {
          0%, 100% {
            opacity: 0.12;
            transform: scale(1);
          }
          50% {
            opacity: 0.20;
            transform: scale(1.05);
          }
        }

        .mockmind-ambient-breathe {
          animation: mockmindAmbientBreathe 14s ease-in-out infinite;
        }

        @keyframes mockmindCyanWaveFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(2%, -15px, 0) scaleY(1.08);
          }
        }

        .mockmind-cyan-wave {
          animation: mockmindCyanWaveFloat 24s ease-in-out infinite;
        }

        @keyframes mockmindOrangeWaveFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(-2.5%, 18px, 0) scaleY(0.94);
          }
        }

        .mockmind-orange-wave {
          animation: mockmindOrangeWaveFloat 28s ease-in-out infinite;
        }

        @keyframes mockmindRingPulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.02);
          }
        }

        .mockmind-ring-pulse {
          animation: mockmindRingPulse 3.5s ease-in-out infinite;
        }

        @keyframes mockmindHeaderWaveFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-35px, 0, 0);
          }
        }

        .mockmind-header-wave {
          animation: mockmindHeaderWaveFloat 24s ease-in-out infinite alternate;
        }

        @keyframes mockmindBadgePulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
            border-color: rgba(0, 210, 255, 0.35);
          }
          50% {
            box-shadow: 0 0 16px rgba(0, 210, 255, 0.4), 0 0 8px rgba(255, 136, 0, 0.2);
            border-color: rgba(0, 210, 255, 0.55);
          }
        }

        .mockmind-badge-pulse {
          animation: mockmindBadgePulse 4s ease-in-out infinite;
        }

        @keyframes mockmindLowerWaveFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(1.5%, -12px, 0) scaleY(1.06);
          }
        }

        .mockmind-lower-wave {
          animation: mockmindLowerWaveFloat 32s ease-in-out infinite;
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
          .mockmind-orange-wave-bar,
          .mockmind-ambient-breathe,
          .mockmind-ring-pulse {
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

  // Separate Face Landmarker for Round 3 gaze-proxy analytics.
  // The existing FaceDetector continues to handle face-presence checks.
  const gazeLandmarkerRef = useRef(null);
  const gazeLandmarkerInitRef = useRef(null);
  const preflightCanvasRef = useRef(null);
  const preflightAudioContextRef = useRef(null);
  const micTestRecognitionRef = useRef(null);
  const greetingSpokenRef = useRef(false);
  const micConfirmationSpokenRef = useRef(false);
  const micConfirmationInProgressRef = useRef(false);
  const setupCompletionSpokenRef = useRef(false);

  /* =======================================================
     ROUND 3 CAMERA ANALYTICS — STEP 3
     -------------------------------------------------------
     Collects only observable camera data during the active interview.
     No fabricated eye-contact or gaze scores are generated because the
     existing detector is a face-presence detector, not a gaze tracker.
     ======================================================= */
  const cameraAnalyticsRef = useRef({
    sampleAttempts: 0,
    stableSamples: 0,
    faceDetectedSamples: 0,
    noFaceSamples: 0,
    multipleFaceSamples: 0,
    gazeSamples: 0,
    eyeContactSamples: 0,
    lookingAwaySamples: 0,
    startedAt: null,
  });

  // The camera detection loop is intentionally created only when the camera
  // becomes available. Keep the latest Round 3 state in a ref so the loop
  // never uses a stale React-state value when deciding whether to record
  // interview analytics.
  const round3StateRef = useRef(round3State);

  useEffect(() => {
    round3StateRef.current = round3State;
  }, [round3State]);

  const resetCameraAnalytics = () => {
    cameraAnalyticsRef.current = {
      sampleAttempts: 0,
      stableSamples: 0,
      faceDetectedSamples: 0,
      noFaceSamples: 0,
      multipleFaceSamples: 0,
      gazeSamples: 0,
      eyeContactSamples: 0,
      lookingAwaySamples: 0,
      startedAt: Date.now(),
    };
  };

  const recordCameraObservation = (result) => {
    if (
      !interviewStartedRef.current ||
      round3StateRef.current !== 'interview_active'
    ) {
      return;
    }

    const metrics = cameraAnalyticsRef.current;
    metrics.sampleAttempts += 1;

    if (result?.cameraStable) {
      metrics.stableSamples += 1;
    }

    if (result?.faceCount === 1) {
      metrics.faceDetectedSamples += 1;

      if (result?.gaze?.available) {
        metrics.gazeSamples += 1;
        if (result.gaze.eyeContact) metrics.eyeContactSamples += 1;
        if (result.gaze.lookingAway) metrics.lookingAwaySamples += 1;
      }
    } else if (result?.faceCount === 0) {
      metrics.noFaceSamples += 1;
    } else if (result?.faceCount > 1) {
      metrics.multipleFaceSamples += 1;
    }
  };

  const buildCameraMetrics = () => {
    const metrics = cameraAnalyticsRef.current;
    const observations =
      metrics.faceDetectedSamples +
      metrics.noFaceSamples +
      metrics.multipleFaceSamples;

    const faceVisibility = observations > 0
      ? Math.round((metrics.faceDetectedSamples / observations) * 100)
      : null;

    const cameraStability = metrics.sampleAttempts > 0
      ? Math.round((metrics.stableSamples / metrics.sampleAttempts) * 100)
      : null;

    const eyeContact = metrics.gazeSamples > 0
      ? Math.round((metrics.eyeContactSamples / metrics.gazeSamples) * 100)
      : null;

    const lookingAway = metrics.gazeSamples > 0
      ? Math.round((metrics.lookingAwaySamples / metrics.gazeSamples) * 100)
      : null;

    const cameraComponents = [
      faceVisibility,
      eyeContact,
      cameraStability,
    ].filter((value) => value !== null);

    const cameraScore = cameraComponents.length > 0
      ? Math.round(
          cameraComponents.reduce((sum, value) => sum + value, 0) /
            cameraComponents.length
        )
      : null;

    return {
      score: cameraScore,
      face_visibility: faceVisibility,
      eye_contact: eyeContact,
      looking_away: lookingAway,
      camera_stability: cameraStability,
      samples: observations,
      stable_samples: metrics.stableSamples,
      face_detected_samples: metrics.faceDetectedSamples,
      no_face_samples: metrics.noFaceSamples,
      multiple_face_samples: metrics.multipleFaceSamples,
      gaze_samples: metrics.gazeSamples,
      eye_contact_samples: metrics.eyeContactSamples,
      looking_away_samples: metrics.lookingAwaySamples,
      measurement_note:
        'Face visibility and camera stability are measured from the existing face detector. Eye contact and looking away are estimated from facial/iris landmarks as gaze proxies, not definitive gaze measurements.',
      started_at: metrics.startedAt
        ? new Date(metrics.startedAt).toISOString()
        : null,
    };
  };

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
      transcript: payload.transcript,
      duration_seconds: payload.duration_seconds,
      // STEP 3: send the real per-question camera observations to the
      // existing AIAnswerSubmit.camera_metrics field.
      camera_metrics: payload.camera_metrics,
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

  const createGazeLandmarker = () => {
    if (gazeLandmarkerRef.current) {
      return Promise.resolve(gazeLandmarkerRef.current);
    }

    if (gazeLandmarkerInitRef.current) {
      return gazeLandmarkerInitRef.current;
    }

    gazeLandmarkerInitRef.current = (async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm'
        );

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
        );

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.25,
          minFacePresenceConfidence: 0.25,
          minTrackingConfidence: 0.25,
        });

        gazeLandmarkerRef.current = landmarker;
        return landmarker;
      } catch (error) {
        gazeLandmarkerRef.current = null;
        console.warn('Round 3 gaze landmarker unavailable:', error);
        return null;
      } finally {
        gazeLandmarkerInitRef.current = null;
      }
    })();

    return gazeLandmarkerInitRef.current;
  };

  const estimateGazeProxy = (landmarks) => {
    if (!Array.isArray(landmarks) || landmarks.length < 478) {
      return { available: false, eyeContact: false, lookingAway: false };
    }

    const averagePoint = (indices) => {
      const points = indices.map((index) => landmarks[index]).filter(Boolean);
      if (!points.length) return null;
      return {
        x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
        y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
      };
    };

    const leftOuter = landmarks[33];
    const leftInner = landmarks[133];
    const rightInner = landmarks[362];
    const rightOuter = landmarks[263];
    const leftTop = landmarks[159];
    const leftBottom = landmarks[145];
    const rightTop = landmarks[386];
    const rightBottom = landmarks[374];
    const leftIris = averagePoint([468, 469, 470, 471, 472]);
    const rightIris = averagePoint([473, 474, 475, 476, 477]);

    if (
      !leftOuter || !leftInner || !rightInner || !rightOuter ||
      !leftTop || !leftBottom || !rightTop || !rightBottom ||
      !leftIris || !rightIris
    ) {
      return { available: false, eyeContact: false, lookingAway: false };
    }

    const normalize = (point, start, end) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const lengthSquared = dx * dx + dy * dy;
      if (lengthSquared < 0.000001) return null;
      return ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
    };

    const leftX = normalize(leftIris, leftOuter, leftInner);
    const rightX = normalize(rightIris, rightInner, rightOuter);
    const leftY = normalize(leftIris, leftTop, leftBottom);
    const rightY = normalize(rightIris, rightTop, rightBottom);

    if ([leftX, rightX, leftY, rightY].some((value) => value === null)) {
      return { available: false, eyeContact: false, lookingAway: false };
    }

    const centered =
      leftX >= 0.25 && leftX <= 0.75 &&
      rightX >= 0.25 && rightX <= 0.75 &&
      leftY >= 0.25 && leftY <= 0.75 &&
      rightY >= 0.25 && rightY <= 0.75;

    return {
      available: true,
      eyeContact: centered,
      lookingAway: !centered,
    };
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

      let gaze = {
        available: false,
        eyeContact: false,
        lookingAway: false,
      };

      // Only perform gaze-proxy analysis during the active interview and
      // when exactly one face is visible. Pre-flight remains face detection only.
      if (
        detections.length === 1 &&
        interviewStartedRef.current &&
        round3StateRef.current === 'interview_active'
      ) {
        try {
          const gazeLandmarker = await createGazeLandmarker();
          if (gazeLandmarker) {
            const gazeResult = gazeLandmarker.detectForVideo(
              canvas,
              Math.round(performance.now())
            );
            gaze = estimateGazeProxy(gazeResult?.faceLandmarks?.[0]);
          }
        } catch (gazeError) {
          console.warn('Round 3 gaze sample failed:', gazeError);
        }
      }

      // STEP 3: record only observable camera/face data for the active
      // question. Gaze values are recorded only when real landmarks exist.
      recordCameraObservation({
        cameraStable: Boolean(
          video.readyState >= 2 &&
          video.videoWidth >= 2 &&
          mediaStreamRef.current?.getVideoTracks?.()[0]?.readyState === 'live'
        ),
        faceCount: detections.length,
        gaze,
      });

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

      // STEP 3: begin camera analytics only when the first interview question
      // becomes active. Readiness/setup observations are excluded.
      resetCameraAnalytics();

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

      // STEP 3: each question gets its own camera analytics window so the
      // feedback service can aggregate real per-answer observations.
      resetCameraAnalytics();

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
      duration_seconds: Math.max(0, QUESTION_TIME - timeLeft),
      submitted_at: new Date().toISOString(),
      // STEP 3: persist only real camera observations collected while
      // answering this question. Missing gaze data stays null.
      camera_metrics: buildCameraMetrics(),
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

      try {
        gazeLandmarkerRef.current?.close?.();
      } catch {}
      gazeLandmarkerRef.current = null;
      gazeLandmarkerInitRef.current = null;

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
    <div className="min-h-screen bg-[#030609] text-[#F5F7FA] relative overflow-x-hidden selection:bg-[#00E5FF]/30 selection:text-white">
      {/* ===================================================
          MOCKMIND AI — 5-LAYER CINEMATIC BACKGROUND SYSTEM
          Deep Black/Navy base + Cyan & Orange atmosphere + Waves + Dots
      ==================================================== */}
      {/* LAYER 1: Cyan / Electric Blue Atmospheric Glow (Top-Left) */}
      <div 
        className="fixed -top-[120px] -left-[100px] w-[950px] h-[750px] pointer-events-none z-0 mockmind-ambient-breathe"
        style={{
          background: 'radial-gradient(ellipse at 25% 20%, rgba(0, 229, 255, 0.16) 0%, rgba(8, 200, 255, 0.07) 40%, rgba(3, 15, 38, 0.015) 70%, transparent 85%)',
          filter: 'blur(70px)',
        }}
      />

      {/* LAYER 2: Warm Orange / Amber Atmospheric Glow (Top-Right) */}
      <div 
        className="fixed -top-[120px] -right-[100px] w-[950px] h-[750px] pointer-events-none z-0 mockmind-ambient-breathe"
        style={{
          background: 'radial-gradient(ellipse at 80% 18%, rgba(255, 138, 0, 0.15) 0%, rgba(255, 157, 46, 0.07) 40%, rgba(38, 15, 5, 0.015) 70%, transparent 85%)',
          filter: 'blur(70px)',
        }}
      />

      {/* LAYER 3: Secondary Blue & Orange Lower Atmospheric Anchor */}
      <div 
        className="fixed -bottom-[120px] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 85%, rgba(0, 191, 255, 0.10) 0%, rgba(8, 119, 184, 0.04) 50%, transparent 75%)',
          filter: 'blur(75px)',
        }}
      />
      <div 
        className="fixed -bottom-[80px] -right-[60px] w-[650px] h-[450px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 85%, rgba(255, 138, 0, 0.09) 0%, rgba(245, 166, 35, 0.03) 45%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* LAYER 4: Dark Cinematic Vignette Transitions */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(1400px 950px at 50% 45%, transparent 45%, rgba(5, 8, 13, 0.7) 80%, #030609 100%)',
        }}
      />

      {/* LAYER 5: DECORATIVE FLOWING WAVES (TOP & LOWER) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 select-none" aria-hidden="true">
        {/* Upper Blue / Cyan Flowing Wave */}
        <svg className="absolute w-[180%] sm:w-[130%] h-[550px] top-[12%] -left-[15%] mockmind-cyan-wave" viewBox="0 0 1440 450" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mockmindCyanBgWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00BFFF" stopOpacity="0" />
              <stop offset="25%" stopColor="#00E5FF" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#08C8FF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mockmindCyanBgFill" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,220 C320,320 420,120 720,240 C1020,360 1120,160 1440,260 L1440,450 L0,450 Z" fill="url(#mockmindCyanBgFill)" />
          <path d="M0,220 C320,320 420,120 720,240 C1020,360 1120,160 1440,260" stroke="url(#mockmindCyanBgWave)" strokeWidth="2" />
          <path d="M0,250 C300,340 450,150 720,260 C990,370 1140,190 1440,280" stroke="url(#mockmindCyanBgWave)" strokeWidth="1" strokeDasharray="6 8" opacity="0.6" />
        </svg>

        {/* Upper Orange / Amber Flowing Wave */}
        <svg className="absolute w-[180%] sm:w-[130%] h-[520px] top-[18%] -right-[15%] mockmind-orange-wave" viewBox="0 0 1440 450" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mockmindOrangeBgWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF8A00" stopOpacity="0" />
              <stop offset="35%" stopColor="#FF9D2E" stopOpacity="0.45" />
              <stop offset="75%" stopColor="#FF8A00" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#FF8A00" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mockmindOrangeBgFill" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#FF8A00" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,280 C360,160 500,340 820,200 C1140,60 1260,300 1440,180 L1440,450 L0,450 Z" fill="url(#mockmindOrangeBgFill)" />
          <path d="M0,280 C360,160 500,340 820,200 C1140,60 1260,300 1440,180" stroke="url(#mockmindOrangeBgWave)" strokeWidth="1.8" />
        </svg>

        {/* Lower Background Wave — flowing blue/orange energy behind buttons & footer */}
        <svg className="absolute w-[180%] sm:w-[130%] h-[360px] -bottom-[40px] -left-[15%] mockmind-lower-wave" viewBox="0 0 1440 320" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mockmindLowerWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
              <stop offset="30%" stopColor="#00E5FF" stopOpacity="0.35" />
              <stop offset="65%" stopColor="#08C8FF" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#FF8A00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FF9D2E" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mockmindLowerOrangeWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF8A00" stopOpacity="0" />
              <stop offset="35%" stopColor="#FF9D2E" stopOpacity="0.28" />
              <stop offset="75%" stopColor="#FF8A00" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#FF8A00" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,160 C380,80 620,240 980,120 C1200,40 1340,180 1440,100" stroke="url(#mockmindLowerWaveGrad)" strokeWidth="1.8" />
          <path d="M0,210 C340,150 560,280 920,180 C1140,120 1300,240 1440,170" stroke="url(#mockmindLowerOrangeWaveGrad)" strokeWidth="1.3" strokeDasharray="6 8" />
        </svg>
      </div>

      {/* Decorative dot matrix layer (Subtle technical texture matching Reference C) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.06] select-none" 
        style={{
          backgroundImage: 'radial-gradient(circle, #00E5FF 0.9px, transparent 0.9px)',
          backgroundSize: '30px 30px',
        }}
        aria-hidden="true"
      />

      {interviewComplete ? (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_16px_36px_rgba(0,0,0,0.6)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#19D98B]/30 bg-[#19D98B]/10 text-[#19D98B]">
              <CheckCircle2 className="h-8 w-8 text-[#19D98B]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA]">Interview Complete</h1>
            <p className="mt-3 text-[#A5AFBC]">You completed all {totalQuestions} questions in your {selectedRole} interview.</p>
            <p className="mt-2 text-sm text-[#687483]">Your Round 3 responses have been saved for feedback generation.</p>
            <button
              type="button"
              onClick={() => navigate('/feedback')}
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-[#FF8A00] via-[#FF9D2E] to-[#D96A00] hover:from-[#FFA742] hover:via-[#FFB347] hover:to-[#E07200] px-6 py-3.5 font-bold text-black shadow-[0_4px_24px_rgba(255,138,0,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_32px_rgba(255,138,0,0.55)] active:translate-y-0 cursor-pointer"
            >
              Continue to Feedback
            </button>
          </div>
        </div>
      ) : (
        <>
      {/* ===================================================
          MASTER HEADER (DARK CINEMATIC CYAN + ORANGE SYSTEM)
      ==================================================== */}
      <header className="sticky top-0 z-50 h-[64px] min-h-[64px] px-[clamp(14px,1.7vw,28px)] flex items-center justify-between bg-[#071019]/90 backdrop-blur-md text-[#F5F7FA] border-b border-white/[0.08] relative transition-all overflow-hidden">
        {/* Animated dual-wave SVG background in header — Orange & Cyan clearly visible per Reference #4 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0 select-none" aria-hidden="true">
          <svg className="absolute w-[160%] sm:w-[130%] h-full -left-[15%] top-0 mockmind-header-wave" viewBox="0 0 1200 64" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="headerCyanWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00BFFF" stopOpacity="0" />
                <stop offset="30%" stopColor="#00E5FF" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#08C8FF" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="headerOrangeWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF8A00" stopOpacity="0" />
                <stop offset="35%" stopColor="#FF9D2E" stopOpacity="0.85" />
                <stop offset="75%" stopColor="#FF8A00" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#FF8A00" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Cyan Wave Curves */}
            <path d="M0,28 C220,8 440,48 660,24 C880,4 1040,44 1200,20" stroke="url(#headerCyanWaveGrad)" strokeWidth="1.6" />
            <path d="M0,42 C200,22 460,56 700,32 C920,12 1100,48 1200,28" stroke="url(#headerCyanWaveGrad)" strokeWidth="1.0" strokeDasharray="4 6" opacity="0.7" />
            {/* Orange / Amber Wave Curves — Clearly visible */}
            <path d="M0,34 C240,54 480,18 720,44 C960,68 1120,26 1200,38" stroke="url(#headerOrangeWaveGrad)" strokeWidth="1.8" />
            <path d="M0,46 C260,60 500,28 740,50 C960,70 1120,36 1200,46" stroke="url(#headerOrangeWaveGrad)" strokeWidth="1.2" strokeDasharray="5 7" opacity="0.8" />
            {/* Header accent dots */}
            <circle cx="280" cy="22" r="1.5" fill="#00E5FF" opacity="0.7" />
            <circle cx="560" cy="40" r="1.8" fill="#FF8A00" opacity="0.85" />
            <circle cx="880" cy="18" r="1.5" fill="#08C8FF" opacity="0.6" />
            <circle cx="1020" cy="42" r="1.8" fill="#FF9D2E" opacity="0.8" />
          </svg>
        </div>

        {/* Subtle dual-accent wave highlight across header border */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[1px] pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(0, 229, 255, 0.45) 25%, rgba(8, 200, 255, 0.2) 50%, rgba(255, 138, 0, 0.5) 75%, transparent 100%)',
          }}
        />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1550px] items-center justify-between">
          {/* LEFT: BRAND — Mock (white), Mind (cyan), AI (orange) */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-[#00E5FF]/10 to-orange-500/20 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.2)] shrink-0">
              <Bot className="h-5 w-5 text-[#00E5FF]" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight">
              <span className="text-[#F5F7FA]">Mock</span>
              <span className="text-[#00E5FF]">Mind </span>
              <span className="text-[#FF8A00]">AI</span>
            </span>
          </div>

          {/* CENTER NAVIGATION ONLY FOR PRE-INTERVIEW */}
          {!interviewStarted && (
            <div className="hidden items-center gap-2.5 text-xs font-semibold md:flex">
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[#d1ccc7]">
                AI Interview Preparation
              </span>
              <span className="text-[#74808C]">•</span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[#00d2ff]">
                Round 3
              </span>
            </div>
          )}

          {/* RIGHT: ACTIONS & USER PROFILE */}
          <div className="flex items-center gap-3">
            {!interviewStarted && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="hidden sm:inline-flex items-center rounded-xl border border-white/[0.12] bg-[#0c101d] px-4 py-2 text-sm font-medium text-[#f5f1ec] hover:border-cyan-500/40 hover:bg-white/[0.03] transition cursor-pointer"
              >
                Dashboard
              </button>
            )}

            {interviewStarted && (
              <button
                type="button"
                onClick={handleEndInterview}
                className="flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-3.5 py-1.5 text-sm font-medium text-red-400 hover:border-red-500/60 hover:bg-red-500/20 transition cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.15)]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Exit Interview</span>
              </button>
            )}

            {/* USER MENU */}
            <div
              ref={userMenuRef}
              className="relative hidden sm:block"
            >
              <button
                type="button"
                onClick={() =>
                  setIsUserMenuOpen((previous) => !previous)
                }
                className="flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-[#0c101d] px-3 py-1.5 hover:border-cyan-500/30 transition cursor-pointer text-[#f5f1ec]"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-black shadow-[0_0_10px_rgba(0,210,255,0.4)]">
                  {userName.charAt(0).toUpperCase()}
                </div>

                <span className="max-w-[110px] truncate text-sm font-medium text-[#f5f1ec]">
                  {userName}
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-[#9a9a9a] transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-[200] mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#131416] shadow-2xl shadow-black/80"
                >
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-[#f5f1ec]">
                      {userName}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#9a9a9a]">
                      {JSON.parse(localStorage.getItem('user') || '{}')?.email || ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleUserProfile}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#d1ccc7] transition-colors hover:bg-white/5 hover:text-[#f5f1ec]"
                  >
                    <UserRound className="h-4 w-4 text-[#9a9a9a]" />
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

      {/* ===================================================
          PRE-INTERVIEW (DARK CINEMATIC CYAN + ORANGE SYSTEM)
      ==================================================== */}
      {!interviewStarted && (
        <main className="relative z-10 mx-auto w-full max-w-[1500px] px-[clamp(14px,1.7vw,28px)] pb-10 pt-6">
          {/* HEADER SECTION */}
          <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,210,255,0.2)]">
                <ShieldCheck className="h-7 w-7 text-[#00d2ff]" />
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[clamp(20px,1.8vw,28px)] font-bold tracking-tight text-white">
                    Get Ready for Your AI Interview
                  </h1>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#00d2ff]">
                    Round 3
                  </span>
                </div>
                <p className="text-sm text-[#94a3b8]">
                  Check your camera, microphone, voice, connection and interview environment before starting.
                </p>
              </div>
            </div>

            {/* INTERVIEW DURATION METRIC CARD */}
            <div className="relative overflow-hidden flex items-center gap-4 rounded-2xl border border-[#FF8A00]/25 hover:border-[#FF8A00]/45 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.6),0_0_20px_rgba(255,138,0,0.08)] transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00BFFF]/40 before:via-[#0877B8]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10">
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 260px 140px at 0% 0%, rgba(0, 191, 255, 0.08) 0%, transparent 80%)",
                }}
              />
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-bl from-[#FF8A00]/25 via-[#FF8A00]/6 to-transparent rounded-full blur-xl pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-[#FF8A00]/15 border border-[#FF8A00]/35 flex items-center justify-center shadow-[0_0_18px_rgba(255,138,0,0.25)] relative z-10 shrink-0">
                <Clock3 className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <div className="relative z-10">
                <p className="text-xs uppercase tracking-wider text-[#A5AFBC] font-medium">Interview Duration</p>
                <p className="font-mono text-2xl sm:text-3xl font-bold text-[#F5F7FA] mt-0.5 tracking-tight">{formatTime(totalInterviewTime)}</p>
              </div>
            </div>
          </section>

          {preflightMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#FFB020]/35 bg-[#FFB020]/10 px-4 py-3 text-sm text-[#FFB020] shadow-[0_0_15px_rgba(255,176,32,0.1)]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#FFB020]" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#FFB020]">Setup attention required</p>
                <p className="mt-0.5 text-[#FFB020]/80">{preflightMessage}</p>
              </div>
              <button type="button" onClick={() => setPreflightMessage('')} className="text-xs text-[#FFB020] hover:text-white transition cursor-pointer">Dismiss</button>
            </div>
          )}

          <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr_0.75fr]">
            {/* CAMERA SETUP CARD */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] transition-all before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00BFFF]/45 before:via-[#0877B8]/15 before:to-[#FF8A00]/40 before:pointer-events-none before:z-10">
              <div className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full bg-cyan-500/12 blur-xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-orange-500/12 blur-xl" aria-hidden="true" />

              <div className="mb-3.5 flex items-center justify-between gap-3 relative z-10">
                <h2 className="flex items-center gap-2 font-bold text-sm text-white">
                  <Video className="h-5 w-5 text-[#FF8A00]" />
                  Your Camera
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cameraOn ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    ● {cameraOn ? 'LIVE' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { void toggleCamera(); }}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${cameraOn ? 'border-red-500/30 text-red-300 hover:bg-red-500/10' : 'border-white/[0.12] bg-[#0c101d] text-[#f5f1ec] hover:border-cyan-500/30'}`}
                    aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
                  >
                    {cameraOn ? 'Turn Off Camera' : 'Enable Camera'}
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-black border border-white/[0.06]">
                <video ref={handleVideoElementRef} autoPlay playsInline muted className={`aspect-[16/9] sm:aspect-[4/3] max-h-[290px] w-full object-cover object-[center_20%] transition-opacity ${cameraOn ? 'opacity-100' : 'opacity-0'}`} />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#74808C]">
                    <VideoOff className="mb-3 h-12 w-12" />
                    <p className="text-sm">Camera is turned off</p>
                    <button type="button" onClick={() => startCamera({ force: true })} className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-[#00d2ff] hover:bg-cyan-500/20 transition cursor-pointer">Enable Camera</button>
                  </div>
                )}
                {cameraOn && faceStatus === 'none' && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-amber-300/30 bg-black/75 px-3 py-2 text-center text-xs text-amber-200 backdrop-blur">Position your face clearly in the camera frame.</div>
                )}
                {cameraOn && faceStatus === 'multiple' && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-red-300/30 bg-black/75 px-3 py-2 text-center text-xs text-red-200 backdrop-blur">Only one person should be visible.</div>
                )}
                {cameraOn && faceStatus === 'far' && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-amber-300/30 bg-black/75 px-3 py-2 text-center text-xs text-amber-200 backdrop-blur">Move a little closer so your face is clearly visible.</div>
                )}
                {cameraOn && faceStatus === 'eyes' && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-amber-300/30 bg-black/75 px-3 py-2 text-center text-xs text-amber-200 backdrop-blur">Keep both eyes visible and face the camera.</div>
                )}
              </div>

              <div className="mt-3.5 grid grid-cols-3 gap-2 relative z-10">
                <div className="rounded-xl border border-white/[0.06] bg-[#060a14]/80 p-3 text-center transition hover:border-cyan-500/20">
                  <Video className={`mx-auto h-5 w-5 ${cameraOn ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <p className="mt-1 text-xs text-[#94a3b8]">Camera</p>
                  <p className={`text-sm font-semibold ${cameraOn ? 'text-emerald-400' : 'text-amber-400'}`}>{cameraOn ? 'Connected' : 'Not Ready'}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#060a14]/80 p-3 text-center transition hover:border-cyan-500/20">
                  <UserRound className={`mx-auto h-5 w-5 ${faceReady ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <p className="mt-1 text-xs text-[#94a3b8]">Face Detection</p>
                  <p className={`text-sm font-semibold ${getPreflightStatus(faceStatus).className}`}>{getPreflightStatus(faceStatus).label}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#060a14]/80 p-3 text-center transition hover:border-cyan-500/20">
                  <Lightbulb className={`mx-auto h-5 w-5 ${lightingStatus === 'good' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <p className="mt-1 text-xs text-[#94a3b8]">Lighting</p>
                  <p className={`text-sm font-semibold ${getPreflightStatus(lightingStatus).className}`}>{getPreflightStatus(lightingStatus).label}</p>
                </div>
              </div>
            </div>

            {/* AI INTERVIEWER CARD */}
            <div className="relative overflow-hidden flex min-h-[360px] flex-col items-center justify-between rounded-2xl border border-white/[0.08] hover:border-[#00E5FF]/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-5 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] transition-all before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00E5FF]/45 before:via-[#08C8FF]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10">
              <div className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full bg-[#00E5FF]/15 blur-xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-[#FF8A00]/15 blur-xl" aria-hidden="true" />

              <div className="mb-3 flex w-full items-center justify-between text-left font-bold text-sm text-[#F5F7FA] relative z-10">
                <span className="flex items-center gap-2"><Bot className="h-5 w-5 text-[#00E5FF]" />AI Interviewer</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${aiVoiceReady ? 'bg-[#19D98B]/10 text-[#19D98B] border border-[#19D98B]/30 shadow-[0_0_8px_rgba(25,217,139,0.2)]' : 'bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/30'}`}>{aiVoiceReady ? 'VOICE READY' : 'VOICE CHECKING'}</span>
              </div>

              <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden py-4">
                <div className="absolute w-44 h-44 rounded-full bg-gradient-to-r from-[#00E5FF]/15 via-[#FF8A00]/10 to-transparent blur-3xl pointer-events-none" />

                {/* Left/Right AI voice waveform with Cyan & Orange dual spectrum */}
                <div className="pointer-events-none absolute inset-x-2 top-1/2 z-0 flex -translate-y-1/2 items-center justify-center gap-2">
                  <div className="flex h-20 w-[31%] items-center justify-end gap-1 overflow-hidden">
                    {[18, 30, 44, 62, 38, 72, 50, 30, 58, 42, 68, 34, 52, 26, 46].map((height, i) => (
                      <span
                        key={`left-wave-${i}`}
                        className="mockmind-preflight-wave-bar w-1 rounded-full bg-gradient-to-t from-[#00BFFF]/30 via-[#00E5FF] to-[#08C8FF]"
                        style={{ height: `${height}%`, animationDelay: `${i * 0.055}s`, opacity: aiSpeaking ? 1 : 0.7 }}
                      />
                    ))}
                  </div>
                  <div className="relative z-10 shrink-0 scale-[0.95] sm:scale-105"><AIInterviewerAvatar speaking={aiSpeaking} /></div>
                  <div className="flex h-20 w-[31%] items-center justify-start gap-1 overflow-hidden">
                    {[46, 26, 52, 34, 68, 42, 58, 30, 50, 72, 38, 62, 44, 30, 18].map((height, i) => (
                      <span
                        key={`right-wave-${i}`}
                        className="mockmind-preflight-wave-bar w-1 rounded-full bg-gradient-to-t from-[#FF8A00]/30 via-[#FF9D2E] to-[#FFB347]"
                        style={{ height: `${height}%`, animationDelay: `${i * 0.055}s`, opacity: aiSpeaking ? 1 : 0.7 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-10 w-full flex flex-col items-center">
                <div className={`rounded-full border px-5 py-2 text-sm font-semibold shadow-sm ${aiVoiceReady ? 'border-[#19D98B]/30 bg-[#19D98B]/10 text-[#19D98B]' : 'border-[#FFB020]/30 bg-[#FFB020]/10 text-[#FFB020]'}`}>
                  {aiVoiceReady ? <CircleCheck className="mr-2 inline h-4 w-4" /> : <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />}
                  {aiVoiceReady ? 'AI Voice Ready' : 'Checking AI Voice'}
                </div>
                <p className="mt-3 text-xs text-[#A5AFBC] leading-relaxed max-w-sm">{aiGreetingText}</p>
              </div>
            </div>

            {/* OVERVIEW CARD */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-[#00E5FF]/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00E5FF]/45 before:via-[#08C8FF]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10">
              <h2 className="mb-4 font-bold text-sm text-[#F5F7FA]">Interview Overview</h2>
              <div className="space-y-4">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/25 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="h-4 w-4 text-[#00E5FF]" />
                  </div>
                  <div><p className="text-xs text-[#A5AFBC]">Interview Type</p><p className="font-medium text-sm text-[#F5F7FA]">{interviewTypeLabel}</p></div>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-[#19D98B]/10 border border-[#19D98B]/25 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-[#19D98B]" />
                  </div>
                  <div><p className="text-xs text-[#A5AFBC]">Total Questions</p><p className="font-medium text-sm text-[#F5F7FA]">{totalQuestions} Questions</p></div>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/10 border border-[#FF8A00]/25 flex items-center justify-center shrink-0">
                    <Clock3 className="h-4 w-4 text-[#FF8A00]" />
                  </div>
                  <div><p className="text-xs text-[#A5AFBC]">Time per Question</p><p className="font-medium text-sm text-[#F5F7FA]">{QUESTION_TIME} Seconds</p></div>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-[#08C8FF]/10 border border-[#08C8FF]/25 flex items-center justify-center shrink-0">
                    <Clock3 className="h-4 w-4 text-[#08C8FF]" />
                  </div>
                  <div><p className="text-xs text-[#A5AFBC]">Total Duration</p><p className="font-medium text-sm text-[#F5F7FA]">{formatTime(totalInterviewTime)}</p></div>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
                    <Globe2 className="h-4 w-4 text-[#A5AFBC]" />
                  </div>
                  <div><p className="text-xs text-[#A5AFBC]">Language</p><p className="font-medium text-sm text-[#F5F7FA]">English</p></div>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-[#19D98B]/10 border border-[#19D98B]/25 flex items-center justify-center shrink-0">
                    <Volume2 className="h-4 w-4 text-[#19D98B]" />
                  </div>
                  <div><p className="text-xs text-[#A5AFBC]">AI Voice</p><p className={`font-medium text-sm ${aiVoiceReady ? 'text-[#19D98B]' : 'text-[#FFB020]'}`}>{aiVoiceReady ? 'Enabled' : 'Checking'}</p></div>
                </div>
              </div>
            </div>
          </section>

          {/* CHECKLIST SECTION */}
          <section className="mt-5 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00E5FF]/45 before:via-[#08C8FF]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10 relative overflow-hidden">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between relative z-10">
              <h2 className="flex items-center gap-2 font-bold text-sm text-[#F5F7FA]">
                <ClipboardCheck className="h-5 w-5 text-[#00E5FF]" />
                Pre-Interview Checklist
              </h2>
              <span className={`text-xs font-semibold ${canStartInterview ? 'text-[#19D98B]' : 'text-[#FFB020]'}`}>
                {canStartInterview ? 'All required checks passed' : 'Complete required checks to continue'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 relative z-10">
              {checklistItems.map(({ Icon, label, status, ready }) => {
                const meta = getPreflightStatus(status);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={label === 'Microphone' ? startMicrophoneTest : undefined}
                    disabled={label === 'Microphone' && (micTestStatus === 'listening' || micTestStatus === 'prompting')}
                    className={`flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0A0F16]/80 p-3 text-left transition ${label === 'Microphone' ? 'cursor-pointer hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5' : ''} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${ready ? 'text-[#19D98B]' : meta.className}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#A5AFBC]">{label}</p>
                      <p className={`text-sm font-semibold ${meta.className}`}>{meta.label}</p>
                      {label === 'Microphone' && micTestTranscript && <p className="mt-0.5 truncate text-[10px] text-[#687483]">“{micTestTranscript}”</p>}
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-[#687483]" />
                  </button>
                );
              })}
            </div>

            <div className={`mt-4 rounded-xl border px-4 py-3 text-center text-sm font-semibold relative z-10 ${canStartInterview ? 'border-[#19D98B]/30 bg-[#19D98B]/10 text-[#19D98B]' : 'border-[#FFB020]/30 bg-[#FFB020]/10 text-[#FFB020]'}`}>
              {canStartInterview ? (
                <><CircleCheck className="mr-2 inline h-4 w-4" />You're all set! Good luck with your interview.</>
              ) : (
                <><AlertTriangle className="mr-2 inline h-4 w-4" />Please complete the required checks before starting.</>
              )}
              {backendLatency !== null && <span className="ml-2 text-xs font-normal text-[#A5AFBC]">Server response: {backendLatency} ms</span>}
            </div>
          </section>

          {/* ENVIRONMENT DETAILS */}
          <section className="mt-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-sm text-[#F5F7FA]">Environment Analysis</p>
                <p className="mt-0.5 text-xs text-[#A5AFBC]">Current browser/camera observations. No value is hard-coded as Good.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEnvironmentDetails((v) => !v)}
                className="rounded-xl border border-white/[0.12] bg-[#0A0F16] px-4 py-2 text-xs font-semibold text-[#F5F7FA] hover:border-[#00E5FF]/30 transition cursor-pointer"
              >
                {showEnvironmentDetails ? 'Hide Environment Details' : 'Get Environment Details'}
              </button>
            </div>
            {showEnvironmentDetails && (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-white/[0.06] bg-[#0A0F16]/80 p-3"><p className="text-xs text-[#A5AFBC]">Face</p><p className={`font-semibold text-sm ${getPreflightStatus(faceStatus).className}`}>{getPreflightStatus(faceStatus).label}</p></div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A0F16]/80 p-3"><p className="text-xs text-[#A5AFBC]">Lighting</p><p className={`font-semibold text-sm ${getPreflightStatus(lightingStatus).className}`}>{getPreflightStatus(lightingStatus).label}</p></div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A0F16]/80 p-3"><p className="text-xs text-[#A5AFBC]">People</p><p className={`font-semibold text-sm ${faceStatus === 'multiple' ? 'text-[#FF4545]' : faceStatus === 'detected' ? 'text-[#19D98B]' : 'text-[#A5AFBC]'}`}>{faceStatus === 'multiple' ? 'Multiple' : faceStatus === 'detected' ? '1 detected' : 'Not verified'}</p></div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A0F16]/80 p-3"><p className="text-xs text-[#A5AFBC]">Connection</p><p className={`font-semibold text-sm ${getPreflightStatus(internetStatus).className}`}>{getPreflightStatus(internetStatus).label}{backendLatency !== null ? ` • ${backendLatency} ms` : ''}</p></div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A0F16]/80 p-3"><p className="text-xs text-[#A5AFBC]">Overall</p><p className={`font-semibold text-sm ${getPreflightStatus(environmentStatus).className}`}>{getPreflightStatus(environmentStatus).label}</p></div>
              </div>
            )}
          </section>

          {/* LOWER PREP AREA: TIPS | START CTA | WHAT TO EXPECT */}
          <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.25fr_0.9fr]">
            {/* TIPS */}
            <div className="rounded-2xl border border-white/[0.08] hover:border-[#FF8A00]/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00E5FF]/45 before:via-[#08C8FF]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10">
              <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#00E5FF_1px,transparent_1px)] [background-size:14px_14px]" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-6 -right-6 w-24 h-24 bg-[#FF8A00]/12 rounded-full blur-xl" aria-hidden="true" />

              <h2 className="mb-4 flex items-center gap-2 font-bold text-sm text-[#F5F7FA] relative z-10">
                <Lightbulb className="h-4 w-4 text-[#FF8A00]" />
                Interview Tips
              </h2>
              <ul className="space-y-3 text-xs text-[#A5AFBC] relative z-10">
                {[
                  'Speak clearly and at a normal pace',
                  'Maintain good eye contact',
                  'Take your time to think',
                  'Be honest and confident',
                  'Ensure a quiet environment',
                  'Dress professionally',
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 mt-0.5" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* START INTERVIEW CTA CARD */}
            <div className="relative overflow-hidden rounded-2xl border border-[#FF8A00]/40 hover:border-[#FF8A00]/60 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_16px_36px_rgba(0,0,0,0.6),0_0_24px_rgba(255,138,0,0.1)] flex flex-col items-center justify-center text-center">
              {/* Soft warm ambient glow matching Dark Cinematic Orange Accent */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FF8A00]/14 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_600px_220px_at_50%_50%,rgba(255,138,0,0.1),transparent_70%)] pointer-events-none" />

              <div className="relative z-10 w-full flex flex-col items-center">
                <button
                  type="button"
                  onClick={startInterview}
                  disabled={!canStartInterview}
                  className={`w-full max-w-md rounded-xl px-8 py-4 text-xl sm:text-2xl font-black shadow-[0_4px_24px_rgba(255,138,0,0.42)] transition-all duration-200 cursor-pointer ${
                    canStartInterview
                      ? 'bg-gradient-to-r from-[#FF8A00] via-[#FF9D2E] to-[#D96A00] hover:from-[#FFA742] hover:via-[#FFB347] hover:to-[#E07200] text-black hover:-translate-y-0.5 hover:shadow-[0_6px_34px_rgba(255,138,0,0.6)] active:translate-y-0'
                      : 'cursor-not-allowed border border-white/[0.08] bg-[#0A0F16] text-[#687483] opacity-60'
                  }`}
                >
                  {canStartInterview ? (
                    <>Start Interview <span className="ml-2">→</span></>
                  ) : (
                    <>Complete Setup <span className="ml-2">🔒</span></>
                  )}
                </button>
                <p className="mt-4 text-xs text-[#A5AFBC] flex items-center justify-center gap-1.5">
                  <LockKeyhole className="h-3.5 w-3.5 text-[#00E5FF]" />
                  Your interview will start in fullscreen mode
                </p>
                <p className="mt-1 text-[11px] text-[#687483]">
                  Once started, the session timer begins and fullscreen rules apply.
                </p>
              </div>
            </div>

            {/* WHAT TO EXPECT */}
            <div className="rounded-2xl border border-white/[0.08] hover:border-[#00E5FF]/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] relative overflow-hidden">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-sm text-[#F5F7FA]">
                <CircleHelp className="h-4 w-4 text-[#00E5FF]" />
                What to Expect
              </h2>
              <ul className="space-y-3 text-xs text-[#A5AFBC]">
                <li><CheckCircle2 className="w-3.5 h-3.5 text-[#FF8A00] shrink-0 inline mr-2" />AI will ask you {totalQuestions} questions</li>
                <li><CheckCircle2 className="w-3.5 h-3.5 text-[#FF8A00] shrink-0 inline mr-2" />{QUESTION_TIME} seconds to answer each</li>
                <li><CheckCircle2 className="w-3.5 h-3.5 text-[#FF8A00] shrink-0 inline mr-2" />You will answer every question using your voice</li>
                <li><CheckCircle2 className="w-3.5 h-3.5 text-[#FF8A00] shrink-0 inline mr-2" />AI will evaluate your responses</li>
                <li><CheckCircle2 className="w-3.5 h-3.5 text-[#FF8A00] shrink-0 inline mr-2" />Detailed feedback after completion</li>
              </ul>
            </div>
          </section>

          <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#0A0F16]/70 px-4 py-3 text-center text-xs text-[#A5AFBC]">
            <Info className="mr-2 inline h-4 w-4 text-[#00E5FF]" />
            Once you click “Start Interview”, the session will begin and you cannot pause or go back.
          </div>
        </main>
      )}

      {/* ===================================================
          FINAL INTERVIEW (DARK CINEMATIC CYAN + ORANGE SYSTEM)
      ==================================================== */}
      {interviewStarted && (
        <main className="relative z-10 mx-auto flex w-full max-w-[1550px] flex-col px-4 sm:px-6 pt-2.5 pb-4 min-h-[calc(100dvh-64px)] justify-between">
          {/* HEADER STATUS BAR */}
          <section className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
                <ShieldCheck className="h-4 w-4 text-[#00E5FF]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-[#F5F7FA] leading-tight">Interview in Progress</h1>
                <p className="text-[11px] text-[#A5AFBC]">Answer clearly and confidently. You're doing great!</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] px-3.5 py-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_20px_rgba(0,0,0,0.4)]">
              <Clock3 className="h-4 w-4 text-[#FF8A00]" />
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-[#A5AFBC] font-medium">Total Time Left</p>
                <p className="font-mono text-base font-bold text-[#F5F7FA] leading-none">{totalTimeLabel}</p>
              </div>
            </div>
          </section>

          {/* READINESS CHECK BEFORE Q1 OR ACTIVE INTERVIEW ROOM */}
          {round3State === 'waiting_for_ready' && !currentQuestion ? (
            <section className="grid min-h-[min(560px,calc(100vh-140px))] flex-1 place-items-center py-4">
              <div className="relative overflow-hidden w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-6 sm:p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_16px_36px_rgba(0,0,0,0.6)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00E5FF]/45 before:via-[#08C8FF]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10">
                <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 bg-[#00E5FF]/14 rounded-full blur-3xl" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-12 -right-12 w-48 h-48 bg-[#FF8A00]/14 rounded-full blur-3xl" aria-hidden="true" />

                <div className="relative z-10">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                    <Bot className="h-8 w-8 text-[#00E5FF]" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00E5FF]">Final Round Readiness</p>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">Are you ready for the interview?</h1>
                  <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-[#A5AFBC]">
                    The AI interviewer will listen to your voice. Say <span className="font-semibold text-white">yes, I am ready</span> when you are ready to begin.
                  </p>

                  <div className="mx-auto mt-5 max-w-xl rounded-xl border border-white/[0.08] bg-[#0A0F16]/80 p-4">
                    <div className="flex items-center justify-center gap-2.5 text-[#00E5FF]">
                      <Volume2 className="h-4 w-4" />
                      <span className="font-semibold text-sm">
                        {aiSpeaking ? 'AI is speaking...' : readinessListening ? 'Listening for your answer...' : 'Waiting for your response'}
                      </span>
                    </div>
                    {readinessTranscript && (
                      <p className="mt-3 rounded-xl border border-white/[0.06] bg-[#0A0F16] p-2.5 text-left text-sm text-[#F5F7FA]">
                        {readinessTranscript}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={startReadinessListening}
                      disabled={aiSpeaking || loading || readinessListening}
                      className="rounded-xl bg-gradient-to-r from-[#FF8A00] via-[#FF9D2E] to-[#D96A00] hover:from-[#FFA742] hover:via-[#FFB347] hover:to-[#E07200] px-6 py-3 font-bold text-sm text-black shadow-[0_4px_24px_rgba(255,138,0,0.38)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_32px_rgba(255,138,0,0.55)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <Mic className="mr-2 inline h-4 w-4" />
                      {readinessListening ? 'Listening...' : 'Answer Ready Check'}
                    </button>
                  </div>

                  {error && <p className="mt-3 text-xs text-[#FF4545]">{error}</p>}
                </div>
              </div>
            </section>
          ) : (
            <>
              {/* ACTIVE INTERVIEW ROOM WORKSPACE */}
              <section className="grid items-stretch gap-3.5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
                {/* LEFT WORKSPACE */}
                <div className="flex flex-col gap-3.5 min-w-0">
                  {/* TOP ROW: YOUR CAMERA & AI INTERVIEWER */}
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {/* YOUR CAMERA CARD */}
                    <div className="flex flex-col min-h-[300px] sm:h-[315px] lg:h-[325px] rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_32px_rgba(0,0,0,0.65),0_0_20px_rgba(0,191,255,0.04)] transition-all relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00BFFF]/50 before:via-[#0877B8]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10">
                      <div className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full bg-[#00BFFF]/12 blur-xl" aria-hidden="true" />
                      <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-[#FF8A00]/12 blur-xl" aria-hidden="true" />

                      <div className="mb-2.5 flex shrink-0 items-center justify-between relative z-10">
                        <h2 className="flex items-center gap-2 font-bold text-xs sm:text-sm text-white">
                          <Camera className="h-4 w-4 text-[#FF8A00]" />
                          Your Camera
                        </h2>
                        {cameraOn ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-[11px] font-bold text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
                            OFF
                          </span>
                        )}
                      </div>

                      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black border border-white/[0.06]">
                        <video
                          ref={handleVideoElementRef}
                          autoPlay
                          playsInline
                          muted
                          className={`absolute inset-0 h-full w-full object-cover object-[center_20%] ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
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
                          className="absolute right-2.5 top-2.5 rounded-lg border border-white/10 bg-black/60 p-1.5 text-white backdrop-blur transition hover:bg-black/80 hover:text-cyan-300 cursor-pointer"
                          aria-label="Fullscreen camera"
                        >
                          <Expand className="h-3.5 w-3.5" />
                        </button>
                        <div
                          className={`absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur shadow-sm ${
                            faceStatus === 'detected'
                              ? 'border-[#19D98B]/30 bg-black/75 text-[#19D98B]'
                              : faceStatus === 'multiple'
                                ? 'border-[#FF4545]/40 bg-black/75 text-[#FF4545]'
                                : faceStatus === 'none'
                                  ? 'border-[#FFB020]/40 bg-black/75 text-[#FFB020]'
                                  : 'border-white/10 bg-black/75 text-[#A5AFBC]'
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3" />
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

                      <div className="mt-2.5 flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 text-xs font-medium relative z-10">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${cameraOn ? 'bg-[#19D98B] shadow-[0_0_8px_rgba(25,217,139,0.5)]' : 'bg-[#FF4545]'}`} />
                          <span className="text-[#A5AFBC]">Camera: <strong className={cameraOn ? 'text-[#19D98B]' : 'text-[#FF4545]'}>{cameraOn ? 'On' : 'Off'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${micAvailable ? 'bg-[#19D98B] shadow-[0_0_8px_rgba(25,217,139,0.5)]' : 'bg-[#FF4545]'}`} />
                          <span className="text-[#A5AFBC]">Mic: <strong className={micAvailable ? 'text-[#19D98B]' : 'text-[#FF4545]'}>{micAvailable ? 'Active' : 'Off'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#687483]">Face:</span>
                          <span className={`font-semibold ${faceStatus === 'detected' ? 'text-[#19D98B]' : faceStatus === 'multiple' ? 'text-[#FF4545]' : 'text-[#FFB020]'}`}>
                            {faceStatus === 'detected' ? 'Detected' : faceStatus === 'multiple' ? 'Multiple' : faceStatus === 'none' ? 'Not detected' : 'Checking'}
                          </span>
                        </div>
                        <div className="hidden sm:flex items-center gap-0.5" aria-hidden="true">
                          {[6, 14, 18, 11, 16, 9, 14, 6].map((h, idx) => (
                            <span
                              key={idx}
                              className={`w-0.5 rounded-full transition-all duration-150 ${micAvailable ? 'bg-[#00E5FF]' : 'bg-white/20'}`}
                              style={{ height: `${micAvailable ? h : 3}px` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI INTERVIEWER CARD */}
                    <div className="relative flex flex-col min-h-[300px] sm:h-[315px] lg:h-[325px] items-center justify-between overflow-hidden rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_32px_rgba(0,0,0,0.65),0_0_20px_rgba(0,191,255,0.04)] transition-all before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00BFFF]/50 before:via-[#0877B8]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10">
                      <div className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full bg-[#00BFFF]/15 blur-xl" aria-hidden="true" />
                      <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-[#FF8A00]/15 blur-xl" aria-hidden="true" />

                      <div className="flex w-full shrink-0 items-center justify-between font-bold text-xs sm:text-sm text-white relative z-10">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-[#00E5FF]" />
                          <span>AI Interviewer</span>
                        </div>
                        <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-[#00E5FF]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
                          Round 3
                        </span>
                      </div>

                      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
                        <div className="pointer-events-none absolute inset-x-2 top-1/2 flex -translate-y-1/2 items-center justify-between opacity-90" aria-hidden="true">
                          {/* Left waveform cluster — Blue/Cyan */}
                          <div className="flex items-center gap-1">
                            {[12, 22, 34, 18, 28, 40, 24, 36, 16, 8].map((h, i) => (
                              <span
                                key={`l-${i}`}
                                className={`w-1 rounded-full bg-gradient-to-t from-[#00BFFF]/30 via-[#00E5FF] to-[#08C8FF] ${aiSpeaking ? 'mockmind-orange-wave-bar' : 'opacity-40'}`}
                                style={{
                                  height: `${h}px`,
                                  animationDelay: `${(i % 5) * 0.08}s`,
                                }}
                              />
                            ))}
                          </div>
                          {/* Right waveform cluster — Orange/Amber — clearly visible per Reference #4 */}
                          <div className="flex items-center gap-1">
                            {[8, 16, 36, 24, 40, 28, 18, 34, 22, 12].map((h, i) => (
                              <span
                                key={`r-${i}`}
                                className={`w-1 rounded-full bg-gradient-to-t from-[#FF8A00]/30 via-[#FF9D2E] to-[#FFB347] ${aiSpeaking ? 'mockmind-orange-wave-bar' : 'opacity-50'}`}
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

                      {/* Reference box */}
                      <div className="shrink-0 w-full rounded-xl border border-white/[0.08] bg-[#0A0F16]/90 px-4 py-2 text-center text-xs sm:text-[13px] font-medium text-[#A5AFBC] relative z-10">
                        {aiSpeaking ? '🔊 AI is speaking...' : "Listen carefully and answer when you're ready."}
                      </div>

                      {/* 5 Subtle Dots — Cyan, Sky, Blue, Orange, Amber */}
                      <div className="flex items-center justify-center gap-1.5 pt-1 relative z-10" aria-hidden="true">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#08C8FF]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#159FE8]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF8A00]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FFB347]"></span>
                      </div>
                    </div>
                  </div>

                  {/* CURRENT QUESTION CARD */}
                  <section className="rounded-2xl border border-white/[0.08] hover:border-[#FF8A00]/35 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-4 sm:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_32px_rgba(0,0,0,0.65),0_0_24px_rgba(255,138,0,0.08)] transition-all relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00BFFF]/50 before:via-[#0877B8]/15 before:to-[#FF8A00]/50 before:pointer-events-none before:z-10">
                    <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-[#FF8A00]/15 blur-xl" aria-hidden="true" />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#00BFFF]/10 blur-xl" aria-hidden="true" />

                    <div className="flex items-center justify-between gap-2 relative z-10">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
                        <CircleHelp className="h-4 w-4 text-[#FF8A00]" />
                        <span>Current Question</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-[#FF8A00]/40 bg-[#FF8A00]/15 px-3 py-0.5 text-xs font-bold text-[#FF9D2E] shadow-[0_0_10px_rgba(255,138,0,0.2)]">
                          Question {currentQuestionIndex + 1} of {totalQuestions}
                        </span>
                        {interviewTypeLabel && (
                          <span className="hidden sm:inline-block rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-xs font-medium text-[#A5AFBC]">
                            {interviewTypeLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-2.5 break-words text-lg sm:text-xl lg:text-[22px] font-bold leading-relaxed text-[#F5F7FA] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative z-10">
                      {currentQuestion}
                    </p>

                    {/* QUESTION TIP ROW & REPLAY */}
                    <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
                      <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-[#FF8A00]/35 bg-[#0A0F16]/90 px-3.5 py-2 text-xs sm:text-[13px] text-[#F5F7FA] shadow-[0_0_16px_rgba(255,138,0,0.06)]">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#FF8A00]" />
                        <div>
                          <strong className="text-[#FF8A00] font-bold">Tip: </strong>
                          <span>Structure your thoughts clearly. State your approach, then give a concise example.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={replayQuestion}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-[#0D131B] px-3.5 py-2 text-xs font-semibold text-[#F5F7FA] hover:border-[#FF8A00]/50 hover:bg-[#FF8A00]/10 hover:shadow-[0_0_15px_rgba(255,138,0,0.25)] transition cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-[#FF8A00]" />
                        <span>Replay Question</span>
                      </button>
                    </div>
                  </section>

                  {/* YOUR ANSWER / VOICE-TO-TEXT */}
                  <section className="rounded-2xl border border-white/[0.08] hover:border-[#00E5FF]/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-4 sm:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_32px_rgba(0,0,0,0.65),0_0_20px_rgba(0,229,255,0.04)] transition-all relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00E5FF]/50 before:via-[#08C8FF]/15 before:to-[#FF8A00]/40 before:pointer-events-none before:z-10">
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#00E5FF]/12 blur-xl" aria-hidden="true" />
                    <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#FF8A00]/10 blur-xl" aria-hidden="true" />

                    <div className="mb-3 flex items-center justify-between relative z-10">
                      <h2 className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#F5F7FA]">
                        <Mic className="h-4 w-4 text-[#00E5FF]" />
                        Your Answer
                      </h2>
                      <span className="flex items-center gap-1.5 rounded-full border border-[#00E5FF]/30 bg-[#071019]/90 px-3 py-0.5 text-xs font-medium text-[#A5AFBC] shadow-[0_0_10px_rgba(0,229,255,0.1)]">
                        <Mic className="h-3.5 w-3.5 text-[#00E5FF]" />
                        Voice-to-Text Enabled
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)] relative z-10">
                      {/* LEFT: MIC BUTTON, STATUS, WAVEFORM */}
                      <div className="flex flex-col justify-between rounded-xl border border-white/[0.06] bg-[#0A0F16]/80 p-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={toggleVoiceRecording}
                            disabled={!voiceSupported || loading || aiSpeaking}
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition cursor-pointer ${
                              recording
                                ? 'border-[#FF4545] bg-[#FF4545]/20 text-[#FF4545] shadow-[0_0_24px_rgba(255,69,69,0.5)] animate-pulse'
                                : 'border-[#00E5FF]/50 bg-[#00E5FF]/15 text-[#00E5FF] hover:bg-[#00E5FF]/25 shadow-[0_0_20px_rgba(0,229,255,0.3)]'
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                            aria-label={recording ? 'Stop answering' : 'Start voice answer'}
                          >
                            {recording ? (
                              <Square className="h-5 w-5 fill-current text-[#FF4545]" />
                            ) : (
                              <Mic className="h-5 w-5 text-[#00E5FF]" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-sm text-[#F5F7FA]">
                              {recording ? 'Listening...' : voiceTranscript ? 'Answer captured' : 'Ready for answer'}
                            </p>
                            <p className="text-[11px] text-[#A5AFBC] truncate">
                              {recording ? 'Speak now clearly' : voiceTranscript ? 'Voice captured' : 'Click mic to answer'}
                            </p>
                          </div>
                        </div>

                        {/* WAVEFORM — Blue/cyan with orange accents */}
                        <div className="mt-3 flex h-7 items-center justify-center gap-1 rounded-lg bg-[#071019] px-2.5 border border-white/5" aria-hidden="true">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-0.5 rounded-full ${
                                recording
                                  ? 'mockmind-orange-wave-bar bg-gradient-to-t from-[#00E5FF] via-[#08C8FF] to-[#FF8A00]'
                                  : 'bg-white/20'
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
                      <div className="flex flex-col min-h-[105px] rounded-xl border border-white/[0.06] bg-[#0A0F16]/80 p-3.5">
                        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#A5AFBC]">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
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
                          <div className="flex flex-1 items-center justify-center text-center text-xs sm:text-[13px] text-[#687483] italic">
                            Your voice response will transcribe here in real time...
                          </div>
                        )}
                      </div>
                    </div>

                    {error && <p className="mt-2 text-center text-xs text-[#FF4545] relative z-10">{error}</p>}
                  </section>
                </div>

                {/* RIGHT WORKSPACE: PROGRESS + TIPS */}
                <div className="flex flex-col gap-3.5 min-w-0 h-full">
                  {/* INTERVIEW PROGRESS */}
                  <div className="flex h-[390px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] hover:border-[#00E5FF]/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-4 sm:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_32px_rgba(0,0,0,0.65),0_0_20px_rgba(0,229,255,0.04)] transition-all before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00E5FF]/50 before:via-[#08C8FF]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10 relative">
                    <div className="flex shrink-0 items-center justify-between">
                      <h2 className="font-bold text-xs sm:text-sm text-[#F5F7FA]">Interview Progress</h2>
                      <div className="flex items-center gap-1.5 rounded-full border border-[#00E5FF]/35 bg-[#0A0F16]/90 px-3 py-1 shadow-[0_0_14px_rgba(0,229,255,0.22)] mockmind-badge-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF8A00] animate-pulse" />
                        <span className="text-xs font-bold text-[#00E5FF] tracking-tight">
                          {Math.round(((currentQuestionIndex) / totalQuestions) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Circular Progress Indicator with Dark Oceanic / Futuristic Styling */}
                    <div className="relative mx-auto my-2 flex h-24 w-24 shrink-0 items-center justify-center rounded-full shadow-[0_0_24px_rgba(0,229,255,0.2)]">
                      {/* Subtle pulse ring */}
                      <div className="absolute inset-0 rounded-full bg-[#00E5FF]/5 mockmind-ring-pulse pointer-events-none" />
                      <svg className="h-full w-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="mockmindOceanProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00E5FF" />
                            <stop offset="45%" stopColor="#08C8FF" />
                            <stop offset="80%" stopColor="#FF8A00" />
                            <stop offset="100%" stopColor="#FF9D2E" />
                          </linearGradient>
                          <filter id="glowProgress" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#FF8A00" floodOpacity="0.4" />
                          </filter>
                        </defs>
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="rgba(255, 255, 255, 0.06)"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="url(#mockmindOceanProgress)"
                          strokeWidth="6"
                          strokeDasharray={238.76}
                          strokeDashoffset={238.76 - (238.76 * (currentQuestionIndex + 1)) / totalQuestions}
                          strokeLinecap="round"
                          fill="none"
                          filter="url(#glowProgress)"
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-2 rounded-full bg-[#071019] border border-white/[0.08] flex flex-col items-center justify-center text-center shadow-inner z-20">
                        <p className="text-base font-extrabold text-[#F5F7FA] leading-none">{currentQuestionIndex + 1} / {totalQuestions}</p>
                        <p className="text-[9px] uppercase tracking-wider text-[#A5AFBC] mt-0.5 font-medium">Questions</p>
                      </div>
                    </div>

                    {/* Questions list title */}
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#A5AFBC]">
                      <span>Questions</span>
                      <span className="text-[#687483]">{currentQuestionIndex + 1} of {totalQuestions}</span>
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
                                ? 'border-[#FF8A00]/50 bg-[#FF8A00]/15 shadow-[0_0_12px_rgba(255,138,0,0.25)]'
                                : isCompleted
                                  ? 'border-[#19D98B]/20 bg-[#19D98B]/5'
                                  : 'border-white/5 bg-[#0A0F16]/60'
                            }`}
                          >
                            {isCompleted ? (
                              <CircleCheck className="h-4 w-4 shrink-0 text-[#19D98B]" />
                            ) : isActive ? (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF9D2E] text-[10px] font-black text-black shadow-[0_0_8px_rgba(255,138,0,0.5)]">
                                {i + 1}
                              </span>
                            ) : (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] text-[#687483]">
                                {i + 1}
                              </span>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className={`text-xs ${isActive ? 'font-bold text-[#F5F7FA]' : isCompleted ? 'text-[#A5AFBC]' : 'text-[#687483]'}`}>
                                Question {i + 1}
                              </p>
                              <p className={`text-[10px] ${isActive ? 'text-[#FF8A00] font-semibold' : isCompleted ? 'text-[#19D98B]/80' : 'text-[#687483]'}`}>
                                {isActive ? 'In Progress' : isCompleted ? 'Completed' : 'Pending'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Answer Time */}
                    <div className="mt-2.5 shrink-0 rounded-xl border border-white/[0.06] bg-[#0A0F16]/80 p-2.5">
                      <div className="flex items-center justify-between text-xs text-[#A5AFBC]">
                        <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                          <Clock3 className="h-3.5 w-3.5 text-[#00E5FF]" />
                          Answer Time
                        </span>
                        <span className="font-mono font-bold text-xs text-[#FF8A00]">
                          {formatTime(timeLeft)} <span className="text-[10px] font-normal text-[#687483]">/ 01:00</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] via-[#08C8FF] to-[#FF8A00] transition-all duration-300 shadow-[0_0_8px_rgba(255,138,0,0.4)]"
                          style={{ width: `${answerProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* TIPS FOR A GREAT ANSWER (RESPONSIVE FLEXIBLE HEIGHT) */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-[#FF8A00]/30 bg-gradient-to-b from-[#101720] via-[#0D131B] to-[#0A0F16] p-4 sm:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_32px_rgba(0,0,0,0.65),0_0_20px_rgba(0,229,255,0.04)] flex-1 min-h-[185px] flex flex-col justify-start gap-2 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00E5FF]/45 before:via-[#08C8FF]/15 before:to-[#FF8A00]/45 before:pointer-events-none before:z-10">
                    <div className="pointer-events-none absolute inset-0 opacity-12 bg-[radial-gradient(#00E5FF_1px,transparent_1px)] [background-size:14px_14px]" aria-hidden="true" />

                    {/* Flowing Cyan + Orange decorative wave — Orange wave clearly visible near lower/right per Section 26 */}
                    <svg className="pointer-events-none absolute -bottom-2 -right-2 h-36 w-48 opacity-45" viewBox="0 0 200 120" fill="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="mockmindTipsWaveDual" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
                          <stop offset="35%" stopColor="#00E5FF" stopOpacity="0.45" />
                          <stop offset="70%" stopColor="#FF8A00" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#FF9D2E" stopOpacity="0.95" />
                        </linearGradient>
                      </defs>
                      <path d="M0,80 Q50,40 100,70 T200,45" stroke="url(#mockmindTipsWaveDual)" strokeWidth="2.5" />
                      <path d="M0,95 Q60,60 120,85 T200,65" stroke="url(#mockmindTipsWaveDual)" strokeWidth="1.8" />
                    </svg>

                    <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-[#FF8A00]/15 blur-xl" aria-hidden="true" />
                    <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-[#00E5FF]/10 blur-xl" aria-hidden="true" />
                    
                    {/* Decorative "Good Luck!" stamp */}
                    <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#0A0F16]/90 px-3 py-1.5 backdrop-blur-sm shadow-sm select-none" aria-hidden="true">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#A5AFBC] leading-none">GOOD</span>
                      <span className="text-[13px] font-black uppercase tracking-wider text-[#FF8A00] leading-tight">LUCK!</span>
                    </div>

                    <div className="relative z-10">
                      <div className="mb-2.5 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#FF8A00]/30 bg-[#FF8A00]/10 shadow-[0_0_10px_rgba(255,138,0,0.25)]">
                          <Lightbulb className="h-3.5 w-3.5 text-[#FF8A00]" />
                        </div>
                        <h2 className="font-bold text-xs sm:text-sm text-[#F5F7FA]">
                          Tips for a Great Answer
                        </h2>
                      </div>

                      <ul className="space-y-1.5 text-xs text-[#A5AFBC] max-w-[220px]">
                        {[
                          'Speak clearly and confidently',
                          'Maintain good eye contact',
                          'Take your time',
                          'Be confident',
                          'Give structured answers',
                        ].map((tip) => (
                          <li key={tip} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#00E5FF]" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative z-10 mt-auto pt-3">
                      <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-[#00E5FF]/30 via-[#08C8FF]/15 to-transparent" />
                    </div>
                  </div>
                </div>
              </section>

              {/* BOTTOM ACTION BAR (WITH SUBTLE FLOWING WAVES BEHIND IT PER SECTION 30) */}
              <div className="relative mt-3.5">
                {/* Subtle flowing waves behind the bottom action area per Section 30 */}
                <div className="pointer-events-none absolute inset-x-0 -bottom-4 h-24 overflow-hidden opacity-30 select-none z-0" aria-hidden="true">
                  <svg className="w-full h-full" viewBox="0 0 1200 100" fill="none" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="bottomCyanWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
                        <stop offset="30%" stopColor="#00E5FF" stopOpacity="0.55" />
                        <stop offset="70%" stopColor="#08C8FF" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="bottomOrangeWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF8A00" stopOpacity="0" />
                        <stop offset="40%" stopColor="#FF9D2E" stopOpacity="0.65" />
                        <stop offset="80%" stopColor="#FF8A00" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#FF8A00" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,50 C300,15 550,80 850,35 C1050,10 1150,65 1200,45" stroke="url(#bottomCyanWaveGrad)" strokeWidth="1.8" />
                    <path d="M0,70 C320,95 600,40 900,80 C1080,95 1160,50 1200,65" stroke="url(#bottomOrangeWaveGrad)" strokeWidth="1.6" strokeDasharray="5 7" />
                  </svg>
                </div>

                <section className="relative z-10 grid gap-3 sm:grid-cols-[1fr_1.6fr_1fr]">
                  <button
                    type="button"
                    onClick={handleSkipQuestion}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 rounded-2xl border border-white/[0.12] bg-[#0A0F16] px-5 py-3 text-xs sm:text-sm font-bold text-[#F5F7FA] transition hover:border-[#00E5FF]/40 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_4px_16px_rgba(0,0,0,0.3)] min-h-[64px] cursor-pointer"
                  >
                    <SkipForward className="h-5 w-5 shrink-0 text-[#A5AFBC]" />
                    <div className="text-left">
                      <p className="font-bold leading-tight text-white">Skip Question</p>
                      <p className="text-[11px] font-normal text-[#A5AFBC]">Skip and move to next</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitAndNext}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#FF8A00] via-[#FF9D2E] to-[#D96A00] hover:from-[#FFA742] hover:via-[#FFB347] hover:to-[#E07200] px-5 py-3 text-xs sm:text-sm font-bold text-black shadow-[0_4px_24px_rgba(255,138,0,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_34px_rgba(255,138,0,0.65)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 min-h-[64px] cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-black" />
                    ) : (
                      <div className="text-center">
                        <p className="font-black text-sm sm:text-base leading-tight text-black">
                          {currentQuestionIndex === totalQuestions - 1 ? 'Submit & Finish Interview' : 'Next Question →'}
                        </p>
                        <p className="text-[11px] font-semibold text-black/80">
                          {currentQuestionIndex === totalQuestions - 1 ? 'Final submission' : 'Save answer and go to next'}
                        </p>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitInterview}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 rounded-2xl border border-[#19D98B]/40 bg-[#19D98B]/10 px-5 py-3 text-xs sm:text-sm font-bold text-[#19D98B] transition hover:bg-[#19D98B]/20 hover:border-[#19D98B]/70 disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_0_15px_rgba(25,217,139,0.18)] min-h-[64px] cursor-pointer"
                  >
                    <Check className="h-5 w-5 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold leading-tight text-[#19D98B]">Submit Interview</p>
                      <p className="text-[11px] font-normal text-[#19D98B]/80">Submit and finish interview</p>
                    </div>
                  </button>
                </section>
              </div>

              {/* SECURITY FOOTER */}
              <div className="mt-2.5 flex items-center justify-center gap-2 text-center text-xs text-[#A5AFBC]">
                <LockKeyhole className="h-3.5 w-3.5 text-[#00E5FF]" />
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
