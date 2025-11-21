# CS35L Full Stack Project

A full-stack web application with **Vite + React** frontend and **Express** backend.

## Project Structure

```
35l-proj/
├── client/          # Vite + React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/          # Express backend
│   ├── index.js
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
npm run install-all
```

Or install individually:

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

- **Client (Vite)**: http://localhost:3000
- **Server (Express)**: http://localhost:5000

The Vite dev server is configured to proxy API requests to the Express server.

## Development

- The client will automatically reload when you make changes (HMR)
- The server uses nodemon for automatic restart on file changes
- API calls from the client are proxied to http://localhost:5000

## Environment Variables

The server uses a `.env` file for configuration:

```
PORT=5000
NODE_ENV=development
```

### Geospatial photo clustering

`server/scrapBookGen.js` can now annotate and cluster photos by official administrative boundaries (city, state, country, etc.) using GeoJSON polygons:

1. Compile or download boundary GeoJSON files (e.g., Natural Earth, US Census TIGER) and describe them in a config file. See `server/geospatial/boundaryConfig.example.json` for the structure; each `level` points to either an inline `featureCollection` or an external GeoJSON file plus the property names that hold the unique id/name.
2. Set `SCRAPBOOK_BOUNDARY_CONFIG=/absolute/path/to/your/config.json`. Optionally limit the processed layers with `SCRAPBOOK_BOUNDARY_LEVELS=city,state`.
3. Run the ingestion script as usual, e.g. `node server/scrapBookGen.js photos/` or `node server/scrapBookGen.js --atlas myCollection`. When the env vars are set, the script performs a point-in-polygon lookup for every GPS-tagged photo, reports clusters per boundary level, and enriches the in-memory entries with a `boundaries` object describing the administrative matches.

Photos without GPS metadata are reported separately so you can decide how to handle them.

## License

MIT - See [LICENSE](LICENSE) file for details
