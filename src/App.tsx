import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import GameHistory from "./pages/GameHistory";
import ReferEarn from "./pages/ReferEarn";
import WithdrawHistory from "./pages/WithdrawHistory";
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
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/game-history" element={<GameHistory />} />
          <Route path="/refer-earn" element={<ReferEarn />} />
          <Route path="/withdraw-history" element={<WithdrawHistory />} />
          {/* Admin Routes */}
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
