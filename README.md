# 🚀 ChatForge Service

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
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
   Create a `config.env` file in the root directory:
   ```env
   DATABASE_URI=your_mongodb_connection_string
   PORT=8000
   API_SECRET=your_secure_api_secret
   MAX_QR_GENERATIONS=30
   ```

4. **Start the Service**:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
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