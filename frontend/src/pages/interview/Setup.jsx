import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Settings, Loader2, ChevronDown } from 'lucide-react';

/* =========================================================
   TECHNICAL DOMAINS
========================================================= */

const TECHNICAL_ROLES = [
  'Software Engineering',
  'Data Analytics',
  'Data Science',
  'Artificial Intelligence & Machine Learning',
  'Full-Stack Development',
  'Frontend Development',
  'Backend Development',
  'Cloud Computing',
  'DevOps Engineering',
  'Cybersecurity',
  'Data Engineering',
  'Generative AI / LLM Engineering',
];

/* =========================================================
   NON-TECHNICAL DOMAINS
========================================================= */

const NON_TECHNICAL_ROLES = [
  'Human Resources (HR)',
  'Sales & Business Development',
  'Digital Marketing',
  'Business Analysis',
  'Project Management',
  'Operations Management',
];

const Setup = () => {
  /* =======================================================
     STATE
  ======================================================= */

  const [role, setRole] = useState('');
  const [interviewType, setInterviewType] = useState('');

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  /* =======================================================
     CURRENT INTERVIEW
  ======================================================= */

  const currentInterview = JSON.parse(
    localStorage.getItem('current_interview') || '{}'
  );

  /* =======================================================
     VALIDATE INTERVIEW STAGE
     AND GET INTERVIEW TYPE
  ======================================================= */

  useEffect(() => {
    const validateStage = async () => {
      if (!currentInterview?.id) {
        navigate('/dashboard');
        return;
      }

      try {
        const res = await api.get(
          `/interview/stage?interview_id=${currentInterview.id}`
        );

        /* User must complete Round 2 first */

        if (res.data.stage !== 'setup') {
          navigate('/dashboard');
          return;
        }

        /*
         Get interview type from backend.

         Expected:
         technical
         OR
         non-technical
        */

        const type = String(
          res.data.interview_type ||
            currentInterview.interview_type ||
            ''
        )
          .trim()
          .toLowerCase();

        if (
          type !== 'technical' &&
          type !== 'non-technical'
        ) {
          setError(
            'Unable to determine interview type.'
          );

          setPageLoading(false);
          return;
        }

        setInterviewType(type);

        /*
         Do not automatically select a role.
         User must choose one.
        */

        setRole('');

        setPageLoading(false);

      } catch (err) {
        console.error(
          'Failed to validate interview stage:',
          err
        );

        navigate('/dashboard');
      }
    };

    validateStage();

  }, [navigate, currentInterview?.id]);

  /* =======================================================
     SELECT DOMAIN LIST
  ======================================================= */

  const availableRoles =
    interviewType === 'technical'
      ? TECHNICAL_ROLES
      : interviewType === 'non-technical'
      ? NON_TECHNICAL_ROLES
      : [];

  /* =======================================================
     START AI INTERVIEW
  ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) {
      setError(
        'Please select a target role / domain.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      /*
       IMPORTANT:

       Difficulty and duration have been removed.

       Backend will receive only:

       interview_id
       role
      */

      await api.post('/interview/setup', {
        interview_id: currentInterview.id,
        role: role,
      });

      /* ===============================================
         UPDATE LOCAL STORAGE
      =============================================== */

      const updatedInterview = {
        ...currentInterview,

        interview_type: interviewType,

        role: role,

        stage: 'ai',
      };

      localStorage.setItem(
        'current_interview',
        JSON.stringify(updatedInterview)
      );

      /* ===============================================
         MOVE TO AI INTERVIEW
      =============================================== */

      navigate('/ai-interview');

    } catch (err) {
      console.error(
        'Failed to setup interview:',
        err
      );

      setError(
        err?.response?.data?.detail ||
          'Failed to setup interview.'
      );

      setLoading(false);
    }
  };

  /* =======================================================
     PAGE LOADING
  ======================================================= */

  if (pageLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2
          className="
            w-8
            h-8
            animate-spin
            text-primary-400
          "
        />
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="flex-1 flex items-center justify-center p-4">

      <div
        className="
          glass-card
          max-w-lg
          w-full
          relative
          overflow-hidden
        "
      >

        {/* Background Glow */}

        <div
          className="
            absolute
            -top-20
            -right-20
            w-48
            h-48
            bg-primary-500/20
            blur-[60px]
            -z-10
            rounded-full
          "
        />

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-3
            mb-6
            border-b
            border-white/10
            pb-4
          "
        >

          <div
            className="
              p-2
              bg-primary-500/10
              rounded
              text-primary-400
            "
          >
            <Settings className="w-6 h-6" />
          </div>

          <div>

            <h2 className="text-2xl font-bold">
              AI Interview Setup
            </h2>

            {interviewType && (
              <p className="text-sm text-gray-400 mt-1">
                {interviewType === 'technical'
                  ? 'Technical Interview'
                  : 'Non-Technical Interview'}
              </p>
            )}

          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="
              mb-6
              p-4
              rounded-lg
              bg-red-500/10
              border
              border-red-500/20
              text-red-400
              text-sm
            "
          >
            {error}
          </div>
        )}

        {/* =================================================
            SETUP FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* ===============================================
              TARGET ROLE / DOMAIN
          =============================================== */}

          <div>

            <label className="label-text">
              Target Role / Domain
            </label>

            <div className="relative mt-2">

              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setError('');
                }}
                className="
                  input-field
                  appearance-none
                  pr-10
                  cursor-pointer
                "
                required
              >

                <option value="">
                  Select Target Role / Domain
                </option>

                {availableRoles.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </select>

              <ChevronDown
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  w-5
                  h-5
                  text-gray-400
                  pointer-events-none
                "
              />

            </div>

          </div>

          {/* =================================================
              START INTERVIEW
          ================================================= */}

          <div
            className="
              pt-4
              mt-8
              border-t
              border-white/10
            "
          >

            <button
              type="submit"
              className="
                btn-primary
                w-full
                flex
                justify-center
                items-center
                gap-2
              "
              disabled={
                loading ||
                !role ||
                !interviewType
              }
            >

              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />

                  Starting Interview...
                </>
              ) : (
                'Start AI Interview'
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default Setup;