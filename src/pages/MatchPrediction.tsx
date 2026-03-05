import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  AlertTriangle,
  Swords,
  Sparkles,
  Loader2,
} from "lucide-react";
import { fixtures } from "@/data/mockData";
import Layout from "@/components/Layout";
import FormBadge from "@/components/FormBadge";
import PitchFormation from "@/components/PitchFormation";
import PredictionCard from "@/components/PredictionCard";
import { Button } from "@/components/ui/button";

// TODO: call Claude API for prediction — replace mock with real API call
const mockPredictions: Record<string, { home: number; away: number; confidence: number; reasoning: string; bet: string }> = {
  "1": { home: 2, away: 1, confidence: 72, reasoning: "Arsenal's strong home form and defensive solidity gives them the edge. Chelsea's away record has been inconsistent, and with Reece James out, their right flank is vulnerable. Expect Arsenal to control possession and create more chances through the left side.", bet: "Home Win & Over 1.5 Goals" },
  "2": { home: 2, away: 2, confidence: 58, reasoning: "Both sides are in exceptional form. Liverpool's Anfield fortress is hard to crack, but City's quality makes a draw the most likely result. De Bruyne's absence weakens City's creativity, but Haaland remains a constant threat.", bet: "Both Teams to Score" },
  "3": { home: 1, away: 2, confidence: 65, reasoning: "Newcastle's recent form is significantly better than United's. The visitors have won 4 of their last 5 and United's midfield struggles will be exposed by Guimarães and Tonali.", bet: "Away Win" },
  "4": { home: 3, away: 2, confidence: 61, reasoning: "El Clásico at the Bernabéu favors Real Madrid historically. Mbappé and Vinícius Jr create nightmare scenarios for any defense. Barcelona without Pedri lose creativity in midfield, though Yamal remains dangerous.", bet: "Over 3.5 Goals" },
  "5": { home: 1, away: 1, confidence: 55, reasoning: "Madrid derbies are typically tight affairs. Atlético's defensive organization at home is elite, but Real's quality should be enough for a goal. Expect a cagey tactical battle.", bet: "Under 2.5 Goals" },
  "6": { home: 1, away: 2, confidence: 68, reasoning: "Inter's form is dominant — 4 wins in 5. Their 3-5-2 system has been clinical this season. Milan will fight in the derby, but Inter's midfield of Barella, Çalhanoğlu, and Mkhitaryan is a class above.", bet: "Away Win" },
  "7": { home: 1, away: 0, confidence: 63, reasoning: "Juventus have been defensively solid, conceding very few at the Allianz Stadium. Milan's away form has been mixed. Expect Juve to grind out a narrow win.", bet: "Home Win & Under 2.5 Goals" },
  "8": { home: 3, away: 1, confidence: 75, reasoning: "Bayern at home are virtually unstoppable. Kane has been in sensational form and Musiala adds creativity. Dortmund will struggle without Haller to hold the ball up against Bayern's press.", bet: "Home Win & Over 2.5 Goals" },
  "9": { home: 2, away: 2, confidence: 52, reasoning: "An evenly matched contest. Leipzig's home form is decent but inconsistent. Dortmund's quality in attack should ensure goals at both ends.", bet: "Both Teams to Score" },
  "10": { home: 3, away: 0, confidence: 78, reasoning: "PSG have been dominant in Le Classique recently. With Dembélé in sparkling form and Marseille missing Harit, this looks like a comfortable home win at the Parc des Princes.", bet: "Home Win to Nil" },
  "11": { home: 2, away: 2, confidence: 50, reasoning: "Olympique derbies are unpredictable. Both sides are competitive but inconsistent. Lyon's home support will be a factor, but Marseille have the squad depth to compete.", bet: "Draw" },
  "12": { home: 1, away: 1, confidence: 54, reasoning: "Without Son, Spurs lose their main creative threat. Aston Villa's well-organized defence under Emery will frustrate the home side. A cagey draw seems the most likely outcome.", bet: "Draw" },
};

