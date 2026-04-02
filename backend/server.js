const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
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

// A pool of words with varying difficulty points
const WORD_POOL = [
  { word: "Elevator", points: 20 },
  { word: "Filthy", points: 25 },
  { word: "Old", points: 27 },
  { word: "Root", points: 30 },
  { word: "Quilt", points: 38 },
  { word: "Approach", points: 13 },
  { word: "Cart", points: 15 },
  { word: "Brunette", points: 3 },
  { word: "Shrink", points: 21 },
  { word: "Branch", points: 3 },
  { word: "East", points: 9 },
  { word: "Believer", points: 4 },
  { word: "Codenames", points: 8 },
  { word: "Telescope", points: 18 },
  { word: "Galaxy", points: 32 },
  { word: "Quantum", points: 45 },
  { word: "Apple", points: 5 },
  { word: "Chair", points: 2 },
  { word: "Acoustic", points: 28 },
  { word: "Synergy", points: 42 }
];

const rooms = {}; // Map to store room state

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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', ({ roomId, playerName }) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        players: {},
        board: [],
        score: { teamA: 0, teamB: 0 },
        isStarted: false,
        wordGrowthInterval: null
      };
    }

    // Default to team A, users can switch in lobby
    rooms[roomId].players[socket.id] = { id: socket.id, name: playerName, team: 'teamA', role: 'guesser' };
    
    io.to(roomId).emit('room_update', rooms[roomId]);
  });

  socket.on('switch_team', ({ roomId, team }) => {
    if (rooms[roomId] && rooms[roomId].players[socket.id]) {
      rooms[roomId].players[socket.id].team = team;
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('switch_role', ({ roomId, role }) => {
    if (rooms[roomId] && rooms[roomId].players[socket.id]) {
      rooms[roomId].players[socket.id].role = role;
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('start_game', ({ roomId }) => {
    if (rooms[roomId]) {
      rooms[roomId].isStarted = true;
      rooms[roomId].score = { teamA: 0, teamB: 0 };
      
      // Initially show 8 words
      rooms[roomId].board = getRandomWords(8);
      io.to(roomId).emit('room_update', rooms[roomId]);

      if (rooms[roomId].wordGrowthInterval) {
        clearInterval(rooms[roomId].wordGrowthInterval);
      }
      // Periodically add words until maximum of 12
      rooms[roomId].wordGrowthInterval = setInterval(() => {
        if (rooms[roomId] && rooms[roomId].isStarted) {
          if (rooms[roomId].board.length < 12) {
            const currentWordStrings = rooms[roomId].board.map(w => w.word);
            const newWords = getRandomWords(1, currentWordStrings);
            if (newWords.length > 0) {
              rooms[roomId].board.push(newWords[0]);
              io.to(roomId).emit('room_update', rooms[roomId]);
            }
          }
        }
      }, 5000);
    }
  });

  socket.on('submit_guess', ({ roomId, guess }) => {
    if (rooms[roomId] && rooms[roomId].isStarted) {
      const room = rooms[roomId];
      const player = room.players[socket.id];
      if (!player) return;
      
      const normalizedGuess = guess.trim().toLowerCase();
      const wordIndex = room.board.findIndex(w => 
        w.status === 'active' && w.word.toLowerCase() === normalizedGuess
      );
      
      if (wordIndex !== -1) {
        const wordConfig = room.board[wordIndex];
        room.board[wordIndex].status = 'correct';
        room.score[player.team] += wordConfig.points;

        io.to(roomId).emit('room_update', room);
      }
    }
  });

  socket.on('end_game', ({ roomId }) => {
    if (rooms[roomId]) {
      rooms[roomId].isStarted = false;
      if (rooms[roomId].wordGrowthInterval) {
        clearInterval(rooms[roomId].wordGrowthInterval);
      }
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
          if (rooms[roomId].wordGrowthInterval) {
            clearInterval(rooms[roomId].wordGrowthInterval);
          }
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('room_update', rooms[roomId]);
        }
      }
    });
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Serve index.html for any other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Port configuration (useful for deployment)
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
