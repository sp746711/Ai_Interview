import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../../services/api';

import {
  Clock,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ArrowRight,
} from 'lucide-react';


// ============================================================
// TASK 13 + TASK 14 ONLY
// Avatar event storage.
// Existing Test functionality is NOT changed.
// ============================================================

const AVATAR_EVENT_KEY = 'mockmind_avatar_event';

const Test = () => {
  /* ======================================================
     NORMAL TEST STATE
     ====================================================== */

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});

  // ==========================================================
  // TASK 16 — PER-QUESTION TIME TRACKING
  // ==========================================================
  const [questionTimes, setQuestionTimes] = useState({});

  // Stores elapsed seconds for each question key.
  const questionTimesRef = useRef({});
  const activeQuestionRef = useRef(null);
  const questionStartedAtRef = useRef(null);

  // 40 minutes
  const [timeLeft, setTimeLeft] = useState(50* 60);

  /* ======================================================
     SECURITY STATE
     ====================================================== */

  const [violationCount, setViolationCount] = useState(0);

  const [securityWarning, setSecurityWarning] = useState(false);

  const [securityReason, setSecurityReason] = useState('');

  const [securityTerminated, setSecurityTerminated] = useState(false);

  const [securityEvents, setSecurityEvents] = useState([]);

  /*
   * Refs are important because event listeners need
   * the latest values immediately.
   */

  const violationCountRef = useRef(0);

  const submittingRef = useRef(false);

  const securityTerminatedRef = useRef(false);

  const answersRef = useRef({});

  const questionsRef = useRef([]);

  const securityEventsRef = useRef([]);

  const initializationRef = useRef(false);

  const handleSubmitRef = useRef(null);


  // ==========================================================
  // TASK 14 ONLY
  // Prevent the same avatar event from being sent repeatedly.
  // ==========================================================

  const avatarEventsSentRef = useRef({
    round2Start: false,
    round2Started: false,
    timeWarning: false,
    finalStage: false,
    round2Complete: false,
  });


  const navigate = useNavigate();

  const currentInterview = JSON.parse(
    localStorage.getItem('current_interview') || '{}'
  );


  /* ======================================================
     TASK 14 — AVATAR EVENT HELPER
     ====================================================== */

  const setAvatarEvent = (event) => {
    try {
      localStorage.setItem(
        AVATAR_EVENT_KEY,
        event
      );

      /*
       * Same-tab support.
       *
       * If the avatar listener is mounted at the same time,
       * it can receive this event immediately.
       *
       * This does NOT change the test functionality.
       */

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


  /* ======================================================
     KEEP REFS SYNCHRONIZED
     ====================================================== */

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);


  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);


  // ==========================================================
  // TASK 16 — TRACK TIME SPENT ON EACH QUESTION
  // ==========================================================
  useEffect(() => {
    if (loading || questions.length === 0) {
      return;
    }

    // Initialize all question times once the questions are loaded.
    const initialTimes = {};
    questions.forEach((q, index) => {
      const key = String(q.question || `q_${index}`);
      initialTimes[key] = 0;
    });

    questionTimesRef.current = initialTimes;
    setQuestionTimes(initialTimes);

    const questionElements = document.querySelectorAll(
      '[data-question-index]'
    );

    if (!questionElements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          );

        if (!visibleEntries.length) {
          return;
        }

        const nextIndex = Number(
          visibleEntries[0].target.dataset.questionIndex
        );

        if (Number.isNaN(nextIndex)) {
          return;
        }

        const now = Date.now();

        // Add elapsed time to the previously active question.
        if (
          activeQuestionRef.current !== null &&
          questionStartedAtRef.current !== null
        ) {
          const previousQuestion =
            questions[activeQuestionRef.current];

          if (previousQuestion) {
            const previousKey = String(
              previousQuestion.question ||
                `q_${activeQuestionRef.current}`
            );

            const elapsedSeconds = Math.max(
              0,
              Math.floor(
                (now - questionStartedAtRef.current) / 1000
              )
            );

            questionTimesRef.current[previousKey] =
              (questionTimesRef.current[previousKey] || 0) +
              elapsedSeconds;
          }
        }

        activeQuestionRef.current = nextIndex;
        questionStartedAtRef.current = now;

        setQuestionTimes({
          ...questionTimesRef.current,
        });
      },
      {
        threshold: [0.4, 0.6, 0.8],
      }
    );

    questionElements.forEach((element) =>
      observer.observe(element)
    );

    return () => {
      const now = Date.now();

      // Save the time currently being spent on the active question.
      if (
        activeQuestionRef.current !== null &&
        questionStartedAtRef.current !== null
      ) {
        const activeQuestion =
          questions[activeQuestionRef.current];

        if (activeQuestion) {
          const activeKey = String(
            activeQuestion.question ||
              `q_${activeQuestionRef.current}`
          );

          const elapsedSeconds = Math.max(
            0,
            Math.floor(
              (now - questionStartedAtRef.current) / 1000
            )
          );

          questionTimesRef.current[activeKey] =
            (questionTimesRef.current[activeKey] || 0) +
            elapsedSeconds;
        }
      }

      observer.disconnect();
      activeQuestionRef.current = null;
      questionStartedAtRef.current = null;
    };
  }, [loading, questions]);


  useEffect(() => {
    securityEventsRef.current = securityEvents;
  }, [securityEvents]);


  /* ======================================================
     FETCH QUESTIONS

     PERFORMANCE FIX:
     - Prevent duplicate initialization.
     - Stage and question requests run in parallel.
     - Cancel stale work when the page unmounts.
     ====================================================== */

  useEffect(() => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;

    let cancelled = false;

    const fetchQuestions = async () => {
      if (!currentInterview?.id) {
        if (!cancelled) {
          setError('Interview ID not found.');
          setLoading(false);
          navigate('/dashboard', { replace: true });
        }

        return;
      }

      try {

        // ======================================================
        // TASK 14 ONLY
        // Round 2 has started.
        //
        // Existing API request remains unchanged.
        // ======================================================

        if (
          !avatarEventsSentRef.current.round2Start
        ) {
          setAvatarEvent('round2_start');

          avatarEventsSentRef.current.round2Start =
            true;
        }


        // These requests are independent, so do not wait for one before starting the other.
        const stagePromise = api.get(
          `/interview/stage?interview_id=${encodeURIComponent(
            currentInterview.id
          )}`
        );

        const questionsPromise = api.get(
          `/test/questions?interview_id=${encodeURIComponent(
            currentInterview.id
          )}&interview_type=${encodeURIComponent(
            currentInterview.interview_type || 'technical'
          )}&difficulty=easy`
        );

        const [stageRes, response] = await Promise.all([
          stagePromise,
          questionsPromise,
        ]);

        if (cancelled) {
          return;
        }

        if (stageRes?.data?.stage !== 'test') {
          navigate('/dashboard', { replace: true });
          return;
        }

        let qData = response?.data?.questions || [];

        if (typeof qData === 'string') {
          try {
            qData = JSON.parse(qData);
          } catch (e) {
            console.error(
              'Could not parse stringified questions',
              qData
            );

            qData = [];
          }
        }

        if (!Array.isArray(qData)) {
          qData = [];
        }

        questionsRef.current = qData;
        setQuestions(qData);
        setLoading(false);


        // ======================================================
        // TASK 14 ONLY
        // Questions are ready and the assessment has started.
        // ======================================================

        if (
          !avatarEventsSentRef.current.round2Started
        ) {
          setAvatarEvent('round2_started');

          avatarEventsSentRef.current.round2Started =
            true;
        }

      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          'Round 2 initialization failed:',
          err
        );

        setError('Failed to fetch questions.');
        setLoading(false);
      }
    };

    fetchQuestions();

    return () => {
      cancelled = true;
    };

  }, [
    navigate,
    currentInterview.id,
    currentInterview.interview_type,
  ]);


  /* ======================================================
     TIMER

     PERFORMANCE FIX:
     The old effect recreated the interval every second because
     timeLeft was a dependency. This creates one interval while
     the test is active.
     ====================================================== */

  useEffect(() => {
    if (
      loading ||
      submitting ||
      securityTerminated
    ) {
      return;
    }

    const timerInt = setInterval(() => {
      setTimeLeft((prev) => {

        if (prev <= 1) {
          clearInterval(timerInt);

          if (handleSubmitRef.current) {
            handleSubmitRef.current(false);
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInt);

  }, [
    loading,
    submitting,
    securityTerminated,
  ]);


  /* ======================================================
     TASK 14 — TIME-BASED AVATAR INFORMATION
     
     IMPORTANT:
     Avatar does NOT speak continuously.
     
     Only:
     - 5 minutes remaining
     - 2 minutes remaining
     
     Each message is sent once.
     ====================================================== */

  useEffect(() => {
    if (
      loading ||
      submitting ||
      securityTerminated
    ) {
      return;
    }


    // ------------------------------------------------------
    // 5 MINUTES REMAINING
    // ------------------------------------------------------

    if (
      timeLeft <= 300 &&
      timeLeft > 120 &&
      !avatarEventsSentRef.current.timeWarning
    ) {

      setAvatarEvent(
        'round2_time_warning'
      );

      avatarEventsSentRef.current.timeWarning =
        true;
    }


    // ------------------------------------------------------
    // 2 MINUTES REMAINING
    // ------------------------------------------------------

    if (
      timeLeft <= 120 &&
      timeLeft > 0 &&
      !avatarEventsSentRef.current.finalStage
    ) {

      setAvatarEvent(
        'round2_final_stage'
      );

      avatarEventsSentRef.current.finalStage =
        true;
    }

  }, [
    timeLeft,
    loading,
    submitting,
    securityTerminated,
  ]);


  /* ======================================================
     OPTION SELECT
     ====================================================== */

  const handleOptionSelect = (
    index,
    optionIndex
  ) => {

    if (
      submitting ||
      securityTerminated
    ) {
      return;
    }

    setAnswers((previousAnswers) => {

      const updatedAnswers = {
        ...previousAnswers,

        [index.toString()]:
          optionIndex.toString(),
      };

      answersRef.current =
        updatedAnswers;

      return updatedAnswers;
    });
  };


  /* ======================================================
     BUILD SUBMIT PAYLOAD
     ====================================================== */

  const buildSubmitPayload = (
    securityData = null
  ) => {

    const currentQuestions =
      questionsRef.current;

    const currentAnswers =
      answersRef.current;

    // ==========================================================
    // TASK 16 — FINALIZE CURRENT QUESTION TIME
    // ==========================================================
    if (
      activeQuestionRef.current !== null &&
      questionStartedAtRef.current !== null
    ) {
      const activeIndex = activeQuestionRef.current;
      const activeQuestion = currentQuestions[activeIndex];

      if (activeQuestion) {
        const activeKey = String(
          activeQuestion.question ||
            `q_${activeIndex}`
        );

        const elapsedSeconds = Math.max(
          0,
          Math.floor(
            (Date.now() - questionStartedAtRef.current) / 1000
          )
        );

        questionTimesRef.current[activeKey] =
          (questionTimesRef.current[activeKey] || 0) +
          elapsedSeconds;

        questionStartedAtRef.current = Date.now();
      }
    }

    const submitPayload = {
      interview_id:
        currentInterview.id,

      answers: {},

      // TASK 16 — Backend-required per-question timing.
      question_times: {
        ...questionTimesRef.current,
      },
    };

    currentQuestions.forEach(
      (q, idx) => {

        const selectedOptIdx =
          currentAnswers[
            idx.toString()
          ];

        const opts = Array.isArray(
          q.options
        )
          ? q.options
          : [];

        const selectedValue =
          selectedOptIdx !== undefined
            ? opts[
                parseInt(
                  selectedOptIdx,
                  10
                )
              ]
            : null;

        submitPayload.answers[
          String(
            q.question ||
              `q_${idx}`
          )
        ] = selectedValue ?? '';
      }
    );

    /*
     * Security information is prepared here.
     *
     * For now it is stored locally.
     * Later we will add backend MongoDB storage.
     */

    if (securityData) {
      submitPayload.security =
        securityData;
    }

    return submitPayload;
  };


  /* ======================================================
     SUBMIT TEST
     ====================================================== */

  const handleSubmit = async (
    securityAutoSubmit = false,
    securityData = null
  ) => {

    if (!currentInterview.id) {
      return;
    }


    /*
     * Prevent duplicate submissions.
     */

    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    setSubmitting(true);


    const submitPayload =
      buildSubmitPayload(
        securityData
      );


    try {

      /*
       * Current backend submission.
       *
       * Security data will be added to the backend
       * in our next step.
       */

      await api.post(
        '/test/submit',
        {
          interview_id:
            submitPayload.interview_id,

          answers:
            submitPayload.answers,

          question_times:
            submitPayload.question_times,
        }
      );


      // ======================================================
      // TASK 14 ONLY
      // Round 2 has completed successfully.
      //
      // This does NOT change the existing submission logic.
      // ======================================================

      if (
        !avatarEventsSentRef.current.round2Complete
      ) {

        setAvatarEvent(
          'round2_complete'
        );

        avatarEventsSentRef.current.round2Complete =
          true;
      }


      /* =========================================
         SECURITY AUTO-SUBMIT
         ========================================= */

      if (securityAutoSubmit) {

        /*
         * Second security violation happened.
         *
         * Round 2 has already been submitted above.
         * Keep the security record so it can later
         * appear in Final Feedback.
         */

        const securityRecord = {
          status: 'flagged',

          violation_count:
            violationCountRef.current,

          auto_submitted: true,

          auto_submit_reason:
            'second_security_violation',

          events:
            securityData?.events || [],
        };


        /*
         * Store temporary security record using
         * this interview's ID.
         */

        localStorage.setItem(
          `round2_security_${currentInterview.id}`,
          JSON.stringify(
            securityRecord
          )
        );


        /*
         * IMPORTANT:
         *
         * Do NOT go to Feedback.
         *
         * Round 2 is complete, therefore continue
         * to Round 3 Setup.
         */

        localStorage.setItem(
          'current_interview',
          JSON.stringify({
            ...currentInterview,

            stage: 'setup',

            difficulty: 'easy',

            round2_security:
              securityRecord,
          })
        );


        /*
         * Continue to Round 3.
         */

        navigate('/setup', {
          replace: true,

          state: {
            round2SecurityViolation:
              true,

            security:
              securityRecord,
          },
        });

        return;
      }


      /* =========================================
         NORMAL SUBMISSION
         ========================================= */

      localStorage.setItem(
        'current_interview',
        JSON.stringify({
          ...currentInterview,

          stage: 'setup',

          difficulty: 'easy',
        })
      );

      navigate('/setup');

    } catch (err) {

      console.error(err);

      setError(
        securityAutoSubmit
          ? 'Failed to save your assessment. Please try again.'
          : 'Failed to submit test.'
      );


      /*
       * If normal submission fails,
       * allow the candidate to try again.
       *
       * If security auto-submit fails,
       * keep the assessment locked.
       */

      if (!securityAutoSubmit) {
        submittingRef.current =
          false;

        setSubmitting(false);
      }
    }
  };


  // Always expose the latest submit function to the stable timer/security handlers.
  handleSubmitRef.current = handleSubmit;


  /* ======================================================
     SECURITY VIOLATION
     ====================================================== */

  const registerViolation =
    useCallback(
      (
        type,
        message,
        counted = true
      ) => {

        /*
         * Ignore events before the test loads.
         */

        if (loading) return;


        /*
         * Ignore events while submitting.
         */

        if (
          submittingRef.current ||
          securityTerminatedRef.current
        ) {
          return;
        }


        const event = {
          type,

          message,

          timestamp:
            new Date().toISOString(),
        };


        const updatedSecurityEvents = [
          ...securityEventsRef.current,
          event,
        ];


        securityEventsRef.current =
          updatedSecurityEvents;

        setSecurityEvents(
          updatedSecurityEvents
        );


        /*
         * Some events are only logged and
         * do not count as violations.
         */

        if (!counted) {
          return;
        }


        const nextCount =
          violationCountRef.current +
          1;


        violationCountRef.current =
          nextCount;

        setViolationCount(
          nextCount
        );


        /* =========================================
           FIRST VIOLATION
           ========================================= */

        if (nextCount === 1) {

          setSecurityReason(message);

          setSecurityWarning(true);

          return;
        }


        /* =========================================
           SECOND VIOLATION
           ========================================= */

        if (nextCount >= 2) {

          securityTerminatedRef.current =
            true;

          setSecurityTerminated(
            true
          );

          setSecurityReason(message);


          /*
           * Include the second/current violation
           * immediately.
           */

          const finalEvents = [
            ...securityEventsRef.current,
          ];


          /*
           * Show the final security screen briefly,
           * then save and submit Round 2.
           */

          setTimeout(() => {

            if (handleSubmitRef.current) {

              handleSubmitRef.current(
                true,
                {
                  status: 'flagged',

                  violation_count:
                    nextCount,

                  auto_submitted:
                    true,

                  auto_submit_reason:
                    'second_security_violation',

                  events:
                    finalEvents,
                }
              );
            }

          }, 1200);
        }
      },
      [
        loading,
      ]
    );


  /* ======================================================
     SECURITY EVENT LISTENERS
     ====================================================== */

  useEffect(() => {

    if (loading) return;


    // One physical action must count as only one violation.
    // Example: a tab switch can fire both blur and visibilitychange.

    let lastViolationTime = 0;
    let lastViolationGroup = '';


    const registerDeduplicatedViolation = (
      group,
      type,
      message,
      counted = true
    ) => {

      const now = Date.now();


      if (
        counted &&
        lastViolationGroup === group &&
        now - lastViolationTime < 1000
      ) {
        return;
      }


      if (counted) {
        lastViolationGroup = group;
        lastViolationTime = now;
      }


      registerViolation(
        type,
        message,
        counted
      );
    };


    const handleCopy = (event) => {

      event.preventDefault();

      registerDeduplicatedViolation(
        'copy',
        'copy_attempt',
        'Copying assessment content is restricted.',
        true
      );
    };


    const handleCut = (event) => {

      event.preventDefault();

      registerDeduplicatedViolation(
        'cut',
        'cut_attempt',
        'Cutting assessment content is restricted.',
        true
      );
    };


    const handleContextMenu = (event) => {

      event.preventDefault();

      registerDeduplicatedViolation(
        'right_click',
        'right_click',
        'Right-click is restricted during the assessment.',
        true
      );
    };


    const handleDragStart = (event) => {

      event.preventDefault();

      registerDeduplicatedViolation(
        'drag',
        'drag_attempt',
        'Dragging assessment content is restricted.',
        true
      );
    };


    const handleKeyDown = (event) => {

      const key = event.key.toLowerCase();

      const ctrlOrCommand =
        event.ctrlKey ||
        event.metaKey;


      if (
        ctrlOrCommand &&
        key === 'c'
      ) {

        event.preventDefault();

        registerDeduplicatedViolation(
          'copy',
          'copy_shortcut',
          'Copy shortcut detected during the assessment.',
          true
        );

        return;
      }


      if (
        ctrlOrCommand &&
        key === 'x'
      ) {

        event.preventDefault();

        registerDeduplicatedViolation(
          'cut',
          'cut_shortcut',
          'Cut shortcut detected during the assessment.',
          true
        );

        return;
      }


      if (
        ctrlOrCommand &&
        key === 'a'
      ) {

        event.preventDefault();

        return;
      }


      if (
        event.key === 'PrintScreen'
      ) {

        registerViolation(
          'printscreen_key',
          'A screenshot key event was detected.',
          false
        );
      }
    };


    // First tab/window leave = Warning 1/2.
    // Second tab/window leave = auto-submit Round 2 and continue to Round 3.

    const handleVisibilityChange = () => {

      if (
        document.visibilityState ===
        'hidden'
      ) {

        registerDeduplicatedViolation(
          'focus_leave',
          'tab_visibility_change',
          'Leaving the assessment tab is restricted during Round 2.',
          true
        );
      }
    };


    const handleWindowBlur = () => {

      setTimeout(() => {

        if (
          document.visibilityState ===
            'hidden' ||
          !document.hasFocus()
        ) {

          registerDeduplicatedViolation(
            'focus_leave',
            'window_blur',
            'Leaving the assessment window is restricted during Round 2.',
            true
          );
        }

      }, 100);
    };


    document.addEventListener(
      'copy',
      handleCopy
    );

    document.addEventListener(
      'cut',
      handleCut
    );

    document.addEventListener(
      'contextmenu',
      handleContextMenu
    );

    document.addEventListener(
      'dragstart',
      handleDragStart
    );

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    window.addEventListener(
      'blur',
      handleWindowBlur
    );


    return () => {

      document.removeEventListener(
        'copy',
        handleCopy
      );

      document.removeEventListener(
        'cut',
        handleCut
      );

      document.removeEventListener(
        'contextmenu',
        handleContextMenu
      );

      document.removeEventListener(
        'dragstart',
        handleDragStart
      );

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      window.removeEventListener(
        'blur',
        handleWindowBlur
      );
    };

  }, [
    loading,
    registerViolation,
  ]);


  /* ======================================================
     FORMAT TIMER
     ====================================================== */

  const formatTime = (seconds) => {

    const m = Math.floor(
      seconds / 60
    )
      .toString()
      .padStart(2, '0');


    const s = (
      seconds % 60
    )
      .toString()
      .padStart(2, '0');


    return `${m}:${s}`;
  };


  /* ======================================================
     LOADING SCREEN
     ====================================================== */

  if (loading) {

    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24">

        <Loader2 className="w-10 h-10 animate-spin text-[#F7A078] mb-4" />

        <p className="text-[#B8B8B8] font-medium text-sm sm:text-base">
          Preparing your test environment...
        </p>

      </div>
    );
  }


  /* ======================================================
     ERROR SCREEN
     ====================================================== */

  if (
    error &&
    questions.length === 0
  ) {

    return (
      <div className="flex-1 flex items-center justify-center py-16">

        <div className="max-w-lg w-full rounded-2xl border border-red-500/30 bg-[#111112] p-8 text-center shadow-2xl">

          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />

          <h2 className="text-xl font-bold mb-2 text-[#F5F5F5]">
            Something went wrong
          </h2>

          <p className="text-[#B8B8B8] mb-6 text-sm">
            {error}
          </p>

          <button
            onClick={() =>
              navigate('/setup')
            }
            className="px-6 py-3 rounded-xl font-semibold bg-[#1A1A1C] border border-white/10 text-[#F5F5F5] hover:bg-[#252528] transition-colors"
          >
            Back to Setup
          </button>

        </div>

      </div>
    );
  }


  /* ======================================================
     TEST UI
     ====================================================== */

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length || 50;
  const progressPercent =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  return (
    <>
      {/* ==================================================
          FIRST SECURITY WARNING MODAL
          ================================================== */}

      {securityWarning &&
        !securityTerminated && (

          <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">

            <div className="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-[#0E0E10] shadow-2xl p-6 md:p-8 text-center">

              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">

                <ShieldAlert className="w-8 h-8 text-amber-400" />

              </div>

              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-3">
                Assessment Security Warning
              </h2>

              <p className="text-[#B8B8B8] mb-4 text-sm sm:text-base">
                {securityReason}
              </p>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6 text-left">

                <p className="text-amber-300 font-semibold mb-1 text-sm">
                  First Warning
                </p>

                <p className="text-xs sm:text-sm text-[#B8B8B8] leading-relaxed">
                  Another security violation will automatically save your current answers and submit Round 2. You will then continue to Round 3.
                </p>

              </div>

              <button
                onClick={() =>
                  setSecurityWarning(
                    false
                  )
                }
                className="w-full py-3.5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-[#F6AD82] to-[#F08D67] text-[#080909] shadow-[0_4px_24px_rgba(247,160,120,0.3)] hover:shadow-[0_6px_32px_rgba(247,160,120,0.45)] transition-all cursor-pointer"
              >
                Continue Assessment
              </button>

            </div>

          </div>
        )}


      {/* ==================================================
          SECOND VIOLATION / AUTO SUBMISSION
          ================================================== */}

      {securityTerminated && (

        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">

          <div className="w-full max-w-lg rounded-2xl border border-red-500/40 bg-[#0E0E10] shadow-2xl p-6 md:p-8 text-center">

            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">

              <ShieldAlert className="w-8 h-8 text-red-400" />

            </div>

            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-3">
              Round 2 Auto-Submitted
            </h2>

            <p className="text-[#B8B8B8] mb-4 text-sm sm:text-base">
              A second security violation was detected.
            </p>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-6">

              <p className="text-red-300 font-semibold text-sm">
                Your current Round 2 answers are being saved and submitted.
              </p>

              <p className="text-xs sm:text-sm text-[#858585] mt-1.5">
                You will be moved to Round 3 automatically.
              </p>

            </div>

            <div className="flex items-center justify-center gap-3 text-[#B8B8B8]">

              <Loader2 className="w-5 h-5 animate-spin text-[#F7A078]" />

              <span>Saving Round 2...</span>

            </div>

          </div>

        </div>
      )}


      {/* ==================================================
          MAIN TEST CONTAINER
          ================================================== */}

      <div
        className="flex-1 max-w-4xl lg:max-w-5xl mx-auto w-full flex flex-col bg-[#0D0D0E]/95 rounded-2xl border border-[rgba(247,160,120,0.25)] p-6 sm:p-8 lg:p-10 shadow-[0_0_40px_rgba(247,160,120,0.06),0_20px_50px_rgba(0,0,0,0.7)] select-none transition-all"
        onCopy={(e) =>
          e.preventDefault()
        }
        onCut={(e) =>
          e.preventDefault()
        }
        onDragStart={(e) =>
          e.preventDefault()
        }
      >

        {/* PROGRESS BAR ROW */}
        <div className="flex items-center gap-4 mb-6">

          <div className="flex-1 bg-[#18181A] rounded-full h-2.5 overflow-hidden p-0.5 border border-white/[0.04]">

            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] via-[#3B82F6] to-[#8B5CF6] transition-all duration-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
              style={{
                width: `${progressPercent}%`,
              }}
            />

          </div>

          <span className="font-mono text-xs sm:text-sm font-bold text-[#B8B8B8] min-w-[42px] text-right">
            {progressPercent}%
          </span>

        </div>


        {/* ROUND 2 INFORMATION CARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111113] p-5 sm:p-6 rounded-2xl border border-[rgba(247,160,120,0.20)] mb-8 shadow-sm">

          <div className="flex items-start gap-4">

            <div className="w-12 h-12 rounded-xl bg-[rgba(247,160,120,0.12)] border border-[rgba(247,160,120,0.25)] flex items-center justify-center text-[#F7A078] shrink-0 mt-0.5 shadow-sm">
              <FileText className="w-6 h-6 text-[#F7A078]" />
            </div>

            <div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
                Round 2:{' '}
                <span className="text-[#F7A078]">
                  {currentInterview.interview_type ===
                  'non-technical'
                    ? 'Non-Technical Test'
                    : 'Technical Test'}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-[#B8B8B8] mt-1 leading-relaxed">
                Answer all questions to the best of your ability.
              </p>

              {/* SECURITY INDICATOR */}
              <div className="flex items-center gap-1.5 mt-2.5 text-xs font-medium text-emerald-400">

                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />

                <span>Assessment Security Active</span>

                {violationCount > 0 && (

                  <span className="text-amber-400 ml-2 font-semibold">
                    • Warning {violationCount}/2
                  </span>

                )}

              </div>

            </div>

          </div>

          {/* TIMER CARD */}
          <div
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-mono text-xl sm:text-2xl font-bold shrink-0 self-start sm:self-auto transition-all ${
              timeLeft < 300
                ? 'bg-red-500/15 border border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse'
                : 'bg-[#0B0B0C] border border-[rgba(247,160,120,0.30)] text-[#F7A078] shadow-[0_0_16px_rgba(247,160,120,0.08)]'
            }`}
          >

            <Clock className="w-5 h-5 text-[#F7A078]" />

            <span>{formatTime(timeLeft)}</span>

          </div>

        </div>


        {/* QUESTIONS LIST */}
        <div className="space-y-6 flex-1 pb-28">

          {questions.map(
            (q, qIndex) => (

              <div
                key={qIndex}
                data-question-index={qIndex}
                className="rounded-2xl border border-[#242424] hover:border-[#333333] bg-[#111112] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.4)] select-none transition-all duration-200"
              >

                <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-6 text-[#F5F5F5] select-none leading-relaxed flex items-start">

                  <span className="text-[#F7A078] mr-3 shrink-0 font-extrabold">
                    {qIndex + 1}.
                  </span>

                  <span>{q.question}</span>

                </h3>

                <div className="space-y-3.5">

                  {q.options &&
                    q.options.map(
                      (
                        option,
                        optIndex
                      ) => {

                        const isSelected =
                          answers[
                            qIndex.toString()
                          ] ===
                          optIndex.toString();

                        return (

                          <div
                            key={
                              optIndex
                            }
                            onClick={() =>
                              handleOptionSelect(
                                qIndex,
                                optIndex
                              )
                            }
                            className={`p-4 sm:p-4.5 rounded-xl border transition-all duration-200 flex items-center select-none cursor-pointer group ${
                              isSelected
                                ? 'border-[#F7A078] bg-[rgba(247,160,120,0.08)] shadow-[0_0_20px_rgba(247,160,120,0.12)]'
                                : 'border-[#242424] bg-[#0A0A0B] hover:border-[#383838] hover:bg-[#0E0E10]'
                            }`}
                          >

                            {/* Circular Radio Indicator */}
                            <div
                              className={`w-5 h-5 rounded-full border flex-shrink-0 mr-4 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-[#F7A078] bg-[rgba(247,160,120,0.2)]'
                                  : 'border-[#4A4A4A] group-hover:border-[#666666]'
                              }`}
                            >

                              {isSelected && (

                                <div className="w-2.5 h-2.5 bg-[#F7A078] rounded-full shadow-[0_0_6px_rgba(247,160,120,0.8)]" />

                              )}

                            </div>

                            <span
                              className={`text-sm sm:text-base font-medium transition-colors ${
                                isSelected
                                  ? 'text-[#F5F5F5]'
                                  : 'text-[#B8B8B8] group-hover:text-[#E0E0E0]'
                              }`}
                            >
                              {option}
                            </span>

                          </div>

                        );
                      }
                    )}

                </div>

              </div>

            )
          )}

        </div>


        {/* FIXED BOTTOM SUBMISSION BAR */}
        <div className="fixed bottom-0 left-0 w-full bg-[#080809]/95 border-t border-[#242424] p-4 sm:py-4.5 sm:px-10 backdrop-blur-md z-30 shadow-[0_-10px_35px_rgba(0,0,0,0.85)]">

          <div className="max-w-4xl lg:max-w-5xl mx-auto flex justify-between items-center">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-[rgba(247,160,120,0.12)] border border-[rgba(247,160,120,0.25)] flex items-center justify-center text-[#F7A078] shrink-0">
                <FileText className="w-5 h-5" />
              </div>

              <p className="text-sm text-[#B8B8B8] font-medium">

                Answered:{' '}

                <span className="text-[#F5F5F5] font-bold text-base">

                  {
                    Object.keys(
                      answers
                    ).length
                  }

                </span>

                {' / '}

                <span className="text-[#858585]">
                  {questions.length}
                </span>

              </p>

            </div>

            <button
              onClick={() =>
                handleSubmit(false)
              }
              disabled={
                submitting ||
                securityTerminated
              }
              className="px-6 sm:px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#F6AD82] to-[#F08D67] text-[#080909] shadow-[0_4px_24px_rgba(247,160,120,0.35)] hover:shadow-[0_6px_32px_rgba(247,160,120,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
            >

              {submitting ? (

                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#080909]" />
                  <span>Submitting Test...</span>
                </>

              ) : (

                <>
                  <span>Submit Test & Continue</span>
                  <ArrowRight className="w-4 h-4 text-[#080909]" />
                </>

              )}

            </button>

          </div>

        </div>

      </div>
    </>
  );
};

export default Test;