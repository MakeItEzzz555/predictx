import { trpc } from "@/lib/trpc";
import { useMarketSocket, useTradeNotifications } from "@/hooks/useMarketSocket";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Info, Loader2, TrendingDown, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatVolume(v: string | number) {
  const n = parseFloat(String(v));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// Simulated order book based on current price
function generateOrderBook(yesPrice: number) {
  const bids = Array.from({ length: 6 }, (_, i) => ({
    price: Math.max(1, yesPrice - (i + 1) * 2),
    qty: Math.floor(Math.random() * 500 + 50),
  }));
  const asks = Array.from({ length: 6 }, (_, i) => ({
    price: Math.min(99, yesPrice + (i + 1) * 2),
    qty: Math.floor(Math.random() * 500 + 50),
  }));
  return { bids, asks };
}

export default function MarketDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [tradeSide, setTradeSide] = useState<"yes" | "no">("yes");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(10);

  const { data: market, isLoading } = trpc.markets.bySlug.useQuery({ slug: slug ?? "" });
  const { data: priceHistory } = trpc.markets.priceHistory.useQuery(
    { marketId: market?.id ?? 0, limit: 100 },
    { enabled: !!market?.id }
  );
  const { data: wallet } = trpc.wallet.get.useQuery(undefined, { enabled: isAuthenticated });
  const { latestUpdate, connected } = useMarketSocket(market?.id);

  // Show trade notifications as toasts
  useTradeNotifications((n) => {
    if (n.marketId === market?.id) {
      toast.info(`${n.traderName} bought ${n.quantity} ${n.side.toUpperCase()} @ $${n.totalCost.toFixed(2)}`, {
        duration: 3000,
      });
    }
  });

  const buyMutation = trpc.trading.buy.useMutation({
    onSuccess: (data) => {
      toast.success(`Order filled! Bought ${quantity} ${tradeSide.toUpperCase()} contracts`, {
        description: `Cost: $${data.totalCost.toFixed(2)}`,
      });
      utils.markets.bySlug.invalidate({ slug: slug ?? "" });
      utils.wallet.get.invalidate();
      utils.trading.myPositions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sellMutation = trpc.trading.sell.useMutation({
    onSuccess: (data) => {
      toast.success(`Sold ${quantity} ${tradeSide.toUpperCase()} contracts`, {
        description: `Received: $${data.saleValue.toFixed(2)}`,
      });
      utils.markets.bySlug.invalidate({ slug: slug ?? "" });
      utils.wallet.get.invalidate();
      utils.trading.myPositions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.78_0.18_195)]" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="font-['Rajdhani'] text-sm tracking-widest text-muted-foreground">MARKET NOT FOUND</p>
        <Link href="/markets">
          <button className="text-xs font-['Rajdhani'] tracking-widest text-[oklch(0.78_0.18_195)] hover:underline">
            ← BACK TO MARKETS
          </button>
        </Link>
      </div>
    );
  }

  const yesPrice = parseFloat(market.yesPrice);
  const noPrice = parseFloat(market.noPrice);
  const tradePrice = tradeSide === "yes" ? yesPrice : noPrice;
  const estimatedCost = (tradePrice * quantity) / 100;
  const potentialPayout = quantity; // $1 per contract if correct
  const potentialProfit = potentialPayout - estimatedCost;

  // Build chart data
  const chartData =
    priceHistory && priceHistory.length > 0
      ? [...priceHistory]
          .reverse()
          .map((p) => ({
            time: new Date(p.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            yes: parseFloat(p.yesPrice),
            no: parseFloat(p.noPrice),
          }))
      : Array.from({ length: 30 }, (_, i) => {
          const base = yesPrice + (Math.random() - 0.5) * 20;
          const y = Math.max(1, Math.min(99, Math.round(base)));
          return {
            time: new Date(Date.now() - (29 - i) * 24 * 3600 * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            yes: y,
            no: 100 - y,
          };
        });

  const { bids, asks } = generateOrderBook(yesPrice);

  const handleTrade = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (tradeType === "buy") {
      buyMutation.mutate({ marketId: market.id, side: tradeSide, quantity });
    } else {
      sellMutation.mutate({ marketId: market.id, side: tradeSide, quantity });
    }
  };

  const isMutating = buyMutation.isPending || sellMutation.isPending;

  return (
    <div className="min-h-screen py-6">
      <div className="container">
        {/* Breadcrumb */}
        <Link href="/markets">
          <button className="flex items-center gap-1.5 text-xs font-['Rajdhani'] tracking-widest text-muted-foreground hover:text-[oklch(0.78_0.18_195)] transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />
            MARKETS
          </button>
        </Link>

        {/* Market Header */}
        <div className="cyber-card hud-bracket rounded p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest px-2 py-0.5 rounded uppercase text-[oklch(0.78_0.18_195)] bg-[oklch(0.78_0.18_195/0.1)] border border-[oklch(0.78_0.18_195/0.3)]">
                  {market.category}
                </span>
                <span
                  className={`text-[10px] font-['Rajdhani'] font-semibold tracking-widest px-2 py-0.5 rounded uppercase ${
                    market.status === "open"
                      ? "text-[oklch(0.75_0.18_145)] bg-[oklch(0.75_0.18_145/0.1)] border border-[oklch(0.75_0.18_145/0.3)]"
                      : "text-muted-foreground border border-border"
                  }`}
                >
                  {market.status}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-['Orbitron'] font-bold text-foreground leading-snug mb-4">
                {market.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-['Rajdhani'] tracking-wide">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Closes {formatDate(market.closesAt)}
                </span>
                <span>Vol: {formatVolume(market.volume)}</span>
                <span>OI: {formatVolume(market.openInterest)}</span>
              </div>
            </div>
            {/* Current Prices */}
            <div className="flex gap-3 shrink-0">
              <div className="text-center p-4 rounded border border-[oklch(0.75_0.18_145/0.3)] bg-[oklch(0.75_0.18_145/0.05)]">
                <div className="text-2xl font-['Orbitron'] font-bold text-[oklch(0.75_0.18_145)]">
                  {yesPrice}¢
                </div>
                <div className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-[oklch(0.75_0.18_145)] mt-1">
                  YES
                </div>
              </div>
              <div className="text-center p-4 rounded border border-[oklch(0.65_0.22_15/0.3)] bg-[oklch(0.65_0.22_15/0.05)]">
                <div className="text-2xl font-['Orbitron'] font-bold text-[oklch(0.65_0.22_15)]">
                  {noPrice}¢
                </div>
                <div className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-[oklch(0.65_0.22_15)] mt-1">
                  NO
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chart + Order Book */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Price Chart */}
            <div className="cyber-card rounded p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-['Orbitron'] font-bold text-foreground tracking-wider">
                  PROBABILITY <span className="neon-cyan">CHART</span>
                </h2>
                <div className="flex items-center gap-3 text-[10px] font-['Rajdhani'] tracking-widest">
                  <span className="flex items-center gap-1 text-[oklch(0.75_0.18_145)]">
                    <span className="w-3 h-0.5 bg-[oklch(0.75_0.18_145)] inline-block" /> YES
                  </span>
                  <span className="flex items-center gap-1 text-[oklch(0.65_0.22_15)]">
                    <span className="w-3 h-0.5 bg-[oklch(0.65_0.22_15)] inline-block" /> NO
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.75 0.18 145)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.75 0.18 145)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="noGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.22 15)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="oklch(0.65 0.22 15)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.03 240 / 0.5)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "oklch(0.55 0.04 240)", fontSize: 10, fontFamily: "Rajdhani" }}
                    tickLine={false}
                    axisLine={{ stroke: "oklch(0.22 0.04 240)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "oklch(0.55 0.04 240)", fontSize: 10, fontFamily: "Rajdhani" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}¢`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.09 0.015 270)",
                      border: "1px solid oklch(0.22 0.04 240)",
                      borderRadius: "4px",
                      fontFamily: "Rajdhani",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "oklch(0.55 0.04 240)" }}
                    formatter={(val: number, name: string) => [
                      `${val}¢`,
                      name.toUpperCase(),
                    ]}
                  />
                  <Area type="monotone" dataKey="yes" stroke="oklch(0.75 0.18 145)" strokeWidth={2} fill="url(#yesGrad)" dot={false} />
                  <Area type="monotone" dataKey="no" stroke="oklch(0.65 0.22 15)" strokeWidth={1.5} fill="url(#noGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Order Book */}
            <div className="cyber-card rounded p-5">
              <h2 className="text-sm font-['Orbitron'] font-bold text-foreground tracking-wider mb-4">
                ORDER <span className="neon-cyan">BOOK</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Bids (YES buyers) */}
                <div>
                  <div className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-[oklch(0.75_0.18_145)] mb-2 flex justify-between">
                    <span>BID (YES)</span><span>QTY</span>
                  </div>
                  {bids.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs font-['Rajdhani'] py-0.5 relative">
                      <div
                        className="absolute inset-0 bg-[oklch(0.75_0.18_145/0.06)] rounded"
                        style={{ width: `${(b.qty / 600) * 100}%` }}
                      />
                      <span className="relative text-[oklch(0.75_0.18_145)]">{b.price}¢</span>
                      <span className="relative text-muted-foreground">{b.qty}</span>
                    </div>
                  ))}
                </div>
                {/* Asks (NO buyers / YES sellers) */}
                <div>
                  <div className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-[oklch(0.65_0.22_15)] mb-2 flex justify-between">
                    <span>ASK (NO)</span><span>QTY</span>
                  </div>
                  {asks.map((a, i) => (
                    <div key={i} className="flex justify-between text-xs font-['Rajdhani'] py-0.5 relative">
                      <div
                        className="absolute inset-0 bg-[oklch(0.65_0.22_15/0.06)] rounded"
                        style={{ width: `${(a.qty / 600) * 100}%` }}
                      />
                      <span className="relative text-[oklch(0.65_0.22_15)]">{a.price}¢</span>
                      <span className="relative text-muted-foreground">{a.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Market Info */}
            <div className="cyber-card rounded p-5">
              <h2 className="text-sm font-['Orbitron'] font-bold text-foreground tracking-wider mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-[oklch(0.78_0.18_195)]" />
                MARKET <span className="neon-cyan">INFO</span>
              </h2>
              {market.description && (
                <p className="text-sm text-muted-foreground font-['Rajdhani'] leading-relaxed mb-4">
                  {market.description}
                </p>
              )}
              {market.resolutionCriteria && (
                <div className="border border-[oklch(0.78_0.18_195/0.2)] bg-[oklch(0.78_0.18_195/0.04)] rounded p-3">
                  <div className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-[oklch(0.78_0.18_195)] mb-2">
                    RESOLUTION CRITERIA
                  </div>
                  <p className="text-xs text-muted-foreground font-['Rajdhani'] leading-relaxed">
                    {market.resolutionCriteria}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Trading Panel */}
          <div className="flex flex-col gap-4">
            <div className="cyber-card hud-bracket rounded p-5 sticky top-20">
              <h2 className="text-sm font-['Orbitron'] font-bold text-foreground tracking-wider mb-5">
                TRADE <span className="neon-pink">CONTRACTS</span>
              </h2>

              {/* Buy/Sell Toggle */}
              <div className="flex gap-2 mb-4">
                {(["buy", "sell"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTradeType(t)}
                    className={`flex-1 py-2 text-xs font-['Rajdhani'] font-bold tracking-widest rounded transition-all ${
                      tradeType === t
                        ? "bg-[oklch(0.78_0.18_195/0.2)] border border-[oklch(0.78_0.18_195/0.6)] text-[oklch(0.78_0.18_195)]"
                        : "border border-border text-muted-foreground hover:border-[oklch(0.78_0.18_195/0.3)]"
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* YES/NO Toggle */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setTradeSide("yes")}
                  className={`flex-1 py-2.5 text-sm font-['Rajdhani'] font-bold tracking-widest rounded transition-all ${
                    tradeSide === "yes"
                      ? "bg-[oklch(0.75_0.18_145/0.2)] border border-[oklch(0.75_0.18_145/0.6)] text-[oklch(0.75_0.18_145)] shadow-[0_0_12px_oklch(0.75_0.18_145/0.3)]"
                      : "border border-border text-muted-foreground hover:border-[oklch(0.75_0.18_145/0.3)]"
                  }`}
                >
                  YES {yesPrice}¢
                </button>
                <button
                  onClick={() => setTradeSide("no")}
                  className={`flex-1 py-2.5 text-sm font-['Rajdhani'] font-bold tracking-widest rounded transition-all ${
                    tradeSide === "no"
                      ? "bg-[oklch(0.65_0.22_15/0.2)] border border-[oklch(0.65_0.22_15/0.6)] text-[oklch(0.65_0.22_15)] shadow-[0_0_12px_oklch(0.65_0.22_15/0.3)]"
                      : "border border-border text-muted-foreground hover:border-[oklch(0.65_0.22_15/0.3)]"
                  }`}
                >
                  NO {noPrice}¢
                </button>
              </div>

              {/* Quantity */}
              <div className="mb-5">
                <label className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-muted-foreground block mb-2">
                  QUANTITY (CONTRACTS)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 10))}
                    className="w-8 h-8 border border-border text-muted-foreground hover:text-foreground hover:border-[oklch(0.78_0.18_195/0.4)] rounded text-sm transition-all"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center bg-[oklch(0.09_0.015_270)] border border-border text-foreground text-sm font-['Rajdhani'] font-bold py-1.5 rounded focus:outline-none focus:border-[oklch(0.78_0.18_195/0.5)]"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(10000, quantity + 10))}
                    className="w-8 h-8 border border-border text-muted-foreground hover:text-foreground hover:border-[oklch(0.78_0.18_195/0.4)] rounded text-sm transition-all"
                  >
                    +
                  </button>
                </div>
                {/* Quick amounts */}
                <div className="flex gap-1.5 mt-2">
                  {[10, 50, 100, 500].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(q)}
                      className="flex-1 text-[10px] py-1 border border-border text-muted-foreground hover:text-foreground hover:border-[oklch(0.78_0.18_195/0.3)] rounded font-['Rajdhani'] font-semibold tracking-wider transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade Summary */}
              <div className="border border-border rounded p-3 mb-5 space-y-2">
                <div className="flex justify-between text-xs font-['Rajdhani'] tracking-wide">
                  <span className="text-muted-foreground">Price per contract</span>
                  <span className="text-foreground font-semibold">{tradePrice}¢</span>
                </div>
                <div className="flex justify-between text-xs font-['Rajdhani'] tracking-wide">
                  <span className="text-muted-foreground">Est. cost</span>
                  <span className="text-foreground font-semibold">${estimatedCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-['Rajdhani'] tracking-wide">
                  <span className="text-muted-foreground">Max payout</span>
                  <span className="text-[oklch(0.75_0.18_145)] font-semibold">${potentialPayout.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-xs font-['Rajdhani'] tracking-wide">
                  <span className="text-muted-foreground">Potential profit</span>
                  <span className={potentialProfit >= 0 ? "text-[oklch(0.75_0.18_145)] font-bold" : "text-[oklch(0.65_0.22_15)] font-bold"}>
                    {potentialProfit >= 0 ? "+" : ""}${potentialProfit.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Balance */}
              {isAuthenticated && wallet && (
                <div className="text-xs text-muted-foreground font-['Rajdhani'] tracking-wide mb-4 flex justify-between">
                  <span>Available balance</span>
                  <span className="text-foreground font-semibold">${parseFloat(wallet.balance).toFixed(2)}</span>
                </div>
              )}

              {/* Trade Button */}
              {market.status === "open" ? (
                <button
                  onClick={handleTrade}
                  disabled={isMutating}
                  className={`w-full py-3 text-sm font-['Rajdhani'] font-bold tracking-widest rounded transition-all flex items-center justify-center gap-2 ${
                    tradeSide === "yes"
                      ? "bg-[oklch(0.75_0.18_145)] text-[oklch(0.06_0.01_270)] hover:shadow-[0_0_20px_oklch(0.75_0.18_145/0.5)] disabled:opacity-50"
                      : "bg-[oklch(0.65_0.22_15)] text-white hover:shadow-[0_0_20px_oklch(0.65_0.22_15/0.5)] disabled:opacity-50"
                  }`}
                >
                  {isMutating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {tradeType.toUpperCase()} {tradeSide.toUpperCase()}
                      {tradeType === "buy" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-3 text-center text-xs font-['Rajdhani'] font-semibold tracking-widest text-muted-foreground border border-border rounded">
                  MARKET {market.status.toUpperCase()}
                  {market.outcome && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-[oklch(0.75_0.18_145)]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      RESOLVED: {market.outcome.toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              {!isAuthenticated && (
                <p className="text-center text-[10px] text-muted-foreground font-['Rajdhani'] tracking-wide mt-3">
                  <a href={getLoginUrl()} className="text-[oklch(0.78_0.18_195)] hover:underline">
                    Connect
                  </a>{" "}
                  to start trading
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
