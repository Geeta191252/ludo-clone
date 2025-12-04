import GameCard from "./GameCard";

const GamesSection = () => {
  return (
    <section className="pb-28">
      <div className="px-4">
        <h2 className="section-title">Our Games</h2>
        <div className="grid grid-cols-2 gap-4">
          <GameCard gameType="ludo-classic" isLive={true} />
          <GameCard gameType="ludo-popular" isLive={true} />
          <GameCard gameType="snake" isLive={true} />
          <GameCard gameType="dragon-tiger" isLive={true} />
          <GameCard gameType="aviator" isLive={true} />
        </div>
      </div>
      
      {/* Footer Links */}
      <div className="mt-6 px-4 pt-4 border-t border-border">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>.</span>
          <span>Terms,</span>
          <span>Privacy,</span>
          <span>Support</span>
        </div>
      </div>
    </section>
  );
};

export default GamesSection;
