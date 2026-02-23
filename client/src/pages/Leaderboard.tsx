import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Crown, Medal, Trophy, User } from "lucide-react";

const RANK_STYLES = [
  { color: "oklch(0.70 0.20 60)", label: "1ST", icon: Crown },
  { color: "oklch(0.75 0.04 240)", label: "2ND", icon: Medal },
  { color: "oklch(0.65 0.12 40)", label: "3RD", icon: Medal },
];

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const { data: leaders, isLoading } = trpc.leaderboard.top.useQuery({ limit: 50 });

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded border border-[oklch(0.70_0.20_60/0.4)] bg-[oklch(0.70_0.20_60/0.08)] flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-[oklch(0.70_0.20_60)]" />
          </div>
          <h1 className="text-2xl font-['Orbitron'] font-bold text-foreground">
            TRADER <span className="neon-cyan">LEADERBOARD</span>
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[oklch(0.70_0.20_60)] to-transparent mx-auto mt-3" />
          <p className="text-xs text-muted-foreground font-['Rajdhani'] tracking-widest mt-3">
            TOP TRADERS RANKED BY TOTAL PROFIT
          </p>
        </div>

        {/* Top 3 Podium */}
        {leaders && leaders.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[leaders[1], leaders[0], leaders[2]].map((leader, podiumIdx) => {
              const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
              const style = RANK_STYLES[rank - 1];
              const Icon = style.icon;
              const pnl = parseFloat(leader?.totalPnl ?? "0");
              const isCurrentUser = currentUser && leader?.name === currentUser.name;

              return (
                <div
                  key={rank}
                  className={`cyber-card rounded p-4 text-center ${podiumIdx === 1 ? "border-[oklch(0.70_0.20_60/0.4)] shadow-[0_0_20px_oklch(0.70_0.20_60/0.15)]" : ""}`}
                  style={{ borderColor: `${style.color.replace(")", " / 0.3)")}` }}
                >
                  <Icon
                    className="w-6 h-6 mx-auto mb-2"
                    style={{ color: style.color }}
                  />
                  <div
                    className="text-[10px] font-['Orbitron'] font-bold tracking-widest mb-2"
                    style={{ color: style.color }}
                  >
                    {style.label}
                  </div>
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center mx-auto mb-2" style={{ borderColor: `${style.color.replace(")", " / 0.4)")}`, background: `${style.color.replace(")", " / 0.1)")}` }}>
                    <User className="w-5 h-5" style={{ color: style.color }} />
                  </div>
                  <p className="text-xs font-['Rajdhani'] font-bold text-foreground truncate">
                    {leader?.name ?? "Anonymous"}
                    {isCurrentUser && " (YOU)"}
                  </p>
                  <p
                    className="text-sm font-['Orbitron'] font-bold mt-1"
                    style={{ color: pnl >= 0 ? "oklch(0.75 0.18 145)" : "oklch(0.65 0.22 15)" }}
                  >
                    {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="cyber-card rounded p-5">
          <h2 className="text-sm font-['Orbitron'] font-bold text-foreground tracking-wider mb-5">
            FULL <span className="neon-cyan">RANKINGS</span>
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 bg-[oklch(0.12_0.02_270)] rounded animate-pulse" />
              ))}
            </div>
          ) : leaders && leaders.length > 0 ? (
            <div className="space-y-1">
              {leaders.map((leader, idx) => {
                const rank = idx + 1;
                const pnl = parseFloat(leader.totalPnl);
                const balance = parseFloat(leader.balance);
                const isCurrentUser = currentUser && leader.name === currentUser.name;
                const rankStyle = rank <= 3 ? RANK_STYLES[rank - 1] : null;

                return (
                  <div
                    key={leader.userId}
                    className={`flex items-center gap-4 py-3 px-3 rounded transition-colors ${
                      isCurrentUser
                        ? "bg-[oklch(0.78_0.18_195/0.08)] border border-[oklch(0.78_0.18_195/0.2)]"
                        : "hover:bg-[oklch(0.78_0.18_195/0.03)] border border-transparent"
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className="w-8 text-center font-['Orbitron'] font-bold text-sm shrink-0"
                      style={{ color: rankStyle?.color ?? "oklch(0.55 0.04 240)" }}
                    >
                      {rank <= 3 ? (
                        <span>{rank}</span>
                      ) : (
                        <span className="text-xs">{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
                      style={{
                        borderColor: rankStyle
                          ? `${rankStyle.color.replace(")", " / 0.4)")}`
                          : "oklch(0.22 0.04 240)",
                        background: rankStyle
                          ? `${rankStyle.color.replace(")", " / 0.1)")}`
                          : "oklch(0.12 0.02 270)",
                      }}
                    >
                      <User
                        className="w-4 h-4"
                        style={{ color: rankStyle?.color ?? "oklch(0.55 0.04 240)" }}
                      />
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-['Rajdhani'] font-bold text-foreground truncate">
                        {leader.name ?? `Trader #${leader.userId}`}
                        {isCurrentUser && (
                          <span className="ml-2 text-[10px] text-[oklch(0.78_0.18_195)] font-semibold tracking-widest">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-['Rajdhani'] tracking-wide">
                        Balance: ${balance.toFixed(2)}
                      </p>
                    </div>

                    {/* P&L */}
                    <div className="text-right shrink-0">
                      <div
                        className="text-sm font-['Orbitron'] font-bold"
                        style={{ color: pnl >= 0 ? "oklch(0.75 0.18 145)" : "oklch(0.65 0.22 15)" }}
                      >
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-['Rajdhani'] tracking-wide">
                        P&L
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-['Rajdhani'] tracking-widest">NO TRADERS YET</p>
              <p className="text-xs mt-2 opacity-60">Be the first to trade and claim the top spot</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
