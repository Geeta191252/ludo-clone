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
  const [livePlayerCount, setLivePlayerCount] = useState(1);
  const [serverAvailable, setServerAvailable] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const masterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckRef = useRef<boolean>(false);
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Register this session as active
  const registerSession = useCallback(async () => {
    try {
      await fetch(`/api/game-state.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: gameType,
          action: 'heartbeat',
          session_id: sessionId.current
        })
      });
    } catch (error) {
      // Silently fail
    }
  }, [gameType]);

  // Fetch game state from server
  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`/api/game-state.php?game_type=${gameType}&session_id=${sessionId.current}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        setServerAvailable(false);
        setIsConnected(false);
        return null;
      }
      
      const data = await response.json();
      if (data.status && data.state) {
        setGameState(data.state);
        setLiveBets(data.state.live_bets || []);
        // Use active_players count from server if available, otherwise count unique sessions
        setLivePlayerCount(data.state.active_players || Math.max(1, data.state.live_bets?.length || 1));
        setIsConnected(true);
        setServerAvailable(true);
        connectionCheckRef.current = true;
        return data.state;
      }
    } catch (error) {
      console.log('Server not available, using local mode');
      setServerAvailable(false);
      setIsConnected(false);
    }
    return null;
  }, [gameType]);

  // Run game tick (master controller) - only runs if server available
  const runGameTick = useCallback(async () => {
    if (!serverAvailable) return;
    try {
      await fetch(`/api/game-master.php?game_type=${gameType}&action=tick`);
    } catch (error) {
      console.log('Tick failed - server may be unavailable');
    }
  }, [gameType, serverAvailable]);

  // Place bet on server
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
      if (data.status) {
        // Immediately refetch to get updated bets
        fetchGameState();
      }
      return data.status;
    } catch (error) {
      console.error('Error placing bet:', error);
      return false;
    }
  }, [gameType, gameState?.round_number, fetchGameState]);

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

  // Start polling - check server first
  useEffect(() => {
    // Initial fetch to check if server is available
    fetchGameState();
    registerSession();
    
    // Poll for state updates every 500ms for smooth sync
    intervalRef.current = setInterval(() => {
      fetchGameState();
    }, 500);
    
    // Send heartbeat every 3 seconds to track active users
    const heartbeatInterval = setInterval(() => {
      registerSession();
    }, 3000);
    
    // Run game tick every 1 second for timer countdown (waiting phase)
    // During flying phase, multiplier updates happen faster on server side
    masterIntervalRef.current = setInterval(() => {
      if (serverAvailable) {
        runGameTick();
      }
    }, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (masterIntervalRef.current) clearInterval(masterIntervalRef.current);
      clearInterval(heartbeatInterval);
    };
  }, [fetchGameState, runGameTick, registerSession, gameType, serverAvailable]);

  return {
    gameState,
    liveBets,
    livePlayerCount,
    isConnected,
    serverAvailable,
    placeBet,
    cashOut,
    refetch: fetchGameState
  };
};
