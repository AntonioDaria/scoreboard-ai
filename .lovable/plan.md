

# Football Match Score Prediction App — Frontend UI

## Design System
- **Dark navy background** (`#0a0e1a` / `#111827` range) with **electric green** (`#00ff87`) and **blue** (`#00b4d8`) accents
- Bold typography, smooth transitions, glassmorphism card effects
- ESPN meets fintech dashboard aesthetic

## Pages

### 1. Home / Match Selector (`/`)
- Hero banner with app branding and quick stats
- **Filter bar**: league pills (Premier League, La Liga, Serie A, Bundesliga, Ligue 1) + date filter
- **Fixture cards** grouped by league: team logos, names, match date/time, "Predict" button
- All data hardcoded with `// TODO: fetch fixtures from API-Football` comments

### 2. Prediction Page (`/match/:id`)
- **Match header**: team logos, names, league badge, date/time
- **Two side-by-side team panels** (stacked on mobile):
  - League position, last 5 form (W/D/L colored badges)
  - Key injuries/suspensions list
  - Visual pitch formation showing likely starting XI
- **Head-to-head section**: last 5 meetings table, win ratio donut chart, goals stats
- **"Generate Prediction" button** → reveals animated prediction card with:
  - Predicted scoreline, confidence % bar, reasoning summary, suggested bet type
  - `// TODO: call Claude API for prediction` placeholder

### 3. Prediction History (`/history`)
- **Accuracy summary cards** at top (overall %, correct predictions count, streak)
- **Table** of past predictions: match, predicted score, actual score, suggested bet, outcome (✅/❌)
- Filterable and sortable

### 4. Layout & Navigation
- Sticky top navbar with logo, nav links (Home, History), dark/light feel
- Mobile hamburger menu
- Smooth page transitions

### Mock Data
- 15-20 fixtures across 5 leagues with real team names
- Complete team stats, form, injuries, lineups for ~4 detailed matches
- 10+ historical predictions with mixed outcomes

