import MarketCard from "@/components/MarketCard";
import TrendingMarketSlider from "@/components/TrendingMarketSlider";
import { trpc } from "@/lib/trpc";
import { BarChart2, Flame, Search, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearch } from "wouter";

const CATEGORIES = [
  { id: "all", label: "ALL", icon: "⚡" },
  { id: "politics", label: "POLITICS", icon: "🏛" },
  { id: "sports", label: "SPORTS", icon: "⚽" },
  { id: "crypto", label: "CRYPTO", icon: "₿" },
  { id: "economics", label: "ECONOMICS", icon: "📈" },
  { id: "climate", label: "CLIMATE", icon: "🌍" },
  { id: "tech", label: "TECH", icon: "💻" },
  { id: "entertainment", label: "ENTERTAINMENT", icon: "🎬" },
  { id: "health", label: "HEALTH", icon: "🧬" },
];

const FILTERS = [
  { id: "all", label: "ALL", icon: BarChart2 },
  { id: "trending", label: "TRENDING", icon: TrendingUp },
  { id: "popular", label: "POPULAR", icon: Flame },
  { id: "new", label: "NEW", icon: Sparkles },
] as const;

type FilterType = "all" | "trending" | "popular" | "new";

export default function Markets() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCategory = params.get("category") ?? "all";

  const [category, setCategory] = useState(initialCategory);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(search);
    const cat = p.get("category");
    if (cat) setCategory(cat);
  }, [search]);

  const { data: markets, isLoading } = trpc.markets.list.useQuery({
    category: category === "all" ? undefined : category,
    filter,
    limit: 60,
  });

  const filtered = markets?.filter((m) =>
    searchQuery
      ? m.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-['Orbitron'] font-bold text-foreground">
            PREDICTION <span className="neon-cyan">MARKETS</span>
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-[oklch(0.78_0.18_195)] to-transparent mt-2" />
        </div>

        {/* Search */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="SEARCH MARKETS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-[oklch(0.09_0.015_270)] border border-border text-xs sm:text-sm font-['Rajdhani'] tracking-wide text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.78_0.18_195/0.5)] rounded transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 sm:mb-4 scrollbar-none">
          {CATEGORIES.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-xs font-['Rajdhani'] font-semibold tracking-widest whitespace-nowrap transition-all ${
                category === id
                  ? "bg-[oklch(0.78_0.18_195/0.15)] border border-[oklch(0.78_0.18_195/0.5)] text-[oklch(0.78_0.18_195)]"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-[oklch(0.78_0.18_195/0.3)]"
              }`}
            >
              <span>{icon}</span>
              <span className="hidden xs:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 sm:mb-8">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id as FilterType)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-xs font-['Rajdhani'] font-semibold tracking-widest transition-all ${
                filter === id
                  ? "bg-[oklch(0.72_0.22_330/0.15)] border border-[oklch(0.72_0.22_330/0.5)] text-[oklch(0.72_0.22_330)]"
                  : "border border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden xs:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Trending Market Slider */}
        {!isLoading && filtered && filtered.length > 0 && (
          <TrendingMarketSlider totalMarketsCount={filtered.length} />
        )}

        {/* Markets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="cyber-card rounded p-4 h-48 animate-pulse">
                <div className="h-3 bg-[oklch(0.18_0.03_240)] rounded w-1/3 mb-3" />
                <div className="h-4 bg-[oklch(0.18_0.03_240)] rounded w-full mb-2" />
                <div className="h-4 bg-[oklch(0.18_0.03_240)] rounded w-3/4 mb-4" />
                <div className="h-10 bg-[oklch(0.18_0.03_240)] rounded mb-3" />
                <div className="flex gap-2">
                  <div className="h-7 bg-[oklch(0.18_0.03_240)] rounded w-16" />
                  <div className="h-7 bg-[oklch(0.18_0.03_240)] rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <>
            {/* Note: Market count is now shown in the slider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filtered.map((m) => (
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
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-['Rajdhani'] text-sm tracking-widest">NO MARKETS FOUND</p>
            <p className="text-xs mt-2 opacity-60">Try a different category or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
