import GameCard from "./GameCard";

const games = [
  { id: 1, title: "LUDO", subtitle: "CLASSIC", isLive: true },
  { id: 2, title: "LUDO", subtitle: "POPULAR", isLive: true },
  { id: 3, title: "SNAKE", subtitle: "& LADDERS", isLive: true },
  { id: 4, title: "DRAGON", subtitle: "TIGER", isLive: true },
];

const GamesSection = () => {
  return (
    <section className="px-4 pb-6">
      <h2 className="section-title">Our Games</h2>
      <div className="grid grid-cols-2 gap-4">
        {games.map((game) => (
          <GameCard
            key={game.id}
            title={game.title}
            subtitle={game.subtitle}
            isLive={game.isLive}
          />
        ))}
      </div>
      
      {/* Aviator - Full Width */}
      <div className="mt-4">
        <GameCard
          title="AVIATOR"
          isLive={true}
        />
      </div>
    </section>
  );
};

export default GamesSection;
