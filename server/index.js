require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
const { initDB } = require('./db');

const authRoutes   = require('./routes/auth');
const gamesRoutes  = require('./routes/games');
const scoresRoutes = require('./routes/scores');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth',   authRoutes);
app.use('/api/games',  gamesRoutes);
app.use('/api/scores', scoresRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Fight Game Socket Rooms ──────────────────────────────────────
const rooms = {}; // roomCode -> { host, controller, state }

io.on('connection', (socket) => {

  // PC host creates room
  socket.on('create-room', (roomCode) => {
    rooms[roomCode] = { host: socket.id, controller: null };
    socket.join(roomCode);
    socket.emit('room-created', roomCode);
    console.log(`Room created: ${roomCode}`);
  });

  // Phone joins as controller
  socket.on('join-room', (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit('room-error', 'Oda bulunamadı');
    if (room.controller) return socket.emit('room-error', 'Oda dolu');
    room.controller = socket.id;
    socket.join(roomCode);
    socket.emit('room-joined', roomCode);
    io.to(room.host).emit('controller-connected');
    console.log(`Controller joined: ${roomCode}`);
  });

  // Phone sends button press
  socket.on('button', ({ roomCode, action }) => {
    const room = rooms[roomCode];
    if (!room) return;
    io.to(room.host).emit('button', action);
  });

  // PC sends game state to controller (optional)
  socket.on('game-state', ({ roomCode, state }) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (room.controller) io.to(room.controller).emit('game-state', state);
  });

  socket.on('disconnect', () => {
    for (const [code, room] of Object.entries(rooms)) {
      if (room.host === socket.id) {
        io.to(code).emit('host-disconnected');
        delete rooms[code];
      } else if (room.controller === socket.id) {
        room.controller = null;
        io.to(room.host).emit('controller-disconnected');
      }
    }
  });
});

server.listen(PORT, async () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
  await initDB();
});
