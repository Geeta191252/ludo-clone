import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MobileLayout from "./components/MobileLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import GameHistory from "./pages/GameHistory";
import ReferEarn from "./pages/ReferEarn";
import WithdrawHistory from "./pages/WithdrawHistory";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminGames from "./pages/admin/AdminGames";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAviatorControl from "./pages/admin/AdminAviatorControl";
import AdminDragonTigerControl from "./pages/admin/AdminDragonTigerControl";
import AdminLudoControl from "./pages/admin/AdminLudoControl";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Mobile Layout Routes */}
          <Route path="/" element={<MobileLayout><Index /></MobileLayout>} />
          <Route path="/auth" element={<MobileLayout><Auth /></MobileLayout>} />
          <Route path="/profile" element={<MobileLayout><Profile /></MobileLayout>} />
          <Route path="/wallet" element={<MobileLayout><Wallet /></MobileLayout>} />
          <Route path="/game-history" element={<MobileLayout><GameHistory /></MobileLayout>} />
          <Route path="/refer-earn" element={<MobileLayout><ReferEarn /></MobileLayout>} />
          <Route path="/withdraw-history" element={<MobileLayout><WithdrawHistory /></MobileLayout>} />
          <Route path="/notifications" element={<MobileLayout><Notifications /></MobileLayout>} />
          {/* Admin Routes - Full Width */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
          <Route path="/admin/games" element={<AdminGames />} />
          <Route path="/admin/ludo-control" element={<AdminLudoControl />} />
          <Route path="/admin/aviator-control" element={<AdminAviatorControl />} />
          <Route path="/admin/dragon-tiger-control" element={<AdminDragonTigerControl />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<MobileLayout><NotFound /></MobileLayout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

