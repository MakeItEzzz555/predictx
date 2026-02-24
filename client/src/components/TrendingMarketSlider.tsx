import { ChevronLeft, ChevronRight, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "@/lib/trpc";

interface TrendingMarketSliderProps {
  totalMarketsCount?: number;
}

export default function TrendingMarketSlider({
  totalMarketsCount = 0,
}: TrendingMarketSliderProps) {
  const { data: markets = [] } = trpc.markets.list.useQuery({
    limit: 10,
    filter: "trending",
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-rotate every 10 seconds
  useEffect(() => {
    if (!autoRotate || markets.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % markets.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRotate, markets.length]);

  // Resume auto-rotate after 5 seconds of manual interaction
  useEffect(() => {
    if (!autoRotate) {
      const timeout = setTimeout(() => setAutoRotate(true), 5000);
      return () => clearTimeout(timeout);
    }
  }, [autoRotate]);

  // Early returns AFTER all hooks
  if (markets.length === 0) {
    return null;
  }

  const currentMarket = markets[currentIndex];
  if (!currentMarket) return null;

  const yp = parseFloat(currentMarket.yesPrice);
  const np = parseFloat(currentMarket.noPrice);

  // Build 30-day price chart data
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (30 - i));
    return {
      time: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      yes: yp + Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10,
      no: np - Math.sin(i * 0.3) * 15 - (Math.random() - 0.5) * 10,
    };
  });

  const handlePrev = () => {
    setAutoRotate(false);
    setCurrentIndex((prev) => (prev - 1 + markets.length) % markets.length);
  };

  const handleNext = () => {
    setAutoRotate(false);
    setCurrentIndex((prev) => (prev + 1) % markets.length);
  };

  const formatDate = (d: Date | string) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatVolume = (v: string | number) => {
    const n = parseFloat(String(v));
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  };

  return (
    <div className="w-full mb-8">
      {/* Market Count Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-['Orbitron'] font-bold text-foreground tracking-wider">
          <span className="neon-cyan">{totalMarketsCount}</span> MARKETS FOUND
        </h2>
        <div className="text-[10px] sm:text-xs text-muted-foreground font-['Rajdhani'] tracking-widest">
          TRENDING • AUTO-ROTATING
        </div>
      </div>

      {/* Slider Container */}
      <div className="cyber-card hud-bracket rounded p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left: Market Info */}
          <div className="lg:col-span-1 flex flex-col justify-between">
            {/* Category & Status */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-[10px] font-['Rajdhani'] font-semibold tracking-widest px-2 py-0.5 rounded uppercase text-[oklch(0.78_0.18_195)] bg-[oklch(0.78_0.18_195/0.1)] border border-[oklch(0.78_0.18_195/0.3)]">
                {currentMarket.category}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-['Rajdhani'] font-semibold tracking-widest px-2 py-0.5 rounded text-[oklch(0.72_0.22_330)] bg-[oklch(0.72_0.22_330/0.1)] border border-[oklch(0.72_0.22_330/0.3)]">
                <TrendingUp className="w-2.5 h-2.5" />
                TRENDING
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-['Orbitron'] font-bold text-foreground leading-snug mb-4 line-clamp-3">
              {currentMarket.title}
            </h3>

            {/* Market Details */}
            <div className="space-y-2 mb-4 text-xs sm:text-sm text-muted-foreground font-['Rajdhani'] tracking-wide">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Closes {formatDate(currentMarket.closesAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold">VOLUME:</span>
                <span className="neon-cyan">{formatVolume(currentMarket.volume)}</span>
              </div>
            </div>

            {/* YES/NO Buttons */}
            <div className="flex gap-2 mb-4">
              <button className="btn-yes text-xs sm:text-sm font-['Rajdhani'] font-bold tracking-wider px-3 py-2 rounded flex-1">
                YES {yp}¢
              </button>
              <button className="btn-no text-xs sm:text-sm font-['Rajdhani'] font-bold tracking-wider px-3 py-2 rounded flex-1">
                NO {np}¢
              </button>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-[oklch(0.78_0.18_195/0.4)] transition-all rounded flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center text-[10px] text-muted-foreground font-['Rajdhani'] tracking-widest">
                {currentIndex + 1} / {markets.length}
              </div>
              <button
                onClick={handleNext}
                className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-[oklch(0.78_0.18_195/0.4)] transition-all rounded flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Live Chart */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs sm:text-sm font-['Orbitron'] font-bold text-foreground tracking-wider">
                LIVE <span className="neon-cyan">PROBABILITY</span>
              </h4>
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-['Rajdhani'] tracking-widest">
                <span className="flex items-center gap-1 text-[oklch(0.75_0.18_145)]">
                  <span className="w-2 h-0.5 bg-[oklch(0.75_0.18_145)] inline-block" /> YES
                </span>
                <span className="flex items-center gap-1 text-[oklch(0.65_0.22_15)]">
                  <span className="w-2 h-0.5 bg-[oklch(0.65_0.22_15)] inline-block" /> NO
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="yesGradSlider" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.75 0.18 145)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.75 0.18 145)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="noGradSlider" x1="0" y1="0" x2="0" y2="1">
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
                    `${val.toFixed(1)}¢`,
                    name.toUpperCase(),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="yes"
                  stroke="oklch(0.75 0.18 145)"
                  strokeWidth={2}
                  fill="url(#yesGradSlider)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="no"
                  stroke="oklch(0.65 0.22 15)"
                  strokeWidth={1.5}
                  fill="url(#noGradSlider)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Indicator Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {markets.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx);
              setAutoRotate(false);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex
                ? "bg-[oklch(0.78_0.18_195)] w-6"
                : "bg-[oklch(0.22_0.04_240)] hover:bg-[oklch(0.55_0.04_240)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
