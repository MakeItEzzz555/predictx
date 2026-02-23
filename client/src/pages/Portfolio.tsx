import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Activity, ArrowUpRight, BarChart2, Clock, Lock, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "wouter";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(v: string | number) {
  return `$${parseFloat(String(v)).toFixed(2)}`;
}

export default function Portfolio() {
  const { isAuthenticated, user } = useAuth();
  const { data: positions, isLoading: posLoading } = trpc.trading.myPositions.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: orders, isLoading: ordLoading } = trpc.trading.myOrders.useQuery(
    { limit: 30 },
    { enabled: isAuthenticated }
  );
  const { data: wallet } = trpc.wallet.get.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 py-20">
        <div className="w-16 h-16 rounded border border-[oklch(0.78_0.18_195/0.3)] bg-[oklch(0.78_0.18_195/0.08)] flex items-center justify-center">
          <Lock className="w-8 h-8 text-[oklch(0.78_0.18_195)]" />
        </div>
        <div className="text-center">
          <h2 className="font-['Orbitron'] font-bold text-lg text-foreground mb-2">
            AUTHENTICATION <span className="neon-cyan">REQUIRED</span>
          </h2>
          <p className="text-sm text-muted-foreground font-['Rajdhani'] mb-6">
            Connect your account to view your portfolio
          </p>
          <a
            href={getLoginUrl()}
            className="px-6 py-2.5 bg-[oklch(0.78_0.18_195)] text-[oklch(0.06_0.01_270)] font-['Rajdhani'] font-bold text-sm tracking-widest rounded hover:shadow-[0_0_20px_oklch(0.78_0.18_195/0.4)] transition-all"
          >
            CONNECT
          </a>
        </div>
      </div>
    );
  }

  // Calculate P&L
  const totalInvested = positions?.reduce(
    (acc, { position }) => acc + parseFloat(position.totalInvested),
    0
  ) ?? 0;

  const totalCurrentValue = positions?.reduce((acc, { position, market }) => {
    const currentPrice = position.side === "yes"
      ? parseFloat(market.yesPrice)
      : parseFloat(market.noPrice);
    return acc + (currentPrice * position.quantity) / 100;
  }, 0) ?? 0;

  const unrealizedPnl = totalCurrentValue - totalInvested;
  const realizedPnl = parseFloat(wallet?.totalPnl ?? "0");

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-['Orbitron'] font-bold text-foreground">
            MY <span className="neon-cyan">PORTFOLIO</span>
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-[oklch(0.78_0.18_195)] to-transparent mt-2" />
          {user?.name && (
            <p className="text-xs text-muted-foreground font-['Rajdhani'] tracking-widest mt-2">
              TRADER: {user.name.toUpperCase()}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "BALANCE",
              value: formatCurrency(wallet?.balance ?? 0),
              color: "oklch(0.78 0.18 195)",
              icon: BarChart2,
            },
            {
              label: "INVESTED",
              value: formatCurrency(totalInvested),
              color: "oklch(0.72 0.22 330)",
              icon: Activity,
            },
            {
              label: "UNREALIZED P&L",
              value: `${unrealizedPnl >= 0 ? "+" : ""}${formatCurrency(unrealizedPnl)}`,
              color: unrealizedPnl >= 0 ? "oklch(0.75 0.18 145)" : "oklch(0.65 0.22 15)",
              icon: unrealizedPnl >= 0 ? TrendingUp : TrendingDown,
            },
            {
              label: "REALIZED P&L",
              value: `${realizedPnl >= 0 ? "+" : ""}${formatCurrency(realizedPnl)}`,
              color: realizedPnl >= 0 ? "oklch(0.75 0.18 145)" : "oklch(0.65 0.22 15)",
              icon: realizedPnl >= 0 ? TrendingUp : TrendingDown,
            },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="cyber-card hud-bracket rounded p-4"
              style={{ borderColor: `${color.replace(")", " / 0.2)")}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-muted-foreground">
                  {label}
                </span>
              </div>
              <div
                className="text-xl font-['Orbitron'] font-bold"
                style={{ color }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Open Positions */}
        <div className="cyber-card rounded p-5 mb-6">
          <h2 className="text-sm font-['Orbitron'] font-bold text-foreground tracking-wider mb-5">
            OPEN <span className="neon-cyan">POSITIONS</span>
          </h2>

          {posLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-[oklch(0.12_0.02_270)] rounded animate-pulse" />
              ))}
            </div>
          ) : positions && positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-['Rajdhani']">
                <thead>
                  <tr className="border-b border-border text-muted-foreground tracking-widest">
                    <th className="text-left pb-2 font-semibold">MARKET</th>
                    <th className="text-center pb-2 font-semibold">SIDE</th>
                    <th className="text-right pb-2 font-semibold">QTY</th>
                    <th className="text-right pb-2 font-semibold">AVG COST</th>
                    <th className="text-right pb-2 font-semibold">CURRENT</th>
                    <th className="text-right pb-2 font-semibold">P&L</th>
                    <th className="text-right pb-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(({ position, market }) => {
                    const currentPrice = position.side === "yes"
                      ? parseFloat(market.yesPrice)
                      : parseFloat(market.noPrice);
                    const currentValue = (currentPrice * position.quantity) / 100;
                    const invested = parseFloat(position.totalInvested);
                    const pnl = currentValue - invested;
                    const pnlPct = invested > 0 ? ((pnl / invested) * 100).toFixed(1) : "0";

                    return (
                      <tr key={position.id} className="border-b border-border/50 hover:bg-[oklch(0.78_0.18_195/0.03)] transition-colors">
                        <td className="py-3 pr-4 max-w-[200px]">
                          <p className="truncate text-foreground font-semibold">{market.title}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                            <Clock className="w-2.5 h-2.5" />
                            <span className="text-[10px]">{formatDate(market.closesAt)}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest ${
                              position.side === "yes"
                                ? "text-[oklch(0.75_0.18_145)] bg-[oklch(0.75_0.18_145/0.1)] border border-[oklch(0.75_0.18_145/0.3)]"
                                : "text-[oklch(0.65_0.22_15)] bg-[oklch(0.65_0.22_15/0.1)] border border-[oklch(0.65_0.22_15/0.3)]"
                            }`}
                          >
                            {position.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-right text-foreground">{position.quantity}</td>
                        <td className="py-3 text-right text-muted-foreground">{parseFloat(position.avgCost).toFixed(0)}¢</td>
                        <td className="py-3 text-right text-foreground">{currentPrice.toFixed(0)}¢</td>
                        <td className="py-3 text-right">
                          <div className={pnl >= 0 ? "text-[oklch(0.75_0.18_145)]" : "text-[oklch(0.65_0.22_15)]"}>
                            <div className="font-bold">{pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}</div>
                            <div className="text-[10px]">{pnl >= 0 ? "+" : ""}{pnlPct}%</div>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Link href={`/markets/${market.slug}`}>
                            <button className="p-1 text-muted-foreground hover:text-[oklch(0.78_0.18_195)] transition-colors">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-['Rajdhani'] tracking-widest">NO OPEN POSITIONS</p>
              <Link href="/markets">
                <button className="mt-3 text-xs text-[oklch(0.78_0.18_195)] hover:underline font-['Rajdhani'] tracking-widest">
                  BROWSE MARKETS →
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Trade History */}
        <div className="cyber-card rounded p-5">
          <h2 className="text-sm font-['Orbitron'] font-bold text-foreground tracking-wider mb-5">
            TRADE <span className="neon-pink">HISTORY</span>
          </h2>

          {ordLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-[oklch(0.12_0.02_270)] rounded animate-pulse" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-['Rajdhani']">
                <thead>
                  <tr className="border-b border-border text-muted-foreground tracking-widest">
                    <th className="text-left pb-2 font-semibold">MARKET</th>
                    <th className="text-center pb-2 font-semibold">TYPE</th>
                    <th className="text-center pb-2 font-semibold">SIDE</th>
                    <th className="text-right pb-2 font-semibold">QTY</th>
                    <th className="text-right pb-2 font-semibold">PRICE</th>
                    <th className="text-right pb-2 font-semibold">TOTAL</th>
                    <th className="text-right pb-2 font-semibold">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(({ order, market }) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-[oklch(0.78_0.18_195/0.03)] transition-colors">
                      <td className="py-2 pr-4 max-w-[160px]">
                        <p className="truncate text-foreground font-semibold">{market.title}</p>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`text-[10px] font-bold tracking-widest ${order.type === "buy" ? "text-[oklch(0.75_0.18_145)]" : "text-[oklch(0.65_0.22_15)]"}`}>
                          {order.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`text-[10px] font-bold tracking-widest ${order.side === "yes" ? "text-[oklch(0.75_0.18_145)]" : "text-[oklch(0.65_0.22_15)]"}`}>
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 text-right text-foreground">{order.quantity}</td>
                      <td className="py-2 text-right text-muted-foreground">{parseFloat(order.pricePerContract).toFixed(0)}¢</td>
                      <td className="py-2 text-right text-foreground font-semibold">{formatCurrency(order.totalCost)}</td>
                      <td className="py-2 text-right text-muted-foreground">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-['Rajdhani'] tracking-widest">NO TRADE HISTORY</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
