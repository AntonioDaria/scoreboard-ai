import type { UIFixture, FormResult, H2HRecord, UserPrediction } from "./types";

const API_BASE = "http://localhost:8000";

export const TOKEN_KEY = "scoreboard_token";

async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event("auth:logout"));
  }
  return res;
}

// --- Auth ---

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).detail ?? "Login failed");
  }
  const data = await res.json();
  return data.access_token;
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).detail ?? "Registration failed");
  }
}

// --- Helpers ---

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(utcDate: string): string {
  const dt = new Date(utcDate);
  return `${pad(dt.getDate())}-${pad(dt.getMonth() + 1)}-${dt.getFullYear()}`;
}

function formatTime(utcDate: string): string {
  const dt = new Date(utcDate);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// --- Mappers ---

function mapMatch(m: Record<string, unknown>): UIFixture {
  const homeTeam = m.homeTeam as Record<string, unknown>;
  const awayTeam = m.awayTeam as Record<string, unknown>;
  const competition = m.competition as Record<string, unknown>;
  return {
    id: m.id as number,
    league: competition.name as string,
    leagueLogo: competition.emblem as string,
    homeTeam: {
      id: homeTeam.id as number,
      name: homeTeam.name as string,
      shortName: (homeTeam.shortName ?? homeTeam.tla ?? homeTeam.name) as string,
      logo: homeTeam.crest as string,
      leaguePosition: null,
    },
    awayTeam: {
      id: awayTeam.id as number,
      name: awayTeam.name as string,
      shortName: (awayTeam.shortName ?? awayTeam.tla ?? awayTeam.name) as string,
      logo: awayTeam.crest as string,
      leaguePosition: null,
    },
    date: formatDate(m.utcDate as string),
    utcDate: m.utcDate as string,
    time: formatTime(m.utcDate as string),
    venue: (m.venue as string) ?? "",
  };
}

// --- Football ---

export const LEAGUES = [
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "La Liga" },
  { code: "SA", name: "Serie A" },
  { code: "BL1", name: "Bundesliga" },
  { code: "FL1", name: "Ligue 1" },
];

export async function fetchLeagueFixtures(competitionCode: string, limit = 5): Promise<UIFixture[]> {
  // Fetch SCHEDULED + TIMED (about to kick off) in parallel, merge and sort
  const [scheduledRes, timedRes] = await Promise.all([
    fetch(`${API_BASE}/fixtures?competition_code=${competitionCode}&status=SCHEDULED&limit=${limit}`),
    fetch(`${API_BASE}/fixtures?competition_code=${competitionCode}&status=TIMED&limit=${limit}`),
  ]);

  const scheduled = scheduledRes.ok
    ? ((await scheduledRes.json()) as { matches?: unknown[] }).matches ?? []
    : [];
  const timed = timedRes.ok
    ? ((await timedRes.json()) as { matches?: unknown[] }).matches ?? []
    : [];

  const seen = new Set<number>();
  const merged: UIFixture[] = [];
  for (const m of [...timed, ...scheduled]) {
    const match = m as Record<string, unknown>;
    const id = match.id as number;
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(mapMatch(match));
    }
  }
  return merged.slice(0, limit);
}

export async function fetchFixture(matchId: number): Promise<UIFixture> {
  const res = await fetch(`${API_BASE}/fixture/${matchId}`);
  if (!res.ok) throw new Error(`Failed to fetch fixture: ${res.status}`);
  const data = await res.json();
  if (!data?.id) throw new Error("Match data unavailable — API may be rate limited");
  return mapMatch(data as Record<string, unknown>);
}

