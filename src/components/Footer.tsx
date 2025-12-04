import { ChevronDown } from "lucide-react";

const Footer = () => {
  return (
    <footer className="px-4 py-6 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
          <a href="/support" className="hover:text-primary transition-colors">Support</a>
        </div>
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2024 RockyLudo. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Instant withdrawal 24x7
        </p>
      </div>
    </footer>
  );
};

export default Footer;
