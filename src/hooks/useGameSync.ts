import { useState, useEffect, useCallback, useRef } from 'react';

interface LiveBet {
  mobile: string;
  username: string;
  bet_area: string | null;
  bet_amount: number;
  odds: string;
  win_amount: number;
  cashed_out: number;
  isUser?: boolean;
}

interface GameState {
  game_type: string;
  phase: string;
  timer: number;
  multiplier: number;
  round_number: number;
  history: any[];
  dragon_card_value: string | null;
  dragon_card_suit: string | null;
  tiger_card_value: string | null;
  tiger_card_suit: string | null;
  winner: string | null;
  crash_point: number | null;
  plane_x: number;
  plane_y: number;
  live_bets: LiveBet[];
}

export const useGameSync = (gameType: 'aviator' | 'dragon-tiger') => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [livePlayerCount, setLivePlayerCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const masterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstUserRef = useRef(false);

  // Fetch game state
  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`/api/game-state.php?game_type=${gameType}`);
      const data = await response.json();
      if (data.status && data.state) {
        setGameState(data.state);
        setLiveBets(data.state.live_bets || []);
        setLivePlayerCount(data.state.live_bets?.length || 0);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
      setIsConnected(false);
    }
  }, [gameType]);

  // Run game tick (master controller)
  const runGameTick = useCallback(async () => {
    try {
      await fetch(`/api/game-master.php?game_type=${gameType}&action=tick`);
    } catch (error) {
      console.error('Error running game tick:', error);
    }
  }, [gameType]);

  // Place bet
  const placeBet = useCallback(async (betAmount: number, betArea?: string) => {
    try {
      const user = localStorage.getItem('user');
      if (!user) return false;
      const userData = JSON.parse(user);
      
      const response = await fetch('/api/game-state.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: gameType,
          action: 'place_bet',
          mobile: userData.mobile,
          username: userData.name || `***${userData.mobile.slice(-4)}`,
          bet_area: betArea || null,
          bet_amount: betAmount,
          round_number: gameState?.round_number || 1
        })
      });
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error placing bet:', error);
      return false;
    }
  }, [gameType, gameState?.round_number]);

  // Cash out
  const cashOut = useCallback(async (odds: string, winAmount: number) => {
    try {
      const user = localStorage.getItem('user');
      if (!user) return false;
      const userData = JSON.parse(user);
      
      const response = await fetch('/api/game-state.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: gameType,
          action: 'cash_out',
          mobile: userData.mobile,
          round_number: gameState?.round_number || 1,
          odds,
          win_amount: winAmount
        })
      });
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error cashing out:', error);
      return false;
    }
  }, [gameType, gameState?.round_number]);

  // Start polling
  useEffect(() => {
    // Initial fetch
    fetchGameState();
    
    // Poll for state updates every 500ms for smooth sync
    intervalRef.current = setInterval(fetchGameState, 500);
    
    // Run game tick every second (first user becomes master)
    const checkAndRunMaster = async () => {
      // Simple: all clients run the master tick, server handles state
      await runGameTick();
    };
    
    // Run tick based on game type
    const tickInterval = gameType === 'aviator' ? 80 : 1000;
    masterIntervalRef.current = setInterval(checkAndRunMaster, tickInterval);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (masterIntervalRef.current) clearInterval(masterIntervalRef.current);
    };
  }, [fetchGameState, runGameTick, gameType]);

  return {
    gameState,
    liveBets,
    livePlayerCount,
    isConnected,
    placeBet,
    cashOut,
    refetch: fetchGameState
  };
};
