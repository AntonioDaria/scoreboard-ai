export type FormResult = "W" | "D" | "L";

export interface StartingXIPlayer {
  name: string;
  position: string;
  number: number;
}

export interface UITeamBasic {
  id: number;
  name: string;
  shortName: string;
  logo: string;
  leaguePosition: number | null;
}

export interface UIFixture {
  id: number;
  league: string;
  leagueLogo: string;
  homeTeam: UITeamBasic;
  awayTeam: UITeamBasic;
  date: string;
  utcDate: string;
  time: string;
  venue: string;
}

export interface H2HRecord {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
}

export interface UITeamDetail extends UITeamBasic {
  form: FormResult[];
  injuries: string[];
  formation: string;
  startingXI: StartingXIPlayer[];
}

export interface UserPrediction {
  id: number;
  fixture_id: number;
  home_team: string;
  away_team: string;
  league: string | null;
  predicted_home_score: number;
  predicted_away_score: number;
  confidence: number;
  reasoning: string;
  suggested_bet: string;
  created_at: string;
  actual_home_score: number | null;
  actual_away_score: number | null;
  result: string;
  home_injuries: string[];
  away_injuries: string[];
}

export interface SlipItem {
  id: number;
  slip_id: number;
  prediction_id: number;
  odds: number;
  stake: number;
  potential_winnings: number;
  prediction: {
    id: number;
    home_team: string;
    away_team: string;
    predicted_home_score: number;
    predicted_away_score: number;
    suggested_bet: string;
  } | null;
}

export interface Slip {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  exported_at: string | null;
  items: SlipItem[];
  total_potential_winnings: number;
}

export interface SlipSummary {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}
