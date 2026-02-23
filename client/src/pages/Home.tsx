import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import MarketCard from "@/components/MarketCard";
import { ArrowRight, BarChart2, Shield, Zap } from "lucide-react";
import { Link } from "wouter";

const CATEGORY_ICONS: Record<string, string> = {
  politics: "🏛",
  sports: "⚡",
  crypto: "₿",
  economics: "📈",
  climate: "🌍",
  tech: "💻",
  entertainment: "🎬",
  health: "🧬",
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: featured } = trpc.markets.featured.useQuery();
  const { data: stats } = trpc.markets.stats.useQuery();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[oklch(0.78_0.18_195/0.04)] rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[oklch(0.72_0.22_330/0.04)] rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[oklch(0.78_0.18_195/0.3)] bg-[oklch(0.78_0.18_195/0.08)] rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.78_0.18_195)] neon-pulse" />
            <span className="text-xs font-['Rajdhani'] font-semibold tracking-widest text-[oklch(0.78_0.18_195)]">
              LIVE PREDICTION MARKETS
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-['Orbitron'] font-black tracking-tight mb-6 leading-none">
            <span className="neon-cyan">TRADE</span>
            <br />
            <span className="text-foreground">THE FUTURE</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground font-['Rajdhani'] max-w-2xl mx-auto mb-10 leading-relaxed">
            Predict real-world outcomes. Buy YES or NO contracts on politics, sports, crypto,
            and more. Your edge is your knowledge.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/markets">
              <button className="flex items-center gap-2 px-8 py-3 bg-[oklch(0.78_0.18_195)] text-[oklch(0.06_0.01_270)] font-['Rajdhani'] font-bold text-sm tracking-widest rounded hover:shadow-[0_0_30px_oklch(0.78_0.18_195/0.5)] transition-all">
                EXPLORE MARKETS
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            {!isAuthenticated && (
              <a
                href={getLoginUrl()}
                className="flex items-center gap-2 px-8 py-3 border border-[oklch(0.72_0.22_330/0.5)] text-[oklch(0.72_0.22_330)] font-['Rajdhani'] font-bold text-sm tracking-widest rounded hover:bg-[oklch(0.72_0.22_330/0.1)] hover:shadow-[0_0_20px_oklch(0.72_0.22_330/0.3)] transition-all"
              >
                START TRADING
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-[oklch(0.08_0.012_270/0.8)]">
        <div className="container py-6">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { label: "LIVE MARKETS", value: stats?.totalMarkets ?? "—" },
              {
                label: "TOTAL VOLUME",
                value: stats?.totalVolume
                  ? `$${(parseFloat(stats.totalVolume) / 1000).toFixed(0)}K`
                  : "—",
              },
              { label: "TRADERS", value: stats?.totalTraders ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-['Orbitron'] font-bold neon-cyan">
                  {value}
                </div>
                <div className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest text-muted-foreground mt-1">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-['Orbitron'] font-bold text-foreground">
                FEATURED <span className="neon-cyan">MARKETS</span>
              </h2>
              <div className="h-[1px] w-24 bg-gradient-to-r from-[oklch(0.78_0.18_195)] to-transparent mt-2" />
            </div>
            <Link href="/markets">
              <button className="flex items-center gap-1.5 text-xs font-['Rajdhani'] font-semibold tracking-widest text-[oklch(0.78_0.18_195)] hover:text-foreground transition-colors">
                VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((m) => (
                <MarketCard
                  key={m.id}
                  id={m.id}
                  slug={m.slug}
                  title={m.title}
                  category={m.category}
                  yesPrice={m.yesPrice}
                  noPrice={m.noPrice}
                  volume={m.volume}
                  closesAt={m.closesAt}
                  isTrending={m.isTrending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground font-['Rajdhani']">
              <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm tracking-widest">NO MARKETS AVAILABLE YET</p>
              <p className="text-xs mt-2 opacity-60">Markets will appear here once seeded</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 border-t border-border">
        <div className="container">
          <h2 className="text-xl font-['Orbitron'] font-bold text-foreground mb-8">
            BROWSE BY <span className="neon-pink">CATEGORY</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => (
              <Link key={cat} href={`/markets?category=${cat}`}>
                <div className="cyber-card hud-bracket rounded p-4 text-center cursor-pointer group">
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-xs font-['Rajdhani'] font-bold tracking-widest text-muted-foreground group-hover:text-[oklch(0.78_0.18_195)] transition-colors uppercase">
                    {cat}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-border">
        <div className="container">
          <h2 className="text-xl font-['Orbitron'] font-bold text-center text-foreground mb-12">
            HOW IT <span className="neon-cyan">WORKS</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart2,
                title: "BROWSE MARKETS",
                desc: "Explore hundreds of prediction markets across politics, sports, crypto, and more.",
                color: "oklch(0.78 0.18 195)",
              },
              {
                icon: Zap,
                title: "TRADE CONTRACTS",
                desc: "Buy YES or NO contracts based on your prediction. Each contract pays $1 if correct.",
                color: "oklch(0.72 0.22 330)",
              },
              {
                icon: Shield,
                title: "COLLECT PAYOUTS",
                desc: "When markets resolve, winning contracts pay out automatically to your wallet.",
                color: "oklch(0.75 0.18 145)",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="cyber-card hud-bracket rounded p-6 text-center">
                <div
                  className="w-12 h-12 rounded flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${color.replace(")", " / 0.1)")}`, border: `1px solid ${color.replace(")", " / 0.3)")}` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="font-['Orbitron'] font-bold text-sm tracking-wider text-foreground mb-3">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground font-['Rajdhani'] leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-['Orbitron'] font-bold text-sm tracking-widest neon-cyan">
            PREDICT<span className="neon-pink">X</span>
          </span>
          <span className="text-xs text-muted-foreground font-['Rajdhani'] tracking-wide">
            © 2026 PredictX. For entertainment purposes.
          </span>
        </div>
      </footer>
    </div>
  );
}
