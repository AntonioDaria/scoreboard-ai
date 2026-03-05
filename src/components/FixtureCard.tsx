import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import type { UIFixture } from "@/lib/types";

const FixtureCard = ({ fixture, index }: { fixture: UIFixture; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/match/${fixture.id}`} className="group block">
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.15)] sm:p-5">
          {/* Teams row */}
          <div className="flex items-center justify-between gap-3">
            {/* Home team */}
            <div className="flex flex-1 items-center gap-3">
              <img
                src={fixture.homeTeam.logo}
                alt={fixture.homeTeam.name}
                className="h-10 w-10 rounded-full object-contain sm:h-12 sm:w-12"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-foreground sm:text-base">
                  {fixture.homeTeam.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fixture.homeTeam.leaguePosition != null ? `#${fixture.homeTeam.leaguePosition}` : ""}
                </p>
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="font-display text-lg font-bold text-muted-foreground">
                VS
              </span>
            </div>

            {/* Away team */}
            <div className="flex flex-1 flex-row-reverse items-center gap-3">
              <img
                src={fixture.awayTeam.logo}
                alt={fixture.awayTeam.name}
                className="h-10 w-10 rounded-full object-contain sm:h-12 sm:w-12"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div className="min-w-0 text-right">
                <p className="truncate font-display text-sm font-semibold text-foreground sm:text-base">
                  {fixture.awayTeam.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fixture.awayTeam.leaguePosition != null ? `#${fixture.awayTeam.leaguePosition}` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom info */}
          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {fixture.date} · {fixture.time}
              </span>
              <span className="hidden items-center gap-1 sm:flex">
                <MapPin className="h-3 w-3" />
                {fixture.venue}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Predict
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default FixtureCard;
