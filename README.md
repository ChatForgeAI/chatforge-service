# WhatsApp API Application

A powerful WhatsApp API application that allows users to manage WhatsApp sessions, send messages, manage contacts, create templates, and set up auto-replies.

## Features

### User Management
- User registration with email and password
- User authentication and login
- Role-based access control (admin, user, manager)
- User subscription plans management

### WhatsApp Session Management
- Create and manage multiple WhatsApp sessions per user
- Session status tracking (initialize, qr, loading_screen, authenticated, ready, disconnected, auth_failure)
- Session security with unique session secrets
- QR code generation for WhatsApp Web authentication
- Session termination and restart capabilities

### Messaging
- Send text messages
- Send media messages (images, documents, etc.)
- Send locations
- Message templates
- Bulk messaging capabilities
- Message status tracking
- Message revocation

### Contact Management
- Store and manage WhatsApp contacts
- Contact grouping and categorization
- Contact information synchronization

### Auto-Reply System
- Create custom auto-reply rules
- Trigger-based responses
- Delay settings for responses
- Multiple response types (text, image)
- Active/inactive status for auto-replies

### Template Messages
- Create and manage message templates
- Template approval workflow
- Template categories
- Template variables support

## API Endpoints

### Authentication Routes (`/auth`)
- `POST /auth/login` - User login with validation
- `POST /auth/register` - Register new user with validation
- `POST /auth/start-whatsapp-session` - Start a new WhatsApp session
- `POST /auth/subscribe-plan` - Subscribe to a plan
- `POST /auth/update-session-name` - Update session name
- `POST /auth/terminate-whatsapp-session` - Terminate a session
- `GET /auth/qr` - Get QR code for session
- `GET /auth/restart-whatsapp-session` - Restart a session

### Chat Routes (`/chat`)
- `GET /chat/get-all-chats` - Get all chats
- `GET /chat/get-all-chats-by-phone` - Get chats by phone number
- `GET /chat/get-all-message-by-phone` - Get all messages with a contact
- `POST /chat/send-message` - Send text message
- `POST /chat/send-image-url` - Send image from URL
- `POST /chat/remove-message` - Revoke/delete message
- `POST /chat/send-location` - Send location
- `POST /chat/send-file` - Send file (supports file upload)

### Auto-Reply Routes (`/auto-reply`)
- `POST /auto-reply/create` - Create new auto-reply rule
- `POST /auto-reply/delete` - Delete auto-reply rule
- `GET /auto-reply/get-all` - Get all auto-reply rules
- `POST /auto-reply/update` - Update auto-reply rule

### Template Message Routes (`/template`)
- `GET /template/get-all` - Get all templates
- `POST /template/create` - Create new template
- `POST /template/update` - Update template
- `POST /template/delete` - Delete template

### Contact Routes (`/contact`)
- `GET /contact/get-all` - Get all contacts
- `POST /contact/create` - Add new contact
- `POST /contact/update` - Update contact
- `POST /contact/delete` - Delete contact

### Group Routes (`/group`)
- `GET /group/get-all` - Get all groups
- `POST /group/create` - Create new group
- `POST /group/update` - Update group
- `POST /group/delete` - Delete group
- `POST /group/add-participant` - Add participant to group
- `POST /group/remove-participant` - Remove participant from group

### Account Routes (`/account`)
- `GET /account/profile` - Get account profile
- `POST /account/update` - Update account settings
- `POST /account/change-password` - Change account password

### Plan Routes (`/plan`)
- `GET /plan/get-all` - Get all subscription plans
- `POST /plan/create` - Create new plan
- `POST /plan/update` - Update plan
- `POST /plan/delete` - Delete plan

## Data Models

### User Model
```javascript
{
    name: String,
    email: String,
    password: String,
    instanceSecret: String,
    qrCode: String,
    role: String,
    instanceStatus: String,
    whatsappSessions: [{
        sessionId: String,
        sessionSecret: String,
        status: String,
        startedAt: Date,
        deviceInfo: String,
        ipAddress: String
    }],
    subscriptionPlan: ObjectId,
    endSubscription: Date,
    createdAt: Date
}
```

### Message Model
```javascript
{
    userId: ObjectId,
    to: String,
    body: String,
    type: String,
    status: String,
    mediaUrl: String,
    createdAt: Date
}
```

### Contact Model
```javascript
{
    userId: ObjectId,
    name: String,
    phoneNumber: String,
    email: String,
    group: String,
    notes: String,
    createdAt: Date
}
```

### Template Message Model
```javascript
{
    userId: ObjectId,
    name: String,
    content: String,
    category: String,
    language: String,
    status: String,
    variables: [String],
    createdAt: Date
}
```

### Auto-Reply Model
```javascript
{
    userId: ObjectId,
    triggers: [String],
    responseType: String,
    responseContent: String,
    delay: Number,
    isActive: Boolean,
    createdAt: Date
}
```

## Security Features
- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- Secure session secrets
- API key validation

## Technologies Used
- Node.js
- Express.js
- MongoDB with Mongoose
- WhatsApp Web API
- bcrypt for password hashing
- JWT for authentication

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Chrome/Chromium browser (for WhatsApp Web)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```
   MONGODB_URI=your_mongodb_uri
   PORT=3000
   JWT_SECRET=your_jwt_secret
   CHROME_PATH=path_to_chrome_executable
   ```
4. Start the server: `npm start`

## License
This project is licensed under the MIT License.