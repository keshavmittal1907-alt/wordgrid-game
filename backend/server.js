const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

/**
 * SAFETY NET: Crash Protection
 * Prevents the backend server from stopping due to unexpected errors.
 */
process.on('uncaughtException', (err) => {
  console.error('[CRASH PROTECTION] Caught unhandled exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH PROTECTION] Caught unhandled rejection at:', promise, 'reason:', reason);
});
const path = require('path');

const app = express();
app.use(cors());

// Serve static frontend files (used for production/local sharing)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Load word pool from external JSON
const WORD_POOL = require('./words.json');
console.log(`[INIT] Loaded ${WORD_POOL.length} words from words.json`);

const rooms = {}; // Map to store room state
const intervals = {}; // Internal map for timers to avoid serialization errors

function stopIntervals(roomId) {
  if (intervals[roomId]) {
    if (intervals[roomId].timer) clearInterval(intervals[roomId].timer);
    if (intervals[roomId].wordGrowth) clearInterval(intervals[roomId].wordGrowth);
    delete intervals[roomId];
  }
}

function getRandomWords(count, excludeWords = []) {
  const available = WORD_POOL.filter(w => !excludeWords.includes(w.word));
  if (available.length === 0) return [];
  const shuffled = available.sort(() => 0.5 - Math.random());
  // Attach unique IDs and default status to the words for the board
  return shuffled.slice(0, count).map(w => ({
    ...w,
    id: Math.random().toString(36).substring(2, 9),
    status: 'active' // 'active', 'correct', 'missed'
  }));
}
function getBalancedWordsForRound(room) {
  const round = room.currentRound;
  if (!room.roundBlueprints) room.roundBlueprints = {};
  if (!room.playedWords) room.playedWords = [];

  const shuffle = (arr) => arr.sort(() => 0.5 - Math.random());
  
  if (!room.roundBlueprints[round]) {
    // Generate organic board for the first team of this round
    const smPool = WORD_POOL.filter(w => w.points <= 28 && !room.playedWords.includes(w.word));
    const hPool = WORD_POOL.filter(w => w.points > 28 && w.points <= 45 && !room.playedWords.includes(w.word));
    const ePool = WORD_POOL.filter(w => w.points > 45 && !room.playedWords.includes(w.word));

    const smSelected = shuffle(smPool).slice(0, 7);
    const hSelected = shuffle(hPool).slice(0, 3);
    const eSelected = shuffle(ePool).slice(0, 2);

    let combined = [...smSelected, ...hSelected, ...eSelected];
    
    // Save exactly these point values as the universal blueprint for this round
    room.roundBlueprints[round] = combined.map(w => w.points);

    // Track played words so they don't appear again
    combined.forEach(w => room.playedWords.push(w.word));

    combined = shuffle(combined);
    return combined.map(w => ({
      ...w,
      id: Math.random().toString(36).substring(2, 9),
      status: 'active'
    }));
  } else {
    // Second team is playing: use the blueprint to trace identically scored words
    const blueprint = room.roundBlueprints[round]; // [9, 14, 21, ...]
    const selectedWords = [];
    
    // Filter available pool
    const availablePool = WORD_POOL.filter(w => !room.playedWords.includes(w.word));

    for (const requiredPoints of blueprint) {
      let pool = shuffle(availablePool);
      let matchingWords = pool.filter(w => w.points === requiredPoints);
      
      let picked;
      if (matchingWords.length > 0) {
        picked = matchingWords[0];
      } else {
        // Fallback: If exact point value depleted, find mathematically absolute closest
        let minDiff = Infinity;
        for (const w of pool) {
          const diff = Math.abs(w.points - requiredPoints);
          if (diff < minDiff) {
            minDiff = diff;
            picked = w;
          }
        }
      }

      if (picked) {
        selectedWords.push(picked);
        room.playedWords.push(picked.word);
        // Splice picked word from availablePool
        const removeIdx = availablePool.findIndex(w => w.word === picked.word);
        if(removeIdx !== -1) availablePool.splice(removeIdx, 1);
      }
    }

    const combined = shuffle(selectedWords);
    return combined.map(w => ({
      ...w,
      id: Math.random().toString(36).substring(2, 9),
      status: 'active'
    }));
  }
}


