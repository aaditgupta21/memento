# Memento

A full-stack web application with **Next.js** frontend and **Express** backend.

## Project Structure

```
35l-proj/
├── client/          # Next.js frontend
│   ├── app/         # Next.js app directory
│   │   ├── [username]/  # Dynamic user gallery pages
│   │   ├── account/     # Account settings
│   │   ├── feed/        # Posts feed
│   │   ├── upload/      # Post upload
│   │   ├── wrapped/     # Year wrapped
│   │   └── ...
│   ├── components/  # React components
│   ├── context/      # React context (UserContext)
│   └── package.json
├── server/          # Express backend
│   ├── config/      # Database and middleware config
│   ├── models/      # Mongoose models (User, Post, Scrapbook)
│   ├── routes/      # API routes (auth, users, posts, scrapbooks)
│   ├── index.js     # Main server file
│   └── package.json
└── package.json     # Root package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install all dependencies (client, server, and root):

```bash
# Install root dependencies
npm install

# Install client dependencies
npm run install-client

# Install server dependencies
npm run install-server
```

### Running the Application

#### Run both client and server concurrently (Development Mode) ⚡

```bash
npm run dev
```

#### Run client only

```bash
npm run client
```

#### Run server only

```bash
npm run server
```

### Build for Production

```bash
npm run build
```

### Ports

- **Client (Next.js)**: http://localhost:3000
- **Server (Express)**: http://localhost:4000

## Development

- The Next.js client will automatically reload when you make changes
- The server uses nodemon for automatic restart on file changes
- API calls from the client are made directly to http://localhost:4000

## Environment Variables

### Server `.env` file

Create a `.env` file in the `server/` directory with the following variables:

```
PORT=4000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Client `.env` file

Create a `.env` file in the `client/` directory with the following variables:

```
UPLOADTHING_TOKEN=your_uploadthing_token
```

## License

MIT - See [LICENSE](LICENSE) file for details
