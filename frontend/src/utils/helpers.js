/**
 * Helper utilities
 */

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const calculatePercentage = (score, total) => {
  return Math.round((score / total) * 100);
};

export const getScoreColor = (score) => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'orange';
  return 'red';
};

export const truncateText = (text, length = 100) => {
  return text.length > length ? `${text.slice(0, length)}...` : text;
};
