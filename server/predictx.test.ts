import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getMarkets: vi.fn().mockResolvedValue([
    {
      id: 1,
      slug: "test-market",
      title: "Will X happen?",
      category: "politics",
      yesPrice: "55.00",
      noPrice: "45.00",
      volume: "10000.00",
      openInterest: "2500.00",
      closesAt: new Date("2027-01-01"),
      isTrending: true,
      status: "open",
      description: "Test market",
      resolutionCriteria: "Resolves YES if X happens.",
      outcome: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getMarketBySlug: vi.fn().mockResolvedValue({
    id: 1,
    slug: "test-market",
    title: "Will X happen?",
    category: "politics",
    yesPrice: "55.00",
    noPrice: "45.00",
    volume: "10000.00",
    openInterest: "2500.00",
    closesAt: new Date("2027-01-01"),
    isTrending: true,
    status: "open",
    description: "Test market",
    resolutionCriteria: "Resolves YES if X happens.",
    outcome: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getMarketById: vi.fn().mockResolvedValue({
    id: 1,
    slug: "test-market",
    title: "Will X happen?",
    category: "politics",
    yesPrice: "55.00",
    noPrice: "45.00",
    volume: "10000.00",
    openInterest: "2500.00",
    closesAt: new Date("2027-01-01"),
    isTrending: false,
    status: "open",
    description: null,
    resolutionCriteria: null,
    outcome: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getPriceHistory: vi.fn().mockResolvedValue([]),
  getFeaturedMarkets: vi.fn().mockResolvedValue([]),
  getMarketStats: vi.fn().mockResolvedValue({ totalMarkets: 17, totalVolume: "5000000", totalTraders: 42 }),
  getOrCreateWallet: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    balance: "1000.00",
    totalDeposited: "1000.00",
    totalWithdrawn: "0.00",
    totalPnl: "0.00",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateWalletBalance: vi.fn().mockResolvedValue(1100),
  getUserPositions: vi.fn().mockResolvedValue([]),
  getUserOrders: vi.fn().mockResolvedValue([]),
  getWalletTransactions: vi.fn().mockResolvedValue([]),
  getLeaderboard: vi.fn().mockResolvedValue([
    { userId: 1, name: "Alice", balance: "1500.00", totalPnl: "500.00" },
    { userId: 2, name: "Bob", balance: "1200.00", totalPnl: "200.00" },
  ]),
  createOrder: vi.fn().mockResolvedValue({ id: 1 }),
  updateMarketPrices: vi.fn().mockResolvedValue(undefined),
  upsertPosition: vi.fn().mockResolvedValue(undefined),
  recordPriceHistory: vi.fn().mockResolvedValue(undefined),
  getPosition: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  listMarkets: vi.fn().mockResolvedValue([
    {
      id: 1,
      slug: "test-market",
      title: "Will X happen?",
      category: "politics",
      yesPrice: "55.00",
      noPrice: "45.00",
      volume: "10000.00",
      openInterest: "2500.00",
      closesAt: new Date("2027-01-01"),
      isTrending: true,
      status: "open",
      description: "Test market",
      resolutionCriteria: "Resolves YES if X happens.",
      outcome: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getMarketPriceHistory: vi.fn().mockResolvedValue([]),
  createMarket: vi.fn().mockResolvedValue({ id: 2 }),
  getPlatformStats: vi.fn().mockResolvedValue({ totalMarkets: 17, totalVolume: "5000000", totalTraders: 42 }),
}));

vi.mock("./websocket", () => ({
  broadcastMarketUpdate: vi.fn(),
  broadcastTradeNotification: vi.fn(),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./stripe", () => ({
  createDepositCheckoutSession: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
}));

// ─── Test context helpers ─────────────────────────────────────────────────────
function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAuthCtx(overrides?: Partial<TrpcContext["user"]>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Markets ─────────────────────────────────────────────────────────────────
describe("markets.list", () => {
  it("returns markets for public users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.markets.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("filters by category", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.markets.list({ category: "politics", limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("markets.bySlug", () => {
  it("returns market data for valid slug", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.markets.bySlug({ slug: "test-market" });
    expect(result).toBeDefined();
    expect(result?.slug).toBe("test-market");
  });

  it("throws NOT_FOUND for unknown slug", async () => {
    const { getMarketBySlug } = await import("./db");
    vi.mocked(getMarketBySlug).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.markets.bySlug({ slug: "nonexistent" })).rejects.toThrow("Market not found");
  });
});

describe("markets.stats", () => {
  it("returns platform statistics", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.markets.stats();
    expect(result).toHaveProperty("totalMarkets");
    expect(result).toHaveProperty("totalVolume");
    expect(result).toHaveProperty("totalTraders");
  });
});

// ─── Wallet ───────────────────────────────────────────────────────────────────
describe("wallet.get", () => {
  it("returns wallet for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.wallet.get();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("balance");
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.wallet.get()).rejects.toThrow();
  });
});

describe("wallet.deposit", () => {
  it("adds funds to wallet balance", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.wallet.deposit({ amount: 100 });
    expect(result).toHaveProperty("newBalance");
    expect(result.success).toBe(true);
  });

  it("rejects deposits below minimum", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(caller.wallet.deposit({ amount: 5 })).rejects.toThrow();
  });
});

describe("wallet.stripeDeposit", () => {
  it("creates a Stripe checkout session", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.wallet.stripeDeposit({
      amount: 50,
      origin: "https://example.com",
    });
    expect(result).toHaveProperty("checkoutUrl");
    expect(result.checkoutUrl).toContain("stripe.com");
  });
});

// ─── Trading ──────────────────────────────────────────────────────────────────
describe("trading.buy", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.trading.buy({ marketId: 1, side: "yes", quantity: 10 })
    ).rejects.toThrow();
  });

  it("executes buy order for authenticated user with sufficient balance", async () => {
    const { getMarketById, getOrCreateWallet, createOrder } = await import("./db");
    vi.mocked(getOrCreateWallet).mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: "5000.00",
      totalDeposited: "5000.00",
      totalWithdrawn: "0.00",
      totalPnl: "0.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(createOrder).mockResolvedValueOnce({ id: 42 });

    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.trading.buy({ marketId: 1, side: "yes", quantity: 10 });
    expect(result.success).toBe(true);
    expect(result.totalCost).toBeGreaterThan(0);
  });

  it("rejects buy when insufficient balance", async () => {
    const { getOrCreateWallet } = await import("./db");
    vi.mocked(getOrCreateWallet).mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: "0.50",
      totalDeposited: "1.00",
      totalWithdrawn: "0.50",
      totalPnl: "0.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(
      caller.trading.buy({ marketId: 1, side: "yes", quantity: 100 })
    ).rejects.toThrow("Insufficient balance");
  });
});

// ─── Leaderboard ─────────────────────────────────────────────────────────────
describe("leaderboard.top", () => {
  it("returns ranked traders", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.leaderboard.top({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("totalPnl");
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
  });
});
