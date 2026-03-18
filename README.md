# PredictX

A full-featured prediction market platform where users trade on the outcomes of real-world events using Yes/No contracts, similar to Kalshi. Features real-time price updates, portfolio management, and Stripe-powered deposits.

## Features

- **Market Trading** — Buy and sell Yes/No contracts on politics, sports, crypto, tech, and more
- **Real-time Updates** — WebSocket-powered live order books and price feeds
- **Portfolio Dashboard** — Track holdings, P&L, and transaction history
- **Wallet System** — Stripe-integrated deposits and balance management
- **Leaderboard** — Compete with other traders on performance
- **AI Chat Assistant** — Built-in AI-powered chat box for market insights
- **Market Categories** — Politics, Sports, Crypto, Economics, Climate, Tech, Entertainment, Health

## Tech Stack

### Frontend
- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS v4**
- **tRPC** + **TanStack React Query** for type-safe API calls
- **Framer Motion** for animations
- **Wouter** for routing
- **Recharts** for data visualization

### Backend
- **Express** (HTTP server)
- **tRPC** (type-safe API layer)
- **Drizzle ORM** + **MySQL** (database)
- **Socket.IO** (real-time WebSocket updates)
- **Stripe** (payment processing)
- **Jose** (JWT authentication)
- **AWS S3** (file storage)

## Setup

```bash
pnpm install       # Install dependencies
pnpm db:push       # Set up database
pnpm dev           # Start dev server
pnpm build         # Production build
pnpm start         # Start production server
pnpm test          # Run tests
pnpm check         # Type check
```

## Environment Variables

Requires configuration for MySQL, Stripe, AWS S3, and JWT secrets. See the server configuration files for required variables.

## License

MIT
