import { Clock, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface MarketCardProps {
  id: number;
  slug: string;
  title: string;
  category: string;
  yesPrice: string;
  noPrice: string;
  volume: string;
  closesAt: Date | string;
  isTrending?: boolean;
  priceHistory?: Array<{ yesPrice: string; recordedAt: Date | string }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  politics: "oklch(0.72 0.22 330)",
  sports: "oklch(0.75 0.18 145)",
  crypto: "oklch(0.78 0.18 195)",
  economics: "oklch(0.70 0.20 60)",
  climate: "oklch(0.75 0.18 130)",
  tech: "oklch(0.78 0.18 195)",
  entertainment: "oklch(0.72 0.22 330)",
  health: "oklch(0.75 0.18 145)",
};

function formatVolume(v: string | number): string {
  const n = parseFloat(String(v));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatCloseDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days < 30) return `${days}d left`;
  const months = Math.floor(days / 30);
  return `${months}mo left`;
}

export default function MarketCard({
  slug,
  title,
  category,
  yesPrice,
  noPrice,
  volume,
  closesAt,
  isTrending,
  priceHistory = [],
}: MarketCardProps) {
  const yp = parseFloat(yesPrice);
  const np = parseFloat(noPrice);
  const catColor = CATEGORY_COLORS[category] ?? "oklch(0.78 0.18 195)";

  // Build order book data (buy/sell depth visualization)
  const orderBookData = [
    { name: "YES", value: yp, fill: "oklch(0.75 0.18 145)" },
    { name: "NO", value: np, fill: "oklch(0.65 0.22 15)" },
  ];

  return (
    <Link href={`/markets/${slug}`}>
      <div className="cyber-card hud-bracket rounded p-4 cursor-pointer group h-full flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest px-2 py-0.5 rounded uppercase"
              style={{
                color: catColor,
                background: `${catColor.replace(")", " / 0.12)")}`,
                border: `1px solid ${catColor.replace(")", " / 0.3)")}`,
              }}
            >
              {category}
            </span>
            {isTrending && (
              <span className="flex items-center gap-1 text-[10px] font-['Rajdhani'] font-semibold tracking-widest px-2 py-0.5 rounded text-[oklch(0.72_0.22_330)] bg-[oklch(0.72_0.22_330/0.1)] border border-[oklch(0.72_0.22_330/0.3)]">
                <TrendingUp className="w-2.5 h-2.5" />
                HOT
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-['Rajdhani'] tracking-wide shrink-0">
            <Clock className="w-3 h-3" />
            {formatCloseDate(closesAt)}
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-['Rajdhani'] font-semibold text-foreground leading-snug line-clamp-2 flex-1">
          {title}
        </p>

        {/* Order Book Buy/Sell Bar Chart */}
        <div className="h-14 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={orderBookData} margin={{ top: 4, right: 4, bottom: 16, left: 0 }}>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: "oklch(0.55 0.04 240)", fontFamily: "Rajdhani" }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {orderBookData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Prices & Volume */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button className="btn-yes text-xs font-['Rajdhani'] font-bold tracking-wider px-3 py-1 rounded">
              YES {yp}¢
            </button>
            <button className="btn-no text-xs font-['Rajdhani'] font-bold tracking-wider px-3 py-1 rounded">
              NO {np}¢
            </button>
          </div>
          <span className="text-[11px] text-muted-foreground font-['Rajdhani'] tracking-wide">
            {formatVolume(volume)} vol
          </span>
        </div>
      </div>
    </Link>
  );
}
