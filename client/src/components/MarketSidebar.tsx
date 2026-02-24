import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "wouter";

// Subcategories for each main category
const CATEGORY_SUBCATEGORIES: Record<string, { label: string; value: string }[]> = {
  politics: [
    { label: "All markets", value: "all" },
    { label: "US Elections", value: "us-elections" },
    { label: "International", value: "international" },
    { label: "Congress", value: "congress" },
    { label: "SOTU", value: "sotu" },
    { label: "Trump", value: "trump" },
    { label: "Foreign Elections", value: "foreign-elections" },
    { label: "Local", value: "local" },
  ],
  sports: [
    { label: "All markets", value: "all" },
    { label: "Basketball", value: "basketball" },
    { label: "Football", value: "football" },
    { label: "Soccer", value: "soccer" },
    { label: "Baseball", value: "baseball" },
    { label: "Hockey", value: "hockey" },
    { label: "Tennis", value: "tennis" },
    { label: "Golf", value: "golf" },
    { label: "MMA", value: "mma" },
    { label: "Cricket", value: "cricket" },
    { label: "Esports", value: "esports" },
  ],
  crypto: [
    { label: "All markets", value: "all" },
    { label: "Bitcoin", value: "bitcoin" },
    { label: "Ethereum", value: "ethereum" },
    { label: "Solana", value: "solana" },
    { label: "XRP", value: "xrp" },
    { label: "Dogecoin", value: "dogecoin" },
    { label: "Pre-Market", value: "pre-market" },
  ],
  economics: [
    { label: "All markets", value: "all" },
    { label: "Fed Rates", value: "fed-rates" },
    { label: "Inflation", value: "inflation" },
    { label: "GDP", value: "gdp" },
    { label: "Unemployment", value: "unemployment" },
    { label: "Recession", value: "recession" },
  ],
  climate: [
    { label: "All markets", value: "all" },
    { label: "Temperature", value: "temperature" },
    { label: "Climate change", value: "climate-change" },
    { label: "Daily temperature", value: "daily-temperature" },
    { label: "High temp", value: "high-temp" },
    { label: "Hurricanes", value: "hurricanes" },
    { label: "Natural disasters", value: "natural-disasters" },
    { label: "Snow and rain", value: "snow-and-rain" },
  ],
  tech: [
    { label: "All markets", value: "all" },
    { label: "AI & AGI", value: "ai-agi" },
    { label: "Apple", value: "apple" },
    { label: "Google", value: "google" },
    { label: "Meta", value: "meta" },
    { label: "Tesla", value: "tesla" },
    { label: "Space", value: "space" },
  ],
  entertainment: [
    { label: "All markets", value: "all" },
    { label: "Awards", value: "awards" },
    { label: "Grammys", value: "grammys" },
    { label: "Movies", value: "movies" },
    { label: "Music", value: "music" },
    { label: "Music charts", value: "music-charts" },
    { label: "Television", value: "television" },
    { label: "Video games", value: "video-games" },
  ],
  health: [
    { label: "All markets", value: "all" },
    { label: "FDA Approvals", value: "fda-approvals" },
    { label: "Vaccines", value: "vaccines" },
    { label: "Pharma", value: "pharma" },
    { label: "Clinical Trials", value: "clinical-trials" },
  ],
};

interface MarketSidebarProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
}

export default function MarketSidebar({ selectedCategory, selectedSubcategory }: MarketSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    selectedCategory ? new Set([selectedCategory]) : new Set()
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="w-56 bg-[oklch(0.08_0.012_270)] border-r border-border p-4 space-y-2 h-screen overflow-y-auto sticky top-0">
      {/* All Markets Link */}
      <Link href="/markets">
        <div className={`px-3 py-2 rounded text-sm font-['Rajdhani'] font-semibold tracking-wide cursor-pointer transition-colors ${
          !selectedCategory
            ? "text-[oklch(0.78_0.18_195)] bg-[oklch(0.78_0.18_195/0.1)]"
            : "text-muted-foreground hover:text-foreground"
        }`}>
          All markets
        </div>
      </Link>

      {/* Category Groups */}
      {Object.entries(CATEGORY_SUBCATEGORIES).map(([category, subcategories]) => {
        const isExpanded = expandedCategories.has(category);
        const isSelected = selectedCategory === category;

        return (
          <div key={category} className="space-y-1">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm font-['Rajdhani'] font-semibold tracking-wide transition-colors ${
                isSelected
                  ? "text-[oklch(0.78_0.18_195)] bg-[oklch(0.78_0.18_195/0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.78_0.18_195/0.05)]"
              }`}
            >
              <span className="capitalize">{category}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>

            {/* Subcategories */}
            {isExpanded && (
              <div className="pl-2 space-y-1 border-l border-[oklch(0.78_0.18_195/0.2)]">
                {subcategories.map((sub) => (
                  <Link
                    key={sub.value}
                    href={`/markets?category=${category}&subcategory=${sub.value}`}
                  >
                    <div
                      className={`px-3 py-1.5 rounded text-xs font-['Rajdhani'] tracking-wide cursor-pointer transition-colors ${
                        selectedSubcategory === sub.value
                          ? "text-[oklch(0.72_0.22_330)] bg-[oklch(0.72_0.22_330/0.1)]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sub.label}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
