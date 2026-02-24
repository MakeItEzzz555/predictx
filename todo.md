# PredictX - Prediction Market Platform TODO

## Phase 2: Theme & Layout
- [x] Set up cyberpunk theme (deep black, neon pink, electric cyan) in index.css
- [x] Add Google Fonts (Rajdhani, Orbitron) in index.html
- [x] Create global TopNav component with logo, nav links, auth state
- [x] Set up App.tsx routes for all pages

## Phase 3: Database & Backend
- [x] Design and push schema: markets, market_prices, orders, positions, wallet_transactions, users extension
- [x] Backend: markets router (list, getById, categories, trending)
- [x] Backend: orders router (create, getUserOrders)
- [x] Backend: positions router (getUserPositions)
- [x] Backend: wallet router (getBalance, deposit, withdraw, transactions)
- [x] Backend: leaderboard router (getTopTraders)
- [x] Backend: admin router (createMarket)
- [x] Seed demo data (17 markets, price history)

## Phase 4: Home & Markets Pages
- [x] Home page: hero section, featured markets, stats, CTA
- [x] Markets page: category filter tabs, trending/popular/new filters, market cards grid
- [x] Market card component: question, YES/NO prices, volume, close date, mini sparkline chart

## Phase 5: Market Detail & Trading
- [x] Market detail page: header, price probability chart (Recharts)
- [x] Order book component: bid/ask levels
- [x] Trading panel: Buy YES / Buy NO, quantity input, estimated cost, potential payout
- [x] Market info sidebar: volume, open interest, resolution criteria, close date

## Phase 6: Portfolio, Wallet & Leaderboard
- [x] Portfolio dashboard: open positions table, P&L summary, trade history
- [x] Wallet page: balance display, deposit form, withdrawal form, transaction history
- [x] Leaderboard page: top traders ranked by profit with rank badges

## Phase 7: Stripe Integration
- [x] Add Stripe feature via webdev_add_feature
- [x] Stripe checkout for deposits
- [x] Stripe webhook for confirming deposits
- [x] Demo deposit (instant) fallback

## Phase 8: Real-time & Notifications
- [x] WebSocket server (Socket.IO) for real-time price updates
- [x] Frontend WebSocket hook for live market prices
- [x] Trade notifications broadcast to all clients
- [x] Owner notification on high-value trades (>$500)

## Phase 9: Polish & Tests
- [x] Write 17 vitest tests for markets, orders, wallet, leaderboard, auth routers
- [x] All 17 tests passing
- [x] Polish cyberpunk UI: neon glows, HUD brackets, corner accents
- [x] Responsive design (mobile hamburger menu)
- [x] Final demo data seed (17 markets with 60-day price history)
- [x] Save checkpoint


## User Enhancements (Post-Launch)
- [x] Replace market card sparkline with detailed 60-day probability AreaChart (same as MarketDetail)


## Latest Fixes & Enhancements
- [x] Fix responsive design sitewide (TopNav text overflow on mobile)
- [x] Add trending market slider component with auto-rotate every 10 seconds
- [x] Slider shows live graph updates for each trade
- [x] Display market count "X Markets Found" above slider
