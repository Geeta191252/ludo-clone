import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const TermsSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t-2 border-accent">
      {/* Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-4 bg-background"
      >
        <span className="text-muted-foreground text-sm">. Terms, Privacy, Support</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-6 space-y-6 bg-background animate-fade-in">
          {/* About Us */}
          <section>
            <h3 className="font-bold text-foreground mb-3">About Us</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Rocky Ludo is a real-money gaming product owned and operated by Alpha Techh Company ("Rocky Ludo" or "We" or "Us" or "Our").
            </p>
          </section>

          {/* Our Business & Products */}
          <section>
            <h3 className="font-bold text-foreground mb-3">Our Business & Products</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              We are an HTML5 game-publishing company and our mission is to make accessing games fast and easy by removing the friction of app-installs.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Rocky Ludo is a skill-based real-money gaming platform accessible only for our users in India. It is accessible on{" "}
              <a href="https://rockyludo.com" className="text-primary hover:underline">https://rockyludo.com</a>. 
              On Rocky Ludo, users can compete for real cash in Tournaments and Battles. They can encash their winnings via popular options such as Paytm Wallet, Amazon Pay, Bank Transfer, Mobile Recharges etc.
            </p>
          </section>

          {/* Our Games */}
          <section>
            <h3 className="font-bold text-foreground mb-3">Our Games</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              Rocky Ludo has a wide-variety of high-quality, premium HTML5 games. Our games are especially compressed and optimised to work on low-end devices, uncommon browsers, and patchy internet speeds.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We have games across several popular categories: Arcade, Action, Adventure, Sports & Racing, Strategy, Puzzle & Logic. We also have a strong portfolio of multiplayer games such as Ludo, Chess, 8 Ball Pool, Carrom, Tic Tac Toe, Archery, Quiz, Chinese Checkers and more! Some of our popular titles are: Escape Run, Bubble Wipeout, Tower Twist, Cricket Gunda, Ludo With Friends!
            </p>
          </section>

          {/* Game Rules */}
          <section>
            <h3 className="font-bold text-foreground mb-3">Game Rules</h3>
            <ul className="text-muted-foreground text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>Players must be 18+ years old to play real money games.</li>
              <li>All games are skill-based and results depend on player performance.</li>
              <li>Commission: 3% on all games.</li>
              <li>Referral bonus: 2% for all games.</li>
              <li>Minimum withdrawal: ₹100</li>
              <li>24x7 instant withdrawal available.</li>
              <li>Any fraud or cheating will result in permanent account ban.</li>
            </ul>
          </section>

          {/* Privacy Policy */}
          <section>
            <h3 className="font-bold text-foreground mb-3">Privacy Policy</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We respect your privacy and are committed to protecting your personal data. We collect only necessary information to provide our services. Your data is encrypted and stored securely. We do not share your personal information with third parties without your consent.
            </p>
          </section>

          {/* Support */}
          <section>
            <h3 className="font-bold text-foreground mb-3">Support</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              For any queries or support, contact us on WhatsApp or through our support section in the app. Our support team is available 24x7 to help you with any issues.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h3 className="font-bold text-foreground mb-3">Disclaimer</h3>
            <p className="text-muted-foreground text-sm leading-relaxed text-destructive">
              Important Notice: Play At Your Own Risk. This game involves financial risk and may be addictive. Please play responsibly.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

export default TermsSection;
