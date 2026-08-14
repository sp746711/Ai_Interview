// ============================================================
// MockMind AI — Avatar Messages
// Task 13 + Task 14
//
// IMPORTANT:
// These messages are spoken ONLY by the Dashboard AI Avatar.
// They are selected automatically by avatarLogic.js.
// They are NOT displayed as normal UI text.
// ============================================================


// ============================================================
// 1. NEW USER / FIRST DASHBOARD VISIT
// ============================================================

export const getWelcomeMessage = (name = "there") => {
  return `Welcome to MockMind AI, ${name}. I'm your AI interview assistant.`;
};


// ============================================================
// 2. RETURNING USER
// ============================================================

export const getReturningUserMessage = (name = "there") => {
  return `Welcome back, ${name}. Ready for your next interview?`;
};


// ============================================================
// 3. NO INTERVIEW COMPLETED
// ============================================================

export const getNoInterviewMessage = (name = "there") => {
  return `Your first interview is waiting, ${name}. Start whenever you're ready.`;
};


// ============================================================
// 4. INCOMPLETE INTERVIEW
// ============================================================

export const getIncompleteInterviewMessage = (name = "there") => {
  return `${name}, you have an unfinished interview. You can continue whenever you're ready.`;
};


// ============================================================
// 5. INTERVIEW COMPLETED
// ============================================================

export const getCompletionMessage = (
  name = "there",
  score = 0,
  interviewType = null
) => {
  const typeText =
    interviewType === "Technical"
      ? "technical"
      : interviewType === "Non-Technical"
      ? "non-technical"
      : "";

  if (typeText) {
    return `Well done, ${name}. Your ${typeText} interview is complete with a score of ${score} out of 100.`;
  }

  return `Well done, ${name}. Your interview is complete with a score of ${score} out of 100.`;
};


// ============================================================
// 6. SCORE MESSAGE
// ============================================================

export const getScoreMessage = (
  name = "there",
  score = 0
) => {

  // Excellent
  if (score >= 85) {
    return `Excellent performance, ${name}. You scored ${score} out of 100.`;
  }

  // Good
  if (score >= 70) {
    return `Good performance, ${name}. You scored ${score} out of 100.`;
  }

  // Needs improvement
  if (score >= 50) {
    return `${name}, you scored ${score} out of 100. Review your feedback and keep practicing.`;
  }

  // Low score
  return `${name}, you scored ${score} out of 100. Review your weak areas and focus on improving them.`;
};


// ============================================================
// 7. PERSONAL BEST
// ============================================================

export const getPersonalBestMessage = (
  name = "there",
  score = 0
) => {
  return `Congratulations, ${name}. You achieved a new personal best with ${score} out of 100.`;
};


// ============================================================
// 8. SCORE IMPROVEMENT
// ============================================================

export const getScoreImprovementMessage = (
  name = "there",
  previousScore = 0,
  currentScore = 0
) => {
  return `Nice improvement, ${name}. Your score increased from ${previousScore} to ${currentScore}.`;
};


// ============================================================
// 9. SCORE DECREASE
// ============================================================

export const getScoreDecreaseMessage = (
  name = "there",
  previousScore = 0,
  currentScore = 0
) => {
  return `${name}, your latest score was ${currentScore}. Review your feedback and focus on your improvement areas.`;
};


// ============================================================
// 10. PROGRESS / INTERVIEW COUNT
// ============================================================

export const getProgressMessage = (
  name = "there",
  completedInterviews = 0,
  totalInterviews = 0
) => {

  if (completedInterviews === 1) {
    return `Congratulations, ${name.} You've completed your first interview.`;
  }

  if (completedInterviews === 5) {
    return `You've completed 5 interviews, ${name}. Great consistency.`;
  }

  if (completedInterviews === 10) {
    return `You've completed 10 interviews, ${name}. Keep building your experience.`;
  }

  if (completedInterviews >= 20) {
    return `You've completed ${completedInterviews} interviews, ${name}. Excellent consistency.`;
  }

  if (totalInterviews > 0) {
    return `You've completed ${completedInterviews} interviews so far, ${name}.`;
  }

  return null;
};


// ============================================================
// 11. TECHNICAL INTERVIEW PROGRESS
// ============================================================

export const getTechnicalProgressMessage = (
  name = "there",
  count = 0
) => {
  return `You've completed ${count} technical interviews, ${name}.`;
};


// ============================================================
// 12. NON-TECHNICAL INTERVIEW PROGRESS
// ============================================================

export const getNonTechnicalProgressMessage = (
  name = "there",
  count = 0
) => {
  return `You've completed ${count} non-technical interviews, ${name}.`;
};


// ============================================================
// 13. COMBINED INTERVIEW PROGRESS
// ============================================================

export const getCombinedProgressMessage = (
  name = "there",
  technicalCount = 0,
  nonTechnicalCount = 0
) => {
  return `You've completed ${technicalCount} technical and ${nonTechnicalCount} non-technical interviews, ${name}.`;
};


