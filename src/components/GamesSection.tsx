import GameCard from "./GameCard";
import TermsSection from "./TermsSection";

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
      
      {/* Terms Section */}
      <div className="mt-6">
        <TermsSection />
      </div>
    </section>
  );
};

export default GamesSection;
