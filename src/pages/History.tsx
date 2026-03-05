import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, Flame, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import { predictionHistory, leagues } from "@/data/mockData";
import Layout from "@/components/Layout";

const History = () => {
  const [leagueFilter, setLeagueFilter] = useState("All");

  // TODO: fetch prediction history from database
  const filtered = predictionHistory.filter(
    (p) => leagueFilter === "All" || p.league === leagueFilter
  );

  const correct = predictionHistory.filter((p) => p.outcome === "correct").length;
  const incorrect = predictionHistory.filter((p) => p.outcome === "incorrect").length;
  const total = predictionHistory.length;
  const accuracy = Math.round((correct / total) * 100);

  // Calculate streak
  let streak = 0;
  for (const p of predictionHistory) {
    if (p.outcome === "correct") streak++;
    else break;
  }

  const statCards = [
    {
      icon: Target,
      label: "Accuracy",
      value: `${accuracy}%`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: CheckCircle2,
      label: "Correct",
      value: correct.toString(),
      color: "text-win",
      bg: "bg-win/10",
    },
    {
      icon: XCircle,
      label: "Incorrect",
      value: incorrect.toString(),
      color: "text-loss",
      bg: "bg-loss/10",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: streak.toString(),
      color: "text-draw",
      bg: "bg-draw/10",
    },
  ];

  return (
    <Layout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Prediction <span className="text-primary">History</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your prediction accuracy over time
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="overflow-hidden rounded-xl border border-border/50 bg-card p-4"
          >
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`font-display text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
        {leagues.map((league) => (
          <button
            key={league}
            onClick={() => setLeagueFilter(league)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              leagueFilter === league
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-muted/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            {league}
          </button>
        ))}
      </div>

      {/* History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 overflow-hidden rounded-xl border border-border/50 bg-card"
      >
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Match</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">League</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Predicted</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actual</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bet</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Result</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pred) => (
                <tr key={pred.id} className="border-b border-border/30 transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{pred.date}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {pred.homeTeam} vs {pred.awayTeam}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{pred.league}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded bg-muted px-2 py-0.5 font-display font-bold text-foreground">
                      {pred.predictedHome} - {pred.predictedAway}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pred.actualHome !== null ? (
                      <span className="rounded bg-muted px-2 py-0.5 font-display font-bold text-foreground">
                        {pred.actualHome} - {pred.actualAway}
                      </span>
                    ) : (
                      <Clock className="mx-auto h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{pred.suggestedBet}</td>
                  <td className="px-4 py-3 text-center">
                    {pred.outcome === "correct" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-win/10 px-2.5 py-0.5 text-xs font-medium text-win">
                        <CheckCircle2 className="h-3 w-3" /> ✓
                      </span>
                    )}
                    {pred.outcome === "incorrect" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-loss/10 px-2.5 py-0.5 text-xs font-medium text-loss">
                        <XCircle className="h-3 w-3" /> ✗
                      </span>
                    )}
                    {pred.outcome === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-draw/10 px-2.5 py-0.5 text-xs font-medium text-draw">
                        <Clock className="h-3 w-3" /> —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-3 md:hidden">
          {filtered.map((pred) => (
            <div key={pred.id} className="rounded-lg border border-border/30 bg-muted/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{pred.date}</span>
                {pred.outcome === "correct" && (
                  <span className="rounded-full bg-win/10 px-2 py-0.5 text-xs font-medium text-win">✓</span>
                )}
                {pred.outcome === "incorrect" && (
                  <span className="rounded-full bg-loss/10 px-2 py-0.5 text-xs font-medium text-loss">✗</span>
                )}
              </div>
              <p className="font-display text-sm font-semibold text-foreground">
                {pred.homeTeam} vs {pred.awayTeam}
              </p>
              <p className="text-xs text-muted-foreground">{pred.league}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Predicted</p>
                  <span className="font-display text-sm font-bold text-foreground">
                    {pred.predictedHome}-{pred.predictedAway}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Actual</p>
                  <span className="font-display text-sm font-bold text-foreground">
                    {pred.actualHome ?? "?"}-{pred.actualAway ?? "?"}
                  </span>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-muted-foreground">Bet</p>
                  <span className="text-xs text-muted-foreground">{pred.suggestedBet}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
};

export default History;
