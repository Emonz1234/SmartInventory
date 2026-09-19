# IPCSIM Frontend

Modern React TypeScript frontend for IPCSIM (Smart Inventory Controller).

## Features

- **Dashboard**: System status, inventory summary, cabinet overview, environment monitoring
- **Inventory Management**: Search, view stock levels, pick/put operations
- **Cabinet Control**: Open/close/ventilate racks, maintenance controls
- **Environment Monitoring**: Real-time temperature, humidity, weight tracking
- **Operation Logs**: Track all inventory transactions and operations
- **System Settings**: Configure database, serial ports, network settings (maintenance only)
- **Role-Based Access**: Operator, Supervisor, Maintenance roles with different permissions

## Tech Stack

- React 18 + TypeScript
- Material UI v5 (MUI) for components
- Zustand for state management
- TanStack Query for data fetching
- Recharts for data visualization
- Vite for bundling
- Axios for HTTP requests

## Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- IPCSIM backend running on `http://localhost:8000`

### Installation

```bash
cd IPCSIM/frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

Output in `dist/` directory.

## Project Structure

```
src/
  api/              # API client functions
  components/       # Reusable React components
    Layout/        # Header, Sidebar, Layout
  pages/            # Page components for each module
  store/            # Zustand stores (auth, system)
  types/            # TypeScript interfaces and types
  hooks/            # Custom React hooks
  App.tsx          # Main App component
  main.tsx         # Entry point
```

## API Integration

Backend API endpoints:

- `GET /api/items` - List items
- `POST /api/items` - Create item
- `GET /api/inventory` - Get inventory status
- `POST /api/transactions/pick` - Pick item
- `POST /api/transactions/put` - Put item
- `GET /open/{rack}` - Open rack
- `GET /close/{rack}` - Close rack
- `GET /ventilate/{rack}` - Ventilate rack
- `WS /ws/telemetry` - Real-time environment data

## WebSocket Events

- `/ws/telemetry` - Environment data updates
- `/ws/runtime` - Operation status updates
- `/ws/events` - System event notifications

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)
- `VITE_WS_URL` - WebSocket URL (default: ws://localhost:8000)

## License

Proprietary - iPAC Lab