export async function fetchTeamForm(teamId: number): Promise<FormResult[]> {
  const res = await fetch(`${API_BASE}/team/${teamId}/form?limit=5`);
  if (!res.ok) return [];
  const data = (await res.json()) as { matches?: unknown[] };
  return (data.matches ?? []).slice(0, 5).map((m: unknown) => {
    const match = m as Record<string, unknown>;
    const home = (match.homeTeam as Record<string, unknown>);
    const score = (match.score as Record<string, unknown>);
    const winner = score.winner as string | null;
    const isHome = (home.id as number) === teamId;
    if (!winner || winner === "DRAW") return "D";
    if ((isHome && winner === "HOME_TEAM") || (!isHome && winner === "AWAY_TEAM")) return "W";
    return "L";
  });
}

export interface StandingsEntry {
  teamId: number;
  position: number;
}

export async function fetchStandings(competitionCode: string): Promise<StandingsEntry[]> {
  const res = await fetch(`${API_BASE}/standings/${competitionCode}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { standings?: { type: string; table: unknown[] }[] };
  const table = (data.standings ?? []).find((s) => s.type === "TOTAL")?.table ?? [];
  return (table as Record<string, unknown>[]).map((row) => ({
    teamId: (row.team as Record<string, unknown>).id as number,
    position: row.position as number,
  }));
}

export interface LineupPlayer {
  name: string;
  number: number;
  position: string;
}

export interface TeamLineup {
  formation: string;
  players: LineupPlayer[];
}

export async function fetchLineups(
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  competitionCode?: string,
): Promise<{ home: TeamLineup | null; away: TeamLineup | null }> {
  // ESPN date format: YYYYMMDD — matchDate comes in as ISO "2026-03-06T15:00:00Z"
  const espnDate = matchDate.slice(0, 10).replace(/-/g, "");
  const params = new URLSearchParams({
    home_team: homeTeam,
    away_team: awayTeam,
    match_date: espnDate,
  });
  if (competitionCode) params.set("competition_code", competitionCode);
  const res = await fetch(`${API_BASE}/lineups?${params}`);
  if (!res.ok) return { home: null, away: null };
  return res.json();
}

export async function fetchMatchH2H(matchId: number): Promise<H2HRecord[]> {
  const res = await fetch(`${API_BASE}/h2h/${matchId}?limit=5`);
  if (!res.ok) return [];
  const data = (await res.json()) as { matches?: unknown[] };
  return (data.matches ?? []).slice(0, 5).map((m: unknown) => {
    const match = m as Record<string, unknown>;
    const score = (match.score as Record<string, unknown>).fullTime as Record<string, number | null>;
    return {
      date: formatDate(match.utcDate as string),
      homeTeam: (match.homeTeam as Record<string, string>).name,
      awayTeam: (match.awayTeam as Record<string, string>).name,
      homeGoals: score.home ?? 0,
      awayGoals: score.away ?? 0,
    };
  });
}

// --- Predictions ---

export async function createPrediction(fixtureId: number, token: string): Promise<UserPrediction> {
  const res = await apiFetch(`${API_BASE}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fixture_id: fixtureId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).detail ?? "Failed to generate prediction");
  }
  return res.json();
}

export async function fetchMyPredictions(token: string): Promise<UserPrediction[]> {
  const res = await apiFetch(`${API_BASE}/predictions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRemainingPredictions(token: string): Promise<{ used: number; limit: number; remaining: number }> {
  const res = await apiFetch(`${API_BASE}/predictions/remaining`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { used: 0, limit: 5, remaining: 5 };
  return res.json();
}

// --- Betting Slips ---

export async function fetchMySlips(token: string): Promise<import("./types").SlipSummary[]> {
  const res = await apiFetch(`${API_BASE}/slips`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createSlip(name: string, token: string): Promise<import("./types").SlipSummary> {
  const res = await apiFetch(`${API_BASE}/slips`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create slip");
  return res.json();
}

export async function addToSlip(slipId: number, predictionId: number, stake: number, token: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/slips/${slipId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prediction_id: predictionId, stake }),
  });
  if (!res.ok) throw new Error("Failed to add to slip");
}

export async function fetchSlip(slipId: number, token: string): Promise<import("./types").Slip> {
  const res = await apiFetch(`${API_BASE}/slips/${slipId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Slip not found");
  return res.json();
}
