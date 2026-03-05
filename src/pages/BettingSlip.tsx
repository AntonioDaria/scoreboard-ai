import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookmarkPlus, Lock, Loader2, ChevronDown, ChevronUp, BookmarkCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { Slip } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";

const API_BASE = "http://localhost:8000";

async function lockSlip(slipId: number, token: string): Promise<Slip> {
  const res = await fetch(`${API_BASE}/slips/${slipId}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to lock slip");
  return res.json();
}

const BettingSlip = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [expandedSlip, setExpandedSlip] = useState<number | null>(null);
  const [stakes, setStakes] = useState<Record<number, string>>({});
  const [newSlipName, setNewSlipName] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: slips = [], isLoading } = useQuery({
    queryKey: ["slips", token],
    queryFn: () => api.fetchMySlips(token!),
    enabled: !!token,
  });

  const { data: slipDetail } = useQuery({
    queryKey: ["slip", expandedSlip, token],
    queryFn: () => api.fetchSlip(expandedSlip!, token!),
    enabled: !!expandedSlip && !!token,
  });

  const lockMutation = useMutation({
    mutationFn: (slipId: number) => lockSlip(slipId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slip", expandedSlip] });
    },
  });

  const handleCreateSlip = async () => {
    if (!token || !newSlipName.trim()) return;
    setCreating(true);
    try {
      await api.createSlip(newSlipName.trim(), token);
      setNewSlipName("");
      queryClient.invalidateQueries({ queryKey: ["slips"] });
    } finally {
      setCreating(false);
    }
  };

  if (!token) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Lock className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Sign in</Link> to view your betting slips
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Betting <span className="text-primary">Slips</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Collect your predictions into a slip, set your total stake, and see potential returns.
        </p>
      </motion.div>

      {/* Create new slip */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Name your slip..."
          value={newSlipName}
          onChange={(e) => setNewSlipName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateSlip()}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={handleCreateSlip}
          disabled={creating || !newSlipName.trim()}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
          New Slip
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : slips.length === 0 ? (
        <div className="py-16 text-center">
          <BookmarkCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">No slips yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a prediction on a match page and tap <strong>Add to Slip</strong>.
          </p>
          <Link to="/fixtures" className="mt-3 inline-block text-sm text-primary hover:underline">
            Browse matches
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {slips.map((slip) => {
            const isExpanded = expandedSlip === slip.id;
            const detail = isExpanded ? slipDetail : null;
            const stake = parseFloat(stakes[slip.id] ?? "10") || 10;
            const n = detail?.items.length ?? 1;
            const sumOdds = detail?.items.reduce((acc, item) => acc + item.odds, 0) ?? 0;
            const perItemStake = stake / n;
            const totalReturn = perItemStake * sumOdds;

            return (
              <motion.div
                key={slip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-xl border border-border/50 bg-card"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedSlip(isExpanded ? null : slip.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div>
                    <p className="font-display font-semibold text-foreground">{slip.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created {new Date(slip.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Detail */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-5 py-4">
                    {!detail ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : detail.items.length === 0 ? (
                      <p className="py-2 text-sm text-muted-foreground">
                        No predictions yet. Go to a match page and tap <strong>Add to Slip</strong>.
                      </p>
                    ) : (
                      <>
                        {/* Predictions list */}
                        <div className="space-y-2 mb-5">
                          {detail.items.map((item) => {
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between rounded-lg bg-muted/20 px-4 py-3 text-sm"
                              >
                                <div>
                                  {item.prediction ? (
                                    <>
                                      <p className="font-medium text-foreground">
                                        {item.prediction.home_team} vs {item.prediction.away_team}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        Predicted: {item.prediction.predicted_home_score}–{item.prediction.predicted_away_score} · {item.prediction.suggested_bet} · Odds {item.odds.toFixed(2)}x
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="font-medium text-foreground">Prediction #{item.prediction_id}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">Odds: {item.odds.toFixed(2)}x</p>
                                    </>
                                  )}
                                </div>
                                <p className="font-display font-bold text-primary">
                                  £{(perItemStake * item.odds).toFixed(2)}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Stake input */}
                        <div className="mb-5 rounded-xl border border-border/50 bg-muted/10 p-4">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Stake</p>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">£</span>
                            <input
                              type="number"
                              min="1"
                              value={stakes[slip.id] ?? "10"}
                              onChange={(e) => setStakes((s) => ({ ...s, [slip.id]: e.target.value }))}
                              disabled={!!detail.exported_at}
                              className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none disabled:opacity-50"
                            />
                            <span className="text-xs text-muted-foreground">
                              split across {detail.items.length} prediction{detail.items.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="flex items-center justify-between border-t border-border/50 pt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Total potential return</p>
                            <p className="font-display text-2xl font-bold text-primary">
                              £{totalReturn.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Stake £{stake.toFixed(2)} · avg odds {(sumOdds / n).toFixed(2)}x
                            </p>
                          </div>
                          {!detail.exported_at ? (
                            <button
                              onClick={() => lockMutation.mutate(slip.id)}
                              disabled={lockMutation.isPending}
                              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                              {lockMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                              Lock Slip
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground">
                              <Lock className="h-4 w-4" />
                              Locked
                            </div>
                          )}
                        </div>

                        {detail.exported_at && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Locked on {new Date(detail.exported_at).toLocaleString("en-GB")}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default BettingSlip;
