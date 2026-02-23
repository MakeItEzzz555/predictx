import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createMarket,
  createOrder,
  getFeaturedMarkets,
  getLeaderboard,
  getMarketById,
  getMarketBySlug,
  getMarketPriceHistory,
  getOrCreateWallet,
  getPlatformStats,
  getUserOrders,
  getUserPositions,
  getWalletTransactions,
  listMarkets,
  updateMarketPrices,
  updateWalletBalance,
  upsertPosition,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { createDepositCheckoutSession } from "./stripe";
import { broadcastMarketUpdate, broadcastTradeNotification } from "./websocket";
import { markets, wallets } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

// ─── Markets Router ───────────────────────────────────────────────────────────

const marketsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        filter: z.enum(["trending", "popular", "new", "all"]).optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      })
    )
    .query(({ input }) =>
      listMarkets({
        category: input.category,
        filter: input.filter,
        limit: input.limit,
        offset: input.offset,
      })
    ),

  featured: publicProcedure.query(() => getFeaturedMarkets(6)),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const market = await getMarketBySlug(input.slug);
      if (!market) throw new TRPCError({ code: "NOT_FOUND", message: "Market not found" });
      return market;
    }),

  priceHistory: publicProcedure
    .input(z.object({ marketId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getMarketPriceHistory(input.marketId, input.limit)),

  stats: publicProcedure.query(() => getPlatformStats()),

  create: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        title: z.string(),
        description: z.string().optional(),
        resolutionCriteria: z.string().optional(),
        category: z.enum(["politics", "sports", "crypto", "economics", "climate", "tech", "entertainment", "health"]),
        closesAt: z.number(),
        isFeatured: z.boolean().optional(),
        isTrending: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return createMarket({
        ...input,
        closesAt: new Date(input.closesAt),
        isFeatured: input.isFeatured ?? false,
        isTrending: input.isTrending ?? false,
      });
    }),
});

// ─── Trading Router ───────────────────────────────────────────────────────────

const tradingRouter = router({
  buy: protectedProcedure
    .input(
      z.object({
        marketId: z.number(),
        side: z.enum(["yes", "no"]),
        quantity: z.number().int().min(1).max(10000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const market = await getMarketById(input.marketId);
      if (!market) throw new TRPCError({ code: "NOT_FOUND", message: "Market not found" });
      if (market.status !== "open") throw new TRPCError({ code: "BAD_REQUEST", message: "Market is not open" });

      const pricePerContract = parseFloat(
        input.side === "yes" ? market.yesPrice : market.noPrice
      );
      const totalCost = (pricePerContract * input.quantity) / 100;

      const wallet = await getOrCreateWallet(ctx.user.id);
      if (parseFloat(wallet.balance) < totalCost) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }

      const order = await createOrder({
        userId: ctx.user.id,
        marketId: input.marketId,
        side: input.side,
        type: "buy",
        quantity: input.quantity,
        pricePerContract: pricePerContract.toFixed(2),
        totalCost: totalCost.toFixed(2),
        status: "filled",
      });

      await updateWalletBalance(
        ctx.user.id,
        -totalCost,
        "trade_buy",
        `Bought ${input.quantity} ${input.side.toUpperCase()} contracts on "${market.title}"`,
        order?.id
      );

      await upsertPosition(
        ctx.user.id,
        input.marketId,
        input.side,
        input.quantity,
        totalCost.toFixed(2)
      );

      // Recalculate market price based on simple AMM model
      const newYesPrice = input.side === "yes"
        ? Math.min(99, Math.round(pricePerContract + input.quantity * 0.01))
        : Math.max(1, Math.round(pricePerContract - input.quantity * 0.01));
      const newNoPrice = 100 - newYesPrice;

      await updateMarketPrices(
        input.marketId,
        input.side === "yes" ? newYesPrice.toString() : market.yesPrice,
        input.side === "no" ? newNoPrice.toString() : market.noPrice,
        totalCost.toFixed(2)
      );

      // Broadcast real-time update
      broadcastMarketUpdate(input.marketId, {
        yesPrice: input.side === "yes" ? newYesPrice.toString() : market.yesPrice,
        noPrice: input.side === "no" ? newNoPrice.toString() : market.noPrice,
        volume: (parseFloat(market.volume) + totalCost).toFixed(2),
        timestamp: Date.now(),
      });

      // Broadcast trade notification to all clients
      broadcastTradeNotification({
        marketId: input.marketId,
        marketTitle: market.title,
        side: input.side,
        quantity: input.quantity,
        totalCost,
        traderName: ctx.user.name ?? "Anonymous",
      });

      // Notify owner for high-value trades
      if (totalCost >= 500) {
        await notifyOwner({
          title: `High-Value Trade Alert: $${totalCost.toFixed(2)}`,
          content: `User ${ctx.user.name ?? ctx.user.openId} bought ${input.quantity} ${input.side.toUpperCase()} contracts on "${market.title}" for $${totalCost.toFixed(2)}`,
        });
      }

      return { success: true, order, totalCost, newYesPrice, newNoPrice };
    }),

  sell: protectedProcedure
    .input(
      z.object({
        marketId: z.number(),
        side: z.enum(["yes", "no"]),
        quantity: z.number().int().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const market = await getMarketById(input.marketId);
      if (!market) throw new TRPCError({ code: "NOT_FOUND", message: "Market not found" });
      if (market.status !== "open") throw new TRPCError({ code: "BAD_REQUEST", message: "Market is not open" });

      const currentPrice = parseFloat(input.side === "yes" ? market.yesPrice : market.noPrice);
      const saleValue = (currentPrice * input.quantity) / 100;

      const order = await createOrder({
        userId: ctx.user.id,
        marketId: input.marketId,
        side: input.side,
        type: "sell",
        quantity: input.quantity,
        pricePerContract: currentPrice.toFixed(2),
        totalCost: saleValue.toFixed(2),
        status: "filled",
      });

      await updateWalletBalance(
        ctx.user.id,
        saleValue,
        "trade_sell",
        `Sold ${input.quantity} ${input.side.toUpperCase()} contracts on "${market.title}"`,
        order?.id
      );

      await upsertPosition(ctx.user.id, input.marketId, input.side, -input.quantity, (-saleValue).toFixed(2));

      // Update PnL in wallet
      const db = await getDb();
      if (db) {
        await db.update(wallets)
          .set({ totalPnl: sql`totalPnl + ${saleValue}` })
          .where(eq(wallets.userId, ctx.user.id));
      }

      return { success: true, order, saleValue };
    }),

  myOrders: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ ctx, input }) => getUserOrders(ctx.user.id, input.limit)),

  myPositions: protectedProcedure.query(({ ctx }) => getUserPositions(ctx.user.id)),
});

