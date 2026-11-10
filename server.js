const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();
const ARENA = { x: 9, z: 15 };
const cleanName = (s) => String(s || "Pemain").trim().slice(0, 16) || "Pemain";
function roomState(code) {
  if (!rooms.has(code)) rooms.set(code, { players: {}, started: false, scores: { attack: 0, guard: 0 } });
  return rooms.get(code);
}
function publicState(room) {
  return { players: Object.values(room.players), started: room.started, scores: room.scores };
}
function broadcast(code) {
  const room = rooms.get(code);
  if (room) io.to(code).emit("state", publicState(room));
}

io.on("connection", socket => {
  socket.on("join", ({ code, name }) => {
    code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    if (!code) {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      do {
        code = Array.from({length: 5}, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
      } while (rooms.has(code));
    }
    const room = roomState(code);
    if (Object.keys(room.players).length >= 20) return socket.emit("errorMessage", "Room penuh (maksimal 20 pemain).");
    if (socket.data.room) socket.leave(socket.data.room);
    const count = Object.keys(room.players).length;
    const teams = Object.values(room.players).reduce((acc, p) => {
      acc[p.team] += 1; return acc;
    }, { attack: 0, guard: 0 });
    const team = teams.attack <= teams.guard ? "attack" : "guard";
    const spawn = team === "attack"
      ? { x: (count % 3 - 1) * 1.5, z: 6.2 }
      : { x: (count % 3 - 1) * 1.5, z: -6.2 };
    const player = { id: socket.id, name: cleanName(name), team, x: spawn.x, z: spawn.z, yaw: 0, active: true };
    room.players[socket.id] = player;
    socket.data.room = code;
    socket.join(code);
    socket.emit("joined", { code, id: socket.id, team });
    broadcast(code);
  });

  socket.on("move", ({ x, z, yaw }) => {
    const code = socket.data.room;
    const room = rooms.get(code);
    const p = room && room.players[socket.id];
    if (!p || !room.started) return;
    const nx = Number(x), nz = Number(z);
    if (!Number.isFinite(nx) || !Number.isFinite(nz)) return;
    p.x = Math.max(-ARENA.x / 2 + .45, Math.min(ARENA.x / 2 - .45, nx));
    p.z = Math.max(-ARENA.z / 2 + .45, Math.min(ARENA.z / 2 - .45, nz));
    p.yaw = Number(yaw) || 0;
    if (p.team === "guard") {
      for (const other of Object.values(room.players)) {
        if (other.team === "attack" && Math.hypot(other.x - p.x, other.z - p.z) < .8) {
          room.scores.guard += 1;
          other.x = 0; other.z = 6.2;
          io.to(code).emit("notice", `${p.name} menyentuh ${other.name}! Poin penjaga +1`);
        }
      }
    }
    broadcast(code);
  });

  socket.on("startGame", () => {
    const code = socket.data.room, room = rooms.get(code);
    if (!room) return;
    room.started = true;
    io.to(code).emit("notice", "Permainan dimulai! Penyerang menyeberang, penjaga menghadang.");
    broadcast(code);
  });

  socket.on("disconnect", () => {
    const code = socket.data.room, room = rooms.get(code);
    if (!room) return;
    delete room.players[socket.id];
    if (!Object.keys(room.players).length) rooms.delete(code);
    else broadcast(code);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Gobak Sodor berjalan di port ${PORT}`));
