import React, { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import ScoreBoard from './components/ScoreBoard';
import Lobby from './components/Lobby';
import { generateGameWords } from './wordBank';
import { supabase } from './supabaseClient';
import './index.css';

function App() {
  const [gameId, setGameId] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!gameId) return;

    // Listen for updates on the specific game row
    const gameSubscription = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          setWords(payload.new.words_state);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameSubscription);
    };
  }, [gameId]);

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const initialWords = generateGameWords();
      
      const { data, error } = await supabase
        .from('games')
        .insert([{ words_state: initialWords }])
        .select()
        .single();
        
      if (error) throw error;
      
      setWords(initialWords);
      setGameId(data.id);
    } catch (err) {
      alert("Failed to create game. Check Supabase connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (joinId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('words_state')
        .eq('id', joinId.trim())
        .single();
        
      if (error) throw error;
      if (!data) throw new Error("Game not found!");
      
      setWords(data.words_state);
      setGameId(joinId.trim());
    } catch (err) {
      alert("Failed to join game. Invalid ID.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWordToggle = async (clickedWord) => {
    // Optimistic UI update
    const newWords = words.map(w => {
      if (w.id === clickedWord.id) {
        let newStatus = 'neutral';
        if (w.status === 'neutral') newStatus = 'correct';
        else if (w.status === 'correct') newStatus = 'incorrect';
        return { ...w, status: newStatus };
      }
      return w;
    });

    setWords(newWords);

    // Sync to Supabase
    const { error } = await supabase
      .from('games')
      .update({ words_state: newWords })
      .eq('id', gameId);

    if (error) {
      console.error("Failed to sync word toggle:", error);
    }
  };

  const currentScore = words.reduce((acc, w) => w.status === 'correct' ? acc + w.points : acc, 0);
  const maxScore = words.reduce((acc, w) => acc + w.points, 0);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Scipher</h1>
        <p>Select words to earn points based on difficulty.</p>
        {gameId && (
          <div className="game-id-badge">
            <span className="label">Room ID:</span> {gameId}
          </div>
        )}
      </header>
      
      <main className="app-main">
        {!gameId ? (
          loading ? (
            <div className="loading-text">Connecting to Game...</div>
          ) : (
            <Lobby onCreate={handleCreateGame} onJoin={handleJoinGame} />
          )
        ) : (
          <>
            <ScoreBoard score={currentScore} totalPossible={maxScore} />
            {words.length > 0 && <GameBoard words={words} onWordToggle={handleWordToggle} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
