# ChatApp — Chat em Tempo Real com WebSocket

Aplicação full stack de chat em tempo real construída com:
- **Frontend**: Next.js + TypeScript
- **Backend**: Node.js + Express + TypeScript + WebSocket (`ws`)
- **Banco**: PostgreSQL
- **Infra**: Docker Compose

---

## Como executar

### Pré-requisitos
- Docker e Docker Compose instalados

### 1. Clone e entre na pasta
```bash
git clone <repo>
cd chat-app
```

### 2. Suba tudo com Docker
```bash
docker-compose up --build
```

Aguarde todos os containers iniciarem (~30-60s na primeira vez).

### 3. Acesse no navegador
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **WebSocket**: ws://localhost:3001/ws

---

## Como testar o chat

1. Abra **duas abas** (ou dois navegadores) em http://localhost:3000
2. Em cada aba, cadastre um usuário com um nome diferente
3. Selecione o outro usuário na sidebar
4. Envie mensagens e observe:
   - ⏰ **Relógio** → mensagem pendente (ainda não enviou)
   - ✓ **1 check cinza** → enviada para o servidor
   - ✓✓ **2 checks cinzos** → entregue (destinatário online)
   - ✓✓ **2 checks coloridos** → visualizada (destinatário abriu a conversa)

---

## Estrutura do projeto

```
chat-app/
├── .env                          # Variáveis globais do Docker Compose
├── docker-compose.yml
│
├── backend/
│   ├── .env                      # Variáveis do backend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              # Entry point: Express + HTTP + WebSocket
│       ├── types/index.ts        # Tipos compartilhados (User, Message, WSEvent)
│       ├── database/
│       │   ├── connection.ts     # Pool de conexão com o PostgreSQL
│       │   └── migrations.ts     # Cria tabelas ao iniciar
│       ├── models/
│       │   ├── UserModel.ts      # Queries SQL de usuários
│       │   └── MessageModel.ts   # Queries SQL de mensagens
│       ├── controllers/
│       │   ├── UserController.ts   # Handlers das rotas de usuário
│       │   └── MessageController.ts
│       ├── routes/
│       │   └── index.ts          # Mapeamento de rotas REST
│       └── websocket/
│           └── handler.ts        # Toda a lógica WebSocket em tempo real
│
└── frontend/
    ├── .env                      # Variáveis públicas do Next.js
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tsconfig.json
    └── src/
        ├── types/index.ts        # Tipos TypeScript do frontend
        ├── lib/api.ts            # Funções de chamada à API REST
        ├── hooks/
        │   └── useWebSocket.ts   # Hook que gerencia a conexão WebSocket
        ├── components/
        │   └── MessageStatusIcon.tsx  # Ícones de status (✓ ✓✓ etc.)
        └── app/
            ├── layout.tsx
            ├── globals.css       # Estilos globais (tema escuro WhatsApp-like)
            └── page.tsx          # Componente principal: login + chat
```

---

## Fluxo WebSocket

```
Cliente conecta ao WS
  → envia: { type: "user_connected", payload: { userId } }
  ← recebe: { type: "user_list", payload: { users } }
  ← recebe (outros): { type: "user_joined", payload: { user } }

Cliente envia mensagem
  → envia: { type: "message_send", payload: { senderId, receiverId, content, tempId } }
  ← recebe (ACK): { type: "message_status", payload: { tempId, message } }
  ← destinatário recebe: { type: "message_receive", payload: { message } }
  ← remetente recebe: { type: "message_status", payload: { messageId, status: "delivered" } }

Destinatário abre a conversa
  → envia: { type: "message_read", payload: { readerId, senderId } }
  ← remetente recebe: { type: "message_status", payload: { messageIds, status: "read" } }
```

---

## Comandos úteis

```bash
# Subir em modo dev (com logs)
docker-compose up

# Subir em background
docker-compose up -d

# Ver logs de um serviço
docker-compose logs -f backend

# Parar tudo
docker-compose down

# Parar e remover volumes (apaga o banco)
docker-compose down -v
```
