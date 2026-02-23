import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const markets = [
  // Politics
  {
    slug: "us-president-2028-democrat",
    title: "Will a Democrat win the 2028 US Presidential Election?",
    description: "Resolves YES if the Democratic Party candidate wins the 2028 US Presidential Election.",
    category: "politics",
    yesPrice: "52.00",
    noPrice: "48.00",
    volume: "1250000.00",
    openInterest: "340000.00",
    closesAt: new Date("2028-11-05"),
    resolutionCriteria: "Resolves YES if the Democratic Party candidate is declared the winner of the 2028 US Presidential Election by major news organizations.",
    isTrending: true,
    status: "open",
  },
  {
    slug: "uk-general-election-2025",
    title: "Will Labour retain power in the next UK General Election?",
    description: "Resolves YES if the Labour Party wins the most seats in the next UK General Election.",
    category: "politics",
    yesPrice: "61.00",
    noPrice: "39.00",
    volume: "890000.00",
    openInterest: "210000.00",
    closesAt: new Date("2029-01-01"),
    resolutionCriteria: "Resolves YES if Labour wins the most seats in the next UK General Election.",
    isTrending: false,
    status: "open",
  },
  {
    slug: "un-security-council-reform-2026",
    title: "Will the UN Security Council be reformed by end of 2026?",
    description: "Resolves YES if a formal resolution to expand permanent UNSC membership passes.",
    category: "politics",
    yesPrice: "12.00",
    noPrice: "88.00",
    volume: "45000.00",
    openInterest: "12000.00",
    closesAt: new Date("2026-12-31"),
    resolutionCriteria: "Resolves YES if a formal UN General Assembly resolution to reform the Security Council passes with 2/3 majority.",
    isTrending: false,
    status: "open",
  },
  // Sports
  {
    slug: "nba-championship-2026-lakers",
    title: "Will the LA Lakers win the 2026 NBA Championship?",
    description: "Resolves YES if the Los Angeles Lakers win the 2026 NBA Finals.",
    category: "sports",
    yesPrice: "18.00",
    noPrice: "82.00",
    volume: "2100000.00",
    openInterest: "560000.00",
    closesAt: new Date("2026-06-30"),
    resolutionCriteria: "Resolves YES if the LA Lakers are crowned NBA Champions at the end of the 2025-26 season.",
    isTrending: true,
    status: "open",
  },
  {
    slug: "world-cup-2026-brazil",
    title: "Will Brazil win the 2026 FIFA World Cup?",
    description: "Resolves YES if Brazil wins the 2026 FIFA World Cup hosted in USA/Canada/Mexico.",
    category: "sports",
    yesPrice: "22.00",
    noPrice: "78.00",
    volume: "3400000.00",
    openInterest: "890000.00",
    closesAt: new Date("2026-07-19"),
    resolutionCriteria: "Resolves YES if Brazil wins the final match of the 2026 FIFA World Cup.",
    isTrending: true,
    status: "open",
  },
  {
    slug: "wimbledon-2026-djokovic",
    title: "Will Djokovic win Wimbledon 2026?",
    description: "Resolves YES if Novak Djokovic wins the 2026 Wimbledon Championships.",
    category: "sports",
    yesPrice: "35.00",
    noPrice: "65.00",
    volume: "780000.00",
    openInterest: "190000.00",
    closesAt: new Date("2026-07-12"),
    resolutionCriteria: "Resolves YES if Novak Djokovic wins the Men's Singles title at Wimbledon 2026.",
    isTrending: false,
    status: "open",
  },
  // Crypto
  {
    slug: "bitcoin-100k-2026",
    title: "Will Bitcoin exceed $150,000 before end of 2026?",
    description: "Resolves YES if BTC/USD closes above $150,000 on any major exchange before December 31, 2026.",
    category: "crypto",
    yesPrice: "67.00",
    noPrice: "33.00",
    volume: "5600000.00",
    openInterest: "1200000.00",
    closesAt: new Date("2026-12-31"),
    resolutionCriteria: "Resolves YES if the BTC/USD price on Coinbase or Binance closes above $150,000 at any point before December 31, 2026.",
    isTrending: true,
    status: "open",
  },
  {
    slug: "ethereum-etf-approval-2026",
    title: "Will a spot Ethereum ETF launch in the EU by mid-2026?",
    description: "Resolves YES if a spot Ethereum ETF is approved and begins trading in the European Union by June 30, 2026.",
    category: "crypto",
    yesPrice: "44.00",
    noPrice: "56.00",
    volume: "890000.00",
    openInterest: "230000.00",
    closesAt: new Date("2026-06-30"),
    resolutionCriteria: "Resolves YES if a spot Ethereum ETF begins trading on a major EU exchange by June 30, 2026.",
    isTrending: false,
    status: "open",
  },
  {
    slug: "solana-top3-marketcap-2026",
    title: "Will Solana be in the top 3 crypto by market cap in 2026?",
    description: "Resolves YES if Solana ranks in the top 3 cryptocurrencies by market cap at any point in 2026.",
    category: "crypto",
    yesPrice: "58.00",
    noPrice: "42.00",
    volume: "1100000.00",
    openInterest: "310000.00",
    closesAt: new Date("2026-12-31"),
    resolutionCriteria: "Resolves YES if SOL ranks #3 or higher by market cap on CoinMarketCap at any point during 2026.",
    isTrending: true,
    status: "open",
  },
  // Economics
  {
    slug: "us-recession-2026",
    title: "Will the US enter a recession in 2026?",
    description: "Resolves YES if the US economy experiences two consecutive quarters of negative GDP growth in 2026.",
    category: "economics",
    yesPrice: "31.00",
    noPrice: "69.00",
    volume: "2300000.00",
    openInterest: "670000.00",
    closesAt: new Date("2026-12-31"),
    resolutionCriteria: "Resolves YES if the BEA reports two consecutive quarters of negative real GDP growth in 2026.",
    isTrending: true,
    status: "open",
  },
  {
    slug: "fed-rate-cut-q2-2026",
    title: "Will the Fed cut rates in Q2 2026?",
    description: "Resolves YES if the Federal Reserve cuts the federal funds rate at any FOMC meeting in Q2 2026.",
    category: "economics",
    yesPrice: "72.00",
    noPrice: "28.00",
    volume: "1800000.00",
    openInterest: "450000.00",
    closesAt: new Date("2026-06-30"),
    resolutionCriteria: "Resolves YES if the FOMC votes to lower the target federal funds rate at any meeting in April, May, or June 2026.",
    isTrending: false,
    status: "open",
  },
  // Climate
  {
    slug: "global-temp-record-2026",
    title: "Will 2026 set a new global temperature record?",
    description: "Resolves YES if 2026 is confirmed as the hottest year on record by NASA or NOAA.",
    category: "climate",
    yesPrice: "55.00",
    noPrice: "45.00",
    volume: "670000.00",
    openInterest: "180000.00",
    closesAt: new Date("2027-03-01"),
    resolutionCriteria: "Resolves YES if NASA GISS or NOAA confirms 2026 as the warmest year in their global surface temperature record.",
    isTrending: false,
    status: "open",
  },
  {
    slug: "arctic-sea-ice-minimum-2026",
    title: "Will Arctic sea ice hit a new minimum in September 2026?",
    description: "Resolves YES if Arctic sea ice extent reaches a new record low in September 2026.",
    category: "climate",
    yesPrice: "38.00",
    noPrice: "62.00",
    volume: "320000.00",
    openInterest: "89000.00",
    closesAt: new Date("2026-10-01"),
    resolutionCriteria: "Resolves YES if NSIDC reports a new all-time minimum Arctic sea ice extent in September 2026.",
    isTrending: false,
    status: "open",
  },
  // Tech
  {
    slug: "agi-announced-2026",
    title: "Will any major AI lab announce AGI by end of 2026?",
    description: "Resolves YES if OpenAI, Google DeepMind, Anthropic, or Meta officially claims to have achieved AGI.",
    category: "tech",
    yesPrice: "23.00",
    noPrice: "77.00",
    volume: "4200000.00",
    openInterest: "1100000.00",
    closesAt: new Date("2026-12-31"),
    resolutionCriteria: "Resolves YES if a major AI lab (OpenAI, Google DeepMind, Anthropic, or Meta) makes an official public announcement claiming AGI has been achieved.",
    isTrending: true,
    status: "open",
  },
  {
    slug: "apple-ar-glasses-2026",
    title: "Will Apple release standalone AR glasses in 2026?",
    description: "Resolves YES if Apple releases a standalone AR glasses product (not Vision Pro) in 2026.",
    category: "tech",
    yesPrice: "41.00",
    noPrice: "59.00",
    volume: "1500000.00",
    openInterest: "380000.00",
    closesAt: new Date("2026-12-31"),
    resolutionCriteria: "Resolves YES if Apple officially releases and begins selling a standalone AR glasses product in 2026.",
    isTrending: false,
    status: "open",
  },
  // Health
  {
    slug: "mrna-cancer-vaccine-2026",
    title: "Will an mRNA cancer vaccine receive FDA approval in 2026?",
    description: "Resolves YES if the FDA grants full approval to any mRNA-based cancer vaccine in 2026.",
    category: "health",
    yesPrice: "29.00",
    noPrice: "71.00",
    volume: "890000.00",
    openInterest: "240000.00",
    closesAt: new Date("2026-12-31"),
    resolutionCriteria: "Resolves YES if the FDA grants full (not emergency) approval to any mRNA-based cancer vaccine by December 31, 2026.",
    isTrending: true,
    status: "open",
  },
  // Entertainment
  {
    slug: "oscars-2026-best-picture",
    title: "Will an AI-assisted film win Best Picture at the 2027 Oscars?",
    description: "Resolves YES if a film that used AI in its production wins Best Picture at the 99th Academy Awards.",
    category: "entertainment",
    yesPrice: "47.00",
    noPrice: "53.00",
    volume: "560000.00",
    openInterest: "140000.00",
    closesAt: new Date("2027-03-31"),
    resolutionCriteria: "Resolves YES if the Best Picture winner at the 99th Academy Awards is publicly confirmed to have used AI tools in its production.",
    isTrending: false,
    status: "open",
  },
];

