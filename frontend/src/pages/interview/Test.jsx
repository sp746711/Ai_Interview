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
  const [timeLeft, setTimeLeft] = useState(60 * 60);

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

  const navigate = useNavigate();

  const currentInterview = JSON.parse(
    localStorage.getItem('current_interview') || '{}'
  );

  /* ======================================================
     KEEP REFS SYNCHRONIZED
     ====================================================== */

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  /* ======================================================
     FETCH QUESTIONS
     ====================================================== */

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const stageRes = await api.get(
          `/interview/stage?interview_id=${currentInterview.id}`
        );

        if (stageRes.data.stage !== 'test') {
          navigate('/dashboard');
          return;
        }

        const response = await api.get(
          `/test/questions?interview_type=${
            currentInterview.interview_type || 'technical'
          }&difficulty=easy`
        );

        let qData = response.data.questions || [];

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

        setQuestions(qData);

        questionsRef.current = qData;

        setLoading(false);
      } catch (err) {
        console.error(err);

        setError('Failed to fetch questions.');

        setLoading(false);
      }
    };

    fetchQuestions();
  }, [
    navigate,
    currentInterview.id,
    currentInterview.interview_type,
  ]);

  /* ======================================================
     TIMER
     ====================================================== */

  useEffect(() => {
    if (
      loading ||
      submitting ||
      securityTerminated
    ) {
      return;
    }

    if (timeLeft <= 0) {
      handleSubmit(false);

      return;
    }

    const timerInt = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerInt);
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

        setSecurityEvents(
          (previous) => [
            ...previous,
            event,
          ]
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
            ...securityEvents,
            event,
          ];

          /*
           * Show the final security screen briefly,
           * then save and submit Round 2.
           */

          setTimeout(() => {
            handleSubmit(
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
          }, 1200);
        }
      },
      [
        loading,
        securityEvents,
      ]
    );

  /* ======================================================
     SECURITY EVENT LISTENERS
     ====================================================== */

  useEffect(() => {
    if (loading) return;

    /* ---------------------------------------------------
       COPY
       --------------------------------------------------- */

    const handleCopy = (event) => {
      event.preventDefault();

      registerViolation(
        'copy_attempt',

        'Copying assessment content is restricted.',

        true
      );
    };

    /* ---------------------------------------------------
       CUT
       --------------------------------------------------- */

    const handleCut = (event) => {
      event.preventDefault();

      registerViolation(
        'cut_attempt',

        'Cutting assessment content is restricted.',

        true
      );
    };

    /* ---------------------------------------------------
       RIGHT CLICK
       --------------------------------------------------- */

    const handleContextMenu = (
      event
    ) => {
      event.preventDefault();

      registerViolation(
        'right_click',

        'Right-click is restricted during the assessment.',

        true
      );
    };

    /* ---------------------------------------------------
       DRAG
       --------------------------------------------------- */

    const handleDragStart = (
      event
    ) => {
      event.preventDefault();

      registerViolation(
        'drag_attempt',

        'Dragging assessment content is restricted.',

        true
      );
    };

    /* ---------------------------------------------------
       KEYBOARD
       --------------------------------------------------- */

    const handleKeyDown = (
      event
    ) => {
      const key =
        event.key.toLowerCase();

      const ctrlOrCommand =
        event.ctrlKey ||
        event.metaKey;

      /*
       * Ctrl+C / Cmd+C
       */

      if (
        ctrlOrCommand &&
        key === 'c'
      ) {
        event.preventDefault();

        registerViolation(
          'copy_shortcut',

          'Copy shortcut detected during the assessment.',

          true
        );

        return;
      }

      /*
       * Ctrl+X / Cmd+X
       */

      if (
        ctrlOrCommand &&
        key === 'x'
      ) {
        event.preventDefault();

        registerViolation(
          'cut_shortcut',

          'Cut shortcut detected during the assessment.',

          true
        );

        return;
      }

      /*
       * Ctrl+A / Cmd+A
       *
       * Block selection but don't count it
       * as a violation.
       */

      if (
        ctrlOrCommand &&
        key === 'a'
      ) {
        event.preventDefault();

        return;
      }

      /*
       * PrintScreen
       *
       * Browsers cannot guarantee blocking
       * operating-system screenshots.
       *
       * Detect/log where possible.
       */

      if (
        event.key ===
        'PrintScreen'
      ) {
        registerViolation(
          'printscreen_key',

          'A screenshot key event was detected.',

          false
        );
      }
    };

    /* ---------------------------------------------------
       TAB / VISIBILITY CHANGE

       Log only.
       --------------------------------------------------- */

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          'hidden'
        ) {
          registerViolation(
            'tab_visibility_change',

            'The assessment tab became inactive.',

            false
          );
        }
      };

    /* ---------------------------------------------------
       WINDOW BLUR

       Log only.
       --------------------------------------------------- */

    const handleWindowBlur =
      () => {
        registerViolation(
          'window_blur',

          'The assessment window lost focus.',

          false
        );
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