// ============================================================
// 14. FINAL INTERVIEW COMPLETED
// IMPORTANT:
// This is spoken AFTER Round 3 is finished.
// The separate Round 3 AI handles the actual interview.
// ============================================================

export const getFinalInterviewCompletedMessage = (
  name = "there"
) => {
  return `Great job, ${name}. Your final interview is complete.`;
};


// ============================================================
// 15. FEEDBACK READY
// ============================================================

export const getFeedbackMessage = (
  name = "there"
) => {
  return `Your interview feedback is ready, ${name}. Review your performance and improvement areas.`;
};


// ============================================================
// 16. HIGH PERFORMANCE FEEDBACK
// ============================================================

export const getExcellentFeedbackMessage = (
  name = "there"
) => {
  return `Excellent performance, ${name}. Your feedback shows strong interview skills.`;
};


// ============================================================
// 17. GOOD PERFORMANCE FEEDBACK
// ============================================================

export const getGoodFeedbackMessage = (
  name = "there"
) => {
  return `Good performance, ${name}. Review the recommendations to improve further.`;
};


// ============================================================
// 18. IMPROVEMENT FEEDBACK
// ============================================================

export const getImprovementFeedbackMessage = (
  name = "there"
) => {
  return `${name}, your feedback highlights areas for improvement. Review them before your next interview.`;
};


// ============================================================
// 19. TECHNICAL FEEDBACK
// ============================================================

export const getTechnicalFeedbackMessage = (
  name = "there"
) => {
  return `${name}, review your technical feedback and strengthen the areas that need improvement.`;
};


// ============================================================
// 20. NON-TECHNICAL FEEDBACK
// ============================================================

export const getNonTechnicalFeedbackMessage = (
  name = "there"
) => {
  return `${name}, review your communication and reasoning feedback before your next interview.`;
};


// ============================================================
// 21. ROUND 1 — START
// ============================================================

export const getRound1WelcomeMessage = (
  name = "there"
) => {
  return `Round 1 is ready, ${name}. Let's begin your interview setup.`;
};


// ============================================================
// 22. ROUND 1 — INTERVIEW TYPE
// ============================================================

export const getRound1InterviewTypeMessage = (
  name = "there"
) => {
  return `Choose your interview type, ${name}, to continue.`;
};


// ============================================================
// 23. ROUND 1 — RESUME REQUIRED
// ============================================================

export const getRound1ResumeMessage = (
  name = "there"
) => {
  return `Your resume is required to continue, ${name}.`;
};


// ============================================================
// 24. ROUND 1 — RESUME UPLOADED
// ============================================================

export const getRound1ResumeUploadedMessage = (
  name = "there"
) => {
  return `Your resume has been received, ${name}.`;
};


// ============================================================
// 25. ROUND 1 — RESUME ANALYSIS
// ============================================================

export const getRound1ResumeAnalysisMessage = (
  name = "there"
) => {
  return `I'm analyzing your resume, ${name}.`;
};


// ============================================================
// 26. ROUND 1 — READY FOR ROUND 2
// ============================================================

export const getRound1ReadyMessage = (
  name = "there"
) => {
  return `Round 1 is complete, ${name}. You're ready for the online assessment.`;
};


// ============================================================
// ROUND 2 — IMPORTANT INFORMATION ONLY
//
// MAXIMUM 5 IMPORTANT MESSAGES
// The avatar should NOT speak continuously during the test.
// ============================================================


// 27. ROUND 2 — ENTER
export const getRound2StartMessage = (
  name = "there"
) => {
  return `Round 2 is ready, ${name}. Your online assessment is about to begin.`;
};


// 28. ROUND 2 — TEST START
export const getRound2StartedMessage = (
  name = "there"
) => {
  return `Your assessment has started, ${name}. Stay focused and manage your time.`;
};


// 29. ROUND 2 — IMPORTANT TIME WARNING
export const getRound2TimeWarningMessage = (
  name = "there"
) => {
  return `Time is running low, ${name}. Use your remaining time wisely.`;
};


// 30. ROUND 2 — FINAL STAGE
export const getRound2FinalStageMessage = (
  name = "there"
) => {
  return `You're almost finished, ${name}. Complete the remaining questions carefully.`;
};


// 31. ROUND 2 — COMPLETED
export const getRound2CompletedMessage = (
  name = "there"
) => {
  return `Round 2 is complete, ${name}. Your assessment has been submitted.`;
};


// ============================================================
// ROUND 2 — OPTIONAL RESULT
// This is used ONLY when the result becomes available.
// ============================================================

export const getRound2ResultMessage = (
  name = "there",
  score = 0
) => {
  return `Your assessment result is ready, ${name}. You scored ${score} out of 100.`;
};


// ============================================================
// 32. GENERAL ENCOURAGEMENT
// ============================================================

export const getEncouragementMessage = (
  name = "there"
) => {
  return `Keep going, ${name}. Consistent practice builds confidence.`;
};


// ============================================================
// 33. ERROR / FALLBACK
// ============================================================

export const getFallbackMessage = (
  name = "there"
) => {
  return `I'm here to help, ${name}.`;
};