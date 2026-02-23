import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Activity, BarChart2, Menu, Trophy, Wallet, X, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navLinks = [
  { href: "/markets", label: "MARKETS", icon: BarChart2 },
  { href: "/portfolio", label: "PORTFOLIO", icon: Activity },
  { href: "/leaderboard", label: "LEADERBOARD", icon: Trophy },
  { href: "/wallet", label: "WALLET", icon: Wallet },
];

export default function TopNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-[oklch(0.06_0.01_270/0.95)] backdrop-blur-md">
      {/* Top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[oklch(0.78_0.18_195)] to-transparent opacity-60" />

      <div className="container flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-[oklch(0.78_0.18_195/0.15)] rounded border border-[oklch(0.78_0.18_195/0.4)] group-hover:border-[oklch(0.78_0.18_195/0.8)] transition-all" />
            <Zap className="w-4 h-4 text-[oklch(0.78_0.18_195)] relative z-10" />
          </div>
          <span className="font-['Orbitron'] font-bold text-lg tracking-widest neon-cyan hidden sm:block">
            PREDICT<span className="neon-pink">X</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || location.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-['Rajdhani'] font-semibold tracking-widest transition-all rounded ${
                  isActive
                    ? "text-[oklch(0.78_0.18_195)] bg-[oklch(0.78_0.18_195/0.1)] border border-[oklch(0.78_0.18_195/0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.78_0.18_195/0.05)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-muted-foreground font-['Rajdhani'] tracking-wide">
                {user?.name ?? "TRADER"}
              </span>
              <button
                onClick={() => logout()}
                className="text-xs px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-[oklch(0.78_0.18_195/0.4)] transition-all rounded font-['Rajdhani'] font-semibold tracking-widest"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <a
              href={getLoginUrl()}
              className="text-xs px-4 py-1.5 bg-[oklch(0.78_0.18_195/0.15)] border border-[oklch(0.78_0.18_195/0.5)] text-[oklch(0.78_0.18_195)] hover:bg-[oklch(0.78_0.18_195/0.25)] hover:shadow-[0_0_12px_oklch(0.78_0.18_195/0.4)] transition-all rounded font-['Rajdhani'] font-semibold tracking-widest"
            >
              CONNECT
            </a>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground p-1"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-[oklch(0.07_0.012_270)] px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-['Rajdhani'] font-semibold tracking-widest text-muted-foreground hover:text-foreground hover:bg-[oklch(0.78_0.18_195/0.05)] rounded transition-all"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