// Generate price history for each market
function generatePriceHistory(marketId, yesPrice, days = 60) {
  const history = [];
  let price = parseFloat(yesPrice) + (Math.random() - 0.5) * 20;
  price = Math.max(5, Math.min(95, price));
  
  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 4;
    price = Math.max(2, Math.min(98, price + change));
    history.push({
      marketId,
      yesPrice: price.toFixed(2),
      noPrice: (100 - price).toFixed(2),
      recordedAt: new Date(Date.now() - i * 24 * 3600 * 1000),
    });
  }
  return history;
}

try {
  console.log("🌱 Seeding markets...");
  
  for (const market of markets) {
    // Check if market already exists
    const existing = await connection.execute(
      "SELECT id FROM markets WHERE slug = ?",
      [market.slug]
    );
    
    if (existing[0].length > 0) {
      console.log(`  ⏭  Skipping existing market: ${market.slug}`);
      continue;
    }
    
    // Insert market
    const [result] = await connection.execute(
      `INSERT INTO markets (slug, title, description, category, yesPrice, noPrice, volume, openInterest, closesAt, resolutionCriteria, isTrending, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        market.slug,
        market.title,
        market.description,
        market.category,
        market.yesPrice,
        market.noPrice,
        market.volume,
        market.openInterest,
        market.closesAt,
        market.resolutionCriteria,
        market.isTrending ? 1 : 0,
        market.status,
      ]
    );
    
    const marketId = result.insertId;
    
    // Insert price history
    const history = generatePriceHistory(marketId, market.yesPrice);
    for (const h of history) {
      await connection.execute(
        `INSERT INTO market_prices (marketId, yesPrice, noPrice, recordedAt) VALUES (?, ?, ?, ?)`,
        [h.marketId, h.yesPrice, h.noPrice, h.recordedAt]
      );
    }
    
    console.log(`  ✅ Created market: ${market.title.substring(0, 50)}...`);
  }
  
  console.log("\n✅ Seeding complete!");
} catch (err) {
  console.error("❌ Seed error:", err.message);
} finally {
  await connection.end();
}
