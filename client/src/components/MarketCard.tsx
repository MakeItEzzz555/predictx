import { Clock, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  priceHistory?: Array<{ yesPrice: string; noPrice?: string; recordedAt: Date | string }>;
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

  // Build detailed price chart data (same as MarketDetail)
  const chartData =
    priceHistory.length > 0
      ? priceHistory.map((p) => {
          const d = p.recordedAt instanceof Date ? p.recordedAt : new Date(p.recordedAt);
          const y = parseFloat(p.yesPrice);
          return {
            time: d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            yes: y,
            no: 100 - y,
          };
        })
      : Array.from({ length: 30 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (30 - i));
          return {
            time: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            yes: 50 + Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10,
            no: 50 - Math.sin(i * 0.3) * 15 - (Math.random() - 0.5) * 10,
          };
        });

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
        <p className="text-sm font-['Rajdhani'] font-semibold text-foreground leading-snug line-clamp-2">
          {title}
        </p>

        {/* Detailed Price Chart (same as MarketDetail) */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-['Orbitron'] font-bold text-foreground tracking-wider">
              PROBABILITY <span className="neon-cyan">CHART</span>
            </h3>
            <div className="flex items-center gap-2 text-[9px] font-['Rajdhani'] tracking-widest">
              <span className="flex items-center gap-1 text-[oklch(0.75_0.18_145)]">
                <span className="w-2 h-0.5 bg-[oklch(0.75_0.18_145)] inline-block" /> YES
              </span>
              <span className="flex items-center gap-1 text-[oklch(0.65_0.22_15)]">
                <span className="w-2 h-0.5 bg-[oklch(0.65_0.22_15)] inline-block" /> NO
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id={`yesGrad-${slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.75 0.18 145)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.75 0.18 145)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`noGrad-${slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.22 15)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="oklch(0.65 0.22 15)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.03 240 / 0.5)" />
              <XAxis
                dataKey="time"
                tick={{ fill: "oklch(0.55 0.04 240)", fontSize: 9, fontFamily: "Rajdhani" }}
                tickLine={false}
                axisLine={{ stroke: "oklch(0.22 0.04 240)" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "oklch(0.55 0.04 240)", fontSize: 9, fontFamily: "Rajdhani" }}
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
                  fontSize: "11px",
                }}
                labelStyle={{ color: "oklch(0.55 0.04 240)" }}
                formatter={(val: number, name: string) => [
                  `${val.toFixed(1)}¢`,
                  name.toUpperCase(),
                ]}
              />
              <Area
                type="monotone"
                dataKey="yes"
                stroke="oklch(0.75 0.18 145)"
                strokeWidth={1.5}
                fill={`url(#yesGrad-${slug})`}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="no"
                stroke="oklch(0.65 0.22 15)"
                strokeWidth={1.5}
                fill={`url(#noGrad-${slug})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Prices & Volume */}
        <div className="flex items-center justify-between gap-2 mt-2">
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
