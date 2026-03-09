import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Target, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PredictionCardProps {
  homeTeam: string;
  awayTeam: string;
  predictedHome: number;
  predictedAway: number;
  confidence: number;
  reasoning: string;
  suggestedBet: string;
}

const PredictionCard = ({
  homeTeam,
  awayTeam,
  predictedHome,
  predictedAway,
  confidence,
  reasoning,
  suggestedBet,
}: PredictionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-secondary/5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-primary/5 px-5 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-display text-sm font-semibold text-primary">
          AI Prediction
        </span>
      </div>

      <div className="space-y-5 p-5">
        {/* Scoreline */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-right">
            <p className="font-display text-sm font-medium text-foreground">
              {homeTeam}
            </p>
          </div>
          <div className="flex items-baseline gap-2 rounded-xl bg-muted/50 px-5 py-3">
            <span className="font-display text-4xl font-bold text-primary">
              {predictedHome}
            </span>
            <span className="font-display text-lg text-muted-foreground">-</span>
            <span className="font-display text-4xl font-bold text-secondary">
              {predictedAway}
            </span>
          </div>
          <div className="text-left">
            <p className="font-display text-sm font-medium text-foreground">
              {awayTeam}
            </p>
          </div>
        </div>

        {/* Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Confidence
            </div>
            <span className="font-display font-bold text-primary">{Math.round(confidence * 100)}%</span>
          </div>
          <Progress value={confidence * 100} className="h-2 bg-muted" />
        </div>

        {/* Suggested bet */}
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
          <Target className="h-4 w-4 shrink-0 text-secondary" />
          <div>
            <p className="text-xs text-muted-foreground">Suggested Bet</p>
            <p className="text-sm font-semibold text-foreground">{suggestedBet}</p>
          </div>
        </div>

        {/* Reasoning */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            Analysis
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{reasoning}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PredictionCard;
