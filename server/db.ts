import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertMarket,
  InsertOrder,
  InsertUser,
  Market,
  marketPrices,
  markets,
  orders,
  positions,
  users,
  walletTransactions,
  wallets,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Markets ──────────────────────────────────────────────────────────────────

export async function listMarkets(opts: {
  category?: string;
  filter?: "trending" | "popular" | "new" | "all";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(markets).$dynamic();
  if (opts.category && opts.category !== "all") {
    query = query.where(eq(markets.category, opts.category as Market["category"]));
  }
  if (opts.filter === "trending") {
    query = query.where(eq(markets.isTrending, true));
  } else if (opts.filter === "new") {
    query = query.orderBy(desc(markets.createdAt));
  } else if (opts.filter === "popular") {
    query = query.orderBy(desc(markets.volume));
  } else {
    query = query.orderBy(desc(markets.isFeatured), desc(markets.volume));
  }
  return query.limit(opts.limit ?? 50).offset(opts.offset ?? 0);
}

export async function getMarketBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(markets).where(eq(markets.slug, slug)).limit(1);
  return result[0];
}

export async function getMarketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  return result[0];
}

export async function getMarketPriceHistory(marketId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(marketPrices)
    .where(eq(marketPrices.marketId, marketId))
    .orderBy(desc(marketPrices.recordedAt))
    .limit(limit);
}

export async function getFeaturedMarkets(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(markets)
    .where(and(eq(markets.isFeatured, true), eq(markets.status, "open")))
    .orderBy(desc(markets.volume))
    .limit(limit);
}

export async function createMarket(data: InsertMarket) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(markets).values(data);
  return db.select().from(markets).where(eq(markets.slug, data.slug)).limit(1).then((r) => r[0]);
}

export async function updateMarketPrices(
  marketId: number,
  yesPrice: string,
  noPrice: string,
  volumeDelta: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(markets)
    .set({
      yesPrice,
      noPrice,
      volume: sql`volume + ${volumeDelta}`,
      updatedAt: new Date(),
    })
    .where(eq(markets.id, marketId));
  await db.insert(marketPrices).values({ marketId, yesPrice, noPrice, volume: volumeDelta });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(orders).values(data);
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, data.userId), eq(orders.marketId, data.marketId)))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  return result[0];
}

export async function getUserOrders(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      order: orders,
      market: {
        id: markets.id,
        title: markets.title,
        slug: markets.slug,
        status: markets.status,
        yesPrice: markets.yesPrice,
        noPrice: markets.noPrice,
      },
    })
    .from(orders)
    .innerJoin(markets, eq(orders.marketId, markets.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

// ─── Positions ────────────────────────────────────────────────────────────────

export async function getUserPositions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      position: positions,
      market: {
        id: markets.id,
        title: markets.title,
        slug: markets.slug,
        status: markets.status,
        yesPrice: markets.yesPrice,
        noPrice: markets.noPrice,
        closesAt: markets.closesAt,
        outcome: markets.outcome,
      },
    })
    .from(positions)
    .innerJoin(markets, eq(positions.marketId, markets.id))
    .where(and(eq(positions.userId, userId), sql`${positions.quantity} > 0`))
    .orderBy(desc(positions.updatedAt));
}

export async function upsertPosition(
  userId: number,
  marketId: number,
  side: "yes" | "no",
  quantityDelta: number,
  costDelta: string
) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.userId, userId),
        eq(positions.marketId, marketId),
        eq(positions.side, side)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    const avgCost = (parseFloat(costDelta) / quantityDelta).toFixed(2);
    await db.insert(positions).values({
      userId,
      marketId,
      side,
      quantity: quantityDelta,
      avgCost,
      totalInvested: costDelta,
    });
  } else {
    const pos = existing[0];
    const newQty = pos.quantity + quantityDelta;
    const newTotal = (parseFloat(pos.totalInvested) + parseFloat(costDelta)).toFixed(2);
    const newAvg = newQty > 0 ? (parseFloat(newTotal) / newQty).toFixed(2) : "0.00";
    await db
      .update(positions)
      .set({ quantity: newQty, totalInvested: newTotal, avgCost: newAvg, updatedAt: new Date() })
      .where(eq(positions.id, pos.id));
  }
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export async function getOrCreateWallet(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(wallets).values({ userId });
  const created = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  return created[0];
}

export async function updateWalletBalance(
  userId: number,
  delta: number,
  type: "deposit" | "withdrawal" | "trade_buy" | "trade_sell" | "payout" | "bonus",
  description: string,
  orderId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const wallet = await getOrCreateWallet(userId);
  const balanceBefore = parseFloat(wallet.balance);
  const balanceAfter = (balanceBefore + delta).toFixed(2);

  await db
    .update(wallets)
    .set({ balance: balanceAfter, updatedAt: new Date() })
    .where(eq(wallets.userId, userId));

  await db.insert(walletTransactions).values({
    userId,
    type,
    amount: delta.toFixed(2),
    balanceBefore: balanceBefore.toFixed(2),
    balanceAfter,
    description,
    orderId,
  });

  return parseFloat(balanceAfter);
}

export async function getWalletTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      userId: wallets.userId,
      name: users.name,
      totalPnl: wallets.totalPnl,
      balance: wallets.balance,
    })
    .from(wallets)
    .innerJoin(users, eq(wallets.userId, users.id))
    .orderBy(desc(wallets.totalPnl))
    .limit(limit);
}

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { totalMarkets: 0, totalVolume: "0", totalTraders: 0 };
  const [mStats] = await db
    .select({
      totalMarkets: sql<number>`count(*)`,
      totalVolume: sql<string>`sum(volume)`,
    })
    .from(markets)
    .where(eq(markets.status, "open"));
  const [uStats] = await db.select({ totalTraders: sql<number>`count(*)` }).from(wallets);
  return {
    totalMarkets: mStats?.totalMarkets ?? 0,
    totalVolume: mStats?.totalVolume ?? "0",
    totalTraders: uStats?.totalTraders ?? 0,
  };
}
