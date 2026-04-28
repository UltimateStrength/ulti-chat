(function () {

    const app = document.querySelector(".app");
    const socket = io();

    let uname = "";
    let nickColor = "#000000";
    let avatarBase64 = null; // null = usa default

    /* ==========================================
       TELA DE LOGIN
    ========================================== */

    const joinBtn = app.querySelector("#join-user");
    const usernameInput = app.querySelector("#username");

    function entrar() {
        const username = usernameInput.value.trim();
        if (username.length === 0) return;

        uname = username;

        socket.emit("newuser", {
            username: uname,
            color: nickColor,
            avatar: avatarBase64
        });

        app.querySelector("#profile-name-display").textContent = uname;
        app.querySelector("#profile-name-display").style.color = nickColor;

        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");
    }

    joinBtn.addEventListener("click", entrar);
    usernameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") entrar();
    });

    /* ==========================================
       PAINEL ESQUERDO — PERFIL
    ========================================== */

    const nickColorInput = app.querySelector("#nick-color");
    const avatarInput = app.querySelector("#avatar-input");
    const previewAvatar = app.querySelector("#preview-avatar");

    // Mudou a cor do nick
    nickColorInput.addEventListener("input", function () {
        nickColor = this.value;
        app.querySelector("#profile-name-display").style.color = nickColor;

        if (uname) {
            socket.emit("updateprofile", { color: nickColor });
        }
    });

    // Selecionou nova foto de perfil
    avatarInput.addEventListener("change", function () {
        if (this.files.length === 0) return;
        const file = this.files[0];
        cropImageTo1x1(file, (croppedBase64) => {
            avatarBase64 = croppedBase64;
            previewAvatar.src = croppedBase64;
            previewAvatar.classList.add("custom");

            if (uname) {
                socket.emit("updateprofile", { avatar: avatarBase64 });
            }
        });
    });

    // Crop 1:1 centralizado via canvas
    function cropImageTo1x1(file, callback) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const size = Math.min(img.width, img.height);
                const offsetX = (img.width - size) / 2;
                const offsetY = (img.height - size) / 2;

                const canvas = document.createElement("canvas");
                canvas.width = 128;
                canvas.height = 128;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 128, 128);
                callback(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /* ==========================================
       TYPEBOX — ÁUDIO / IMAGEM / TEXTO
    ========================================== */

    const messageInput = app.querySelector("#message-input");
    const sendBtn = app.querySelector("#send-message");
    const selectImageBtn = app.querySelector("#select-image");
    const imageInput = app.querySelector("#image-input");
    const audioBtn = app.querySelector("#audio-btn");

    // Enter pra enviar
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") enviarTexto();
    });

    sendBtn.addEventListener("click", enviarTexto);

    // Esconde/mostra botão de áudio conforme o input
    messageInput.addEventListener("input", function () {
        if (this.value.length > 0) {
            audioBtn.classList.add("hidden");
        } else {
            audioBtn.classList.remove("hidden");
        }
    });

    function enviarTexto() {
        const text = messageInput.value.trim();
        if (text.length === 0) return;

        renderMessage("my", { username: uname, text, color: nickColor, avatar: avatarBase64 });
        socket.emit("chat", { username: uname, text, color: nickColor, avatar: avatarBase64 });
        messageInput.value = "";
        audioBtn.classList.remove("hidden");
    }

    // Enviar imagem
    selectImageBtn.addEventListener("click", () => imageInput.click());

    imageInput.addEventListener("change", function () {
        if (this.files.length === 0) return;
        const file = this.files[0];

        resizeImage(file, 800, (resizedBase64) => {
            const data = {
                username: uname,
                image: resizedBase64,
                color: nickColor,
                avatar: avatarBase64
            };
            socket.emit("image", data);
        });

        this.value = "";
    });

    // Redimensiona mantendo proporção, limitando largura máxima
    function resizeImage(file, maxWidth, callback) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const ratio = Math.min(1, maxWidth / img.width);
                const canvas = document.createElement("canvas");
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                callback(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Áudio
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;

    audioBtn.addEventListener("click", function () {
    if (messageInput.value.length > 0) return; // segurança extra

    if (isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        audioBtn.style.background = "#111111";
    } else {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                audioChunks = [];
                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(audioChunks, { type: "audio/webm" });
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const data = {
                            username: uname,
                            audio: e.target.result,
                            color: nickColor,
                            avatar: avatarBase64
                        };
                        socket.emit("audio", data);
                    };
                    reader.readAsDataURL(blob);
                    stream.getTracks().forEach(t => t.stop());
                };

                mediaRecorder.start();
                isRecording = true;
                audioBtn.style.background = "#c0392b";
            })
            .catch(() => alert("Permissão de microfone negada."));
    }
});

    /* ==========================================
       SAIR
    ========================================== */

    app.querySelector("#exit-chat").addEventListener("click", function () {
        socket.emit("exituser", uname);
        window.location.href = window.location.href;
    });

        // Toggle painéis mobile
    const overlay = document.getElementById("panel-overlay");
    const panelLeft = document.querySelector(".panel-left");
    const panelRight = document.querySelector(".panel-right");

    function fecharPaineis() {
        panelLeft.classList.remove("open");
        panelRight.classList.remove("open");
        overlay.classList.remove("active");
    }

    const btnLeft = document.getElementById("btn-toggle-left");
    const btnRight = document.getElementById("btn-toggle-right");

    if (btnLeft) {
        btnLeft.addEventListener("click", () => {
            const abrindo = !panelLeft.classList.contains("open");
            fecharPaineis();
            if (abrindo) {
                panelLeft.classList.add("open");
                overlay.classList.add("active");
            }
        });
    }

    if (btnRight) {
        btnRight.addEventListener("click", () => {
            const abrindo = !panelRight.classList.contains("open");
            fecharPaineis();
            if (abrindo) {
                panelRight.classList.add("open");
                overlay.classList.add("active");
            }
        });
    }

    overlay.addEventListener("click", fecharPaineis);

    /* ==========================================
       EVENTOS DO SOCKET
    ========================================== */

    socket.on("update", (update) => renderMessage("update", update));
    socket.on("chat", (message) => renderMessage("other", message));
    socket.on("image", (data) => renderMessage("other-image", data));
    socket.on("image-sent", (data) => renderMessage("my-image", data));
    socket.on("audio", (data) => renderMessage("other-audio", data));
    socket.on("audio-sent", (data) => renderMessage("my-audio", data));

    socket.on("userlist", (list) => {
        const count = app.querySelector("#online-count");
        const ul = app.querySelector("#online-list");

        count.textContent = list.length;
        ul.innerHTML = "";

        list.forEach((user) => {
            const li = document.createElement("li");
            const isDefault = !user.avatar;

            li.innerHTML = `
                <img
                    src="${user.avatar || "/assets/images/profileIcon.png"}"
                    class="user-avatar ${isDefault ? "default" : ""}"
                >
                <span class="user-name" style="color: ${user.color || "#ffffff"}">${user.username}</span>
            `;
            ul.appendChild(li);
        });
    });

    /* ==========================================
       RENDERIZAÇÃO DE MENSAGENS
    ========================================== */

    function getAvatarEl(avatar, side) {
        const isDefault = !avatar;
        return `<img
            src="${avatar || "/assets/images/profileIcon.png"}"
            class="msg-avatar ${isDefault ? "default" : ""}"
            style="order: ${side === "my" ? 2 : 0}"
        >`;
    }

    function renderMessage(type, message) {
        const container = app.querySelector(".chat-screen .messages");
        let el = document.createElement("div");

        if (type === "my") {
            el.className = "message my-message";
            el.innerHTML = `
                ${getAvatarEl(message.avatar, "my")}
                <div class="bubble">
                    <div class="name" style="color: ${message.color || "#ffffff"}">Você</div>
                    <div class="text">${escapeHtml(message.text)}</div>
                </div>
            `;
        }

        else if (type === "other") {
            el.className = "message other-message";
            el.innerHTML = `
                ${getAvatarEl(message.avatar, "other")}
                <div class="bubble">
                    <div class="name" style="color: ${message.color || "#ffffff"}">${escapeHtml(message.username)}</div>
                    <div class="text">${escapeHtml(message.text)}</div>
                </div>
            `;
        }

        else if (type === "my-image") {
            el.className = "message my-message";
            el.innerHTML = `
                ${getAvatarEl(message.avatar, "my")}
                <div class="bubble">
                    <div class="name" style="color: ${message.color || "#ffffff"}">Você</div>
                    <img src="${message.image}" class="image-message">
                </div>
            `;
        }

        else if (type === "other-image") {
            el.className = "message other-message";
            el.innerHTML = `
                ${getAvatarEl(message.avatar, "other")}
                <div class="bubble">
                    <div class="name" style="color: ${message.color || "#ffffff"}">${escapeHtml(message.username)}</div>
                    <img src="${message.image}" class="image-message">
                </div>
            `;
        }

        else if (type === "my-audio" || type === "other-audio") {
            const isMe = type === "my-audio";
            el.className = `message ${isMe ? "my-message" : "other-message"}`;
            const nameLabel = isMe ? "Você" : escapeHtml(message.username);
            const audioId = "audio-" + Date.now() + Math.random().toString(36).slice(2);

            el.innerHTML = `
                ${getAvatarEl(message.avatar, isMe ? "my" : "other")}
                <div class="bubble">
                    <div class="name" style="color: ${message.color || "#ffffff"}">${nameLabel}</div>
                    <div class="audio-player" data-audio="${message.audio}" id="${audioId}">
                        <button class="audio-play-btn" onclick="toggleAudio('${audioId}')">
                            <img src="/assets/images/playButton.png" class="play-icon">
                        </button>
                        <div class="audio-progress-wrapper">
                            <div class="audio-waveform">
                                ${Array.from({length: 30}, (_, i) =>
                                    `<span class="bar" style="height:${8 + Math.random() * 16}px"></span>`
                                ).join("")}
                            </div>
                            <div class="audio-times">
                                <span class="audio-current">0:00</span>
                                <span class="audio-duration">--:--</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        else if (type === "update") {
            el.className = "update";
            el.textContent = message;
        }

        container.appendChild(el);
        container.scrollTop = container.scrollHeight;

        // Inicializa o audio element após inserir no DOM
        if (type === "my-audio" || type === "other-audio") {
            initAudioPlayer(el.querySelector(".audio-player"));
        }
    }

    function initAudioPlayer(playerEl) {
        const src = playerEl.dataset.audio;
        const audio = new Audio(src);
        playerEl._audio = audio;

        audio.addEventListener("loadedmetadata", () => {
            const dur = playerEl.querySelector(".audio-duration");
            dur.textContent = formatTime(audio.duration);
        });

        audio.addEventListener("timeupdate", () => {
            const cur = playerEl.querySelector(".audio-current");
            cur.textContent = formatTime(audio.currentTime);

            // Progresso visual nas barras
            const bars = playerEl.querySelectorAll(".bar");
            const pct = audio.currentTime / audio.duration;
            const filled = Math.floor(pct * bars.length);
            bars.forEach((b, i) => {
                b.classList.toggle("played", i < filled);
            });
        });

        audio.addEventListener("ended", () => {
            const btn = playerEl.querySelector(".play-icon");
            btn.src = "/assets/images/playButton.png";
            playerEl.querySelector(".audio-current").textContent = "0:00";
            playerEl.querySelectorAll(".bar").forEach(b => b.classList.remove("played"));
        });
    }

    window.toggleAudio = function(id) {
        const playerEl = document.getElementById(id);
        if (!playerEl) return;
        const audio = playerEl._audio;
        const icon = playerEl.querySelector(".play-icon");

        if (audio.paused) {
            // Pausa todos os outros players ativos
            document.querySelectorAll(".audio-player").forEach(p => {
                if (p !== playerEl && p._audio && !p._audio.paused) {
                    p._audio.pause();
                    p.querySelector(".play-icon").src = "/assets/images/playButton.png";
                }
            });
            audio.play();
            icon.src = "/assets/images/pauseButton.png";
        } else {
            audio.pause();
            icon.src = "/assets/images/playButton.png";
        }
    };

    function formatTime(s) {
        if (isNaN(s)) return "--:--";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    }

    // Previne XSS em texto de usuário
    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

})();