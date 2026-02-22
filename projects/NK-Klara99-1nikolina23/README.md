# Trip Planner

**Project name:** Trip Planner
**Team name:** NK

## Team information
**Klara Lana Vidak** - GitHub: [@Klara99]
**Nikolina Plazibat** - GitHub: [@1nikolina23]


## Overview

Trip Planner is an AI-powered travel planning application that helps users create personalized trip itineraries through an interactive chat interface. It provides real-time data about destinations, including nearby places, flight estimates, and travel videos, helping you plan your perfect trip.

This project consists of a React frontend for user interaction and a Node.js backend that enriches trip planning with data from external APIs.

## Features

- **AI Chat Interface**: Conversational trip planning with intelligent recommendations
- **Trip Management**: Create, organize, and manage multiple trips
- **Real-time Data**: Flight estimates, nearby places, and travel videos
- **User Authentication**: Secure login and registration via Supabase
- **Multi-trip Support**: Sidebar navigation between different trip plans
- **Responsive Design**: Modern UI with gradient styling and animations

## Technologies Used

- **Frontend**: React 19, Vite 7, React Router v7
- **Backend**: Node.js, Express.js
- **Database & Auth**: Supabase
- **External APIs**: 
  - Geoapify (places and locations)
- **Build Tools**: Vite, ESLint, Babel

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18+
- **npm**: Version 9+
- **Git**: For cloning the repository

You will also need API keys for:
- **Supabase**: Project URL and anon key
- **Geoapify**: Free tier available (3000 requests/day)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd app1
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
GEOAPIFY_API_KEY=your_geoapify_key
YOUTUBE_API_KEY=your_youtube_key
PORT=3001
```

Start the server:
```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

The API server runs on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd app
npm install
```

Create `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the development server:
```bash
npm run dev
```

The frontend runs on `http://localhost:5173`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api/places` | Nearby places (restaurants, attractions, etc.) |
| `GET /api/flights` | Flight estimates between cities |
| `GET /api/enrich` | Combined data from all sources |

### Example Request

```bash
curl "http://localhost:3001/api/enrich?destination=Madrid&origin=Split&startDate=2025-05-15&endDate=2025-05-21&people=2"
```

## Project Structure

```
.
├── app/                     # React frontend application
│   ├── src/
│   │   ├── pages/           # Page components (Login, Register, AppHome, Chat)
│   │   ├── libs/            # Utility functions and Supabase client
│   │   ├── assets/          # Static images and files
│   │   ├── App.jsx          # Main router component
│   │   └── main.jsx         # Application entry point
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
│
├── server/                  # Express.js backend
│   ├── index.js             # API server entry point
│   ├── .env.example         # Environment variables template
│   └── package.json         # Backend dependencies
│
└── app.sln                  # Solution file
```

## Available Scripts

### Frontend (app/)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Backend (server/)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start production server |

