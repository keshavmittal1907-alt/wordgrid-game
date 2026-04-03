import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Play, LogIn, Users, Plus, X, Check, Sparkles, ChevronRight, RotateCcw, Eye, Crown } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// In production (built app), it automatically connects to the server that hosts it.
// In dev mode, it forces connection to the dynamic host network IP (to support mobile network testing).
const socketUrl = import.meta.env.MODE === 'development' ? `http://${window.location.hostname}:3001` : undefined;
const socket = io(socketUrl);

function App() {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);
  const [joinMode, setJoinMode] = useState('select'); // 'select', 'create', 'join'
  const [totalRounds, setTotalRounds] = useState(3);
  const [turnDuration, setTurnDuration] = useState(60);
  const { width, height } = useWindowSize();

  useEffect(() => {
    socket.on('room_update', (roomState) => {
      setRoom(roomState);
    });
    return () => socket.off('room_update');
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinMode === 'create') {
      const generatedRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
      socket.emit('join_room', { roomId: generatedRoom, playerName });
      setJoined(true);
    } else if (roomId && playerName) {
      socket.emit('join_room', { roomId: roomId.toUpperCase(), playerName });
      setJoined(true);
    }
  };

  // BackgroundGeometry removed to achieve pure pitch black theme

  if (!joined) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        
        <div className="max-w-md w-full glass-panel rounded-[2rem] p-8 md:p-10 animate-fade-in-up">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-6 shadow-2xl">
               <Sparkles className="text-white" size={28} />
            </div>
            <h1 className="text-5xl font-black mb-3 tracking-tighter text-white drop-shadow-sm uppercase">
              WordGrid.gg
            </h1>
          </div>

          {joinMode === 'select' ? (
            <div className="space-y-4">
              <button 
                onClick={() => setJoinMode('create')}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-white rounded-2xl p-6 font-bold flex flex-col items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg border border-blue-500/30"
              >
                <Plus size={24} className="text-blue-400" />
                <span className="text-xl">Start a Game</span>
                <span className="text-xs font-light text-blue-300/60 uppercase tracking-[0.2em]">Create a new game</span>
              </button>
              
              <button 
                onClick={() => setJoinMode('join')}
                className="w-full glass-panel-interactive border-white/10 rounded-2xl p-6 font-bold flex flex-col items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
              >
                <LogIn size={24} className="text-slate-400" />
                <span className="text-xl text-white">Join a Game</span>
                <span className="text-xs font-light text-slate-400 uppercase tracking-[0.2em]">Enter with a code</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setJoinMode('select')} className="text-blue-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
                <span className="font-bold uppercase tracking-widest text-xs text-blue-300/80">
                  {joinMode === 'create' ? 'Creating New Game' : 'Joining Existing Game'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-blue-400/80 uppercase tracking-[0.2em] ml-2">Alias</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-md"
                  placeholder="Your Name..."
                />
              </div>
              
              {joinMode === 'join' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-blue-400/80 uppercase tracking-[0.2em] ml-2">Game Code</label>
                  <input
                    type="text"
                    required
                    value={roomId}
                    onChange={e => setRoomId(e.target.value.toUpperCase().trim())}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all uppercase font-mono font-bold tracking-widest backdrop-blur-md"
                    placeholder="ENTER CODE"
                  />
                </div>
              )}

              {joinMode === 'create' && (
                <div className="space-y-4 pt-2">
                  <label className="text-[11px] font-bold text-blue-400/80 uppercase tracking-[0.2em] ml-2">Match Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 3, 5].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTotalRounds(r)}
                        className={twMerge(
                          "py-3 rounded-xl font-bold text-sm transition-all border",
                          totalRounds === r 
                            ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                            : "bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20"
                        )}
                      >
                        {r} {r === 1 ? 'Round' : 'Rounds'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {joinMode === 'create' && (
                <div className="space-y-4 pt-2">
                  <label className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-[0.2em] ml-2">Turn Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 30, 60, 90].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTurnDuration(t)}
                        className={twMerge(
                          "py-3 rounded-xl font-bold text-sm transition-all border",
                          turnDuration === t 
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                            : "bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20"
                        )}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-white text-black rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                >
                  {joinMode === 'create' ? 'Create Game' : 'Enter Game'} <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!room) return <div className="min-h-screen flex items-center justify-center text-white"><div className="animate-pulse flex items-center gap-3"><Sparkles size={24} className="text-emerald-400"/> <span className="font-bold tracking-widest uppercase">Connecting...</span></div></div>;

  const currentPlayer = room.players[socket.id];
  const isHost = room?.hostId === socket.id;
  const winner = room?.state === 'game_over' 
    ? (room.score.teamA > room.score.teamB ? 'TEAM A' : room.score.teamB > room.score.teamA ? 'TEAM B' : 'DRAW') 
    : null;
  const winnerColor = winner === 'TEAM A' ? 'text-blue-400' : 
                      winner === 'TEAM B' ? 'text-orange-400' : 'text-white';

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-x-hidden">
      
      {/* Header */}
      <header className="glass-panel border-b-1 border-x-0 border-t-0 p-4 sticky top-0 z-40 bg-white/2 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-white" />
              <h1 className="text-xl font-black text-white tracking-tight">wordgrid.gg</h1>
            </div>
            <div className="flex items-center gap-2">
               <div className="glass-panel px-4 py-1.5 rounded-full text-xs font-mono font-bold text-blue-200 bg-blue-500/10">
                 {room.id}
               </div>
               {room.state !== 'lobby' ? (
                 <div className="glass-panel px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white border-white/30">
                   Round {room.currentRound} / {room.totalRounds}
                 </div>
               ) : (
                 <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Lobby</div>
               )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xl shadow-black/20 ring-1 ring-white/10">
              <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Time</div>
              <div className={twMerge("text-2xl font-mono font-black", room.timer <= 10 ? "text-rose-500 animate-pulse" : "text-white")}>
                {room.timer}s
              </div>
            </div>
            
            <div className="glass-panel px-6 py-2 rounded-2xl flex items-center gap-6 shadow-xl shadow-black/20 ring-1 ring-white/10">
              <div className="text-center">
                <div className="text-[10px] uppercase font-black text-blue-400 tracking-widest mb-0.5 max-w-[80px] truncate">{room.teamNames?.teamA || 'TEAM A'}</div>
                <div className="text-2xl font-black text-white">{room.score.teamA}</div>
              </div>
              <div className="w-px h-10 bg-white/10 rounded-full"></div>
              <div className="text-center">
                <div className="text-[10px] uppercase font-black text-orange-400 tracking-widest mb-0.5 max-w-[80px] truncate">{room.teamNames?.teamB || 'TEAM B'}</div>
                <div className="text-2xl font-black text-white">{room.score.teamB}</div>
              </div>
            </div>
            
            {isHost && room.state !== 'lobby' && (
              <button 
                onClick={() => socket.emit('end_game', { roomId: room.id })}
                title="End Game"
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
              >
                <X size={20} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 relative z-10 animate-fade-in-up">
        {/* Left Col: Game Board */}
        <div className="flex-1">
          {room.state === 'lobby' ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel rounded-[2rem] p-12 text-center ring-1 ring-white/5 relative overflow-hidden">
               <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                <Users size={32} className="text-blue-400" />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight text-white capitalize">Ready for battle?</h2>
              <p className="text-slate-400 text-lg max-w-md mb-10 leading-relaxed font-light">
                {isHost 
                  ? "Choose your team and wait for the match to begin. An Explainer will be randomly selected for your team each turn."
                  : "Hang tight! Team members are being assigned. The host will start the game soon."}
              </p>
              
              {isHost ? (
                <div className="flex flex-col items-center w-full max-w-md">
                  <div className="w-full space-y-4 mb-8 text-left bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest ml-1 mb-2 block">Team A Name</label>
                        <input
                          type="text"
                          maxLength={15}
                          value={room.teamNames?.teamA || ''}
                          onChange={(e) => socket.emit('update_team_name', { roomId: room.id, team: 'teamA', name: e.target.value })}
                          className="w-full bg-slate-800/50 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                          placeholder="Team A"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-orange-400/80 uppercase tracking-widest ml-1 mb-2 block">Team B Name</label>
                        <input
                          type="text"
                          maxLength={15}
                          value={room.teamNames?.teamB || ''}
                          onChange={(e) => socket.emit('update_team_name', { roomId: room.id, team: 'teamB', name: e.target.value })}
                          className="w-full bg-slate-800/50 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                          placeholder="Team B"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest ml-1 mb-2 block">Total Rounds</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 3, 5].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setTotalRounds(r)}
                            className={twMerge(
                              "py-2 rounded-lg font-bold text-xs transition-all border",
                              totalRounds === r 
                                ? "bg-blue-600 border-blue-500 text-white" 
                                : "bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20 hover:bg-slate-800"
                            )}
                          >
                            {r} {r === 1 ? 'Round' : 'Rounds'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest ml-1 mb-2 block">Turn Duration</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 30, 60, 90].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTurnDuration(t)}
                            className={twMerge(
                              "py-2 rounded-lg font-bold text-xs transition-all border",
                              turnDuration === t 
                                ? "bg-emerald-600 border-emerald-500 text-white" 
                                : "bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20 hover:bg-slate-800"
                            )}
                          >
                            {t}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => socket.emit('start_game', { roomId: room.id, totalRounds, turnDuration })}
                    className="group w-full relative px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.03] active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)] overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <Play size={24} fill="currentColor" /> Start Game
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-blue-400 font-bold tracking-widest uppercase text-sm animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,1)]" />
                  Waiting for Explainer...
                </div>
              )}
            </div>
          ) : room.state === 'turn_recap' ? (
             <div className="h-full min-h-[500px] flex flex-col items-stretch justify-center glass-panel rounded-[2rem] p-12 ring-1 ring-white/5 relative overflow-hidden animate-fade-in-up">
               <div className="text-center mb-10">
                 <div className="text-[10px] uppercase font-black text-rose-400 tracking-[0.4em] mb-4">TIME'S UP</div>
                 <h2 className="text-5xl font-black mb-2 tracking-tighter text-white">Turn Recap</h2>
                 <p className="text-slate-400 text-lg">Here's what happened this turn.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                 <div className="glass-panel p-8 rounded-3xl border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                   <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Check size={18}/> Guessed Correctly</h3>
                   <div className="flex flex-wrap gap-3">
                     {room.board.filter(w => w.status === 'correct').map(w => (
                       <span key={w.id} className="px-4 py-2 bg-emerald-500/20 text-emerald-300 font-bold rounded-xl text-sm border border-emerald-500/30 shadow-sm transition-transform hover:scale-105">{w.word} <span className="text-emerald-400/80 ml-1">+{w.points}</span></span>
                     ))}
                     {room.board.filter(w => w.status === 'correct').length === 0 && <span className="text-slate-500 text-sm italic font-semibold">Nothing guessed correctly.</span>}
                   </div>
                 </div>
                 
                 <div className="glass-panel p-8 rounded-3xl border-rose-500/20 bg-rose-500/5 shadow-[0_0_30px_rgba(244,63,94,0.05)]">
                   <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-6 flex items-center gap-2"><X size={18}/> Left on Board</h3>
                   <div className="flex flex-wrap gap-3">
                     {room.board.filter(w => w.status === 'active').map(w => (
                       <span key={w.id} className="px-4 py-2 bg-rose-500/10 text-rose-300/60 font-bold rounded-xl text-sm border border-rose-500/20 line-through decoration-rose-500/50">{w.word} ({w.points})</span>
                     ))}
                     {room.board.filter(w => w.status === 'active').length === 0 && <span className="text-slate-500 text-sm italic font-semibold">Board completely cleared!</span>}
                   </div>
                 </div>
               </div>

               <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl w-full max-w-sm mx-auto shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                 <div className="text-[10px] uppercase font-black text-emerald-500/60 tracking-[0.2em] mb-2">Total Points Earned</div>
                 <div className="text-6xl font-black text-emerald-400 drop-shadow-lg">+{room.board.filter(w => w.status === 'correct').reduce((acc, w) => acc + w.points, 0)}</div>
               </div>
             </div>
          ) : room.state === 'turn_transition' ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel rounded-[2rem] p-12 text-center ring-1 ring-white/5 relative overflow-hidden">
               <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-3xl -z-10" />
               
               <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center mb-8 shadow-2xl animate-pulse">
                 {currentPlayer?.id === room.activeExplainer ? <Sparkles size={40} className="text-white" /> : <Users size={40} className="text-white" />}
               </div>

               {currentPlayer?.id === room.activeExplainer ? (
                 <>
                   <h2 className="text-5xl font-black mb-4 tracking-tighter text-white">It's Your Turn!</h2>
                   <p className="text-slate-400 text-lg max-w-sm mb-10 leading-relaxed font-light">
                     You are the <span className="text-white font-bold">Explainer</span> for Team {room.activeTeam === 'teamA' ? 'A' : 'B'}. Get ready to explain words!
                   </p>
                   <button 
                     onClick={() => socket.emit('start_turn', { roomId: room.id })}
                     className="group relative px-16 py-6 bg-blue-600 text-white rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.05] active:scale-95 shadow-2xl"
                   >
                     START TURN
                   </button>
                 </>
               ) : (
                 <>
                   <h2 className="text-4xl font-black mb-4 tracking-tight text-white">Next Up...</h2>
                   <p className="text-slate-400 text-xl max-w-sm mb-6 leading-relaxed font-light italic">
                      Waiting for <span className="text-blue-400 font-black not-italic">{room.players[room.activeExplainer]?.name}</span> to launch their turn.
                   </p>
                   <div className="flex items-center gap-2 text-indigo-400/60 font-bold uppercase tracking-widest text-xs">
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                     Prepare to guess
                   </div>
                 </>
               )}
            </div>
          ) : room.state === 'game_over' ? (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel rounded-[2rem] p-12 text-center ring-1 ring-white/5 relative overflow-hidden">
                   <Confetti width={width} height={height} recycle={false} numberOfPieces={800} gravity={0.2} initialVelocityY={20} colors={['#3b82f6', '#f97316', '#10b981', '#ffffff', '#eab308']} />
                   <div className="text-[10px] uppercase font-black text-white/40 tracking-[0.4em] mb-4">MATCH CONCLUDED</div>
                   <h2 className={twMerge("text-7xl font-black mb-2 tracking-tighter", winnerColor)}>
                     {winner === 'DRAW' ? "IT'S A DRAW!" : `${winner} WINS!`}
                   </h2>
                   
                   <div className="flex gap-8 mt-10 mb-10 w-full max-w-md">
                     <div className="flex-1 p-6 rounded-3xl border-2 border-blue-500/30 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                       <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1 truncate">{room.teamNames?.teamA || 'TEAM A'}</div>
                       <div className="text-5xl font-black text-white">{room.score.teamA}</div>
                     </div>
                     <div className="flex-1 p-6 rounded-3xl border-2 border-orange-500/30 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                       <div className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1 truncate">{room.teamNames?.teamB || 'TEAM B'}</div>
                       <div className="text-5xl font-black text-white">{room.score.teamB}</div>
                     </div>
                   </div>

                   {room.stats && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
                       <div className="glass-panel p-6 rounded-2xl flex flex-col items-center border border-white/10 bg-white/5 shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors">
                         <div className="absolute -top-10 -right-10 text-yellow-500/10 group-hover:scale-110 transition-transform">
                           <Crown size={140} />
                         </div>
                         <Crown size={28} className="text-yellow-400 mb-2" />
                         <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest mb-2">Most Valuable Player</span>
                         {(() => {
                           const mvp = Object.entries(room.stats.playerScores).reduce((a, b) => a[1] > b[1] ? a : b, [null, 0]);
                           return mvp[0] && mvp[1] > 0 ? (
                             <>
                               <div className="text-2xl font-black text-white mb-1 z-10 drop-shadow-md">{room.players[mvp[0]]?.name || 'Unknown'}</div>
                               <div className="text-sm font-bold text-yellow-400 z-10 bg-yellow-500/20 px-3 py-1 rounded-full">{mvp[1]} Points Distributed</div>
                             </>
                           ) : (
                             <div className="text-sm font-bold text-slate-500 mt-2 z-10">No points awarded</div>
                           );
                         })()}
                       </div>

                       <div className="glass-panel p-6 rounded-2xl flex flex-col items-center border border-white/10 bg-white/5 shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors">
                         <div className="absolute -top-4 -right-8 text-emerald-500/10 group-hover:scale-110 transition-transform">
                           <Sparkles size={110} />
                         </div>
                         <Sparkles size={28} className="text-emerald-400 mb-2" />
                         <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2">Fastest Reflexes</span>
                         {room.stats.fastestGuess ? (
                           <>
                             <div className="text-2xl font-black text-white mb-1 z-10 drop-shadow-md">{room.players[room.stats.fastestGuess.playerId]?.name || 'Unknown'}</div>
                             <div className="text-sm font-bold text-emerald-400 z-10 bg-emerald-500/20 px-3 py-1 rounded-full">Guessed "{room.stats.fastestGuess.word}" in {room.stats.fastestGuess.time}s</div>
                           </>
                         ) : (
                           <div className="text-sm font-bold text-slate-500 mt-2 z-10">No fast guesses recorded</div>
                         )}
                       </div>
                     </div>
                   )}

                   {isHost && (
                     <button 
                       onClick={() => socket.emit('end_game', { roomId: room.id })}
                       className="group relative px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.05] active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                     >
                       <RotateCcw size={20} /> Play Again
                     </button>
                   )}
                </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center px-2">
                <div className="flex flex-col">
                  <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    {currentPlayer?.role === 'clue_giver' ? "Explaining" : "Guessing"}
                    <span className={twMerge("px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest max-w-[120px] truncate", room.activeTeam === 'teamA' ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400")}>
                      {room.activeTeam === 'teamA' ? room.teamNames?.teamA || 'Team A' : room.teamNames?.teamB || 'Team B'}
                    </span>
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                   <div className="hidden md:flex items-center gap-2 glass-panel px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border-white/5">
                    Target: {room.board.filter(w => w.status === 'active').length} Words Left
                  </div>
                </div>
              </div>
              
              {(currentPlayer?.role === 'clue_giver' || currentPlayer?.role === 'spectator') && (
                <div className="space-y-6">
                  {currentPlayer?.role === 'spectator' && (
                    <div className="glass-panel p-4 rounded-2xl border-orange-500/20 bg-orange-500/5 flex items-center justify-center gap-3 w-full animate-pulse shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                      <Eye size={20} className="text-orange-400" />
                      <span className="text-orange-300 font-bold uppercase tracking-widest text-sm text-center">Spectating - Monitor the opposing Explainer for rule breaks!</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {room.board.map(w => (
                      <WordCard 
                        key={w.id} 
                        word={w} 
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {currentPlayer?.role === 'guesser' && (
                <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel rounded-[3rem] p-12 relative overflow-hidden border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                   <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-inner">
                     <Play size={32} className="text-blue-400" fill="currentColor" />
                   </div>
                   
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.target.elements.guess;
                      if (input.value.trim()) {
                        socket.emit('submit_guess', { roomId: room.id, guess: input.value });
                        input.value = '';
                      }
                    }}
                    className="w-full max-w-lg"
                  >
                    <input 
                      name="guess"
                      type="text"
                      autoComplete="off"
                      autoFocus
                      placeholder="Type your guess..."
                      className="w-full bg-white/3 border border-white/10 rounded-[2rem] px-8 py-6 text-3xl text-center text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all font-black tracking-wide shadow-2xl backdrop-blur-md"
                    />
                    <div className="flex items-center justify-center gap-2 mt-6">
                       <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Press</span>
                       <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-black text-blue-300">ENTER</kbd>
                       <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">to confirm</span>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Lobby / Players */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="glass-panel rounded-[2rem] p-6 shadow-2xl">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 tracking-wide text-white">
              <Users size={18} className="text-blue-400"/> Players ({Object.keys(room.players).length})
            </h3>
            
            <div className="space-y-8">
              {/* Team A */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] truncate max-w-[150px]">{room.teamNames?.teamA || 'Team A'}</span>
                  {room.state === 'lobby' && currentPlayer?.team !== 'teamA' && (
                    <button onClick={() => socket.emit('switch_team', { roomId: room.id, team: 'teamA' })} className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-500/20 shrink-0">Join</button>
                  )}
                </div>
                <div className="space-y-2">
                  {Object.values(room.players).filter(p => p.team === 'teamA').map(p => (
                    <PlayerRow key={p.id} player={p} isMe={p.id === socket.id} isHost={p.id === room.hostId} isLobby={room.state === 'lobby'} />
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                  <span className="text-xs font-black text-orange-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(251,146,60,0.5)] truncate max-w-[150px]">{room.teamNames?.teamB || 'Team B'}</span>
                  {room.state === 'lobby' && currentPlayer?.team !== 'teamB' && (
                    <button onClick={() => socket.emit('switch_team', { roomId: room.id, team: 'teamB' })} className="text-[10px] uppercase font-bold tracking-wider bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors border border-orange-500/20 shrink-0">Join</button>
                  )}
                </div>
                <div className="space-y-2">
                  {Object.values(room.players).filter(p => p.team === 'teamB').map(p => (
                    <PlayerRow key={p.id} player={p} isMe={p.id === socket.id} isHost={p.id === room.hostId} isLobby={room.state === 'lobby'} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Universal Rules Panel */}
          <div className="glass-panel border-rose-500/30 rounded-[2rem] p-6 flex flex-col bg-rose-900/10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 text-rose-500/5 rotate-12">
              <X size={120} strokeWidth={3} />
            </div>
            <h4 className="font-black text-sm mb-4 text-rose-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-4 ring-rose-500/20"></span>
              Universal Rules
            </h4>
            <ul className="space-y-3 text-rose-200/80 text-sm font-semibold">
              <li className="flex items-start gap-3"><X size={16} className="text-rose-500 shrink-0 mt-0.5" /> No Synonyms</li>
              <li className="flex items-start gap-3"><X size={16} className="text-rose-500 shrink-0 mt-0.5" /> No Hindi Translation</li>
              <li className="flex items-start gap-3"><X size={16} className="text-rose-500 shrink-0 mt-0.5" /> No Direct Opposites</li>
            </ul>
          </div>
          
          {room.state !== 'lobby' && currentPlayer?.role !== 'clue_giver' && (
            <div className="glass-panel border-emerald-500/30 rounded-[2rem] p-8 flex flex-col items-center text-center bg-emerald-900/10 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4 ring-1 ring-emerald-500/30">
                <Sparkles size={24} className="text-emerald-400" />
              </div>
              <h4 className="font-black text-lg mb-2 text-emerald-100">Guesser Mode</h4>
              <p className="text-sm text-emerald-200/60 leading-relaxed font-light">Listen to the Explainer's clues and type your guesses quickly to earn points for your team!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PlayerRow({ player, isMe, isHost, isLobby }) {
  
  return (
    <div className={twMerge("flex items-center justify-between p-3 rounded-xl text-sm transition-all border", isMe ? "glass-panel-interactive border-white/10" : "border-transparent hover:bg-white/5")}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs ring-1 ring-white/10">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="font-semibold flex flex-col">
          <span className="flex items-center gap-1.5">
            {player.name}
            {isMe && <span className="text-[9px] bg-white text-slate-900 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">You</span>}
            {isHost && <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]"><Crown size={10} /> Host</span>}
          </span>
          {!isLobby && (
            <span className={twMerge("text-[10px] font-bold uppercase tracking-wider", 
              player.role === 'clue_giver' ? "text-amber-400" : 
              player.role === 'spectator' ? "text-rose-400" : "text-emerald-400"
            )}>
              {player.role === 'clue_giver' ? 'Explainer' : player.role === 'spectator' ? 'Spectator' : 'Guesser'}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Manual role switching removed to ensure randomization */}
      </div>
    </div>
  );
}

function WordCard({ word }) {
  const isCorrect = word.status === 'correct';
  
  return (
    <div className={twMerge(
      "relative flex flex-col items-center justify-center p-4 h-32 rounded-2xl border-2 transition-all group overflow-hidden animate-fade-in-up",
      isCorrect 
        ? "bg-emerald-500/20 border-emerald-500/50 scale-[0.98] opacity-60" 
        : "bg-slate-900/40 border-white/10 hover:border-blue-500/50 hover:bg-slate-900/60 hover:-translate-y-1 shadow-lg"
    )}>
      <div className="absolute top-2 right-2">
         {isCorrect ? (
           <div className="bg-emerald-500 rounded-full p-0.5">
             <Check size={12} className="text-white" strokeWidth={4} />
           </div>
         ) : (
           <div className={twMerge(
             "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ring-1 ring-inset",
             word.points > 30 ? "bg-red-500/20 text-red-400 ring-red-500/30" : 
             word.points > 15 ? "bg-yellow-500/20 text-yellow-500 ring-yellow-500/30" : 
             "bg-blue-500/20 text-blue-400 ring-blue-500/30"
           )}>
             {word.points} pts
           </div>
         )}
      </div>

      <span className={twMerge(
        "text-xl font-black tracking-tight transition-colors",
        isCorrect ? "text-emerald-400 line-through" : "text-white group-hover:text-blue-300"
      )}>
        {word.word}
      </span>
      
      {!isCorrect && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

export default App;
