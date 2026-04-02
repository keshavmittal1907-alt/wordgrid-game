import React from 'react';
import WordCard from './WordCard';

export default function GameBoard({ words, onWordToggle }) {
  return (
    <div className="game-board-container">
      <div className="game-board-grid">
        {words.map((w) => (
          <WordCard 
            key={w.id} 
            wordObj={w} 
            onToggle={onWordToggle} 
          />
        ))}
      </div>
    </div>
  );
}