const MatchPrediction = () => {
  const { id } = useParams<{ id: string }>();
  const [showPrediction, setShowPrediction] = useState(false);
  const [loading, setLoading] = useState(false);

  const fixture = fixtures.find((f) => f.id === id);

  if (!fixture) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Match not found</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            Back to matches
          </Link>
        </div>
      </Layout>
    );
  }

  const prediction = mockPredictions[fixture.id] || mockPredictions["1"];

  const handleGeneratePrediction = () => {
    setLoading(true);
    // TODO: call Claude API for prediction
    setTimeout(() => {
      setLoading(false);
      setShowPrediction(true);
    }, 1500);
  };

  // H2H stats
  const homeWins = fixture.h2h.filter(
    (h) =>
      (h.homeTeam === fixture.homeTeam.name && h.homeGoals > h.awayGoals) ||
      (h.awayTeam === fixture.homeTeam.name && h.awayGoals > h.homeGoals)
  ).length;
  const awayWins = fixture.h2h.filter(
    (h) =>
      (h.homeTeam === fixture.awayTeam.name && h.homeGoals > h.awayGoals) ||
      (h.awayTeam === fixture.awayTeam.name && h.awayGoals > h.homeGoals)
  ).length;
  const draws = fixture.h2h.filter((h) => h.homeGoals === h.awayGoals).length;
  const totalGoals = fixture.h2h.reduce((s, h) => s + h.homeGoals + h.awayGoals, 0);

  return (
    <Layout>
      {/* Back button */}
      <Link
        to="/"
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
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
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
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <span className="text-sm font-medium text-muted-foreground">
                {fixture.league}
              </span>
            </div>
            <span className="font-display text-3xl font-bold text-muted-foreground">
              VS
            </span>
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
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
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
        {[fixture.homeTeam, fixture.awayTeam].map((team, idx) => (
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
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <h3 className="font-display text-lg font-semibold text-foreground">
                {team.name}
              </h3>
              <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                #{team.leaguePosition}
              </span>
            </div>

            <div className="space-y-5 p-5">
              {/* Form */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last 5 Form
                </p>
                <div className="flex gap-1.5">
                  {team.form.map((r, i) => (
                    <FormBadge key={i} result={r} />
                  ))}
                </div>
              </div>

              {/* Injuries */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Injuries & Suspensions
                </p>
                {team.injuries.length > 0 ? (
                  <div className="space-y-1.5">
                    {team.injuries.map((inj) => (
                      <div
                        key={inj}
                        className="flex items-center gap-2 rounded-lg bg-loss/5 px-3 py-2 text-sm"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-loss" />
                        <span className="text-foreground/80">{inj}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No injuries reported</p>
                )}
              </div>

              {/* Formation */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Likely Starting XI
                </p>
                <PitchFormation team={team} />
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
          <h3 className="font-display text-lg font-semibold text-foreground">
            Head to Head
          </h3>
        </div>

        <div className="p-5">
          {/* Summary stats */}
          <div className="mb-5 grid grid-cols-4 gap-3">
            {[
              { label: `${fixture.homeTeam.shortName} Wins`, value: homeWins, color: "text-primary" },
              { label: "Draws", value: draws, color: "text-draw" },
              { label: `${fixture.awayTeam.shortName} Wins`, value: awayWins, color: "text-secondary" },
              { label: "Avg Goals", value: (totalGoals / fixture.h2h.length).toFixed(1), color: "text-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-muted/30 p-3 text-center">
                <p className={`font-display text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* H2H win ratio bar */}
          <div className="mb-5">
            <div className="flex h-3 overflow-hidden rounded-full">
              <div
                className="bg-primary transition-all"
                style={{ width: `${(homeWins / fixture.h2h.length) * 100}%` }}
              />
              <div
                className="bg-draw transition-all"
                style={{ width: `${(draws / fixture.h2h.length) * 100}%` }}
              />
              <div
                className="bg-secondary transition-all"
                style={{ width: `${(awayWins / fixture.h2h.length) * 100}%` }}
              />
            </div>
          </div>

          {/* H2H Results */}
          <div className="space-y-2">
            {fixture.h2h.map((match, i) => (
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
        </div>
      </motion.div>

      {/* Generate Prediction */}
      <div className="mb-8">
        {!showPrediction && (
          <div className="text-center">
            <Button
              onClick={handleGeneratePrediction}
              disabled={loading}
              className="h-12 gap-2 rounded-xl bg-primary px-8 font-display text-base font-semibold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
            >
              {loading ? (
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

        {showPrediction && (
          <PredictionCard
            homeTeam={fixture.homeTeam.name}
            awayTeam={fixture.awayTeam.name}
            predictedHome={prediction.home}
            predictedAway={prediction.away}
            confidence={prediction.confidence}
            reasoning={prediction.reasoning}
            suggestedBet={prediction.bet}
          />
        )}
      </div>
    </Layout>
  );
};

export default MatchPrediction;
