import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  return (
    <div className="mobile-container">
      {children}
    </div>
  );
};

export default MobileLayout;
