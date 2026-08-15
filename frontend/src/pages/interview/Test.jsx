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

  // 60 minutes
  const [timeLeft, setTimeLeft] = useState(50* 50);

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
          `/test/questions?interview_type=${encodeURIComponent(
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

    const submitPayload = {
      interview_id:
        currentInterview.id,

      answers: {},
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
      <div className="flex-1 flex flex-col items-center justify-center">

        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />

        <p className="text-gray-400">
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
      <div className="flex-1 flex items-center justify-center">

        <div className="glass-card max-w-lg text-center">

          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />

          <h2 className="text-xl font-bold mb-2 text-white">
            Something went wrong
          </h2>

          <p className="text-gray-400 mb-6">
            {error}
          </p>

          <button
            onClick={() =>
              navigate('/setup')
            }
            className="btn-secondary"
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

  return (
    <>
      {/* ==================================================
          FIRST SECURITY WARNING MODAL
          ================================================== */}

      {securityWarning &&
        !securityTerminated && (

          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">

            <div className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-950 shadow-2xl p-6 md:p-8 text-center">

              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">

                <ShieldAlert className="w-8 h-8 text-amber-400" />

              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                Assessment Security Warning
              </h2>

              <p className="text-gray-300 mb-4">
                {securityReason}
              </p>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6 text-left">

                <p className="text-amber-300 font-semibold mb-2">
                  First Warning
                </p>

                <p className="text-sm text-gray-300 leading-6">
                  Another security violation will automatically save your current answers and submit Round 2. You will then continue to Round 3.
                </p>

              </div>

              <button
                onClick={() =>
                  setSecurityWarning(
                    false
                  )
                }
                className="btn-primary w-full"
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

          <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-slate-950 shadow-2xl p-6 md:p-8 text-center">

            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">

              <ShieldAlert className="w-8 h-8 text-red-400" />

            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Round 2 Auto-Submitted
            </h2>

            <p className="text-gray-300 mb-4">
              A second security violation was detected.
            </p>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-6">

              <p className="text-red-300 font-semibold">
                Your current Round 2 answers are being saved and submitted.
              </p>

              <p className="text-sm text-gray-400 mt-2">
                You will be moved to Round 3 automatically.
              </p>

            </div>

            <div className="flex items-center justify-center gap-3 text-gray-400">

              <Loader2 className="w-5 h-5 animate-spin" />

              Saving Round 2...

            </div>

          </div>

        </div>
      )}


      {/* ==================================================
          MAIN TEST
          ================================================== */}

      <div
        className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.12)] select-none"
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

        {/* ROUND PROGRESS */}

        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-4">

          <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-700" />

        </div>


        {/* TEST HEADER */}

        <div className="flex justify-between items-center bg-dark-800/80 p-4 rounded-xl border border-white/10 mb-8 sticky top-20 z-10 backdrop-blur-md">

          <div>

            <h2 className="text-xl font-bold">

              Round 2:{' '}

              {currentInterview.interview_type ===
              'non-technical'
                ? 'Non-Technical Test'
                : 'Technical Test'}

            </h2>

            <p className="text-sm text-gray-400">
              Answer all questions to the best of your ability.
            </p>


            {/* SECURITY INDICATOR */}

            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">

              <ShieldCheck className="w-4 h-4" />

              Assessment Security Active

              {violationCount > 0 && (

                <span className="text-amber-400 ml-2">
                  • Warning {violationCount}/2
                </span>

              )}

            </div>

          </div>


          {/* TIMER */}

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl
              ${
                timeLeft < 300
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-dark-900 border border-white/10'
              }`}
          >

            <Clock className="w-5 h-5" />

            {formatTime(timeLeft)}

          </div>

        </div>


        {/* QUESTIONS */}

        <div className="space-y-8 flex-1 pb-24">

          {questions.map(
            (q, qIndex) => (

              <div
                key={qIndex}
                className="glass-card select-none"
              >

                <h3 className="text-lg font-medium mb-4 text-white select-none">

                  <span className="text-primary-400 mr-2">
                    {qIndex + 1}.
                  </span>

                  {q.question}

                </h3>


                <div className="space-y-3">

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
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center select-none
                              ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-500/10'
                                  : 'border-white/5 bg-dark-900/50 hover:border-white/20 hover:bg-dark-800'
                              }`}
                          >

                            <div
                              className={`w-5 h-5 rounded-full border flex-shrink-0 mr-4 flex items-center justify-center
                                ${
                                  isSelected
                                    ? 'border-primary-500'
                                    : 'border-gray-500'
                                }`}
                            >

                              {isSelected && (

                                <div className="w-3 h-3 bg-primary-500 rounded-full" />

                              )}

                            </div>

                            <span
                              className={
                                isSelected
                                  ? 'text-white'
                                  : 'text-gray-300'
                              }
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


        {/* BOTTOM SUBMIT BAR */}

        <div className="fixed bottom-0 left-0 w-full bg-dark-900/95 border-t border-white/10 p-4 backdrop-blur-md z-20">

          <div className="max-w-4xl mx-auto flex justify-between items-center">

            <p className="text-gray-400">

              Answered:{' '}

              <span className="text-white font-medium">

                {
                  Object.keys(
                    answers
                  ).length
                }

              </span>

              {' / '}

              {questions.length}

            </p>


            <button
              onClick={() =>
                handleSubmit(false)
              }
              disabled={
                submitting ||
                securityTerminated
              }
              className="btn-primary min-w-[200px] flex justify-center"
            >

              {submitting ? (

                <Loader2 className="w-5 h-5 animate-spin" />

              ) : (

                'Submit Test & Continue'

              )}

            </button>

          </div>

        </div>

      </div>
    </>
  );
};

export default Test;