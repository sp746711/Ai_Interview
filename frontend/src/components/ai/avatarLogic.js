// ============================================================
// MockMind AI — Avatar Logic
// Task 13 + Task 14
// ============================================================

import {
  // ==========================================================
  // TASK 13 — DASHBOARD MESSAGES
  // ==========================================================
  getWelcomeMessage,
  getReturningUserMessage,
  getNoInterviewMessage,
  getIncompleteInterviewMessage,
  getCompletionMessage,
  getScoreMessage,
  getPersonalBestMessage,
  getScoreImprovementMessage,
  getScoreDecreaseMessage,
  getProgressMessage,
  getTechnicalProgressMessage,
  getNonTechnicalProgressMessage,
  getCombinedProgressMessage,

  // ==========================================================
  // TASK 13 — FINAL FEEDBACK
  // ==========================================================
  getFinalInterviewCompletedMessage,
  getFeedbackMessage,
  getExcellentFeedbackMessage,
  getGoodFeedbackMessage,
  getImprovementFeedbackMessage,
  getTechnicalFeedbackMessage,
  getNonTechnicalFeedbackMessage,

  // ==========================================================
  // TASK 14 — ROUND 1
  // ==========================================================
  getRound1WelcomeMessage,
  getRound1InterviewTypeMessage,
  getRound1ResumeMessage,
  getRound1ResumeUploadedMessage,
  getRound1ResumeAnalysisMessage,
  getRound1ReadyMessage,

  // ==========================================================
  // TASK 14 — ROUND 2
  // ==========================================================
  getRound2StartMessage,
  getRound2StartedMessage,
  getRound2TimeWarningMessage,
  getRound2FinalStageMessage,
  getRound2CompletedMessage,
  getRound2ResultMessage,

  // ==========================================================
  // GENERAL
  // ==========================================================
  getEncouragementMessage,
  getFallbackMessage,
} from "./avatarMessages";

/**
 * ============================================================
 * SELECT ONE MESSAGE FOR THE AI AVATAR
 * ============================================================
 *
 * IMPORTANT:
 *
 * This file ONLY controls Task 13 + Task 14 avatar messaging.
 *
 * It does NOT change:
 * - Dashboard functionality
 * - Round 1 functionality
 * - Round 2 functionality
 * - Final Interview functionality
 * - Backend
 * - API
 * - Authentication
 * - Avatar appearance
 *
 * The existing avatar design remains unchanged.
 *
 * avatarEvent is optional.
 * If no event is supplied, the normal Dashboard
 * Task 13 logic is used.
 */

