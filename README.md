# IPTV Manager

Web application for managing and organizing IPTV M3U playlists with channel grouping, reordering, and export capabilities.

> 📋 **Per lo stato del progetto e il piano di sviluppo, consulta [ROADMAP.md](ROADMAP.md)**

## Features

- **Import M3U playlists** from file upload or URL
- **Manage channel groups** with drag-and-drop reordering
- **Edit channel metadata** (name, logo, group assignment)
- **Maintain history** - custom changes persist across imports
- **Export customized playlists** as M3U files
- **HTTP server** for serving generated playlists
- **EPG (Electronic Program Guide)** integration with configurable sources (beta)

## Architecture

- **Backend**: Node.js + Express + SQLite
- **Frontend**: Vue.js 3 + Vite + TailwindCSS
- **Deployment**: Single Docker container
- **Database**: SQLite with file-based persistence

## Quick Start

### Using Docker (Recommended)

```bash
# Build and start the container
docker-compose up -d

# Access the application
open http://localhost:3000
```

The generated M3U playlist will be available at:
```
http://localhost:3000/output/playlist.m3u
```

### Development Mode

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
iptv-manager/
├── backend/
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── db/          # Database & migrations
│   │   └── server.js    # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/       # Vue pages
│   │   ├── components/  # Vue components
│   │   └── main.js
│   └── package.json
├── data/                # Persistent data (SQLite + output files)
├── Dockerfile
└── docker-compose.yml
```

## Database Schema

### Channels Table
- Stores imported values (original from M3U)
- Stores custom values (user modifications)
- Override flags to track what has been changed
- Channels matched by `tvg_id` across imports

### Groups Table
- Custom channel groups
- Sortable order
- Export toggle

## API Endpoints

### Import
- `POST /api/import/upload` - Upload M3U file
- `POST /api/import/url` - Import from URL

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create new group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `PUT /api/groups/reorder/all` - Reorder groups

### Channels
- `GET /api/channels` - List all channels
- `GET /api/channels?groupId=xxx` - List channels by group
- `PUT /api/channels/:id` - Update channel
- `PUT /api/channels/reorder/group` - Reorder channels
- `DELETE /api/channels/:id` - Delete channel

### Export
- `POST /api/export` - Generate M3U file
- `GET /api/export/preview` - Preview M3U content
- `GET /output/playlist.m3u` - Download generated file

### EPG
- `GET /api/epg/sources` - List EPG sources
- `POST /api/epg/sources` - Add EPG source
- `PUT /api/epg/sources/:id` - Update EPG source
- `DELETE /api/epg/sources/:id` - Delete EPG source
- `GET /api/epg/config` - Get EPG configuration
- `PUT /api/epg/config` - Update EPG configuration
- `POST /api/epg/grab/:sourceId` - Trigger EPG grab for source
- `POST /api/epg/grab-all` - Trigger EPG grab for all sources
- `GET /api/epg/logs` - Get grab logs
- `GET /api/epg/xml` - Get EPG data (XMLTV format)
- `GET /api/epg/status` - Get EPG system status

## Usage

1. **Import**: Upload your M3U playlist or provide a URL
2. **Manage**: Organize channels into groups, rename them, reorder
3. **EPG** (optional): Configure EPG sources and grab program data
4. **Export**: Generate your customized M3U file
5. **Access**: Use the HTTP URL in your IPTV player

## Future Features

- Complete EPG integration with external grabber
- Series and Movies management
- Search and filtering
- Automatic scheduled EPG updates

## License

MIT
