# Memento

A full-stack web application with **Next.js** frontend and **Express** backend.

Memento is a social media platform for sharing and organizing memories through photos. Users can create posts with images, captions, and locations, organize them into scrapbooks, and view their year in review through the wrapped feature.

## UML DIAGRAMS
### Sequence Diagram to create a scrapbook
<img width="725" height="709" alt="Screenshot 2025-12-04 at 17 40 29" src="https://github.com/user-attachments/assets/1978785a-28e4-4373-aa8d-1b3853b5fbae" />

### Entity Relationship Diagram
<img width="1473" height="1121" alt="ERD drawio" src="https://github.com/user-attachments/assets/28e7a1ee-d550-41aa-bab8-ccfe1d6c1b76" />



## Features

- **Posts**: Upload posts with multiple images, captions, locations, and categories
- **Feed**: Browse and interact with posts from all users
- **Gallery**: View your own or other users' posts and scrapbooks
- **Map**: View a detailed map of where all the photos in your posts were taken
- **Scrapbooks**: Organize posts into curated collections with custom cover images
- **Wrapped**: View your year in review with statistics and top moments
- **Account Management**: Update profile information, username, and password

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

- Node.js (v20 or higher)
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

### Running with Docker

Make sure you have Docker and Docker Compose installed.

1. Create `.env` files as described in the Environment Variables section
2. Build and start all services:

```bash
docker-compose up --build
```

This will start:

- MongoDB on port 27017
- Server on port 4000
- Client on port 3000

To run in detached mode:

```bash
docker-compose up -d
```

To stop all services:

```bash
docker-compose down
```

To stop and remove volumes (including MongoDB data):

```bash
docker-compose down -v
```

### Ports

- **Client (Next.js)**: http://localhost:3000
- **Server (Express)**: http://localhost:4000

## Deployment

The application is deployed at **https://trymemento.app**:

- **Frontend**: Deployed on [Vercel](https://vercel.com)
- **Backend**: Deployed using Docker on Oracle VM
- **API**: Available at `https://api.trymemento.app`

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
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## License

MIT - See [LICENSE](LICENSE) file for details
