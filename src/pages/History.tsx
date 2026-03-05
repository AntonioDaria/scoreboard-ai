import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Target, Flame, CheckCircle2, XCircle, Clock, Filter, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyPredictions } from "@/lib/api";
import type { UserPrediction } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";

const ALL_LEAGUES = ["All", "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"];

const History = () => {
  const [leagueFilter, setLeagueFilter] = useState("All");
  const { token } = useAuth();

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ["predictions", token],
    queryFn: () => fetchMyPredictions(token!),
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  const filtered = predictions.filter(
    (p: UserPrediction) => leagueFilter === "All" || p.league === leagueFilter
  );

  const total = predictions.length;
  const correct = 0;
  const incorrect = 0;

  const statCards = [
    { icon: Target, label: "Predictions", value: total.toString(), color: "text-primary", bg: "bg-primary/10" },
    { icon: CheckCircle2, label: "Correct", value: correct.toString(), color: "text-win", bg: "bg-win/10" },
    { icon: XCircle, label: "Incorrect", value: incorrect.toString(), color: "text-loss", bg: "bg-loss/10" },
    { icon: Flame, label: "This Season", value: total.toString(), color: "text-draw", bg: "bg-draw/10" },
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Prediction <span className="text-primary">History</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your AI-generated predictions
        </p>
      </motion.div>

      {!token ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-display text-lg font-semibold text-foreground">Sign in to view your predictions</p>
          <p className="text-sm text-muted-foreground">Your prediction history is saved to your account</p>
          <Link
            to="/login"
            className="mt-2 rounded-xl bg-primary px-6 py-2.5 font-display text-sm font-semibold text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.3)] hover:bg-primary/90"
          >
            Sign In
          </Link>
        </motion.div>
      ) : (
        <>
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
                <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Filter */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
            {ALL_LEAGUES.map((league) => (
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
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No predictions yet — go pick a match!</p>
              </div>
            ) : (
              <>
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
                      {filtered.map((pred: UserPrediction) => (
                        <tr key={pred.id} className="border-b border-border/30 transition-colors hover:bg-muted/20">
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(pred.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {pred.home_team} vs {pred.away_team}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{pred.league ?? "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="rounded bg-muted px-2 py-0.5 font-display font-bold text-foreground">
                              {pred.predicted_home_score} - {pred.predicted_away_score}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Clock className="mx-auto h-4 w-4 text-muted-foreground" />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{pred.suggested_bet}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-draw/10 px-2.5 py-0.5 text-xs font-medium text-draw">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 p-3 md:hidden">
                  {filtered.map((pred: UserPrediction) => (
                    <div key={pred.id} className="rounded-lg border border-border/30 bg-muted/10 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(pred.created_at).toLocaleDateString()}
                        </span>
                        <span className="rounded-full bg-draw/10 px-2 py-0.5 text-xs font-medium text-draw">
                          Pending
                        </span>
                      </div>
                      <p className="font-display text-sm font-semibold text-foreground">
                        {pred.home_team} vs {pred.away_team}
                      </p>
                      <p className="text-xs text-muted-foreground">{pred.league ?? "—"}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Predicted</p>
                          <span className="font-display text-sm font-bold text-foreground">
                            {pred.predicted_home_score}-{pred.predicted_away_score}
                          </span>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-[10px] text-muted-foreground">Bet</p>
                          <span className="text-xs text-muted-foreground">{pred.suggested_bet}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </Layout>
  );
};

export default History;
