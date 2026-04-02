import React from 'react';

export default function ScoreBoard({ score, totalPossible }) {
  return (
    <div className="score-board">
      <div className="score-label">
        Team Score
      </div>
      <div className="score-value">
        {score} <span className="score-total">/ {totalPossible}</span>
      </div>
    </div>
  );
}