// ─── Wallet Router ────────────────────────────────────────────────────────────

const walletRouter = router({
  get: protectedProcedure.query(({ ctx }) => getOrCreateWallet(ctx.user.id)),

  transactions: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ ctx, input }) => getWalletTransactions(ctx.user.id, input.limit)),

  deposit: protectedProcedure
    .input(z.object({ amount: z.number().min(10).max(100000) }))
    .mutation(async ({ ctx, input }) => {
      // Demo deposit (Stripe handled separately)
      const newBalance = await updateWalletBalance(
        ctx.user.id,
        input.amount,
        "deposit",
        `Demo deposit of $${input.amount.toFixed(2)}`
      );
      const db = await getDb();
      if (db) {
        await db.update(wallets)
          .set({ totalDeposited: sql`totalDeposited + ${input.amount}` })
          .where(eq(wallets.userId, ctx.user.id));
      }
      return { success: true, newBalance };
    }),

  withdraw: protectedProcedure
    .input(z.object({ amount: z.number().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const wallet = await getOrCreateWallet(ctx.user.id);
      if (parseFloat(wallet.balance) < input.amount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }
      const newBalance = await updateWalletBalance(
        ctx.user.id,
        -input.amount,
        "withdrawal",
        `Withdrawal of $${input.amount.toFixed(2)}`
      );
      const db = await getDb();
      if (db) {
        await db.update(wallets)
          .set({ totalWithdrawn: sql`totalWithdrawn + ${input.amount}` })
          .where(eq(wallets.userId, ctx.user.id));
      }
      return { success: true, newBalance };
    }),

  stripeDeposit: protectedProcedure
    .input(z.object({ amount: z.number().min(1).max(100000), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await createDepositCheckoutSession({
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name,
        amount: input.amount,
        origin: input.origin,
      });
      return { checkoutUrl: session.url };
    }),
});

// ─── Leaderboard Router ───────────────────────────────────────────────────────

const leaderboardRouter = router({
  top: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(({ input }) => getLeaderboard(input.limit ?? 50)),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  markets: marketsRouter,
  trading: tradingRouter,
  wallet: walletRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
