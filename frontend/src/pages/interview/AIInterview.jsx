import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MessageSquare,
  ShieldCheck,
  UserRound,
  Wifi,
  Camera,
  CheckCircle2,
  CircleHelp,
  Flag,
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

const MAX_QUESTIONS = 10;
const QUESTION_TIME = 60;
const TOTAL_INTERVIEW_TIME = 45 * 60;

const DEMO_QUESTIONS = [
  'Tell me about yourself and your experience related to this role.',
  'How have you used your technical skills in one of your projects?',
  'Describe a challenging project you have worked on and how you overcame the difficulties.',
  'How do you approach debugging a problem when your first solution does not work?',
  'Tell me about a time you worked with a team to complete a technical task.',
  'How do you keep your technical knowledge and skills up to date?',
  'Describe a situation where you had to learn a new technology quickly.',
  'How would you design a reliable and scalable application for real users?',
  'What security and performance considerations would you make before deployment?',
  'Why are you a good fit for this role, and what would you like to contribute to the team?',
];

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
          .mockmind-wave-bar {
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
    'Cloud Computing';

  /* =======================================================
     STATE
     ======================================================= */

  const [interviewStarted, setInterviewStarted] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [currentQuestion, setCurrentQuestion] = useState('');

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const [totalTimeLeft, setTotalTimeLeft] = useState(TOTAL_INTERVIEW_TIME);

  const [textAnswer, setTextAnswer] = useState('');

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
     REFS
     ======================================================= */

  const videoRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const recognitionRef = useRef(null);

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

  // Keep latest interview state available inside fullscreen event handlers.
  const interviewStartedRef = useRef(false);
  const intentionalFullscreenExitRef = useRef(false);
  const escExitProcessingRef = useRef(false);

  useEffect(() => {
    interviewStartedRef.current = interviewStarted;
  }, [interviewStarted]);

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
            textAnswer.trim() ||
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
    textAnswer,
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

  const startCamera = () => {
    /*
     * Reuse an already running stream.
     * More importantly, reuse an in-flight getUserMedia() request.
     * This prevents duplicate permission prompts and camera startup
     * races when Round 3 preloads the camera and the user immediately
     * clicks Start Interview.
     */
    const existingStream = mediaStreamRef.current;

    if (existingStream) {
      const liveTracks = existingStream
        .getTracks()
        .filter((track) => track.readyState === 'live');

      if (liveTracks.length > 0) {
        if (videoRef.current) {
          videoRef.current.srcObject = existingStream;
          videoRef.current.play().catch(() => {});
        }

        const videoTrack =
          existingStream.getVideoTracks()?.[0];
        const audioTrack =
          existingStream.getAudioTracks()?.[0];

        setCameraOn(
          Boolean(
            videoTrack &&
              videoTrack.readyState === 'live' &&
              videoTrack.enabled
          )
        );

        setMicAvailable(
          Boolean(
            audioTrack &&
              audioTrack.readyState === 'live' &&
              audioTrack.enabled
          )
        );

        return Promise.resolve(existingStream);
      }

      existingStream
        .getTracks()
        .forEach((track) => track.stop());

      mediaStreamRef.current = null;
    }

    if (cameraInitPromiseRef.current) {
      return cameraInitPromiseRef.current;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraOn(false);
      setMicAvailable(false);
      setError(
        'Camera and microphone APIs are not available in this browser.'
      );
      return Promise.resolve(null);
    }

    const initPromise = (async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

        mediaStreamRef.current = stream;

        const videoTrack =
          stream.getVideoTracks()?.[0];
        const audioTrack =
          stream.getAudioTracks()?.[0];

        setCameraOn(
          Boolean(
            videoTrack &&
              videoTrack.readyState === 'live' &&
              videoTrack.enabled
          )
        );

        setMicAvailable(
          Boolean(
            audioTrack &&
              audioTrack.readyState === 'live' &&
              audioTrack.enabled
          )
        );

        /*
         * Attach immediately when the video element exists.
         * The video is muted in JSX, so autoplay is allowed by Chrome.
         */
        const attachVideo = () => {
          if (!videoRef.current) return;

          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        };

        attachVideo();
        requestAnimationFrame(attachVideo);

        return stream;
      } catch (err) {
        console.error(
          'Camera/microphone error:',
          err
        );

        mediaStreamRef.current = null;
        setCameraOn(false);
        setMicAvailable(false);

        setError(
          'Camera or microphone permission was not granted. Please allow camera and microphone access and try again.'
        );

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
    /*
     * Start camera/microphone after Round 3 has rendered. This allows the
     * pre-interview preview to be ready before the user starts.
     */
    const timer = window.setTimeout(() => {
      startCamera();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    /*
     * The pre-interview screen and active interview screen use different
     * <video> elements. When React swaps those elements, the existing
     * MediaStream must be attached to the NEW video element again.
     */
    if (!interviewStarted || !mediaStreamRef.current || !videoRef.current) {
      return;
    }

    const stream = mediaStreamRef.current;
    videoRef.current.srcObject = stream;
    videoRef.current.muted = true;
    videoRef.current.playsInline = true;
    videoRef.current.play().catch(() => {});
  }, [interviewStarted, cameraOn]);

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setMicAvailable(false);
  };

  /* =======================================================
     CAMERA TOGGLE
     ======================================================= */

  const toggleCamera = () => {
    const stream = mediaStreamRef.current;

    if (!stream) {
      startCamera();
      return;
    }

    const videoTrack =
      stream.getVideoTracks()?.[0];

    if (!videoTrack) {
      startCamera();
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;

    setCameraOn(videoTrack.enabled);
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

      window.setTimeout(finish, 1200);
    }).finally(() => {
      speechReadyPromiseRef.current = null;
    });

    return speechReadyPromiseRef.current;
  };

  const speakQuestion = async (question) => {
    if (!question) return;

    if (!('speechSynthesis' in window)) {
      return;
    }

    const sequence = ++speechSequenceRef.current;

    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }

    setAiSpeaking(false);

    /*
     * Cancel only the previous utterance, then give Chrome a short
     * scheduling window before speaking again. Rapid cancel()+speak()
     * calls are a common source of clipped/garbled browser TTS.
     */
    window.speechSynthesis.cancel();

    const voice = await waitForSpeechVoice();

    if (sequence !== speechSequenceRef.current) {
      return;
    }

    await new Promise((resolve) => {
      speechTimerRef.current = window.setTimeout(() => {
        speechTimerRef.current = null;
        resolve();
      }, 80);
    });

    if (sequence !== speechSequenceRef.current) {
      return;
    }

    const utterance =
      new SpeechSynthesisUtterance(question);

    utterance.lang = voice?.lang || 'en-US';

    if (voice) {
      utterance.voice = voice;
    }

    /* Slightly slower speech is clearer and less likely to sound clipped. */
    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      if (sequence !== speechSequenceRef.current) return;
      setAiSpeaking(true);
    };

    utterance.onend = () => {
      if (sequence !== speechSequenceRef.current) return;
      setAiSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.warn(
        'AI speech synthesis error:',
        event?.error || 'unknown'
      );

      if (sequence !== speechSequenceRef.current) return;
      setAiSpeaking(false);
    };

    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error(
        'Unable to start AI speech:',
        err
      );
      setAiSpeaking(false);
    }
  };

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
          'Voice recognition stopped. You can try again or type your answer.'
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
        'Speech recognition is not supported in this browser. Please use Chrome/Edge or type your answer.'
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

  /* =======================================================
     START INTERVIEW
     ======================================================= */

  const startInterview = async () => {
    setError('');

    /*
     * CRITICAL: request fullscreen FIRST while the browser still has the
     * original Start button user-gesture. Starting getUserMedia before
     * fullscreen can consume the gesture in Chrome/Edge and make
     * requestFullscreen() silently fail.
     */
    const fullscreenPromise = enterFullscreen();

    // Hide MainLayout navbar only after Start Interview is clicked.
    setAIInterviewActive(true);

    /*
     * Camera/microphone may already be pre-warmed. If not, initialize
     * them in parallel without blocking fullscreen.
     */
    if (!mediaStreamRef.current) {
      startCamera().catch((err) => {
        console.warn(
          'Camera initialization is still pending:',
          err
        );
      });
    }

    await fullscreenPromise;

    setInterviewStarted(true);
    interviewStartedRef.current = true;

    setInterviewComplete(false);

    setCurrentQuestionIndex(0);

    setCurrentQuestion(
      DEMO_QUESTIONS[0]
    );

    setTextAnswer('');

    setVoiceTranscript('');

    setTimeLeft(QUESTION_TIME);
    setTotalTimeLeft(TOTAL_INTERVIEW_TIME);

    /*
     * Let React commit the first interview screen, then start TTS.
     * speakQuestion() itself waits for the browser voice list and
     * serializes speech so the robot voice stays clear.
     */
    window.requestAnimationFrame(() => {
      speakQuestion(DEMO_QUESTIONS[0]);
    });
  };

  /* =======================================================
     TIMER
     ======================================================= */

  useEffect(() => {
    if (
      !interviewStarted ||
      interviewComplete ||
      !currentQuestion
    ) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timerRef.current);
          window.setTimeout(() => moveToNextQuestion(), 0);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    currentQuestionIndex,
    interviewStarted,
    interviewComplete,
    currentQuestion,
  ]);

  /* =======================================================
     TOTAL INTERVIEW TIMER
     ======================================================= */

  useEffect(() => {
    if (!interviewStarted || interviewComplete) return undefined;

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
  }, [interviewStarted, interviewComplete]);

  /* =======================================================
     NEXT QUESTION
     ======================================================= */

  const moveToNextQuestion = () => {
    const nextIndex =
      currentQuestionIndex + 1;

    if (nextIndex >= MAX_QUESTIONS) {
      finishInterview();
      return;
    }

    if (
      recording &&
      recognitionRef.current
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
    window.speechSynthesis?.cancel();

    setAiSpeaking(false);

    const nextQuestion =
      DEMO_QUESTIONS[nextIndex];

    setCurrentQuestionIndex(nextIndex);

    setCurrentQuestion(nextQuestion);

    setTextAnswer('');

    setVoiceTranscript('');

    setTimeLeft(QUESTION_TIME);

    setRecording(false);

    window.requestAnimationFrame(() => {
      speakQuestion(nextQuestion);
    });
  };

  /* =======================================================
     SUBMIT AND NEXT
     ======================================================= */

  const handleSubmitAndNext = async () => {
    const finalAnswer =
      textAnswer.trim() ||
      voiceTranscript.trim();

    if (!finalAnswer) {
      setError(
        'Please answer using voice or text before continuing.'
      );

      return;
    }

    setError('');

    setLoading(true);

    try {
      /*
       * PHASE 1:
       * Demo only.
       *
       * Backend connection comes later.
       */

      const savedAnswers = JSON.parse(
        sessionStorage.getItem('round3_answers') || '[]'
      );

      savedAnswers[currentQuestionIndex] = {
        questionNumber: currentQuestionIndex + 1,
        question: currentQuestion,
        answer: finalAnswer,
        status: 'answered',
      };

      sessionStorage.setItem(
        'round3_answers',
        JSON.stringify(savedAnswers)
      );

      console.log('Interview answer:', savedAnswers[currentQuestionIndex]);

      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      moveToNextQuestion();
    } catch (err) {
      console.error(err);

      setError(
        'Unable to save your answer. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     SUBMIT INTERVIEW
     ======================================================= */

  const handleSubmitInterview = async () => {
    const finalAnswer = textAnswer.trim() || voiceTranscript.trim();

    if (!finalAnswer) {
      setError('Please answer the current question before submitting the interview.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('Interview submitted:', {
        questionNumber: currentQuestionIndex + 1,
        question: currentQuestion,
        answer: finalAnswer,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));
      await finishInterview();
    } catch (err) {
      console.error(err);
      setError('Unable to submit the interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     SKIP
     ======================================================= */

  const handleSkipQuestion = () => {
    setError('');

    const savedAnswers = JSON.parse(
      sessionStorage.getItem('round3_answers') || '[]'
    );

    savedAnswers[currentQuestionIndex] = {
      questionNumber: currentQuestionIndex + 1,
      question: currentQuestion,
      answer: '',
      status: 'skipped',
    };

    sessionStorage.setItem(
      'round3_answers',
      JSON.stringify(savedAnswers)
    );

    moveToNextQuestion();
  };

  /* =======================================================
     FINISH INTERVIEW
     ======================================================= */

  const finishInterview = async () => {
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
    window.speechSynthesis?.cancel();

    setAiSpeaking(false);

    setRecording(false);

    interviewStartedRef.current = false;

    setInterviewComplete(true);

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
    window.speechSynthesis?.cancel();

    setAiSpeaking(false);
    setRecording(false);

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
      window.speechSynthesis?.cancel();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Recognition may already be stopped.
        }
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
      MAX_QUESTIONS) *
    100;

  /* =======================================================
     COMPLETE SCREEN
     ======================================================= */

  if (interviewComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-[#061426] to-slate-950 px-4 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>

          <h1 className="text-3xl font-bold">
            Interview Complete
          </h1>

          <p className="mt-3 text-gray-400">
            You have completed all{' '}
            {MAX_QUESTIONS} questions in your{' '}
            {selectedRole} interview.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Your Round 3 interview is
            complete.
          </p>

          <button
            onClick={() =>
              navigate('/feedback')
            }
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-3.5 font-semibold text-white transition hover:opacity-90"
          >
            Continue to Feedback
          </button>
        </div>
      </div>
    );
  }

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

  const userName =
    currentInterview?.name ||
    JSON.parse(localStorage.getItem('user') || '{}')?.name ||
    'Candidate';

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

  if (interviewComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#020817] via-[#061426] to-[#020617] px-4 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold">Interview Complete</h1>
          <p className="mt-3 text-gray-400">
            You have completed your {selectedRole} interview.
          </p>
          <button
            onClick={() => navigate('/feedback')}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-3.5 font-semibold text-white transition hover:opacity-90"
          >
            Continue to Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#020817] text-white ${
        interviewStarted || isFullscreen
          ? 'lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden'
          : ''
      }`}
    >
      {/* HEADER */}
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

            <button
              onClick={handleFullscreenButton}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-gray-200 transition hover:border-violet-400/40 hover:text-violet-300"
              aria-label="Fullscreen"
            >
              <Expand className="h-5 w-5" />
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-500 text-xs font-bold text-slate-900">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[110px] truncate text-sm font-medium">{userName}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* PRE-INTERVIEW */}
      {!interviewStarted && (
        <main className="mx-auto w-full max-w-[1500px] px-[clamp(14px,1.7vw,28px)] pb-8 pt-6">
          <section className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-10 w-10 shrink-0 text-emerald-400" />
              <div>
                <h1 className="text-[clamp(20px,1.8vw,28px)] font-bold">Get Ready for Your AI Interview</h1>
                <p className="mt-1 text-sm text-gray-300">Please check your setup before starting the interview.</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <Clock3 className="h-10 w-10 text-violet-400" />
              <div className="text-right">
                <p className="text-xs text-gray-300">Total Time Left</p>
                <p className="font-mono text-3xl font-bold">45:00</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr_0.75fr]">
            {/* CAMERA */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold"><Video className="h-5 w-5 text-violet-400" />Your Camera</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cameraOn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  ● {cameraOn ? 'LIVE' : 'OFF'}
                </span>
              </div>
              <div className="relative overflow-hidden rounded-xl bg-black">
                <video ref={videoRef} autoPlay playsInline muted className={`aspect-[16/9] w-full object-cover ${cameraOn ? 'opacity-100' : 'opacity-0'}`} />
                {!cameraOn && <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"><VideoOff className="mb-3 h-12 w-12" /><p>Camera is turned off</p></div>}
                <button onClick={handleFullscreenButton} className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white"><Expand className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-emerald-400/10 bg-emerald-500/5 p-3 text-center"><Video className="mx-auto h-5 w-5 text-emerald-400" /><p className="mt-1 text-xs text-gray-300">Camera</p><p className="text-sm font-semibold text-emerald-400">{cameraOn ? 'Connected' : 'Not Ready'}</p></div>
                <div className="rounded-xl border border-emerald-400/10 bg-emerald-500/5 p-3 text-center"><UserRound className="mx-auto h-5 w-5 text-emerald-400" /><p className="mt-1 text-xs text-gray-300">Face Detection</p><p className="text-sm font-semibold text-emerald-400">{cameraOn ? 'Good' : 'Waiting'}</p></div>
                <div className="rounded-xl border border-emerald-400/10 bg-emerald-500/5 p-3 text-center"><Lightbulb className="mx-auto h-5 w-5 text-emerald-400" /><p className="mt-1 text-xs text-gray-300">Lighting</p><p className="text-sm font-semibold text-emerald-400">{cameraOn ? 'Good' : 'Check'}</p></div>
              </div>
            </div>

            {/* AI */}
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-center shadow-xl">
              <div className="mb-3 flex w-full items-center gap-2 text-left font-semibold"><Bot className="h-5 w-5 text-violet-400" />AI Interviewer</div>
              <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden">
                <div className="pointer-events-none absolute left-4 right-4 top-1/2 flex -translate-y-1/2 items-center justify-between gap-1 opacity-60">
                  {Array.from({ length: 42 }).map((_, i) => <span key={i} className="h-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ height: `${6 + ((i * 11) % 32)}px` }} />)}
                </div>
                <div className="relative z-10 scale-[0.88] sm:scale-100"><AIInterviewerAvatar speaking={aiSpeaking} /></div>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-400"><CircleCheck className="mr-2 inline h-5 w-5" />AI Voice Ready</div>
              <p className="mt-4 text-gray-200">I'm ready to conduct your interview.</p>
              <p className="mt-1 text-sm text-gray-400">Click “Start Interview” when you are ready.</p>
            </div>

            {/* OVERVIEW */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-xl">
              <h2 className="mb-5 font-semibold">Interview Overview</h2>
              <div className="space-y-5">
                <div className="flex gap-3"><ClipboardCheck className="h-6 w-6 text-violet-400" /><div><p className="text-xs text-gray-400">Interview Type</p><p className="font-medium">{interviewTypeLabel}</p></div></div>
                <div className="flex gap-3"><CheckCircle2 className="h-6 w-6 text-blue-400" /><div><p className="text-xs text-gray-400">Total Questions</p><p className="font-medium">{MAX_QUESTIONS} Questions</p></div></div>
                <div className="flex gap-3"><Clock3 className="h-6 w-6 text-amber-400" /><div><p className="text-xs text-gray-400">Time per Question</p><p className="font-medium">{QUESTION_TIME} Seconds</p></div></div>
                <div className="flex gap-3"><Clock3 className="h-6 w-6 text-cyan-400" /><div><p className="text-xs text-gray-400">Total Duration</p><p className="font-medium">~ 45 Minutes</p></div></div>
                <div className="flex gap-3"><Globe2 className="h-6 w-6 text-cyan-400" /><div><p className="text-xs text-gray-400">Language</p><p className="font-medium">English</p></div></div>
                <div className="flex gap-3"><Volume2 className="h-6 w-6 text-emerald-400" /><div><p className="text-xs text-gray-400">AI Voice</p><p className="font-medium text-emerald-400">Enabled</p></div></div>
              </div>
            </div>
          </section>

          {/* CHECKLIST */}
          <section className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><ClipboardCheck className="h-5 w-5 text-blue-400" />Pre-Interview Checklist</h2>
            <div className="grid gap-3 md:grid-cols-5">
              {[
                [Video, 'Camera', cameraOn ? 'Ready' : 'Waiting', cameraOn],
                [Mic, 'Microphone', micAvailable ? 'Ready' : 'Waiting', micAvailable],
                [Volume2, 'AI Voice', 'Ready', true],
                [Wifi, 'Internet Connection', 'Stable', true],
                [UserRound, 'Environment', 'Good', true],
              ].map(([Icon, label, value, ready]) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-cyan-400/10 bg-slate-950/40 p-3">
                  <Icon className={ready ? 'h-6 w-6 text-emerald-400' : 'h-6 w-6 text-amber-400'} />
                  <div className="min-w-0"><p className="text-sm font-medium">{label}</p><p className={`text-sm font-semibold ${ready ? 'text-emerald-400' : 'text-amber-400'}`}>{value}</p></div>
                  <ChevronRight className="ml-auto h-4 w-4 text-emerald-400" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm font-semibold text-emerald-400"><CircleCheck className="mr-2 inline h-5 w-5" />You are all set! Good luck with your interview.</p>
          </section>

          {/* LOWER PREP AREA */}
          <section className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.25fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><Lightbulb className="h-5 w-5 text-amber-300" />Interview Tips</h2>
              <ul className="space-y-3 text-sm text-gray-300">
                {['Speak clearly and at a normal pace', 'Maintain good eye contact', 'Take your time to think', 'Be honest and confident', 'Ensure a quiet environment'].map((x) => <li key={x}><Check className="mr-2 inline h-4 w-4 text-violet-400" />{x}</li>)}
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-center">
              <button onClick={startInterview} className="w-full max-w-md rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-5 text-[clamp(20px,2vw,30px)] font-bold shadow-xl transition hover:scale-[1.01] hover:opacity-95">Start Interview <span className="ml-3">→</span></button>
              <p className="mt-4 text-sm text-gray-400"><LockKeyhole className="mr-2 inline h-4 w-4" />Your interview will start in fullscreen mode</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><CircleHelp className="h-5 w-5 text-blue-400" />What to Expect</h2>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><Check className="mr-2 inline h-4 w-4 text-violet-400" />AI will ask you {MAX_QUESTIONS} questions</li>
                <li><Check className="mr-2 inline h-4 w-4 text-violet-400" />{QUESTION_TIME} seconds to answer each</li>
                <li><Check className="mr-2 inline h-4 w-4 text-violet-400" />You can speak or type your answer</li>
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
        <main className="mx-auto flex min-h-[calc(100dvh-58px)] w-full max-w-[1550px] flex-col overflow-y-auto px-[clamp(12px,1.5vw,24px)] py-[clamp(10px,1.2vh,16px)] lg:h-[calc(100dvh-58px)] lg:min-h-0 lg:overflow-hidden">
          <section className="mb-3 flex shrink-0 items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-9 w-9 text-emerald-400" />
              <div><h1 className="text-lg font-bold text-emerald-400 sm:text-xl">Interview in Progress</h1><p className="text-xs text-gray-300 sm:text-sm">Answer clearly and confidently. You're doing great!</p></div>
            </div>
            <div className="flex items-center gap-2"><Clock3 className="h-9 w-9 text-violet-400" /><div className="text-right"><p className="text-xs text-gray-300">Total Time Left</p><p className="font-mono text-2xl font-bold sm:text-3xl">{totalTimeLabel}</p></div></div>
          </section>

          <section className="grid shrink-0 gap-3 lg:h-[clamp(285px,38vh,390px)] lg:grid-cols-[0.95fr_0.95fr_0.52fr]">
            {/* VIDEO */}
            <div className="flex min-h-[250px] flex-col rounded-2xl border border-white/10 bg-slate-950/60 p-3 shadow-xl">
              <div className="mb-2 flex shrink-0 items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Video className="h-5 w-5 text-blue-400" />Your Video</h2><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">● LIVE</span></div>
              <div className="relative min-h-[190px] flex-1 overflow-hidden rounded-xl bg-black">
                <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 h-full w-full object-cover ${cameraOn ? 'opacity-100' : 'opacity-0'}`} />
                {!cameraOn && <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"><VideoOff className="mb-3 h-12 w-12" /><p>Camera is turned off</p></div>}
                <button onClick={handleFullscreenButton} className="absolute right-3 top-3 rounded-lg bg-black/60 p-2"><Expand className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 flex shrink-0 items-center justify-between text-sm"><span className="text-emerald-400"><Video className="mr-2 inline h-4 w-4" />Camera: On</span><span className="text-emerald-400"><Mic className="mr-2 inline h-4 w-4" />Mic: Active</span><span className="hidden text-emerald-400 sm:inline">||||||||||||</span></div>
            </div>

            {/* AI */}
            <div className="relative flex min-h-[250px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-center shadow-xl">
              <div className="mb-2 flex w-full items-center gap-2 text-left font-semibold"><Bot className="h-5 w-5 text-violet-400" />AI Interviewer</div>
              <div className="relative flex min-h-[170px] flex-1 w-full items-center justify-center overflow-hidden">
                <div className="pointer-events-none absolute left-3 right-3 top-1/2 flex -translate-y-1/2 items-center justify-between gap-1 opacity-70">
                  {Array.from({ length: 50 }).map((_, i) => <span key={i} className={`w-1 rounded-full bg-gradient-to-b from-violet-500 to-cyan-400 ${aiSpeaking ? 'mockmind-wave-bar' : ''}`} style={{ height: `${8 + ((i * 13) % 42)}px`, animationDelay: `${(i % 10) * 0.05}s` }} />)}
                </div>
                <div className="relative z-10 mockmind-robot-responsive"><AIInterviewerAvatar speaking={aiSpeaking} /></div>
              </div>
              <div className="shrink-0 rounded-xl border border-cyan-400/40 bg-cyan-500/5 px-4 py-2 text-sm font-semibold text-cyan-300">{aiSpeaking ? '🔊 AI is speaking...' : 'AI Interviewer'}</div>
              <p className="mt-2 shrink-0 text-xs text-gray-300 sm:text-sm">Listen carefully and answer when you're ready.</p>
            </div>

            {/* PROGRESS */}
            <div className="min-h-0 rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl">
              <h2 className="font-semibold">Interview Progress</h2>
              <div className="mx-auto my-3 flex h-32 w-32 items-center justify-center rounded-full border-[14px] border-violet-500/20 relative">
                <div className="absolute inset-[-14px] rounded-full border-[14px] border-transparent border-t-violet-600 border-r-blue-500" />
                <div className="text-center"><p className="text-2xl font-bold">{currentQuestionIndex + 1} / {MAX_QUESTIONS}</p><p className="text-xs text-gray-400">Question</p></div>
              </div>
              <div className="max-h-[46vh] space-y-1 overflow-y-auto pr-1">
                {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${statusClass(i)}`}>
                    {i < currentQuestionIndex ? <CircleCheck className="h-6 w-6 shrink-0 text-emerald-400" /> : i === currentQuestionIndex ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold">{i + 1}</span> : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-sm">{i + 1}</span>}
                    <div className="min-w-0"><p className="text-sm font-medium">Question {i + 1}</p><p className={`text-xs ${i < currentQuestionIndex ? 'text-gray-500' : i === currentQuestionIndex ? 'text-violet-300' : 'text-gray-500'}`}>{questionStatus(i)}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3"><p className="text-sm text-gray-300">Answer Time</p><div className="mt-1 flex items-center gap-2"><Clock3 className="h-7 w-7 text-gray-300" /><span className="font-mono text-2xl font-bold text-cyan-400">{formatTime(timeLeft)}</span><span className="text-xs text-gray-500">/ 01:00</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${answerProgress}%` }} /></div></div>
            </div>
          </section>

          {/* QUESTION */}
          <section className="mt-3 min-h-[112px] shrink-0 rounded-2xl border border-white/10 bg-slate-950/60 p-4 lg:min-h-[118px]">
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-300"><CircleHelp className="h-5 w-5" />Current Question</div>
            <p className="mt-3 text-[clamp(15px,1.25vw,20px)] leading-relaxed text-white">{currentQuestion}</p>
            <button onClick={replayQuestion} className="mt-3 text-sm font-semibold text-violet-400 transition hover:text-violet-300"><RotateCcw className="mr-2 inline h-4 w-4" />Replay Question</button>
          </section>

          {/* ANSWER + TIPS */}
          <section className="mt-3 grid min-h-[235px] shrink-0 gap-3 lg:min-h-[250px] lg:grid-cols-[1.55fr_0.45fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><Mic className="h-5 w-5 text-violet-400" />Your Answer</h2>
              <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-slate-950/60 p-1">
                <button onClick={toggleVoiceRecording} disabled={!voiceSupported} className={`rounded-lg px-3 py-2 text-sm font-medium ${recording ? 'bg-red-500/20 text-red-300' : 'bg-violet-600 text-white'} disabled:opacity-40`}><Mic className="mr-2 inline h-4 w-4" />{recording ? 'Stop Answering' : 'Voice Answer'}</button>
                <button onClick={() => document.getElementById('round3-text-answer')?.focus()} className="rounded-lg px-3 py-2 text-sm text-gray-300"><MessageSquare className="mr-2 inline h-4 w-4" />Type Answer</button>
              </div>
              <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/50 p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${recording ? 'border-violet-400 bg-violet-600/20' : 'border-violet-500/30 bg-violet-500/10'}`}><Mic className="h-6 w-6 text-violet-300" /></div>
                  <div className="min-w-0 flex-1"><p className="font-medium">{recording ? 'Listening...' : 'Ready for your answer'}</p><p className="text-xs text-gray-500">{recording ? 'Speak now' : 'Speak clearly or type your answer below'}</p></div>
                  <div className="hidden gap-1 sm:flex">{Array.from({ length: 22 }).map((_, i) => <span key={i} className="w-1 rounded-full bg-violet-400" style={{ height: `${5 + ((i * 7) % 18)}px` }} />)}</div>
                </div>
                {voiceTranscript && <p className="mt-2 max-h-16 overflow-y-auto text-sm text-gray-200">{voiceTranscript}</p>}
              </div>
              <textarea id="round3-text-answer" value={textAnswer} onChange={(e) => setTextAnswer(e.target.value.slice(0, 2000))} rows={2} maxLength={2000} placeholder="Type your answer here..." className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-violet-500/50" />
              {error && <p className="mt-2 text-center text-xs text-red-300">{error}</p>}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <h2 className="mb-3 flex items-center gap-2 font-semibold"><Lightbulb className="h-5 w-5 text-cyan-300" />Tips</h2>
              <ul className="space-y-3 text-sm text-gray-300"><li><Check className="mr-2 inline h-4 w-4 text-cyan-300" />Speak clearly</li><li><Check className="mr-2 inline h-4 w-4 text-cyan-300" />Maintain good eye contact</li><li><Check className="mr-2 inline h-4 w-4 text-cyan-300" />Take your time</li><li><Check className="mr-2 inline h-4 w-4 text-cyan-300" />Be confident</li></ul>
            </div>
          </section>

          {/* CONTROLS */}
          <section className="mt-3 grid min-h-[82px] shrink-0 gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 sm:grid-cols-[0.8fr_1.3fr_0.8fr]">
            <button onClick={handleSkipQuestion} disabled={loading} className="rounded-xl border border-amber-400/70 bg-amber-500/5 px-4 py-3 font-semibold text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-40"><SkipForward className="mr-2 inline h-5 w-5" />Skip Question<p className="text-xs font-normal text-gray-500">Skip and move to next</p></button>
            <button onClick={handleSubmitAndNext} disabled={loading} className="rounded-xl border border-blue-400/60 bg-gradient-to-r from-blue-600/90 to-blue-500/90 px-4 py-3 font-semibold text-white transition hover:opacity-95 disabled:opacity-40">{loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : <><span className="text-lg">{currentQuestionIndex === MAX_QUESTIONS - 1 ? 'Submit & Finish' : 'Next Question →'}</span><p className="text-xs font-normal text-blue-100">Save answer and go to next</p></>}</button>
            <button onClick={handleSubmitInterview} disabled={loading} className="rounded-xl border border-emerald-400/70 bg-emerald-500/5 px-4 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-40"><Check className="mr-2 inline h-5 w-5" />Submit Interview<p className="text-xs font-normal text-gray-500">Submit and finish interview</p></button>
          </section>

          <p className="mt-2 shrink-0 text-center text-xs text-gray-500"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" />Your video and audio are secure and encrypted. Only used for this interview session.</p>
        </main>
      )}
    </div>
  );
};

export default AIInterview