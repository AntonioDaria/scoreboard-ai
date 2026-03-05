import type { UITeamDetail } from "@/lib/types";

// Maps formation string to rows of player counts (excluding GK)
function getFormationRows(formation: string): number[] {
  return formation.split("-").map(Number);
}

// Place players into rows based on formation
function arrangePlayers(team: UITeamDetail) {
  const gk = team.startingXI.find((p) => p.position === "GK");
  const outfield = team.startingXI.filter((p) => p.position !== "GK");
  const rows = getFormationRows(team.formation);

  const arranged: typeof outfield[] = [];
  let idx = 0;
  for (const count of rows) {
    arranged.push(outfield.slice(idx, idx + count));
    idx += count;
  }

  return { gk, rows: arranged };
}

const PitchFormation = ({ team }: { team: UITeamDetail }) => {
  const { gk, rows } = arrangePlayers(team);

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-xl border border-border/50 bg-[hsl(145,60%,18%)]">
      {/* Pitch markings */}
      <div className="absolute inset-0">
        {/* Center line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-[hsl(145,60%,30%)]" />
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[hsl(145,60%,30%)]" />
        {/* Penalty areas */}
        <div className="absolute left-1/4 right-1/4 top-0 h-16 border-b border-l border-r border-[hsl(145,60%,30%)]" />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-16 border-l border-r border-t border-[hsl(145,60%,30%)]" />
      </div>

      {/* Formation label */}
      <div className="absolute right-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur-sm">
        {team.formation}
      </div>

      {/* Players */}
      <div className="relative flex h-full flex-col justify-between px-2 py-4">
        {/* Forwards at top, GK at bottom */}
        {[...rows].reverse().map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center justify-around">
            {row.map((player) => (
              <div key={player.number} className="flex flex-col items-center gap-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/60 bg-primary/20 text-[10px] font-bold text-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]">
                  {player.number}
                </div>
                <span className="max-w-[50px] truncate text-[9px] font-medium text-foreground/80">
                  {player.name.split(" ").pop()}
                </span>
              </div>
            ))}
          </div>
        ))}
        {/* Goalkeeper */}
        {gk && (
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-draw/60 bg-draw/20 text-[10px] font-bold text-draw shadow-[0_0_8px_hsl(var(--draw)/0.3)]">
                {gk.number}
              </div>
              <span className="text-[9px] font-medium text-foreground/80">
                {gk.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PitchFormation;
