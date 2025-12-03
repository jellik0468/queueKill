# QueueKill Backend

Express + TypeScript backend with JWT authentication, Socket.IO real-time communication, and Prisma ORM with PostgreSQL.

## Features

- ⚡ **Express.js** - Fast, unopinionated web framework
- 📘 **TypeScript** - Type-safe development
- 🔐 **JWT Authentication** - Secure access & refresh token system
- 🔌 **Socket.IO** - Real-time bidirectional communication
- 🗄️ **Prisma ORM** - Modern database toolkit with PostgreSQL
- ✅ **Zod Validation** - Runtime type validation
- 🛡️ **Helmet** - Security headers
- 🎨 **ESLint + Prettier** - Code quality and formatting
- 🔄 **ts-node-dev** - Fast development with hot reload

## Project Structure

```
src/
├── config/          # Configuration and environment variables
├── controllers/     # Route controllers (request handling)
├── lib/             # Shared libraries (Prisma client)
├── middleware/      # Express middlewares (auth, error handling, validation)
├── routes/          # API route definitions
├── services/        # Business logic layer
├── sockets/         # Socket.IO event handlers
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (JWT, password hashing)
├── validators/      # Zod validation schemas
├── app.ts           # Express app configuration
└── index.ts         # Application entry point
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database
- npm or yarn

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/queuekill?schema=public"
JWT_SECRET="your-super-secret-key"
```

3. **Set up the database:**

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. **Start development server:**

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (invalidate session) |
| POST | `/api/auth/logout-all` | Logout from all devices (protected) |
| GET | `/api/auth/me` | Get current user profile (protected) |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `joinRoom` | `roomId: string` | Join a room |
| `leaveRoom` | `roomId: string` | Leave a room |
| `sendMessage` | `{ roomId, message }` | Send message to room |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `notification` | `{ message, type }` | Notification message |
| `userConnected` | `{ userId }` | User connected |
| `userDisconnected` | `{ userId }` | User disconnected |
| `error` | `{ message }` | Error message |

### Socket Authentication

Connect with authentication token:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-access-token'
  }
});
```

## License

MIT

