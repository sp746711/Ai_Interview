import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

// Round 3 demo source currently contains exactly 5 questions.
// The UI never hard-codes the count: it always uses questions.length.
const DEMO_QUESTIONS = [
  'Tell me about yourself and your experience related to this role.',
  'How have you used your technical skills in one of your projects?',
  'Describe a challenging project you have worked on and how you overcame the difficulties.',
  'How do you approach debugging a problem when your first solution does not work?',
  'Why are you a good fit for this role, and what would you like to contribute to the team?',
];

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
          .mockmind-preflight-wave-bar {
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
     ROUND 3 QUESTION SOURCE — PHASE 1 DEMO
     -------------------------------------------------------
     The current goal is to make the complete Final Round work
     end-to-end. Therefore the frontend uses the same five demo
     questions as the audited AIController. Dynamic question
     generation is intentionally NOT used yet.
     ======================================================= */
  const [questions, setQuestions] = useState(DEMO_QUESTIONS);

  const totalQuestions = questions.length;
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

        // Demo-phase persistence. Backend/MongoDB persistence can replace this later.
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
      return {
        state: 'interview_active',
        ready: true,
        question_number: currentQuestionIndex + 1,
        total_questions: DEMO_QUESTIONS.length,
        question: DEMO_QUESTIONS[currentQuestionIndex] || '',
      };
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

      const serverIndex = Number(response?.question_number);
      const nextIndex = Number.isFinite(serverIndex) && serverIndex > 0
        ? serverIndex - 1
        : 0;

      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(question);
      setVoiceTranscript('');
      setReadinessTranscript('');
      setRound3State('interview_active');
      setTimeLeft(QUESTION_TIME);
      setTotalTimeLeft(totalInterviewTime);

      window.requestAnimationFrame(() => {
        void speakQuestion(question);
      });
    } catch (err) {
      // Demo fallback: if the backend is temporarily unavailable, continue
      // with the same five audited demo questions instead of breaking the UI.
      console.warn('Unable to load Q1 from backend; using demo fallback.', err);
      const question = DEMO_QUESTIONS[0];
      setQuestions((previous) => previous.length ? previous : DEMO_QUESTIONS);
      setCurrentQuestionIndex(0);
      setCurrentQuestion(question);
      setVoiceTranscript('');
      setReadinessTranscript('');
      setRound3State('interview_active');
      setTimeLeft(QUESTION_TIME);
      setTotalTimeLeft(totalInterviewTime);
      setError('Interview server did not return the question. Demo question mode is active.');
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

      let response = null;
      if (interviewId) {
        response = await fetchRound3Question();
      }

      const nextQuestion = String(response?.question || '').trim() || DEMO_QUESTIONS[currentQuestionIndex + 1] || '';
      const serverNumber = Number(response?.question_number);
      const nextIndex = Number.isFinite(serverNumber) && serverNumber > 0
        ? serverNumber - 1
        : currentQuestionIndex + 1;

      if (!nextQuestion || nextIndex >= totalQuestions) {
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
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestion = DEMO_QUESTIONS[nextIndex] || '';

      if (!nextQuestion) {
        await finishInterview();
        return;
      }

      setError('Interview server did not return the next question. Demo question mode is active.');
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(nextQuestion);
      setVoiceTranscript('');
      setTimeLeft(QUESTION_TIME);
      window.requestAnimationFrame(() => void speakQuestion(nextQuestion));
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
    <div className="min-h-screen bg-[#020817] text-white">
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
      <header className="border-b border-white/10 bg-[#020817]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[58px] w-full max-w-[1500px] items-center justify-between px-[clamp(14px,1.7vw,28px)]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-[clamp(18px,1.5vw,24px)] font-bold">MockMind AI</span>
          </div>

          <div className="hidden items-center gap-3 text-[clamp(13px,1.1vw,17px)] font-medium md:flex">
            <span className="text-violet-300">▥▥▥</span>
            <span>AI Interview</span>
            <span className="text-gray-500">•</span>
            <span>Round 3</span>
          </div>

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
                className="flex items-center gap-2 rounded-xl border border-red-500/60 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
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
                className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 transition hover:border-white/20 hover:bg-slate-800/80"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-500 text-xs font-bold text-slate-900">
                  {userName.charAt(0).toUpperCase()}
                </div>

                <span className="max-w-[110px] truncate text-sm font-medium">
                  {userName}
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-[200] mt-3 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0b1024] shadow-2xl shadow-black/50"
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
        <main className="mx-auto flex min-h-[calc(100dvh-58px)] w-full max-w-[1550px] flex-col px-[clamp(12px,1.5vw,24px)] pb-8 pt-[clamp(10px,1.2vh,16px)]">
          <section className="mb-3 flex shrink-0 items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-9 w-9 text-emerald-400" />
              <div><h1 className="text-lg font-bold text-emerald-400 sm:text-xl">Interview in Progress</h1><p className="text-xs text-gray-300 sm:text-sm">Answer clearly and confidently. You're doing great!</p></div>
            </div>
            <div className="flex items-center gap-2"><Clock3 className="h-9 w-9 text-violet-400" /><div className="text-right"><p className="text-xs text-gray-300">Total Time Left</p><p className="font-mono text-2xl font-bold sm:text-3xl">{totalTimeLabel}</p></div></div>
          </section>

          {round3State === 'waiting_for_ready' && !currentQuestion && (
            <section className="grid min-h-[min(620px,calc(100vh-170px))] flex-1 place-items-center py-6">
              <div className="w-full max-w-3xl rounded-3xl border border-violet-400/20 bg-slate-950/80 p-8 text-center shadow-2xl">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10">
                  <Bot className="h-12 w-12 text-cyan-300" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Final Round Readiness</p>
                <h1 className="mt-3 text-3xl font-bold">Are you ready for the interview?</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400">The AI interviewer will listen to your voice. Say <span className="font-semibold text-white">yes, I am ready</span> when you are ready to begin.</p>

                <div className="mx-auto mt-7 max-w-xl rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-center gap-3 text-cyan-300">
                    <Volume2 className="h-5 w-5" />
                    <span className="font-semibold">{aiSpeaking ? 'AI is speaking...' : readinessListening ? 'Listening for your answer...' : 'Waiting for your response'}</span>
                  </div>
                  {readinessTranscript && (
                    <p className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-left text-sm text-gray-200">{readinessTranscript}</p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button type="button" onClick={startReadinessListening} disabled={aiSpeaking || loading || readinessListening} className="rounded-xl border border-violet-400/40 bg-violet-500/10 px-5 py-3 font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                    <Mic className="mr-2 inline h-5 w-5" />{readinessListening ? 'Listening...' : 'Answer Ready Check'}
                  </button>
                </div>

                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
              </div>
            </section>
          )}

          {round3State === 'interview_active' && currentQuestion && (
            <>
              {/* EXACT FINAL ROUND LAYOUT: left workspace + continuous right progress sidebar */}
              <section className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_330px] lg:grid-rows-[350px_auto_auto]">
                {/* VIDEO + AI */}
                  <section className="grid min-w-0 gap-3 lg:col-start-1 lg:row-start-1 lg:grid-cols-2">
                    {/* VIDEO */}
                    <div className="min-w-0 flex min-h-[310px] flex-col lg:col-start-1 lg:row-start-1 rounded-2xl border border-white/10 bg-slate-950/60 p-3 shadow-xl lg:h-[350px]">
                      <div className="mb-2 flex shrink-0 items-center justify-between">
                        <h2 className="flex items-center gap-2 font-semibold">
                          <Video className="h-5 w-5 text-blue-400" />
                          Your Video
                        </h2>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">● LIVE</span>
                      </div>

                      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black">
                        <video
                          ref={handleVideoElementRef}
                          autoPlay
                          playsInline
                          muted
                          className={`absolute inset-0 h-full w-full object-cover ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {!cameraOn && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                            <VideoOff className="mb-3 h-12 w-12" />
                            <p>Camera is turned off</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleFullscreenButton}
                          className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 transition hover:bg-black/80"
                          aria-label="Fullscreen camera"
                        >
                          <Expand className="h-4 w-4" />
                        </button>
                        <div className={`absolute left-3 top-3 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur ${
                          faceStatus === 'detected'
                            ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                            : faceStatus === 'multiple'
                              ? 'border-red-400/30 bg-red-500/15 text-red-300'
                              : faceStatus === 'none'
                                ? 'border-amber-400/30 bg-amber-500/15 text-amber-200'
                                : 'border-white/15 bg-black/60 text-gray-300'
                        }`}>
                          {faceStatus === 'detected' ? '✓ Face Detected' :
                            faceStatus === 'multiple' ? '⚠ Multiple Faces' :
                              faceStatus === 'none' ? '⚠ Face Not Detected' :
                                'Face Detection…'}
                        </div>
                      </div>

                      <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2 text-sm">
                        <span className={cameraOn ? 'text-emerald-400' : 'text-red-400'}>
                          <Video className="mr-2 inline h-4 w-4" />
                          Camera: {cameraOn ? 'On' : 'Off'}
                        </span>
                        <span className={micAvailable ? 'text-emerald-400' : 'text-red-400'}>
                          <Mic className="mr-2 inline h-4 w-4" />
                          Mic: {micAvailable ? 'Active' : 'Off'}
                        </span>
                        <span className={`text-xs font-semibold ${faceStatus === 'detected' ? 'text-emerald-400' : faceStatus === 'multiple' ? 'text-red-400' : 'text-amber-300'}`}>
                          Face: {faceStatus === 'detected' ? 'Detected' : faceStatus === 'multiple' ? 'Multiple' : faceStatus === 'none' ? 'Not detected' : 'Checking'}
                        </span>
                        <span className="hidden text-emerald-400 sm:inline">||||||||||||</span>
                      </div>
                    </div>

                    {/* AI */}
                    <div className="relative flex min-h-[310px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-center shadow-xl lg:h-[350px]">
                      <div className="mb-2 flex w-full shrink-0 items-center gap-2 text-left font-semibold">
                        <Bot className="h-5 w-5 text-violet-400" />
                        AI Interviewer
                      </div>

                      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
                        <div className="pointer-events-none absolute left-3 right-3 top-1/2 flex -translate-y-1/2 items-center justify-between gap-1 opacity-70">
                          {Array.from({ length: 50 }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full bg-gradient-to-b from-violet-500 to-cyan-400 ${aiSpeaking ? 'mockmind-wave-bar' : ''}`}
                              style={{
                                height: `${8 + ((i * 13) % 42)}px`,
                                animationDelay: `${(i % 10) * 0.05}s`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="relative z-10 mockmind-robot-responsive">
                          <AIInterviewerAvatar speaking={aiSpeaking} />
                        </div>
                      </div>

                      <div className="shrink-0 rounded-xl border border-cyan-400/40 bg-cyan-500/5 px-4 py-2 text-sm font-semibold text-cyan-300">
                        {aiSpeaking ? '🔊 AI is speaking...' : 'AI Interviewer'}
                      </div>
                      <p className="mt-2 shrink-0 text-xs text-gray-300 sm:text-sm">
                        Listen carefully and answer when you're ready.
                      </p>
                    </div>
                  </section>

                  
                {/* CURRENT QUESTION — intentionally compact */}
                  <section className="min-w-0 rounded-2xl border lg:col-start-1 lg:row-start-2 border-white/10 bg-slate-950/60 px-4 py-2.5 shadow-xl">
                    <div className="flex items-center gap-2 text-sm font-medium text-cyan-300">
                      <CircleHelp className="h-5 w-5" />
                      Current Question
                    </div>
                    <p className="mt-1.5 break-words text-[clamp(14px,1.05vw,18px)] leading-snug text-white">
                      {currentQuestion}
                    </p>
                    <button
                      type="button"
                      onClick={replayQuestion}
                      className="mt-1.5 text-sm font-semibold text-violet-400 transition hover:text-violet-300"
                    >
                      <RotateCcw className="mr-2 inline h-4 w-4" />
                      Replay Question
                    </button>
                  </section>

                  
                {/* ANSWER + TIPS */}
                  <section className="min-w-0 grid gap-3 lg:col-start-1 lg:row-start-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(230px,0.45fr)]">
                    {/* ANSWER */}
                    <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/60 p-3 shadow-xl">
                      <h2 className="mb-2 flex items-center gap-2 font-semibold">
                        <Mic className="h-5 w-5 text-violet-400" />
                        Your Answer
                      </h2>

                      <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 px-3 py-2 text-center text-sm font-medium text-violet-200">
                        <Mic className="mr-2 inline h-4 w-4" />
                        Voice-only answer — speak clearly and confidently
                      </div>

                      <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/50 p-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={toggleVoiceRecording}
                            disabled={!voiceSupported || loading || aiSpeaking}
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${
                              recording
                                ? 'border-red-400 bg-red-500/20 hover:bg-red-500/30'
                                : 'border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20'
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                            aria-label={recording ? 'Stop answering' : 'Start voice answer'}
                          >
                            {recording ? (
                              <Square className="h-5 w-5 fill-current text-red-300" />
                            ) : (
                              <Mic className="h-6 w-6 text-violet-300" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="font-medium">
                              {recording ? 'Listening...' : voiceTranscript ? 'Answer captured' : 'Ready for your answer'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {recording
                                ? 'Speak now — your words appear below'
                                : voiceTranscript
                                  ? 'Answer captured. Continue when you are ready.'
                                  : 'Speak clearly and answer using your voice'}
                            </p>
                          </div>

                          <div className="hidden shrink-0 gap-1 sm:flex" aria-hidden="true">
                            {Array.from({ length: 22 }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-1 rounded-full ${recording ? 'mockmind-wave-bar bg-violet-400' : 'bg-violet-400/60'}`}
                                style={{
                                  height: `${5 + ((i * 7) % 18)}px`,
                                  animationDelay: `${(i % 8) * 0.06}s`,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {voiceTranscript && (
                          <p className="mt-2 max-h-20 overflow-y-auto rounded-lg border border-white/5 bg-black/10 p-2 text-sm leading-5 text-gray-200">
                            {voiceTranscript}
                          </p>
                        )}
                      </div>

                      {error && <p className="mt-2 text-center text-xs text-red-300">{error}</p>}
                    </div>

                    {/* TIPS */}
                    <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl">
                      <h2 className="mb-3 flex items-center gap-2 font-semibold">
                        <Lightbulb className="h-5 w-5 text-cyan-300" />
                        Tips
                      </h2>
                      <ul className="space-y-3 text-sm text-gray-300">
                        <li><Check className="mr-2 inline h-4 w-4 text-cyan-300" />Speak clearly</li>
                        <li><Check className="mr-2 inline h-4 w-4 text-cyan-300" />Maintain good eye contact</li>
                        <li><Check className="mr-2 inline h-4 w-4 text-cyan-300" />Take your time</li>
                        <li><Check className="mr-2 inline h-4 w-4 text-cyan-300" />Be confident</li>
                      </ul>
                    </div>
                  </section>

                {/* RIGHT SIDEBAR — STRETCHES FROM TOP TO THE BOTTOM OF TIPS */}
                <aside className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-3">
                  <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl lg:min-h-0">
                    <h2 className="shrink-0 font-semibold">Interview Progress</h2>

                    <div className="relative mx-auto my-3 flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-[14px] border-violet-500/20">
                      <div className="absolute inset-[-14px] rounded-full border-[14px] border-transparent border-t-violet-600 border-r-blue-500" />
                      <div className="text-center">
                        <p className="text-2xl font-bold">{currentQuestionIndex + 1} / {totalQuestions}</p>
                        <p className="text-xs text-gray-400">Question</p>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">
                      {Array.from({ length: totalQuestions }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${statusClass(i)}`}
                        >
                          {i < currentQuestionIndex ? (
                            <CircleCheck className="h-6 w-6 shrink-0 text-emerald-400" />
                          ) : i === currentQuestionIndex ? (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold">
                              {i + 1}
                            </span>
                          ) : (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-sm">
                              {i + 1}
                            </span>
                          )}

                          <div className="min-w-0">
                            <p className="text-sm font-medium">Question {i + 1}</p>
                            <p
                              className={`text-xs ${
                                i < currentQuestionIndex
                                  ? 'text-gray-500'
                                  : i === currentQuestionIndex
                                    ? 'text-violet-300'
                                    : 'text-gray-500'
                              }`}
                            >
                              {questionStatus(i)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 shrink-0 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-sm text-gray-300">Answer Time</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Clock3 className="h-7 w-7 text-gray-300" />
                        <span className="font-mono text-2xl font-bold text-cyan-400">{formatTime(timeLeft)}</span>
                        <span className="text-xs text-gray-500">/ 01:00</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all"
                          style={{ width: `${answerProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </aside>
              </section>

{/* CONTROLS — BELOW BOTH THE LEFT WORKSPACE AND PROGRESS */}
              <section className="mt-3 grid min-h-[82px] shrink-0 gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 sm:grid-cols-[0.8fr_1.3fr_0.8fr]">
                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  disabled={loading}
                  className="rounded-xl border border-amber-400/70 bg-amber-500/5 px-4 py-3 font-semibold text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-40"
                >
                  <SkipForward className="mr-2 inline h-5 w-5" />
                  Skip Question
                  <p className="text-xs font-normal text-gray-500">Skip and move to next</p>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAndNext}
                  disabled={loading}
                  className="rounded-xl border border-blue-400/60 bg-gradient-to-r from-blue-600/90 to-blue-500/90 px-4 py-3 font-semibold text-white transition hover:opacity-95 disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span className="text-lg">{currentQuestionIndex === totalQuestions - 1 ? 'Submit & Finish' : 'Next Question →'}</span>
                      <p className="text-xs font-normal text-blue-100">Save answer and go to next</p>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitInterview}
                  disabled={loading}
                  className="rounded-xl border border-emerald-400/70 bg-emerald-500/5 px-4 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-40"
                >
                  <Check className="mr-2 inline h-5 w-5" />
                  Submit Interview
                  <p className="text-xs font-normal text-gray-500">Submit and finish interview</p>
                </button>
              </section>

              <p className="mt-2 shrink-0 text-center text-xs text-gray-500">
                <LockKeyhole className="mr-1 inline h-3.5 w-3.5" />
                Your video and audio are secure and encrypted. Only used for this interview session.
              </p>
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
