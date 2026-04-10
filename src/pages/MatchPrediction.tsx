import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  AlertTriangle,
  Swords,
  Sparkles,
  Loader2,
  BookmarkPlus,
  Check,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { UITeamDetail, H2HRecord, UserPrediction, FormResult } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import FormBadge from "@/components/FormBadge";
import PitchFormation from "@/components/PitchFormation";
import PredictionCard from "@/components/PredictionCard";
import { Button } from "@/components/ui/button";

const MatchPrediction = () => {
  const { id } = useParams<{ id: string }>();
  const fixtureId = parseInt(id ?? "0", 10);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [prediction, setPrediction] = useState<UserPrediction | null>(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState("");

  const [slipLoading, setSlipLoading] = useState(false);
  const [slipAdded, setSlipAdded] = useState(false);
  const [slipError, setSlipError] = useState("");

  const { data: remaining, refetch: refetchRemaining } = useQuery({
    queryKey: ["remaining", token],
    queryFn: () => api.fetchRemainingPredictions(token!),
    enabled: !!token,
    staleTime: 0,
  });

  // 1. Fetch fixture basic info
  const { data: fixture, isLoading: fixtureLoading, isError: fixtureError } = useQuery({
    queryKey: ["fixture", fixtureId],
    queryFn: () => api.fetchFixture(fixtureId),
    enabled: !!fixtureId,
    staleTime: 5 * 60 * 1000,
    retry: 4,
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 15000),
  });

  const homeId = fixture?.homeTeam.id;
  const awayId = fixture?.awayTeam.id;
  const leagueCode = api.LEAGUES.find((l) => l.name === fixture?.league)?.code;

  // 2. Parallel dependent queries
  const { data: homeForm = [] } = useQuery({
    queryKey: ["form", homeId],
    queryFn: () => api.fetchTeamForm(homeId!),
    enabled: !!homeId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: awayForm = [] } = useQuery({
    queryKey: ["form", awayId],
    queryFn: () => api.fetchTeamForm(awayId!),
    enabled: !!awayId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: standings = [] } = useQuery({
    queryKey: ["standings", leagueCode],
    queryFn: () => api.fetchStandings(leagueCode!),
    enabled: !!leagueCode,
    staleTime: 10 * 60 * 1000,
  });

  const { data: h2h = [] } = useQuery({
    queryKey: ["h2h", fixtureId],
    queryFn: () => api.fetchMatchH2H(fixtureId),
    enabled: !!fixtureId,
    staleTime: 5 * 60 * 1000,
  });

  const homeTeamName = fixture?.homeTeam.name;
  const awayTeamName = fixture?.awayTeam.name;
  const matchUtcDate = fixture?.utcDate;

  const { data: lineups } = useQuery({
    queryKey: ["lineups", homeTeamName, awayTeamName, matchUtcDate],
    queryFn: () => api.fetchLineups(homeTeamName!, awayTeamName!, matchUtcDate!, leagueCode),
    enabled: !!homeTeamName && !!awayTeamName && !!matchUtcDate,
    staleTime: 5 * 60 * 1000,
  });

  if (fixtureLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!fixture) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">
            {fixtureError ? "Unable to load match — please try again" : "Match not found"}
          </p>
          <Link to="/fixtures" className="mt-4 inline-block text-primary hover:underline">
            Back to matches
          </Link>
        </div>
      </Layout>
    );
  }

  const homePosition = standings.find((s) => s.teamId === homeId)?.position ?? null;
  const awayPosition = standings.find((s) => s.teamId === awayId)?.position ?? null;

  const homeLineup = lineups?.home;
  const awayLineup = lineups?.away;

  const homeTeamDetail: UITeamDetail = {
    ...fixture.homeTeam,
    leaguePosition: homePosition,
    form: homeForm as FormResult[],
    injuries: [],
    formation: homeLineup?.formation ?? "4-4-2",
    startingXI: homeLineup?.players ?? [],
  };

  const awayTeamDetail: UITeamDetail = {
    ...fixture.awayTeam,
    leaguePosition: awayPosition,
    form: awayForm as FormResult[],
    injuries: [],
    formation: awayLineup?.formation ?? "4-4-2",
    startingXI: awayLineup?.players ?? [],
  };

  // H2H stats
  const homeWins = (h2h as H2HRecord[]).filter(
    (h) =>
      (h.homeTeam === fixture.homeTeam.name && h.homeGoals > h.awayGoals) ||
      (h.awayTeam === fixture.homeTeam.name && h.awayGoals > h.homeGoals)
  ).length;
  const awayWins = (h2h as H2HRecord[]).filter(
    (h) =>
      (h.homeTeam === fixture.awayTeam.name && h.homeGoals > h.awayGoals) ||
      (h.awayTeam === fixture.awayTeam.name && h.awayGoals > h.homeGoals)
  ).length;
  const draws = (h2h as H2HRecord[]).filter((h) => h.homeGoals === h.awayGoals).length;
  const totalGoals = (h2h as H2HRecord[]).reduce((s, h) => s + h.homeGoals + h.awayGoals, 0);
  const h2hCount = h2h.length || 1;

  const handleAddToSlip = async () => {
    if (!token || !prediction) return;
    setSlipError("");
    setSlipLoading(true);
    try {
      const slips = await api.fetchMySlips(token);
      let slipId: number;
      if (slips.length > 0) {
        slipId = slips[0].id;
      } else {
        const newSlip = await api.createSlip("My Slip", token);
        slipId = newSlip.id;
      }
      await api.addToSlip(slipId, prediction.id, 1, token);
      setSlipAdded(true);
    } catch (err) {
      setSlipError(err instanceof Error ? err.message : "Failed to add to slip");
    } finally {
      setSlipLoading(false);
    }
  };

  const handleGeneratePrediction = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    setPredError("");
    setPredLoading(true);
    try {
      const pred = await api.createPrediction(fixtureId, token);
      setPrediction(pred);
      refetchRemaining();
    } catch (err) {
      setPredError(err instanceof Error ? err.message : "Failed to generate prediction");
    } finally {
      setPredLoading(false);
    }
  };

  return (
    <Layout>
      <Link
        to="/fixtures"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to matches
      </Link>

      {/* Match Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-secondary/5 p-6 sm:p-8"
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Home */}
          <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
            <img
              src={fixture.homeTeam.logo}
              alt={fixture.homeTeam.name}
              className="h-20 w-20 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
            <h2 className="font-display text-2xl font-bold text-foreground">
              {fixture.homeTeam.name}
            </h2>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <img
                src={fixture.leagueLogo}
                alt={fixture.league}
                className="h-6 w-6 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              <span className="text-sm font-medium text-muted-foreground">{fixture.league}</span>
            </div>
            <span className="font-display text-3xl font-bold text-muted-foreground">VS</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {fixture.date} · {fixture.time}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {fixture.venue}
            </span>
          </div>

          {/* Away */}
          <div className="flex flex-1 flex-col items-center gap-3 sm:items-end">
            <img
              src={fixture.awayTeam.logo}
              alt={fixture.awayTeam.name}
              className="h-20 w-20 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
            <h2 className="font-display text-2xl font-bold text-foreground">
              {fixture.awayTeam.name}
            </h2>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      </motion.div>

      {/* Team Panels */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {[homeTeamDetail, awayTeamDetail].map((team, idx) => (
          <motion.div
            key={team.name}
            initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-xl border border-border/50 bg-card"
          >
            <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3">
              <img
                src={team.logo}
                alt={team.name}
                className="h-8 w-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              <h3 className="font-display text-lg font-semibold text-foreground">{team.name}</h3>
            </div>

            <div className="space-y-5 p-5">
              {/* Form */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last 5 Form
                </p>
                {team.form.length > 0 ? (
                  <div className="flex gap-1.5">
                    {team.form.map((r, i) => (
                      <FormBadge key={i} result={r} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
              </div>

              {/* Injuries */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Injuries & Suspensions
                </p>
                {(() => {
                  const injuries = idx === 0 ? prediction?.home_injuries : prediction?.away_injuries;
                  if (!prediction) {
                    return <p className="text-sm text-muted-foreground">Available after prediction</p>;
                  }
                  if (!injuries || injuries.length === 0) {
                    return <p className="text-sm text-muted-foreground">No injuries reported</p>;
                  }
                  return (
                    <div className="space-y-1.5">
                      {injuries.map((inj) => (
                        <div key={inj} className="flex items-center gap-2 rounded-lg bg-loss/5 px-3 py-2 text-sm">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-loss" />
                          <span className="text-foreground/80">{inj}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Formation */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Likely Starting XI
                </p>
                {team.startingXI.length > 0 ? (
                  <PitchFormation team={team} />
                ) : (
                  <p className="text-sm text-muted-foreground">Lineup not yet announced</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Head to Head */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 overflow-hidden rounded-xl border border-border/50 bg-card"
      >
        <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3">
          <Swords className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Head to Head</h3>
        </div>

        <div className="p-5">
          {h2h.length === 0 ? (
            <p className="text-sm text-muted-foreground">No H2H data available</p>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-4 gap-3">
                {[
                  { label: `${fixture.homeTeam.shortName} Wins`, value: homeWins, color: "text-primary" },
                  { label: "Draws", value: draws, color: "text-draw" },
                  { label: `${fixture.awayTeam.shortName} Wins`, value: awayWins, color: "text-secondary" },
                  { label: "Avg Goals", value: (totalGoals / h2hCount).toFixed(1), color: "text-foreground" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-muted/30 p-3 text-center">
                    <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <div className="flex h-3 overflow-hidden rounded-full">
                  <div className="bg-primary transition-all" style={{ width: `${(homeWins / h2hCount) * 100}%` }} />
                  <div className="bg-draw transition-all" style={{ width: `${(draws / h2hCount) * 100}%` }} />
                  <div className="bg-secondary transition-all" style={{ width: `${(awayWins / h2hCount) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                {(h2h as H2HRecord[]).map((match, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-muted/20 px-4 py-2.5 text-sm"
                  >
                    <span className="text-xs text-muted-foreground">{match.date}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${match.homeTeam === fixture.homeTeam.name ? "text-foreground" : "text-muted-foreground"}`}>
                        {match.homeTeam}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 font-display font-bold text-foreground">
                        {match.homeGoals} - {match.awayGoals}
                      </span>
                      <span className={`font-medium ${match.awayTeam === fixture.homeTeam.name ? "text-foreground" : "text-muted-foreground"}`}>
                        {match.awayTeam}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Generate Prediction */}
      <div className="mb-8">
        {!prediction && (
          <div className="text-center">
            {!token && (
              <p className="mb-3 text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">Sign in</Link> to generate an AI prediction
              </p>
            )}
            {token && remaining && (
              <p className="mb-3 text-sm text-muted-foreground">
                <span className={remaining.remaining === 0 ? "text-loss font-medium" : "text-foreground font-medium"}>
                  {remaining.remaining}
                </span>
                {" "}of {remaining.limit} predictions remaining today
              </p>
            )}
            {predError && (
              <p className="mb-3 rounded-lg bg-loss/10 px-4 py-2 text-sm text-loss">{predError}</p>
            )}
            <Button
              onClick={handleGeneratePrediction}
              disabled={!token || predLoading || remaining?.remaining === 0}
              className="h-12 gap-2 rounded-xl bg-primary px-8 font-display text-base font-semibold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {predLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing match data...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Prediction
                </>
              )}
            </Button>
          </div>
        )}

        {prediction && (
          <>
            <PredictionCard
              homeTeam={fixture.homeTeam.name}
              awayTeam={fixture.awayTeam.name}
              predictedHome={prediction.predicted_home_score}
              predictedAway={prediction.predicted_away_score}
              confidence={prediction.confidence}
              reasoning={prediction.reasoning}
              suggestedBet={prediction.suggested_bet}
            />

            <div className="mt-4 rounded-xl border border-border/50 bg-card p-4">
              <p className="mb-1 text-sm font-medium text-foreground">Add to Betting Slip</p>
              <p className="mb-3 text-xs text-muted-foreground">Prediction will be added to your slip. Set your total stake on the slip page.</p>
              {slipAdded ? (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Check className="h-4 w-4" />
                  Added to slip!{" "}
                  <Link to="/slip" className="underline hover:text-primary/80">View slip</Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddToSlip}
                    disabled={slipLoading}
                    className="flex items-center gap-2 rounded-lg bg-secondary/20 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/30 disabled:opacity-50"
                  >
                    {slipLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
                    Add to Slip
                  </button>
                  {slipError && <p className="text-xs text-loss">{slipError}</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MatchPrediction;
