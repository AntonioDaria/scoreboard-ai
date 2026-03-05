import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Trophy, Target, TrendingUp, BarChart3, Brain, Shield, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Predictions",
    description: "Advanced algorithms analyze team form, injuries, H2H records, and 50+ data points per match.",
  },
  {
    icon: Trophy,
    title: "Top 5 Leagues",
    description: "Full coverage of Premier League, La Liga, Serie A, Bundesliga, and Ligue 1.",
  },
  {
    icon: BarChart3,
    title: "Deep Match Analysis",
    description: "Visual formations, injury reports, head-to-head stats, and form guides for every fixture.",
  },
  {
    icon: Target,
    title: "Smart Bet Suggestions",
    description: "Get confident scoreline predictions with reasoning and suggested bet types.",
  },
];

const stats = [
  { value: "64%", label: "Prediction Accuracy" },
  { value: "500+", label: "Matches Analyzed" },
  { value: "5", label: "Top Leagues" },
  { value: "50+", label: "Data Points / Match" },
];

const testimonials = [
  { name: "James R.", text: "The AI predictions are surprisingly accurate. Changed how I watch football.", rating: 5 },
  { name: "Marco T.", text: "Love the formation views and injury tracking. Essential match-day companion.", rating: 5 },
  { name: "Sophie L.", text: "Clean design, great data. The confidence percentages really help.", rating: 4 },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display text-lg font-bold">PredictKick</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/fixtures">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Fixtures
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                History
              </Button>
            </Link>
            <Link to="/fixtures">
              <Button size="sm" className="rounded-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" />
              AI-Powered Football Intelligence
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Predict Every
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Match Outcome
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Machine learning meets football analytics. Get scoreline predictions, confidence ratings, and smart bet suggestions for Europe's top leagues.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/fixtures">
                <Button size="lg" className="rounded-full px-8 text-base shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                  View Fixtures <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
                  See Track Record
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Background effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-[300px] w-[400px] rounded-full bg-secondary/5 blur-[100px]" />
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-3xl font-bold text-primary sm:text-4xl">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Everything You Need to <span className="text-primary">Win</span>
          </h2>
          <p className="mt-3 text-muted-foreground">Data-driven insights for smarter football analysis.</p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-border/50 bg-card/50 p-6 transition-all hover:border-primary/30 hover:bg-card"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/50 bg-card/20">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="mb-12 text-center font-display text-2xl font-bold sm:text-3xl">
            How It <span className="text-primary">Works</span>
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: "01", title: "Pick a Match", desc: "Browse upcoming fixtures across all five leagues." },
              { step: "02", title: "Review Analysis", desc: "Explore form, injuries, lineups, and head-to-head data." },
              { step: "03", title: "Get Prediction", desc: "Our AI delivers a scoreline with confidence and reasoning." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/5 font-display text-lg font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-12 text-center font-display text-2xl font-bold sm:text-3xl">
          Trusted by <span className="text-primary">Fans</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border/50 bg-card/50 p-6"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
              <p className="mt-4 text-xs font-medium text-foreground">{t.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl font-bold sm:text-4xl">
              Ready to Predict?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Start analyzing matches and get AI-powered scoreline predictions today.
            </p>
            <Link to="/fixtures">
              <Button size="lg" className="mt-8 rounded-full px-10 text-base shadow-[0_0_24px_hsl(var(--primary)/0.3)]">
                Explore Fixtures <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="font-display font-semibold text-foreground">PredictKick</span>
          </div>
          <p>© 2026 PredictKick. All data for demonstration purposes.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
