import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Lock,
  Loader2,
  Wallet as WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TX_ICONS: Record<string, React.ReactNode> = {
  deposit: <ArrowDownLeft className="w-3.5 h-3.5 text-[oklch(0.75_0.18_145)]" />,
  withdrawal: <ArrowUpRight className="w-3.5 h-3.5 text-[oklch(0.65_0.22_15)]" />,
  trade_buy: <ArrowUpRight className="w-3.5 h-3.5 text-[oklch(0.65_0.22_15)]" />,
  trade_sell: <ArrowDownLeft className="w-3.5 h-3.5 text-[oklch(0.75_0.18_145)]" />,
  payout: <ArrowDownLeft className="w-3.5 h-3.5 text-[oklch(0.78_0.18_195)]" />,
  bonus: <ArrowDownLeft className="w-3.5 h-3.5 text-[oklch(0.72_0.22_330)]" />,
};

const TX_COLORS: Record<string, string> = {
  deposit: "text-[oklch(0.75_0.18_145)]",
  withdrawal: "text-[oklch(0.65_0.22_15)]",
  trade_buy: "text-[oklch(0.65_0.22_15)]",
  trade_sell: "text-[oklch(0.75_0.18_145)]",
  payout: "text-[oklch(0.78_0.18_195)]",
  bonus: "text-[oklch(0.72_0.22_330)]",
};

