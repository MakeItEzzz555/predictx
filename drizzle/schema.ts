import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Markets ──────────────────────────────────────────────────────────────────

export const markets = mysqlTable("markets", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  resolutionCriteria: text("resolutionCriteria"),
  category: mysqlEnum("category", [
    "politics",
    "sports",
    "crypto",
    "economics",
    "climate",
    "tech",
    "entertainment",
    "health",
  ])
    .default("politics")
    .notNull(),
  status: mysqlEnum("status", ["open", "closed", "resolved"]).default("open").notNull(),
  outcome: mysqlEnum("outcome", ["yes", "no"]),
  yesPrice: decimal("yesPrice", { precision: 5, scale: 2 }).notNull().default("50.00"),
  noPrice: decimal("noPrice", { precision: 5, scale: 2 }).notNull().default("50.00"),
  volume: decimal("volume", { precision: 15, scale: 2 }).notNull().default("0.00"),
  openInterest: decimal("openInterest", { precision: 15, scale: 2 }).notNull().default("0.00"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isTrending: boolean("isTrending").default(false).notNull(),
  closesAt: timestamp("closesAt").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

// ─── Market Price History ─────────────────────────────────────────────────────

export const marketPrices = mysqlTable("market_prices", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId")
    .notNull()
    .references(() => markets.id),
  yesPrice: decimal("yesPrice", { precision: 5, scale: 2 }).notNull(),
  noPrice: decimal("noPrice", { precision: 5, scale: 2 }).notNull(),
  volume: decimal("volume", { precision: 15, scale: 2 }).notNull().default("0.00"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type MarketPrice = typeof marketPrices.$inferSelect;

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  marketId: int("marketId")
    .notNull()
    .references(() => markets.id),
  side: mysqlEnum("side", ["yes", "no"]).notNull(),
  type: mysqlEnum("type", ["buy", "sell"]).notNull(),
  quantity: int("quantity").notNull(),
  pricePerContract: decimal("pricePerContract", { precision: 5, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "filled", "cancelled"]).default("filled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Positions ────────────────────────────────────────────────────────────────

export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  marketId: int("marketId")
    .notNull()
    .references(() => markets.id),
  side: mysqlEnum("side", ["yes", "no"]).notNull(),
  quantity: int("quantity").notNull().default(0),
  avgCost: decimal("avgCost", { precision: 5, scale: 2 }).notNull().default("0.00"),
  totalInvested: decimal("totalInvested", { precision: 15, scale: 2 }).notNull().default("0.00"),
  realizedPnl: decimal("realizedPnl", { precision: 15, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id)
    .unique(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("1000.00"),
  totalDeposited: decimal("totalDeposited", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalPnl: decimal("totalPnl", { precision: 15, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;

export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  type: mysqlEnum("type", [
    "deposit",
    "withdrawal",
    "trade_buy",
    "trade_sell",
    "payout",
    "bonus",
  ]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  balanceBefore: decimal("balanceBefore", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  orderId: int("orderId").references(() => orders.id),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("completed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;
