import React from 'react';
import { Check, X } from 'lucide-react';

export default function WordCard({ wordObj, onToggle }) {
  const { word, points, status } = wordObj;

  let statusClass = 'neutral';
  let icon = null;

  if (status === 'correct') {
    statusClass = 'correct';
    icon = <Check className="icon correct-icon" strokeWidth={3} />;
  } else if (status === 'incorrect') {
    statusClass = 'incorrect';
    icon = <X className="icon incorrect-icon" strokeWidth={3} />;
  }

  const getPointsClass = (pts) => {
    if (pts <= 10) return 'easy';
    if (pts <= 20) return 'medium';
    return 'hard';
  };

  return (
    <button
      onClick={() => onToggle(wordObj)}
      className={`word-card ${statusClass}`}
    >
      <div className="word-content">
        {icon}
        <span className="word-text">{word}</span>
      </div>
      <div className={`points-pill ${getPointsClass(points)}`}>
        {points} points
      </div>
    </button>
  );
}
