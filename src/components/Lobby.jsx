import React, { useState } from 'react';

export default function Lobby({ onCreate, onJoin }) {
  const [joinId, setJoinId] = useState('');

  return (
    <div className="lobby-container">
      <h2 className="lobby-title">Multiplayer Lobby</h2>
      
      <button onClick={onCreate} className="btn primary-btn">
        Create New Game
      </button>

      <div className="lobby-divider">
        <div className="divider-line"></div>
        <span className="divider-text">Or Join Existing</span>
        <div className="divider-line"></div>
      </div>

      <div className="lobby-join-row">
        <input 
          type="text" 
          placeholder="Paste Game ID..." 
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          className="join-input"
        />
        <button 
          onClick={() => onJoin(joinId)}
          disabled={!joinId.trim()}
          className="btn secondary-btn"
        >
          Join
        </button>
      </div>
    </div>
  );
}
