import Stripe from "stripe";
import express from "express";
import { getDb, getOrCreateWallet, updateWalletBalance } from "./db";
import { wallets } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });

export function registerStripeRoutes(app: express.Express) {
  // Webhook endpoint — must use raw body parser BEFORE json
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Stripe Webhook] Signature verification failed:", message);
        return res.status(400).send(`Webhook Error: ${message}`);
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = parseInt(session.metadata?.user_id ?? "0");
          const amount = (session.amount_total ?? 0) / 100;

          if (userId && amount > 0) {
            const newBalance = await updateWalletBalance(
              userId,
              amount,
              "deposit",
              `Stripe deposit of $${amount.toFixed(2)} (Session: ${session.id})`
            );

            const db = await getDb();
            if (db) {
              await db
                .update(wallets)
                .set({ totalDeposited: sql`totalDeposited + ${amount}` })
                .where(eq(wallets.userId, userId));
            }

            console.log(`[Stripe] Credited $${amount} to user ${userId}. New balance: $${newBalance}`);
          }
        }
      } catch (err) {
        console.error("[Stripe Webhook] Processing error:", err);
      }

      res.json({ received: true });
    }
  );
}

export async function createDepositCheckoutSession(opts: {
  userId: number;
  userEmail: string | null | undefined;
  userName: string | null | undefined;
  amount: number;
  origin: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: opts.userEmail ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "PredictX Wallet Deposit",
            description: `Add $${opts.amount.toFixed(2)} to your PredictX trading balance`,
          },
          unit_amount: Math.round(opts.amount * 100),
        },
        quantity: 1,
      },
    ],
    client_reference_id: opts.userId.toString(),
    metadata: {
      user_id: opts.userId.toString(),
      customer_email: opts.userEmail ?? "",
      customer_name: opts.userName ?? "",
    },
    allow_promotion_codes: true,
    success_url: `${opts.origin}/wallet?deposit=success`,
    cancel_url: `${opts.origin}/wallet?deposit=cancelled`,
  });

  return session;
}