function checkNextTurn(room, io) {
  stopIntervals(room.id);

  room.activeTeam = room.activeTeam === 'teamA' ? 'teamB' : 'teamA';
  
  let teamMembers = Object.values(room.players).filter(p => p.team === room.activeTeam && !room.playedExplainers.includes(p.id));
  
  if (teamMembers.length === 0) {
    // Try other team
    room.activeTeam = room.activeTeam === 'teamA' ? 'teamB' : 'teamA';
    teamMembers = Object.values(room.players).filter(p => p.team === room.activeTeam && !room.playedExplainers.includes(p.id));
    
    if (teamMembers.length === 0) {
      // Everyone has been an explainer. Check if we have more rounds.
      if (room.currentRound < room.totalRounds) {
        room.currentRound += 1;
        room.playedExplainers = [];
        // Start the next round by picking the first team again
        room.activeTeam = 'teamA';
        teamMembers = Object.values(room.players).filter(p => p.team === room.activeTeam);
        
        if (teamMembers.length === 0) {
           // Fallback if team A is empty
           room.activeTeam = 'teamB';
           teamMembers = Object.values(room.players).filter(p => p.team === room.activeTeam);
        }
      } else {
        room.state = 'game_over';
        io.to(room.id).emit('room_update', room);
        return;
      }
    }
  }

  if (teamMembers.length > 0) {
    room.activeExplainer = teamMembers[Math.floor(Math.random() * teamMembers.length)].id;
    
    Object.values(room.players).forEach(p => {
      if (p.id === room.activeExplainer) {
        p.role = 'clue_giver';
      } else if (p.team === room.activeTeam) {
        p.role = 'guesser';
      } else {
        p.role = 'spectator';
      }
    });
    
    room.state = 'turn_transition';
    room.timer = room.turnDuration || 60;
    room.board = [];
    io.to(room.id).emit('room_update', room);
  } else {
    room.state = 'game_over';
    io.to(room.id).emit('room_update', room);
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', ({ roomId, playerName }) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        hostId: socket.id, // Creator is host
        players: {},
        board: [],
        wordQueue: [],
        score: { teamA: 0, teamB: 0 },
        state: 'lobby',
        activeTeam: 'teamA',
        activeExplainer: null,
        playedExplainers: [],
        timer: 60,
        turnDuration: 60, // Default duration
        currentRound: 1,
        totalRounds: 1,
        teamNames: { teamA: 'Team A', teamB: 'Team B' },
        stats: { playerScores: {}, fastestGuess: null },
        roundBlueprints: {},
        playedWords: []
      };
    }

    // Handle Reconnection: Find if player with same name already exists
    const existingPlayer = Object.values(rooms[roomId].players).find(p => p.name === playerName);
    
    if (existingPlayer) {
      const oldSocketId = existingPlayer.id;
      // Transfer state to new socket
      existingPlayer.id = socket.id;
      delete rooms[roomId].players[oldSocketId];
      rooms[roomId].players[socket.id] = existingPlayer;
      
      // Update references
      if (rooms[roomId].hostId === oldSocketId) rooms[roomId].hostId = socket.id;
      if (rooms[roomId].activeExplainer === oldSocketId) rooms[roomId].activeExplainer = socket.id;
      
      console.log(`[RECONNECT] Player ${playerName} migrated from ${oldSocketId} to ${socket.id}`);
    } else {
      rooms[roomId].players[socket.id] = { id: socket.id, name: playerName, team: 'teamA', role: 'guesser' };
      console.log(`[JOIN] Player ${playerName} joined room ${roomId} (ID: ${socket.id})`);
    }
    
    io.to(roomId).emit('room_update', rooms[roomId]);
  });

  socket.on('switch_team', ({ roomId, team }) => {
    if (rooms[roomId] && rooms[roomId].players[socket.id] && rooms[roomId].state === 'lobby') {
      rooms[roomId].players[socket.id].team = team;
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('switch_role', ({ roomId, role }) => {
    if (rooms[roomId] && rooms[roomId].players[socket.id] && rooms[roomId].state === 'lobby') {
      rooms[roomId].players[socket.id].role = role;
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('update_team_name', ({ roomId, team, name }) => {
    if (rooms[roomId] && rooms[roomId].hostId === socket.id && rooms[roomId].state === 'lobby') {
      const sanitizedName = name.trim().substring(0, 15) || (team === 'teamA' ? 'Team A' : 'Team B');
      rooms[roomId].teamNames[team] = sanitizedName;
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('start_game', ({ roomId, totalRounds, turnDuration }) => {
    if (rooms[roomId] && rooms[roomId].state === 'lobby') {
      rooms[roomId].score = { teamA: 0, teamB: 0 };
      rooms[roomId].playedExplainers = [];
      rooms[roomId].currentRound = 1;
      rooms[roomId].totalRounds = totalRounds || 1;
      rooms[roomId].turnDuration = turnDuration || 60;
      rooms[roomId].activeTeam = 'teamB'; // it will immediately switch to Team A in checkNextTurn
      rooms[roomId].isStarted = true;
      rooms[roomId].stats = { playerScores: {}, fastestGuess: null };
      rooms[roomId].roundBlueprints = {};
      rooms[roomId].playedWords = [];
      
      checkNextTurn(rooms[roomId], io);
    }
  });

  socket.on('start_turn', ({ roomId }) => {
    const room = rooms[roomId];
    console.log(`[DEBUG] start_turn attempt. Room: ${roomId}, State: ${room?.state}, ActiveExplainer: ${room?.activeExplainer}, Sender: ${socket.id}`);
    if (room && room.state === 'turn_transition' && room.activeExplainer === socket.id) {
       room.state = 'playing';
       room.wordQueue = getBalancedWordsForRound(room);
       room.board = room.wordQueue.splice(0, 8);
       room.playedExplainers.push(socket.id);
       
       stopIntervals(room.id);
       intervals[room.id] = {};

       intervals[room.id].timer = setInterval(() => {
          room.timer -= 1;
          if (room.timer <= 0) {
             clearInterval(intervals[room.id].timer);
             clearInterval(intervals[room.id].wordGrowth);
             
             room.state = 'turn_recap';
             io.to(room.id).emit('room_update', room);
             
             setTimeout(() => {
               checkNextTurn(room, io);
             }, 5000);
          } else {
             io.to(room.id).emit('room_update', room);
          }
       }, 1000);

       intervals[room.id].wordGrowth = setInterval(() => {
         if (room.board.length < 12 && room.wordQueue.length > 0) {
           room.board.push(room.wordQueue.shift());
         }
       }, 5000);

       io.to(room.id).emit('room_update', room);
    }
  });

  socket.on('submit_guess', ({ roomId, guess }) => {
    if (rooms[roomId] && rooms[roomId].state === 'playing') {
      const room = rooms[roomId];
      const player = room.players[socket.id];
      if (!player) return;
      
      // Security check: Only members of the active team who are guessers can score
      if (player.role !== 'guesser') return;
      
      const normalizedGuess = guess.trim().toLowerCase();
      const wordIndex = room.board.findIndex(w => 
        w.status === 'active' && w.word.toLowerCase() === normalizedGuess
      );
      
      if (wordIndex !== -1) {
        const wordConfig = room.board[wordIndex];
        room.board[wordIndex].status = 'correct';
        room.score[player.team] += wordConfig.points;
        
        // Record Stats
        if (!room.stats.playerScores[socket.id]) {
          room.stats.playerScores[socket.id] = 0;
        }
        room.stats.playerScores[socket.id] += wordConfig.points;

        const timeTaken = room.turnDuration - room.timer;
        if (!room.stats.fastestGuess || timeTaken < room.stats.fastestGuess.time) {
          room.stats.fastestGuess = {
             playerId: socket.id,
             time: timeTaken,
             word: wordConfig.word
          };
        }

        io.to(roomId).emit('room_update', room);
      }
    }
  });

  socket.on('end_game', ({ roomId }) => {
    if (rooms[roomId]) {
      rooms[roomId].state = 'lobby';
      rooms[roomId].score = { teamA: 0, teamB: 0 };
      rooms[roomId].isStarted = false;
      stopIntervals(roomId);
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('disconnect', () => {
    // Clean up player from rooms
    Object.keys(rooms).forEach(roomId => {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        
        // If room empty, delete it
        if (Object.keys(rooms[roomId].players).length === 0) {
          stopIntervals(roomId);
          delete rooms[roomId];
        } else {
          // If host left, transfer host
          if (rooms[roomId].hostId === socket.id) {
            const remainingPlayers = Object.keys(rooms[roomId].players);
            if (remainingPlayers.length > 0) {
              rooms[roomId].hostId = remainingPlayers[0];
            }
          }
          io.to(roomId).emit('room_update', rooms[roomId]);
        }
      }
    });
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Serve index.html for any other routes (SPA fallback)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Port configuration (useful for deployment)
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server listening on 0.0.0.0:${PORT}`);
});
