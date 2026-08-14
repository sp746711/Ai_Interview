// ============================================================
// MockMind AI — Avatar Logic
// Task 13 + Task 14
// ============================================================

import {
  getWelcomeMessage,
  getReturningUserMessage,
  getIncompleteInterviewMessage,
  getCompletionMessage,
  getScoreMessage,
  getPersonalBestMessage,
  getProgressMessage,
} from "./avatarMessages";

/**
 * Select ONE message for the AI avatar.
 *
 * Priority:
 * 1. New important event
 * 2. Interview incomplete
 * 3. Personal best
 * 4. Interview completed
 * 5. Progress/milestone
 * 6. Returning user
 * 7. Normal welcome
 */
export const getAvatarMessage = ({
  user,
  isNewUser = false,
  isReturningUser = false,
  hasIncompleteInterview = false,
  interviewCompleted = false,
  score = null,
  previousBest = null,
  totalInterviews = 0,
  completedInterviews = 0,
  interviewType = null,
}) => {
  const userName = user?.name || "there";

  // ----------------------------------------------------------
  // 1. NEW USER
  // ----------------------------------------------------------
  if (isNewUser) {
    return getWelcomeMessage(userName);
  }

  // ----------------------------------------------------------
  // 2. INCOMPLETE INTERVIEW
  // ----------------------------------------------------------
  if (hasIncompleteInterview) {
    return getIncompleteInterviewMessage(userName);
  }

  // ----------------------------------------------------------
  // 3. PERSONAL BEST
  // ----------------------------------------------------------
  if (
    interviewCompleted &&
    score !== null &&
    previousBest !== null &&
    score > previousBest
  ) {
    return getPersonalBestMessage(userName, score);
  }

  // ----------------------------------------------------------
  // 4. JUST COMPLETED INTERVIEW
  // ----------------------------------------------------------
  if (interviewCompleted && score !== null) {
    return getCompletionMessage(
      userName,
      score,
      interviewType
    );
  }

  // ----------------------------------------------------------
  // 5. SCORE / IMPROVEMENT
  // ----------------------------------------------------------
  if (score !== null) {
    return getScoreMessage(userName, score);
  }

  // ----------------------------------------------------------
  // 6. PROGRESS / MILESTONE
  // ----------------------------------------------------------
  if (completedInterviews > 0) {
    return getProgressMessage(
      userName,
      completedInterviews,
      totalInterviews
    );
  }

  // ----------------------------------------------------------
  // 7. RETURNING USER
  // ----------------------------------------------------------
  if (isReturningUser) {
    return getReturningUserMessage(userName);
  }

  // ----------------------------------------------------------
  // 8. DEFAULT
  // ----------------------------------------------------------
  return getReturningUserMessage(userName);
};

export default getAvatarMessage;