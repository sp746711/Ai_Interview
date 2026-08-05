import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
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

const MAX_QUESTIONS = 5;
const QUESTION_TIME = 60;

const DEMO_QUESTIONS = [
  'Tell me about yourself and your experience related to cloud computing.',
  'How have you used cloud computing in one of your projects?',
  'What is the difference between scalability and elasticity in cloud computing?',
  'How would you design a highly available cloud application?',
  'What security considerations would you consider when deploying an application to the cloud?',
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
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
            document.webkitFullscreenElement
        )
      );
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
  }, []);

  /* =======================================================
     CAMERA
     ======================================================= */

  const startCamera = async () => {
    try {
      setError('');

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const videoTrack =
        stream.getVideoTracks()?.[0];

      const audioTrack =
        stream.getAudioTracks()?.[0];

      setCameraOn(
        Boolean(videoTrack && videoTrack.enabled)
      );

      setMicAvailable(
        Boolean(audioTrack && audioTrack.enabled)
      );
    } catch (err) {
      console.error(
        'Camera/microphone error:',
        err
      );

      setCameraOn(false);

      setMicAvailable(false);

      setError(
        'Camera or microphone permission was not granted. You can still test the text interview.'
      );
    }
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

  const speakQuestion = (question) => {
    if (!question) return;

    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    setAiSpeaking(false);

    const utterance =
      new SpeechSynthesisUtterance(question);

    utterance.lang = 'en-US';

    utterance.rate = 0.95;

    utterance.pitch = 1;

    utterance.volume = 1;

    utterance.onstart = () => {
      setAiSpeaking(true);
    };

    utterance.onend = () => {
      setAiSpeaking(false);
    };

    utterance.onerror = () => {
      setAiSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
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
     START INTERVIEW
     ======================================================= */

  const startInterview = async () => {
    setError('');

    /*
     * Fullscreen request must happen from the user's click.
     */
    await enterFullscreen();

    setInterviewStarted(true);

    setInterviewComplete(false);

    setCurrentQuestionIndex(0);

    setCurrentQuestion(
      DEMO_QUESTIONS[0]
    );

    setTextAnswer('');

    setVoiceTranscript('');

    setTimeLeft(QUESTION_TIME);

    setTimeout(() => {
      speakQuestion(DEMO_QUESTIONS[0]);
    }, 500);
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

    setTimeout(() => {
      speakQuestion(nextQuestion);
    }, 500);
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

      console.log(
        'Demo interview answer:',
        {
          questionNumber:
            currentQuestionIndex + 1,
          question: currentQuestion,
          answer: finalAnswer,
        }
      );

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
     SKIP
     ======================================================= */

  const handleSkipQuestion = () => {
    setError('');

    moveToNextQuestion();
  };

  /* =======================================================
     FINISH INTERVIEW
     ======================================================= */

  const finishInterview = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
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

    window.speechSynthesis?.cancel();

    setAiSpeaking(false);

    setRecording(false);

    setInterviewComplete(true);

    setInterviewStarted(false);

    setCurrentQuestion('');

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

    window.speechSynthesis?.cancel();

    setAiSpeaking(false);

    await exitFullscreen();

    navigate('/dashboard');
  };

  /* =======================================================
     INITIAL CAMERA + CLEANUP
     ======================================================= */

  useEffect(() => {
    startCamera();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      window.speechSynthesis?.cancel();

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }
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
     MAIN UI
     ======================================================= */

  return (
    <div
      className={`bg-gradient-to-br from-[#020817] via-[#061426] to-[#020617] text-white ${
        interviewStarted || isFullscreen
          ? `
              min-h-screen
              lg:h-[100dvh]
              lg:min-h-0
              lg:max-h-[100dvh]
              lg:overflow-hidden
              lg:flex
              lg:flex-col
            `
          : 'min-h-[calc(100vh-80px)]'
      }`}
    >
      {/* =================================================
          TOP BAR
          ================================================= */}

      <div className="shrink-0 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[1500px]
            items-center
            justify-between
            px-[clamp(12px,1.5vw,20px)]
            py-[clamp(8px,1.2vh,16px)]
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-[clamp(34px,5vh,40px)]
                w-[clamp(34px,5vh,40px)]
                items-center
                justify-center
                rounded-xl
                border
                border-cyan-400/30
                bg-cyan-500/10
              "
            >
              <Bot className="h-6 w-6 text-cyan-400" />
            </div>

            <div>
              <h1 className="font-bold">
                MockMind AI
              </h1>

              <p className="text-xs text-gray-500">
                AI Interview Room
              </p>
            </div>
          </div>

          <button
            onClick={handleEndInterview}
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-red-400/20
              px-[clamp(10px,1vw,16px)]
              py-[clamp(7px,1vh,8px)]
              text-sm
              text-red-300
              transition
              hover:bg-red-500/10
            "
          >
            <LogOut className="h-4 w-4" />

            <span className="hidden sm:inline">
              Exit Interview
            </span>
          </button>
        </div>
      </div>

      {/* =================================================
          CONTENT
          ================================================= */}

      <main
        className={`
          mx-auto
          w-full
          max-w-[1500px]
          px-[clamp(10px,1.5vw,24px)]

          ${
            interviewStarted ||
            isFullscreen
              ? `
                  lg:flex-1
                  lg:min-h-0
                  lg:overflow-hidden
                  lg:flex
                  lg:flex-col
                  py-[clamp(7px,1.1vh,18px)]
                `
              : 'py-5'
          }
        `}
      >
        {/* =================================================
            DOMAIN + PROGRESS
            ================================================= */}

        <section
          className="
            shrink-0
            text-center
            mb-[clamp(7px,1.2vh,20px)]
          "
        >
          <h2
            className="
              font-bold
              text-cyan-300
              text-[clamp(20px,2vw,30px)]
              leading-tight
            "
          >
            {selectedRole} Interview
          </h2>

          <p
            className="
              mt-[clamp(2px,0.4vh,4px)]
              text-[clamp(11px,1vw,14px)]
              text-gray-300
            "
          >
            {interviewStarted
              ? `Question ${
                  currentQuestionIndex + 1
                } of ${MAX_QUESTIONS}`
              : 'Ready to begin'}
          </p>

          <div
            className="
              mx-auto
              flex
              max-w-xs
              items-center
              justify-center
              gap-[clamp(7px,0.8vw,12px)]
              mt-[clamp(5px,0.8vh,12px)]
            "
          >
            {Array.from({
              length: MAX_QUESTIONS,
            }).map((_, index) => (
              <div
                key={index}
                className={`rounded-full transition-all h-[clamp(8px,1.2vh,12px)] w-[clamp(8px,1.2vh,12px)] ${
                  interviewStarted &&
                  index ===
                    currentQuestionIndex
                    ? 'scale-110 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]'
                    : index <
                        currentQuestionIndex
                      ? 'bg-emerald-400'
                      : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div
            className="
              mx-auto
              max-w-2xl
              overflow-hidden
              rounded-full
              bg-white/10
              h-[clamp(4px,0.6vh,6px)]
              mt-[clamp(5px,0.8vh,12px)]
            "
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-500"
              style={{
                width: interviewStarted
                  ? `${progress}%`
                  : '0%',
              }}
            />
          </div>
        </section>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div
            className="
              mx-auto
              mb-[clamp(6px,1vh,16px)]
              max-w-4xl
              shrink-0
              rounded-xl
              border
              border-red-500/20
              bg-red-500/10
              px-4
              py-2
              text-center
              text-sm
              text-red-300
            "
          >
            {error}
          </div>
        )}

        {/* =================================================
            RESPONSIVE INTERVIEW WORKSPACE
            ================================================= */}

        <div
          className={`
            grid
            grid-cols-1
            items-stretch
            gap-[clamp(10px,1.2vw,20px)]

            lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]

            ${
              interviewStarted ||
              isFullscreen
                ? `
                    lg:flex-1
                    lg:min-h-0
                    lg:overflow-hidden
                  `
                : ''
            }
          `}
        >
          {/* =================================================
              LEFT PANEL
              ================================================= */}

          <div
            className={`
              flex
              min-h-0
              flex-col
              gap-[clamp(8px,1.2vh,16px)]

              ${
                interviewStarted ||
                isFullscreen
                  ? 'lg:h-full lg:overflow-hidden'
                  : ''
              }
            `}
          >
            {/* =================================================
                CAMERA
                ================================================= */}

            <section
              className="
                shrink-0
                rounded-2xl
                border
                border-white/10
                bg-slate-950/60
                p-[clamp(10px,1.4vh,16px)]
                shadow-xl
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-[clamp(7px,1vh,16px)]
                "
              >
                <h3
                  className="
                    flex
                    items-center
                    gap-2
                    font-semibold
                    text-[clamp(13px,1.1vw,16px)]
                  "
                >
                  <Camera className="h-5 w-5" />

                  Live Preview
                </h3>

                <div
                  className={`flex items-center gap-2 text-[clamp(11px,1vw,14px)] ${
                    cameraOn
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      cameraOn
                        ? 'bg-emerald-400'
                        : 'bg-red-400'
                    }`}
                  />

                  {cameraOn
                    ? 'Camera On'
                    : 'Camera Off'}
                </div>
              </div>

              {/* CAMERA VIDEO */}

              <div className="relative overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`
                    w-full
                    object-cover
                    transition-opacity

                    h-[clamp(190px,34vh,340px)]

                    ${
                      cameraOn
                        ? 'opacity-100'
                        : 'opacity-0'
                    }
                  `}
                />

                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                    <VideoOff className="mb-3 h-12 w-12" />

                    <p>
                      Camera is turned off
                    </p>
                  </div>
                )}
              </div>

              {/* CAMERA + MIC STATUS */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-[clamp(6px,0.8vw,12px)]
                  mt-[clamp(7px,1vh,16px)]
                "
              >
                <button
                  onClick={toggleCamera}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-[clamp(7px,1vh,12px)] text-[clamp(11px,1vw,14px)] ${
                    cameraOn
                      ? 'border-emerald-400/20 bg-emerald-500/5 text-emerald-400'
                      : 'border-red-400/20 bg-red-500/5 text-red-400'
                  }`}
                >
                  {cameraOn ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <VideoOff className="h-4 w-4" />
                  )}

                  {cameraOn
                    ? 'Camera On'
                    : 'Enable Camera'}
                </button>

                <div
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-[clamp(7px,1vh,12px)] text-[clamp(11px,1vw,14px)] ${
                    micAvailable
                      ? 'border-emerald-400/20 bg-emerald-500/5 text-emerald-400'
                      : 'border-red-400/20 bg-red-500/5 text-red-400'
                  }`}
                >
                  {micAvailable ? (
                    <Mic className="h-4 w-4" />
                  ) : (
                    <MicOff className="h-4 w-4" />
                  )}

                  {micAvailable
                    ? 'Mic Ready'
                    : 'Mic Unavailable'}
                </div>
              </div>
            </section>

            {/* =================================================
                CURRENT QUESTION
                ================================================= */}

            <section
              className={`
                min-h-0
                rounded-2xl
                border
                border-violet-500/40
                bg-gradient-to-br
                from-slate-950/90
                to-blue-950/30
                p-[clamp(10px,1.4vh,20px)]

                ${
                  interviewStarted ||
                  isFullscreen
                    ? 'lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden'
                    : ''
                }
              `}
            >
              <div className="flex shrink-0 items-center gap-2 text-[clamp(11px,1vw,14px)] font-medium text-violet-300">
                <CircleHelp className="h-5 w-5" />

                Current Question
              </div>

              <div
                className={`
                  mt-[clamp(7px,1.2vh,20px)]
                  min-h-[55px]

                  ${
                    interviewStarted ||
                    isFullscreen
                      ? 'lg:flex-1 lg:min-h-0 lg:overflow-y-auto'
                      : 'md:min-h-[90px]'
                  }
                `}
              >
                {currentQuestion ? (
                  <p
                    className="
                      font-semibold
                      leading-relaxed
                      text-white
                      text-[clamp(14px,1.35vw,20px)]
                    "
                  >
                    {currentQuestion}
                  </p>
                ) : (
                  <p className="text-[clamp(12px,1vw,16px)] text-gray-500">
                    Start the interview to
                    receive your first
                    question.
                  </p>
                )}
              </div>

              {/* TIMER */}

              <div
                className="
                  mt-[clamp(7px,1vh,20px)]
                  flex
                  shrink-0
                  items-center
                  justify-between
                  border-t
                  border-white/10
                  pt-[clamp(7px,1vh,16px)]
                "
              >
                <span className="text-[clamp(11px,1vw,14px)] text-gray-400">
                  Time Left
                </span>

                <span
                  className={`font-mono font-bold text-[clamp(16px,1.5vw,20px)] ${
                    !interviewStarted
                      ? 'text-gray-500'
                      : timeLeft <= 10
                        ? 'text-red-400'
                        : 'text-emerald-400'
                  }`}
                >
                  {interviewStarted
                    ? formatTime(timeLeft)
                    : '--:--'}
                </span>
              </div>
            </section>
          </div>

          {/* =================================================
              RIGHT PANEL
              ================================================= */}

          <section
            className={`
              flex
              min-h-0
              flex-col
              overflow-hidden
              rounded-2xl
              border
              border-cyan-500/20
              bg-slate-950/60
              shadow-[0_0_40px_rgba(6,182,212,0.06)]

              ${
                interviewStarted ||
                isFullscreen
                  ? 'lg:h-full'
                  : 'min-h-[650px]'
              }
            `}
          >
            {/* =================================================
                AI ROBOT AREA
                ================================================= */}

            <div
              className={`
                relative
                flex
                shrink-0
                flex-col
                items-center
                justify-center
                overflow-hidden
                border-b
                border-white/10
                p-[clamp(8px,1.3vh,24px)]

                ${
                  interviewStarted ||
                  isFullscreen
                    ? 'h-[clamp(175px,29vh,300px)]'
                    : 'min-h-[330px]'
                }
              `}
            >
              {/* REPLAY */}

              <button
                onClick={replayQuestion}
                disabled={!currentQuestion}
                className="
                  absolute
                  right-[clamp(8px,1vw,16px)]
                  top-[clamp(8px,1vh,16px)]
                  z-30
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-900/80
                  px-[clamp(9px,1vw,16px)]
                  py-[clamp(6px,0.8vh,8px)]
                  text-[clamp(10px,0.9vw,14px)]
                  text-gray-200
                  transition
                  hover:border-cyan-400/30
                  hover:text-cyan-300
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <RotateCcw className="h-4 w-4" />

                <span className="hidden sm:inline">
                  Replay Question
                </span>
              </button>

              {/* =================================================
                  WAVEFORM
                  ================================================= */}

              <div className="pointer-events-none absolute left-[clamp(12px,3vw,32px)] right-[clamp(12px,3vw,32px)] top-1/2 flex -translate-y-1/2 items-center justify-between gap-[clamp(1px,0.25vw,4px)] opacity-35">
                {Array.from({
                  length: 60,
                }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-1 rounded-full bg-cyan-400 ${
                      aiSpeaking
                        ? 'mockmind-wave-bar'
                        : ''
                    }`}
                    style={{
                      height: `${
                        8 +
                        ((index * 13) % 45)
                      }px`,
                      animationDelay: `${
                        (index % 10) * 0.05
                      }s`,
                    }}
                  />
                ))}
              </div>

              {/* =================================================
                  RESPONSIVE COMPLETE ROBOT

                  IMPORTANT:
                  We scale the entire robot wrapper.
                  No part of the robot is cropped.
                  ================================================= */}

              <div
                className="
                  mockmind-robot-responsive
                  relative
                  z-10
                  flex
                  items-center
                  justify-center
                "
              >
                <AIInterviewerAvatar
                  speaking={aiSpeaking}
                />
              </div>

              {/* SPEAKING STATUS */}

              <div className="relative z-10 mt-[clamp(0px,0.4vh,8px)] shrink-0 text-center">
                <div className="flex items-center justify-center gap-2">
                  {aiSpeaking && (
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                  )}

                  <p className="text-[clamp(11px,1vw,16px)] font-semibold text-cyan-300">
                    {aiSpeaking
                      ? 'AI Interviewer is speaking...'
                      : interviewStarted
                        ? 'AI Interviewer'
                        : 'Ready for Interview'}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                QUESTION DISPLAY
                ================================================= */}

            <div
              className="
                shrink-0
                px-[clamp(10px,1.4vw,20px)]
                pt-[clamp(8px,1.1vh,20px)]
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  max-w-2xl
                  items-start
                  gap-[clamp(8px,1vw,12px)]
                  rounded-2xl
                  border
                  border-white/10
                  bg-slate-900/80
                  p-[clamp(9px,1.2vh,16px)]
                "
              >
                <div
                  className="
                    mt-1
                    flex
                    h-[clamp(30px,4vh,36px)]
                    w-[clamp(30px,4vh,36px)]
                    flex-shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-cyan-500/10
                  "
                >
                  <Volume2 className="h-5 w-5 text-cyan-300" />
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-500 sm:text-xs">
                    AI Question
                  </p>

                  <p className="text-[clamp(12px,1.05vw,16px)] font-medium leading-relaxed text-white">
                    {currentQuestion ||
                      'Click Start Interview to begin your interview.'}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                ANSWER AREA

                Only this area receives internal scrolling when
                the laptop screen is too short.
                ================================================= */}

            <div
              className={`
                flex-1
                min-h-0
                p-[clamp(10px,1.3vh,20px)]

                ${
                  interviewStarted ||
                  isFullscreen
                    ? 'mockmind-answer-scroll overflow-y-auto'
                    : ''
                }
              `}
            >
              {/* =================================================
                  START SCREEN
                  ================================================= */}

              {!interviewStarted && (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold">
                    Ready to start?
                  </h3>

                  <p className="mt-2 max-w-md text-center text-sm text-gray-400">
                    The AI interviewer will
                    ask you {MAX_QUESTIONS}{' '}
                    questions. Each question
                    will have a{' '}
                    {QUESTION_TIME}-second
                    answer window.
                  </p>

                  <p className="mt-2 max-w-md text-center text-xs text-cyan-400/70">
                    Starting the interview
                    will open the interview
                    room in fullscreen mode.
                  </p>

                  <button
                    onClick={startInterview}
                    className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-8 py-3 font-semibold text-white transition hover:scale-[1.02]"
                  >
                    Start Interview
                  </button>
                </div>
              )}

              {/* =================================================
                  ACTIVE INTERVIEW
                  ================================================= */}

              {interviewStarted && (
                <div className="space-y-[clamp(8px,1.1vh,16px)]">
                  {/* =============================================
                      VOICE ANSWER
                      ============================================= */}

                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5">
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-white/5
                        px-[clamp(10px,1vw,16px)]
                        py-[clamp(7px,0.9vh,12px)]
                      "
                    >
                      <div className="flex items-center gap-2 text-[clamp(11px,1vw,14px)] font-medium text-violet-300">
                        <Mic className="h-5 w-5" />

                        Answer with Voice
                      </div>

                      {recording && (
                        <div className="flex items-center gap-2 text-[clamp(10px,0.9vw,14px)] text-emerald-400">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                          Listening...
                        </div>
                      )}
                    </div>

                    <div className="p-[clamp(8px,1vh,12px)]">
                      <button
                        onClick={
                          toggleVoiceRecording
                        }
                        disabled={
                          !voiceSupported
                        }
                        className={`mb-[clamp(7px,1vh,12px)] flex w-full items-center justify-center gap-2 rounded-xl border py-[clamp(7px,1vh,10px)] text-[clamp(11px,1vw,14px)] font-medium transition ${
                          recording
                            ? 'border-red-400/30 bg-red-500/10 text-red-300'
                            : 'border-violet-400/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {recording ? (
                          <>
                            <Square className="h-4 w-4" />

                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />

                            Start Voice Answer
                          </>
                        )}
                      </button>

                      <div
                        className="
                          rounded-xl
                          border
                          border-white/5
                          bg-black/20
                          p-[clamp(8px,1vh,12px)]
                          min-h-[clamp(48px,7vh,70px)]
                          max-h-[clamp(65px,10vh,110px)]
                          overflow-y-auto
                        "
                      >
                        {voiceTranscript ? (
                          <p className="text-[clamp(11px,1vw,16px)] leading-relaxed text-gray-200">
                            {
                              voiceTranscript
                            }
                          </p>
                        ) : (
                          <p className="text-[clamp(10px,0.9vw,14px)] text-gray-500">
                            {voiceSupported
                              ? 'Your spoken answer will appear here...'
                              : 'Speech recognition is not supported in this browser.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* =============================================
                      OR
                      ============================================= */}

                  <div className="flex items-center gap-4 py-[clamp(1px,0.3vh,4px)]">
                    <div className="h-px flex-1 bg-white/10" />

                    <span className="text-xs font-semibold text-gray-500">
                      OR
                    </span>

                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {/* =============================================
                      TEXT ANSWER
                      ============================================= */}

                  <div>
                    <label className="mb-[clamp(5px,0.7vh,8px)] flex items-center gap-2 text-[clamp(11px,1vw,14px)] text-violet-300">
                      <Send className="h-4 w-4" />

                      Type your answer
                    </label>

                    <div className="relative">
                      <textarea
                        value={textAnswer}
                        onChange={(event) =>
                          setTextAnswer(
                            event.target.value.slice(
                              0,
                              2000
                            )
                          )
                        }
                        rows={3}
                        maxLength={2000}
                        placeholder="Type your answer here..."
                        className="
                          w-full
                          resize-none
                          rounded-xl
                          border
                          border-white/10
                          bg-black/30
                          px-4
                          py-[clamp(8px,1vh,12px)]
                          pr-16
                          text-[clamp(11px,1vw,16px)]
                          text-white
                          outline-none
                          transition
                          placeholder:text-gray-600
                          focus:border-violet-500/50
                          min-h-[70px]
                          max-h-[clamp(80px,13vh,130px)]
                        "
                      />

                      <span className="absolute bottom-3 right-3 text-xs text-gray-600">
                        {textAnswer.length}
                        /2000
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                CONTROLS

                Controls remain outside the scroll area so the
                candidate can always reach Submit / Skip / End.
                ================================================= */}

            {interviewStarted && (
              <div
                className="
                  shrink-0
                  grid
                  grid-cols-1
                  gap-[clamp(6px,0.8vw,12px)]
                  border-t
                  border-white/10
                  p-[clamp(8px,1vh,16px)]
                  sm:grid-cols-3
                "
              >
                <button
                  onClick={
                    handleSkipQuestion
                  }
                  disabled={loading}
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-white/10
                    px-[clamp(8px,1vw,16px)]
                    py-[clamp(7px,1vh,12px)]
                    text-[clamp(10px,0.9vw,14px)]
                    text-gray-300
                    transition
                    hover:bg-white/5
                    disabled:opacity-40
                  "
                >
                  <SkipForward className="h-4 w-4" />

                  Skip Question
                </button>

                <button
                  onClick={
                    handleSubmitAndNext
                  }
                  disabled={loading}
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-gradient-to-r
                    from-violet-600
                    to-blue-600
                    px-[clamp(8px,1vw,16px)]
                    py-[clamp(7px,1vh,12px)]
                    text-[clamp(10px,0.9vw,14px)]
                    font-semibold
                    text-white
                    transition
                    hover:opacity-90
                    disabled:opacity-50
                  "
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {currentQuestionIndex ===
                      MAX_QUESTIONS - 1
                        ? 'Submit & Finish'
                        : 'Submit & Next'}

                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={
                    handleEndInterview
                  }
                  disabled={loading}
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-red-500/20
                    px-[clamp(8px,1vw,16px)]
                    py-[clamp(7px,1vh,12px)]
                    text-[clamp(10px,0.9vw,14px)]
                    text-red-400
                    transition
                    hover:bg-red-500/10
                    disabled:opacity-40
                  "
                >
                  <Flag className="h-4 w-4" />

                  End Interview
                </button>
              </div>
            )}
          </section>
        </div>

        {/* =================================================
            PRIVACY

            Hide during active fullscreen interview because it
            unnecessarily consumes vertical interview space.
            ================================================= */}

        {!interviewStarted && (
          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-center text-xs text-gray-500">
            Your answers are used only for
            interview evaluation. Camera
            preview remains within your
            interview session.
          </div>
        )}
      </main>
    </div>
  );
};

export default AIInterview;