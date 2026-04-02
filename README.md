# 🚀 ChatForge Service

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)](https://www.docker.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Baileys-blue.svg)](https://github.com/WhiskeySockets/Baileys)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

**ChatForge Service** is a high-performance, multi-session WhatsApp management microservice. Built with **Node.js** and **Baileys**, it allows for the simultaneous management of multiple WhatsApp accounts through a unified REST API, featuring a built-in AI auto-reply bridge.

---

## ✨ Key Features

- **🔄 Multi-Session Architecture**: Initialize and manage multiple WhatsApp instances independently within a single service.
- **🤖 AI Auto-Reply Bridge**: Automatically intercepts incoming messages and forwards them to an external AI service (e.g., ChatForge Backend) for intelligent responses.
- **⏱️ Robust Lifecycle Management**: Handles connection updates, automatic retries, and session persistence using the `multi-file-auth-state` protocol.
- **📊 Real-time Status Tracking**: Monitor session states through a comprehensive workflow:
  - `initializing` ➡️ `qr` ➡️ `authenticated` ➡️ `ready` ➡️ `disconnected`.
- **📱 QR Code Delivery**: Access QR codes via terminal or API in real-time for seamless authentication.
- **🛡️ Secure Communication**: All API endpoints are protected by `API-Secret` and session-based validation.
- **📁 Persistent Storage**: Session credentials are encrypted and stored locally, ensuring sessions remain active across server restarts.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **WhatsApp Engine**: [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
- **Database**: MongoDB (via Mongoose)
- **Logging**: Winston & Pino
- **Utilities**: Luxon (Time management), Chalk (CLI styling)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher recommended.
- **MongoDB**: A running instance (local or Cloud).
- **Git**: For version control.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ChatForgeAI/chatforge-service.git
   cd chatforge-service
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or copy and edit the provided example):
   ```env
   DATABASE_URI=your_mongodb_connection_string
   PORT=8000
   API_SECRET=your_secure_api_secret
   MAX_QR_GENERATIONS=30
   MESSAGES_API_URL=http://localhost:3000/v1/messages
   ```

4. **Start the Service**:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

---

## 🐳 Run with Docker

### Prerequisites

- **Docker**: v20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: v2.x+ (bundled with Docker Desktop; install the plugin for Linux)

### Option 1 — Docker Compose (recommended)

Docker Compose builds the image and starts the container in one command. It automatically reads environment variables from `.env`.

1. **Configure Environment Variables**:
   Copy the sample values and update them:
   ```env
   DATABASE_URI=your_mongodb_connection_string
   PORT=8000
   API_SECRET=your_secure_api_secret
   MAX_QR_GENERATIONS=30
   MESSAGES_API_URL=http://host.docker.internal:3000/v1/messages
   ```
   > **Note for Linux users**: `host.docker.internal` is not available by default, but the provided `docker-compose.yml` already includes `extra_hosts: host.docker.internal:host-gateway` to handle this automatically. If you prefer, you can replace the hostname with your machine's LAN IP instead.

2. **Build and start**:
   ```bash
   docker compose up --build -d
   ```

3. **View logs**:
   ```bash
   docker compose logs -f
   ```

4. **Stop the service**:
   ```bash
   docker compose down
   ```

WhatsApp session data is persisted in the `./storage/session` directory on your host machine via a volume mount.

---

### Option 2 — Docker CLI

1. **Build the image**:
   ```bash
   docker build -t chatforge-service .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name whatsapp_chat_forge \
     -p 8000:8000 \
     --env-file .env \
     -v "$(pwd)/storage/session:/usr/src/app/storage/session" \
     --restart always \
     chatforge-service
   ```

3. **View logs**:
   ```bash
   docker logs -f whatsapp_chat_forge
   ```

4. **Stop and remove the container**:
   ```bash
   docker stop whatsapp_chat_forge && docker rm whatsapp_chat_forge
   ```

---

## 📡 API Reference

### Headers
Every request must include the following headers for authorization:
- `api-secret`: Your pre-defined API secret.
- `x-user-id`: The unique ID of the user owning the session.

### Session Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/session/start-whatsapp-session` | Initializes a new WhatsApp session. |
| `GET` | `/session/qr` | Retrieves the latest QR code for authentication. |
| `POST` | `/session/restart-whatsapp-session` | Restarts an existing session. |
| `POST` | `/session/terminate-whatsapp-session` | Safely ends a session and clears storage. |
| `POST` | `/session/update-session-name` | Updates the metadata of a session. |

---

## 🧠 AI Auto-Reply Workflow

ChatForge Service acts as a bridge between WhatsApp and your AI logic.

1. **Incoming**: A message is received via WhatsApp.
2. **Forward**: The service sends a `POST` request to `http://localhost:3000/v1/messages`.
3. **Logic**: Your backend processes the message and returns an AI-generated response.
4. **Reply**: ChatForge Service sends the AI response back to the user on WhatsApp.

---

## 📁 Project Structure

```text
src/
├── config/             # Database and app configurations
├── controller/         # Session logic handlers
├── middlewere/         # Auth and validation layers
├── models/             # Mongoose schemas (Session)
├── routs/              # API route definitions
├── services/           # Core WhatsApp (Baileys) engine
└── utils/              # Response formatting and logging
```

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

<p align="center">Made with ❤️ by <b>Abd Alftah</b> for the ChatForge Platform</p>