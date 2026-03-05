import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Zap, Trophy, Target, TrendingUp } from "lucide-react";
import { fixtures, leagues } from "@/data/mockData";
import FixtureCard from "@/components/FixtureCard";
import Layout from "@/components/Layout";

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: fetch fixtures from API-Football
  const filteredFixtures = fixtures.filter((f) => {
    const matchesLeague = selectedLeague === "All" || f.league === selectedLeague;
    const matchesSearch =
      !searchQuery ||
      f.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLeague && matchesSearch;
  });

  const grouped = filteredFixtures.reduce(
    (acc, fixture) => {
      if (!acc[fixture.league]) acc[fixture.league] = [];
      acc[fixture.league].push(fixture);
      return acc;
    },
    {} as Record<string, typeof fixtures>
  );

  return (
    <Layout>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-secondary/5 p-6 sm:p-8">
          <div className="relative z-10">
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Match <span className="text-primary">Predictions</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
              AI-powered football match predictions across Europe's top 5 leagues.
              Pick a match and let our engine do the analysis.
            </p>

            {/* Quick stats */}
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { icon: Trophy, label: "5 Leagues", color: "text-primary" },
                { icon: Target, label: "64% Accuracy", color: "text-secondary" },
                { icon: TrendingUp, label: "12 Fixtures", color: "text-primary" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-medium"
                >
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  <span className="text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-secondary/5 blur-3xl" />
        </div>
      </motion.div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* League pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          {leagues.map((league) => (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                selectedLeague === league
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                  : "border border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {league}
            </button>
          ))}
        </div>
      </div>

      {/* Fixture list grouped by league */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([league, leagueFixtures]) => (
          <div key={league}>
            <div className="mb-3 flex items-center gap-3">
              <img
                src={leagueFixtures[0].leagueLogo}
                alt={league}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <h2 className="font-display text-lg font-semibold text-foreground">
                {league}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {leagueFixtures.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {leagueFixtures.map((fixture, i) => (
                <FixtureCard key={fixture.id} fixture={fixture} index={i} />
              ))}
            </div>
          </div>
        ))}

        {filteredFixtures.length === 0 && (
          <div className="py-16 text-center">
            <Zap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">No matches found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
