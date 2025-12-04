import GameCard from "./GameCard";

const GamesSection = () => {
  return (
    <section className="px-4 pb-28">
      <h2 className="section-title">Our Games</h2>
      <div className="grid grid-cols-2 gap-4">
        <GameCard
          title="LUDO"
          subtitle="CLASSIC"
          isLive={true}
          gameType="ludo-classic"
        />
        <GameCard
          title="LUDO"
          subtitle="POPULAR"
          isLive={true}
          gameType="ludo-popular"
        />
        <GameCard
          title="SNAKE"
          subtitle="& LADDERS"
          isLive={true}
          gameType="snake"
        />
        <GameCard
          title="DRAGON"
          subtitle="TIGER"
          isLive={true}
          gameType="dragon-tiger"
        />
      </div>
      
      {/* Aviator - Full Width */}
      <div className="mt-4">
        <GameCard
          title="AVIATOR"
          isLive={true}
          gameType="aviator"
        />
      </div>
      
      {/* Footer Links */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>.</span>
          <a href="/terms" className="hover:text-foreground transition-colors">Terms,</a>
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy,</a>
          <a href="/support" className="hover:text-foreground transition-colors">Support</a>
        </div>
      </div>
    </section>
  );
};

export default GamesSection;
