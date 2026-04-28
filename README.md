# 💬 UltiChat

Chat em tempo real com suporte a texto, imagem e áudio — rodando com Node.js e Socket.IO.

## ✨ Funcionalidades

- Entrar com nickname personalizado
- Cor do nome configurável por usuário
- Foto de perfil com crop automático 1:1
- Mensagens de texto (Enter ou botão)
- Envio de imagens (redimensionadas automaticamente)
- Gravação e envio de áudio direto pelo navegador
- Player de áudio customizado com waveform visual
- Mensagens alinhadas por autor (esquerda/direita)
- Lista de usuários online em tempo real
- Layout responsivo com painéis colapsáveis no mobile

## 🖥️ Preview

> Chat com painel de perfil à esquerda, mensagens ao centro e lista de online à direita.

## 🚀 Como rodar localmente

```bash
git clone https://github.com/UltimateStrength/ulti-chat.git
cd ulti-chat
npm install
npm start
```

Acesse em: `http://localhost:1234`

## 🗂️ Estrutura

```
ulti-chat/
├── public/
│   └── assets/
│       ├── images/        # Ícones e imagens do app
│       ├── scripts/
│       │   ├── main-code.js          # Lógica do cliente
│       │   └── inspect-block-filter.js
│       └── styles/
│           ├── app.css
│           ├── chat-screen.css
│           ├── hovers.css
│           └── screen.css
│   └── index.html
├── server.js              # Servidor Node + Socket.IO
├── package.json
└── .gitignore
```

## 🛠️ Tecnologias

- Node.js
- Express
- Socket.IO
- HTML / CSS / JavaScript vanilla

## 📌 Observações

- Sem banco de dados — o histórico não persiste entre sessões
- Avatares e áudios trafegam como base64 via socket (recomendado para uso local/LAN)
- Deploy possível via [Render](https://render.com) ou Railway