export const getAvatarMessage = ({
  user,

  // ==========================================================
  // TASK 13 — DASHBOARD STATE
  // ==========================================================

  isNewUser = false,
  isReturningUser = false,

  hasIncompleteInterview = false,

  interviewCompleted = false,

  score = null,
  previousBest = null,

  totalInterviews = 0,
  completedInterviews = 0,

  interviewType = null,

  // ==========================================================
  // TASK 13 — OPTIONAL PROGRESS INFORMATION
  // ==========================================================

  technicalInterviews = 0,
  nonTechnicalInterviews = 0,

  previousScore = null,

  // ==========================================================
  // TASK 14 — IMPORTANT EVENT
  // ==========================================================

  avatarEvent = null,
}) => {
  const userName = user?.name || "there";

  // ==========================================================
  // TASK 14
  //
  // IMPORTANT:
  // Only ONE event is processed.
  // The avatar does not speak continuously.
  // ==========================================================

  if (avatarEvent) {
    switch (avatarEvent) {

      // ========================================================
      // ROUND 1
      // ========================================================

      case "round1_start":
        return getRound1WelcomeMessage(userName);

      case "round1_interview_type":
        return getRound1InterviewTypeMessage(userName);

      case "round1_resume_required":
        return getRound1ResumeMessage(userName);

      case "round1_resume_uploaded":
        return getRound1ResumeUploadedMessage(userName);

      case "round1_resume_analysis":
        return getRound1ResumeAnalysisMessage(userName);

      case "round1_complete":
        return getRound1ReadyMessage(userName);


      // ========================================================
      // ROUND 2
      // MAXIMUM IMPORTANT INFORMATION ONLY
      // ========================================================

      case "round2_start":
        return getRound2StartMessage(userName);

      case "round2_started":
        return getRound2StartedMessage(userName);

      case "round2_time_warning":
        return getRound2TimeWarningMessage(userName);

      case "round2_final_stage":
        return getRound2FinalStageMessage(userName);

      case "round2_complete":
        return getRound2CompletedMessage(userName);

      case "round2_result":
        return getRound2ResultMessage(
          userName,
          score ?? 0
        );


      // ========================================================
      // FINAL INTERVIEW COMPLETED
      // ========================================================

      case "final_interview_completed":
        return getFinalInterviewCompletedMessage(userName);


      // ========================================================
      // FEEDBACK
      // ========================================================

      case "feedback_ready":
        return getFeedbackMessage(userName);


      // ========================================================
      // SCORE-BASED FEEDBACK
      // ========================================================

      case "excellent_feedback":
        return getExcellentFeedbackMessage(userName);

      case "good_feedback":
        return getGoodFeedbackMessage(userName);

      case "improvement_feedback":
        return getImprovementFeedbackMessage(userName);


      // ========================================================
      // INTERVIEW TYPE FEEDBACK
      // ========================================================

      case "technical_feedback":
        return getTechnicalFeedbackMessage(userName);

      case "non_technical_feedback":
        return getNonTechnicalFeedbackMessage(userName);


      // ========================================================
      // GENERAL
      // ========================================================

      case "encouragement":
        return getEncouragementMessage(userName);


      // ========================================================
      // UNKNOWN EVENT
      // ========================================================

      default:
        return null;
    }
  }


  // ============================================================
  // TASK 13 — DASHBOARD MESSAGE LOGIC
  // ============================================================

  // ------------------------------------------------------------
  // 1. NEW USER
  // ------------------------------------------------------------

  if (isNewUser) {
    return getWelcomeMessage(userName);
  }


  // ------------------------------------------------------------
  // 2. INCOMPLETE INTERVIEW
  // ------------------------------------------------------------

  if (hasIncompleteInterview) {
    return getIncompleteInterviewMessage(userName);
  }


  // ------------------------------------------------------------
  // 3. NO COMPLETED INTERVIEW
  // ------------------------------------------------------------

  if (
    completedInterviews === 0 &&
    totalInterviews === 0 &&
    !interviewCompleted
  ) {
    return getNoInterviewMessage(userName);
  }


  // ------------------------------------------------------------
  // 4. PERSONAL BEST
  // ------------------------------------------------------------

  if (
    interviewCompleted &&
    score !== null &&
    previousBest !== null &&
    score > previousBest
  ) {
    return getPersonalBestMessage(
      userName,
      score
    );
  }


  // ------------------------------------------------------------
  // 5. SCORE IMPROVEMENT
  // ------------------------------------------------------------

  if (
    interviewCompleted &&
    score !== null &&
    previousScore !== null &&
    score > previousScore
  ) {
    return getScoreImprovementMessage(
      userName,
      previousScore,
      score
    );
  }


  // ------------------------------------------------------------
  // 6. SCORE DECREASE
  // ------------------------------------------------------------

  if (
    interviewCompleted &&
    score !== null &&
    previousScore !== null &&
    score < previousScore
  ) {
    return getScoreDecreaseMessage(
      userName,
      previousScore,
      score
    );
  }


  // ------------------------------------------------------------
  // 7. JUST COMPLETED INTERVIEW
  // ------------------------------------------------------------

  if (
    interviewCompleted &&
    score !== null
  ) {
    return getCompletionMessage(
      userName,
      score,
      interviewType
    );
  }


  // ------------------------------------------------------------
  // 8. COMBINED PROGRESS
  //
  // TASK 13 FIX:
  // Check BOTH types FIRST.
  // ------------------------------------------------------------

  if (
    technicalInterviews > 0 &&
    nonTechnicalInterviews > 0
  ) {
    return getCombinedProgressMessage(
      userName,
      technicalInterviews,
      nonTechnicalInterviews
    );
  }


  // ------------------------------------------------------------
  // 9. TECHNICAL PROGRESS
  // ------------------------------------------------------------

  if (technicalInterviews > 0) {
    return getTechnicalProgressMessage(
      userName,
      technicalInterviews
    );
  }


  // ------------------------------------------------------------
  // 10. NON-TECHNICAL PROGRESS
  // ------------------------------------------------------------

  if (nonTechnicalInterviews > 0) {
    return getNonTechnicalProgressMessage(
      userName,
      nonTechnicalInterviews
    );
  }


  // ------------------------------------------------------------
  // 11. SCORE / IMPROVEMENT
  // ------------------------------------------------------------

  if (score !== null) {
    return getScoreMessage(
      userName,
      score
    );
  }


  // ------------------------------------------------------------
  // 12. PROGRESS / MILESTONE
  // ------------------------------------------------------------

  if (completedInterviews > 0) {
    return getProgressMessage(
      userName,
      completedInterviews,
      totalInterviews
    );
  }


  // ------------------------------------------------------------
  // 13. RETURNING USER
  // ------------------------------------------------------------

  if (isReturningUser) {
    return getReturningUserMessage(userName);
  }


  // ------------------------------------------------------------
  // 14. DEFAULT
  // ------------------------------------------------------------

  return getFallbackMessage(userName);
};


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default getAvatarMessage;