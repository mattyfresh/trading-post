# Trading Post - MTG Card Marketplace

A web application for Magic: The Gathering players in Stockholm to list cards for sale/trade in digital binders, search for cards across all sellers, and communicate via messaging to arrange meetups.

![Trading Post](https://via.placeholder.com/800x400?text=Trading+Post+MTG+Marketplace)

## Features

- 🃏 **Digital Trade Binders** - Create binders with a 3x3 grid layout resembling real card binders
- 🔍 **Card Search** - Search for cards using Scryfall API with auto-complete
- 💰 **Price Reference** - See EUR prices from Scryfall, set your own asking prices
- 💬 **Messaging** - Contact sellers directly to arrange trades/meetups
- 👤 **User Profiles** - View seller profiles and their public binders
- ✅ **Availability Toggle** - Mark cards as sold/unavailable

## Tech Stack

### Frontend

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Query (data fetching)
- Zustand (state management)
- React Router (routing)
- Lucide React (icons)

### Backend

- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite (local development) / PostgreSQL (production)
- JWT Authentication
- Zod (validation)

### External APIs

- [Scryfall API](https://scryfall.com/docs/api) - Card data and images

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (will be installed automatically if missing)

### Quick Start

The easiest way to get started is to run the setup script:

```bash
./scripts/start-trading-post.sh
```

This script will:
1. Check for Node.js 18+
2. Install pnpm if not present
3. Install all dependencies
4. Create the environment configuration
5. Set up the SQLite database with migrations
6. Optionally start the development servers

### Manual Installation

If you prefer to set things up manually:

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/trading-post.git
   cd trading-post
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   ```bash
   cp backend/.env.example backend/.env
   ```

4. **Generate Prisma client and run migrations**

   ```bash
   pnpm db:generate
   cd backend && npx prisma migrate dev --name init && cd ..
   ```

5. **Start the development servers**

   ```bash
   pnpm dev
   ```

   This will start:

   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

> **Note:** The project uses SQLite for local development. No external database setup is required.

## Project Structure

```
trading-post/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── binder/      # Binder-related components
│   │   │   ├── cards/       # Card display components
│   │   │   ├── chat/        # Messaging components
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript types
│   └── ...
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   └── services/        # Business logic
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── ...
└── docs/                     # Documentation
    └── ARCHITECTURE.md      # Architecture details
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Binders

- `GET /api/binders` - Get user's binders
- `POST /api/binders` - Create binder
- `GET /api/binders/:id` - Get binder with cards
- `POST /api/binders/:id/cards` - Add card to binder
- `PATCH /api/binders/:id/cards/:cardId/availability` - Toggle availability

### Search

- `GET /api/search/cards` - Search all available cards
- `GET /api/search/sellers` - Search sellers
- `GET /api/search/featured` - Get featured listings

### Cards

- `GET /api/cards/search` - Search Scryfall
- `GET /api/cards/autocomplete` - Autocomplete card names

### Conversations

- `GET /api/conversations` - Get user's conversations
- `POST /api/conversations` - Start conversation
- `POST /api/conversations/:id/messages` - Send message

## Development

### Running Tests

```bash
pnpm test
```

### Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio

# Seed database with sample data
pnpm db:seed
```

### Building for Production

```bash
pnpm build
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Deploy

### Backend (Railway)

1. Create a new Railway project
2. Add PostgreSQL database
3. Deploy from GitHub
4. Set environment variables

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Scryfall](https://scryfall.com) for the amazing MTG card API
- [Wizards of the Coast](https://magic.wizards.com) for Magic: The Gathering
- The Stockholm MTG community

---

**Note**: This app is for the Stockholm MTG community. Card data and images are provided by Scryfall and are property of Wizards of the Coast.
