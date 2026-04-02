import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Play, LogIn, Users, Plus, X, Check, Sparkles, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// In production (built app), it automatically connects to the server that hosts it.
// In dev mode, it forces connection to the local backend port.
const socketUrl = import.meta.env.MODE === 'development' ? 'http://localhost:3001' : undefined;
const socket = io(socketUrl);

function App() {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    socket.on('room_update', (roomState) => {
      setRoom(roomState);
    });
    return () => socket.off('room_update');
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId && playerName) {
      socket.emit('join_room', { roomId, playerName });
      setJoined(true);
    }
  };

  const startRandomGame = () => {
    const randomRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(randomRoom);
    if (!playerName) setPlayerName('Hero ' + Math.floor(Math.random() * 100));
  };

  // Background Blobs for depth
  const BackgroundGeometry = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] animate-blob mix-blend-screen" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] animate-blob animation-delay-2000 mix-blend-screen" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-blob animation-delay-4000 mix-blend-screen" />
    </div>
  );

  if (!joined) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <BackgroundGeometry />
        
        <div className="max-w-md w-full glass-panel rounded-[2rem] p-8 md:p-10 animate-fade-in-up">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-6 shadow-2xl shadow-indigo-500/20">
               <Sparkles className="text-fuchsia-400" size={28} />
            </div>
            <h1 className="text-5xl font-black mb-3 tracking-tighter text-gradient from-white via-indigo-200 to-fuchsia-300 drop-shadow-sm">
              WordGrid.gg
            </h1>
            <p className="text-indigo-200/70 font-medium tracking-wide">Enter the arena of words</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-indigo-400/80 uppercase tracking-[0.2em] ml-2">Alias</label>
              <input
                type="text"
                required
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent transition-all backdrop-blur-md"
                placeholder="What should we call you?"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-indigo-400/80 uppercase tracking-[0.2em] ml-2">Lobby Code</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  required
                  value={roomId}
                  onChange={e => setRoomId(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent transition-all uppercase font-mono font-bold tracking-widest backdrop-blur-md"
                  placeholder="CODE"
                />
                <button type="button" onClick={startRandomGame} className="glass-panel-interactive px-5 rounded-2xl text-sm font-bold text-white shadow-lg flex items-center justify-center group">
                  <span className="group-hover:text-fuchsia-400 transition-colors">Random</span>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              >
                Enter Lobby <ChevronRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!room) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><div className="animate-pulse flex items-center gap-3"><Sparkles className="text-fuchsia-500"/> <span className="font-bold tracking-widest uppercase">Connecting...</span></div></div>;

  const currentPlayer = room.players[socket.id];

  return (
    <div className="min-h-screen relative flex flex-col font-sans">
      <BackgroundGeometry />
      
      {/* Header */}
      <header className="glass-panel border-b-0 border-x-0 border-t-0 p-4 sticky top-0 z-40 bg-slate-950/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-fuchsia-400" />
              <h1 className="text-xl font-black text-gradient from-white to-fuchsia-200 tracking-tight">wordgrid.gg</h1>
            </div>
            <div className="glass-panel px-4 py-1.5 rounded-full text-xs font-mono font-bold text-indigo-200">
              {room.id}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="glass-panel px-6 py-2 rounded-2xl flex items-center gap-6 shadow-xl shadow-black/20">
              <div className="text-center">
                <div className="text-[10px] uppercase font-black text-blue-400 tracking-widest mb-0.5 shadow-blue-500">TEAM A</div>
                <div className="text-2xl font-black text-white">{room.score.teamA}</div>
              </div>
              <div className="w-px h-10 bg-white/10 rounded-full"></div>
              <div className="text-center">
                <div className="text-[10px] uppercase font-black text-rose-400 tracking-widest mb-0.5">TEAM B</div>
                <div className="text-2xl font-black text-white">{room.score.teamB}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 relative z-10 animate-fade-in-up">
        {/* Left Col: Game Board */}
        <div className="flex-1">
          {!room.isStarted ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel rounded-[2rem] p-12 text-center ring-1 ring-white/5">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_theme(colors.indigo.500/20)]">
                <Users size={32} className="text-indigo-400" />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight">Gather Your Team</h2>
              <p className="text-slate-400 text-lg max-w-md mb-10 leading-relaxed font-light">Assign yourselves to Team A or B, choose who gives the clues, and start the game when you're ready.</p>
              
              <button 
                onClick={() => socket.emit('start_game', { roomId: room.id })}
                className="group relative px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_40px_theme(colors.white/30)] overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <Play size={24} fill="currentColor" /> Initiate Match
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-end px-2">
                <h2 className="text-2xl font-black tracking-tight">{currentPlayer?.role === 'clue_giver' ? "The Grid" : "Guess"}</h2>
                <div className="flex items-center gap-2 glass-panel px-4 py-1.5 rounded-full text-sm font-bold text-fuchsia-300">
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse-glow" />
                  {room.board.length} / 12 Words
                </div>
              </div>
              
              {currentPlayer?.role === 'clue_giver' ? (
                <div className="flex flex-wrap gap-x-3 gap-y-4 bg-[#36393f] p-6 rounded-xl border border-white/5">
                  {room.board.map(w => (
                    <WordCard 
                      key={w.id} 
                      word={w} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel rounded-[2rem] p-8">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.target.elements.guess;
                      if (input.value.trim()) {
                        socket.emit('submit_guess', { roomId: room.id, guess: input.value });
                        input.value = '';
                      }
                    }}
                    className="w-full max-w-md"
                  >
                    <input 
                      name="guess"
                      type="text"
                      autoComplete="off"
                      autoFocus
                      placeholder="Type your guess here..."
                      className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-6 py-5 text-2xl text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold tracking-wide shadow-2xl"
                    />
                    <p className="text-center text-indigo-300/60 mt-4 text-sm font-medium">Press ENTER to submit your guess</p>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Lobby / Players */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="glass-panel rounded-[2rem] p-6 shadow-2xl">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 tracking-wide">
              <Users size={18} className="text-indigo-400"/> Players ({Object.keys(room.players).length})
            </h3>
            
            <div className="space-y-8">
              {/* Team A */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">Team A</span>
                  {currentPlayer?.team !== 'teamA' && (
                    <button onClick={() => socket.emit('switch_team', { roomId: room.id, team: 'teamA' })} className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-500/20">Switch</button>
                  )}
                </div>
                <div className="space-y-2">
                  {Object.values(room.players).filter(p => p.team === 'teamA').map(p => (
                    <PlayerRow key={p.id} player={p} isMe={p.id === socket.id} roomId={room.id} />
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                  <span className="text-xs font-black text-rose-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]">Team B</span>
                  {currentPlayer?.team !== 'teamB' && (
                    <button onClick={() => socket.emit('switch_team', { roomId: room.id, team: 'teamB' })} className="text-[10px] uppercase font-bold tracking-wider bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors border border-rose-500/20">Switch</button>
                  )}
                </div>
                <div className="space-y-2">
                  {Object.values(room.players).filter(p => p.team === 'teamB').map(p => (
                    <PlayerRow key={p.id} player={p} isMe={p.id === socket.id} roomId={room.id} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {room.isStarted && currentPlayer?.role !== 'clue_giver' && (
            <div className="glass-panel border-emerald-500/30 rounded-[2rem] p-8 flex flex-col items-center text-center bg-emerald-900/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4 ring-1 ring-emerald-500/30">
                <Sparkles size={24} className="text-emerald-400" />
              </div>
              <h4 className="font-black text-lg mb-2 text-emerald-100">Guesser Mode</h4>
              <p className="text-sm text-emerald-200/60 leading-relaxed font-light">Listen to the Host's clues and type your guesses quickly to earn points for your team!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PlayerRow({ player, isMe, roomId }) {
  const isClueGiver = player.role === 'clue_giver';
  
  return (
    <div className={twMerge("flex items-center justify-between p-3 rounded-xl text-sm transition-all border", isMe ? "glass-panel-interactive border-white/10" : "border-transparent hover:bg-white/5")}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs ring-1 ring-white/10">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="font-semibold flex flex-col">
          <span className="flex items-center gap-1.5">
            {player.name}
            {isMe && <span className="text-[9px] bg-white text-slate-900 px-1.5 py-0.5 rounded font-black uppercase">You</span>}
          </span>
          <span className={twMerge("text-[10px] font-bold uppercase tracking-wider", isClueGiver ? "text-amber-400" : "text-slate-500")}>
            {isClueGiver ? 'Host' : 'Guesser'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isMe && !isClueGiver && (
          <button 
            onClick={() => socket.emit('switch_role', { roomId, role: 'clue_giver' })}
            className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-all"
          >
            Become Host
          </button>
        )}
        {isMe && isClueGiver && (
          <button 
            onClick={() => socket.emit('switch_role', { roomId, role: 'guesser' })}
            className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-all"
          >
            Step Down
          </button>
        )}
      </div>
    </div>
  );
}

function WordCard({ word }) {
  const isCorrect = word.status === 'correct';
  
  return (
    <div className="flex flex-col items-center gap-1.5 animate-fade-in-up">
      <div className={twMerge(
        "flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-white font-medium text-sm transition-colors border shadow-sm",
        isCorrect 
          ? "bg-[#3ba55d] border-[#3ba55d] cursor-default" 
          : "bg-[#2b2d31] hover:bg-[#313338] border-transparent cursor-pointer"
      )}>
        {isCorrect && <Check size={16} strokeWidth={3} />}
        {word.word}
      </div>
      <div className="bg-[#da373c] text-white text-[10px] font-bold px-2 py-0.5 rounded-[3px] shadow-sm uppercase tracking-wider">
        {word.points} points
      </div>
    </div>
  );
}

export default App;