export default function Wallet() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [depositAmount, setDepositAmount] = useState(100);
  const [withdrawAmount, setWithdrawAmount] = useState(50);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  const { data: wallet, isLoading: walletLoading } = trpc.wallet.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: transactions, isLoading: txLoading } = trpc.wallet.transactions.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const stripeDepositMutation = trpc.wallet.stripeDeposit.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecting to Stripe checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const depositMutation = trpc.wallet.deposit.useMutation({
    onSuccess: (data) => {
      toast.success(`Deposited $${depositAmount.toFixed(2)} successfully`, {
        description: `New balance: $${data.newBalance.toFixed(2)}`,
      });
      utils.wallet.get.invalidate();
      utils.wallet.transactions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const withdrawMutation = trpc.wallet.withdraw.useMutation({
    onSuccess: (data) => {
      toast.success(`Withdrew $${withdrawAmount.toFixed(2)} successfully`, {
        description: `New balance: $${data.newBalance.toFixed(2)}`,
      });
      utils.wallet.get.invalidate();
      utils.wallet.transactions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

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
            Connect your account to access your wallet
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

  const balance = parseFloat(wallet?.balance ?? "0");
  const totalDeposited = parseFloat(wallet?.totalDeposited ?? "0");
  const totalWithdrawn = parseFloat(wallet?.totalWithdrawn ?? "0");
  const totalPnl = parseFloat(wallet?.totalPnl ?? "0");

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-['Orbitron'] font-bold text-foreground">
            MY <span className="neon-cyan">WALLET</span>
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-[oklch(0.78_0.18_195)] to-transparent mt-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Balance & Actions */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Balance Card */}
            <div className="cyber-card hud-bracket rounded p-6 text-center">
              <div className="w-12 h-12 rounded border border-[oklch(0.78_0.18_195/0.3)] bg-[oklch(0.78_0.18_195/0.08)] flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="w-6 h-6 text-[oklch(0.78_0.18_195)]" />
              </div>
              <div className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-muted-foreground mb-1">
                AVAILABLE BALANCE
              </div>
              {walletLoading ? (
                <div className="h-10 bg-[oklch(0.12_0.02_270)] rounded animate-pulse mx-auto w-32" />
              ) : (
                <div className="text-4xl font-['Orbitron'] font-black neon-cyan">
                  ${balance.toFixed(2)}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "DEPOSITED", value: `$${totalDeposited.toFixed(0)}`, color: "oklch(0.75 0.18 145)" },
                { label: "WITHDRAWN", value: `$${totalWithdrawn.toFixed(0)}`, color: "oklch(0.65 0.22 15)" },
                { label: "TOTAL P&L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? "oklch(0.75 0.18 145)" : "oklch(0.65 0.22 15)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="cyber-card rounded p-3 text-center">
                  <div className="text-[9px] font-['Rajdhani'] font-semibold tracking-widest text-muted-foreground mb-1">{label}</div>
                  <div className="text-sm font-['Orbitron'] font-bold" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Deposit / Withdraw */}
            <div className="cyber-card rounded p-5">
              {/* Tabs */}
              <div className="flex gap-2 mb-5">
                {(["deposit", "withdraw"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-xs font-['Rajdhani'] font-bold tracking-widest rounded transition-all ${
                      activeTab === tab
                        ? tab === "deposit"
                          ? "bg-[oklch(0.75_0.18_145/0.15)] border border-[oklch(0.75_0.18_145/0.5)] text-[oklch(0.75_0.18_145)]"
                          : "bg-[oklch(0.65_0.22_15/0.15)] border border-[oklch(0.65_0.22_15/0.5)] text-[oklch(0.65_0.22_15)]"
                        : "border border-border text-muted-foreground hover:border-[oklch(0.78_0.18_195/0.3)]"
                    }`}
                  >
                    {tab === "deposit" ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <ArrowDownLeft className="w-3.5 h-3.5" /> DEPOSIT
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5" /> WITHDRAW
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {activeTab === "deposit" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-muted-foreground block mb-2">
                      AMOUNT (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="number"
                        min={10}
                        max={100000}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 bg-[oklch(0.09_0.015_270)] border border-border text-foreground text-sm font-['Rajdhani'] rounded focus:outline-none focus:border-[oklch(0.75_0.18_145/0.5)]"
                      />
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {[50, 100, 250, 500].map((a) => (
                        <button
                          key={a}
                          onClick={() => setDepositAmount(a)}
                          className="flex-1 text-[10px] py-1 border border-border text-muted-foreground hover:text-foreground hover:border-[oklch(0.75_0.18_145/0.3)] rounded font-['Rajdhani'] font-semibold tracking-wider transition-all"
                        >
                          ${a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => stripeDepositMutation.mutate({ amount: depositAmount, origin: window.location.origin })}
                      disabled={stripeDepositMutation.isPending || depositAmount < 1}
                      className="w-full py-3 bg-[oklch(0.78_0.18_195)] text-[oklch(0.06_0.01_270)] font-['Rajdhani'] font-bold text-sm tracking-widest rounded hover:shadow-[0_0_20px_oklch(0.78_0.18_195/0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {stripeDepositMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><CreditCard className="w-4 h-4" /> PAY WITH STRIPE</>
                      )}
                    </button>
                    <button
                      onClick={() => depositMutation.mutate({ amount: depositAmount })}
                      disabled={depositMutation.isPending || depositAmount < 10}
                      className="w-full py-2.5 border border-[oklch(0.75_0.18_145/0.4)] text-[oklch(0.75_0.18_145)] font-['Rajdhani'] font-bold text-xs tracking-widest rounded hover:bg-[oklch(0.75_0.18_145/0.08)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {depositMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>DEMO DEPOSIT (INSTANT)</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-muted-foreground block mb-2">
                      AMOUNT (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="number"
                        min={10}
                        max={balance}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 bg-[oklch(0.09_0.015_270)] border border-border text-foreground text-sm font-['Rajdhani'] rounded focus:outline-none focus:border-[oklch(0.65_0.22_15/0.5)]"
                      />
                    </div>
                    <button
                      onClick={() => setWithdrawAmount(balance)}
                      className="mt-1 text-[10px] text-[oklch(0.78_0.18_195)] hover:underline font-['Rajdhani'] tracking-wide"
                    >
                      MAX: ${balance.toFixed(2)}
                    </button>
                  </div>
                  <button
                    onClick={() => withdrawMutation.mutate({ amount: withdrawAmount })}
                    disabled={withdrawMutation.isPending || withdrawAmount < 10 || withdrawAmount > balance}
                    className="w-full py-3 bg-[oklch(0.65_0.22_15)] text-white font-['Rajdhani'] font-bold text-sm tracking-widest rounded hover:shadow-[0_0_20px_oklch(0.65_0.22_15/0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {withdrawMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>WITHDRAW ${withdrawAmount.toFixed(2)}</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Transaction History */}
          <div className="lg:col-span-2">
            <div className="cyber-card rounded p-5">
              <h2 className="text-sm font-['Orbitron'] font-bold text-foreground tracking-wider mb-5">
                TRANSACTION <span className="neon-cyan">HISTORY</span>
              </h2>

              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-[oklch(0.12_0.02_270)] rounded animate-pulse" />
                  ))}
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-1">
                  {transactions.map((tx) => {
                    const amount = parseFloat(tx.amount);
                    const isPositive = ["deposit", "trade_sell", "payout", "bonus"].includes(tx.type);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 border-b border-border/50 hover:bg-[oklch(0.78_0.18_195/0.03)] transition-colors rounded px-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded border border-border flex items-center justify-center">
                            {TX_ICONS[tx.type] ?? <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />}
                          </div>
                          <div>
                            <p className="text-xs font-['Rajdhani'] font-semibold text-foreground">
                              {tx.description ?? tx.type.replace("_", " ").toUpperCase()}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-['Rajdhani'] tracking-wide">
                              {formatDate(tx.createdAt)} · Balance: ${parseFloat(tx.balanceAfter).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-['Orbitron'] font-bold ${TX_COLORS[tx.type] ?? "text-foreground"}`}>
                          {isPositive ? "+" : "-"}${Math.abs(amount).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <WalletIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-['Rajdhani'] tracking-widest">NO TRANSACTIONS YET</p>
                  <p className="text-xs mt-2 opacity-60">Deposit funds to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
