import { useEffect, useState } from 'react';

type StatsData = {
  serverId: string;
  serverName: string;
  stats: {
    activePlayers: number;
    currentBandwidth: number;
    totalBandwidth: number;
    totalSessionTime: number;
  };
};

type SocketMessage = {
  type: string;
  data: StatsData[];
};

export function useWebSocketStats() {
  const [stats, setStats] = useState<StatsData[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/stats/ws`);

    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const message: SocketMessage = JSON.parse(event.data);
        
        if (message.type === 'stats') {
          setStats(message.data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    // Connection closed
    socket.addEventListener('close', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    });

    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  return { stats, connected };
}
