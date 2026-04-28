/* ===============================
   Imports
================================ */
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

/* ===============================
   Inicialização
================================ */
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 1234;

app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   Estado dos usuários online
================================ */

// Map: socketId -> { username, color, avatar }
const onlineUsers = new Map();

function broadcastUserList() {
    const list = Array.from(onlineUsers.values());
    io.emit("userlist", list);
}

/* ===============================
   Socket.IO
================================ */
io.on("connection", (socket) => {

    // Usuário entrou — recebe perfil completo
    socket.on("newuser", ({ username, color, avatar }) => {
        onlineUsers.set(socket.id, { username, color, avatar });
        socket.broadcast.emit("update", `${username} entrou na conversa!`);
        broadcastUserList();
        console.log(`[+] ${username} conectou (${socket.id})`);
    });

    // Usuário atualizou perfil (cor ou avatar)
    socket.on("updateprofile", ({ color, avatar }) => {
        const user = onlineUsers.get(socket.id);
        if (!user) return;
        if (color) user.color = color;
        if (avatar) user.avatar = avatar;
        onlineUsers.set(socket.id, user);
        broadcastUserList();
    });

    // Mensagem de texto
    socket.on("chat", (message) => {
        socket.broadcast.emit("chat", message);
    });

    // Imagem — inclui username e avatar pra renderizar corretamente
    socket.on("image", (data) => {
        // Emite pra todos incluindo quem enviou (io.emit),
        // mas marca se é o próprio usuário no cliente
        socket.broadcast.emit("image", data);
        // Emite de volta pro remetente com flag "my"
        socket.emit("image-sent", data);
    });

    // Áudio
    socket.on("audio", (data) => {
        socket.broadcast.emit("audio", data);
        socket.emit("audio-sent", data);
    });

    // Saída
    socket.on("exituser", (username) => {
        onlineUsers.delete(socket.id);
        socket.broadcast.emit("update", `${username} saiu da conversa!`);
        broadcastUserList();
        console.log(`[-] ${username} desconectou`);
    });

    // Desconexão inesperada (fechou a aba, etc.)
    socket.on("disconnect", () => {
        const user = onlineUsers.get(socket.id);
        if (user) {
            onlineUsers.delete(socket.id);
            socket.broadcast.emit("update", `${user.username} saiu da conversa!`);
            broadcastUserList();
            console.log(`[-] ${user.username} desconectou (inesperado)`);
        }
    });

});

/* ===============================
   Start
================================ */
server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n==========================================\nServidor rodando na porta ${PORT}\n==========================================\n`);
});