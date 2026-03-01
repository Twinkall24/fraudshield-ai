import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  VolumeUp as SoundOnIcon,
  VolumeOff as SoundOffIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { TransactionCard } from './TransactionCard';
import { Transaction } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';

interface TransactionFeedProps {
  initialTransactions?: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({
  initialTransactions = [],
  onTransactionClick,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [autoScroll, setAutoScroll] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const { connected, subscribe, unsubscribe } = useWebSocket();

  // Keep internal state in sync when the parent provides / refetches
  // an initial list (e.g. when navigating back to the dashboard).
  useEffect(() => {
    if (initialTransactions && initialTransactions.length > 0) {
      setTransactions(initialTransactions);
      // Ensure the newest transactions are visible at the top
      setTimeout(() => {
        if (autoScroll && feedRef.current) {
          feedRef.current.scrollTop = 0;
        }
      }, 50);
    }
  }, [initialTransactions, autoScroll]);

  // Play sound for high-risk transactions
  const playAlertSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx =
        // @ts-ignore - webkitAudioContext for Safari
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.value = 880; // A5 tone
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.45);
    } catch {
      // Silently ignore audio errors (e.g. autoplay restrictions)
    }
  };

  // Handle new transaction from WebSocket
  useEffect(() => {
    // Handler for payloads emitted on the `transactions` Redis channel.
    // The backend publishes messages on the "transactions" channel with
    // shape: { type: 'new_transaction', data: transaction }.
    const handleTransactionsPayload = (payload: any) => {
      try {
        console.log('📥 Transactions payload received:', payload);

        // If payload is an array, treat it as an initial transaction list
        if (Array.isArray(payload)) {
          const list = payload.slice(0, 20);
          setTransactions(list);
          setTimeout(() => {
            if (feedRef.current) feedRef.current.scrollTop = 0;
          }, 50);
          return;
        }

        // If it's an object with a type, handle new_transaction
        const type = payload?.type;
        const data = payload?.data || payload;

        if (type === 'new_transaction' && data) {
          const newTransaction = data;

          setTransactions((prev) => {
            const updated = [newTransaction, ...prev];
            const result = updated.slice(0, 20);

            if (newTransaction?.fraud_score > 0.8) {
              playAlertSound();
            }

            setTimeout(() => {
              if (autoScroll && feedRef.current) {
                try {
                  feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                } catch (err) {
                  feedRef.current.scrollTop = 0;
                }
              }
            }, 60);

            return result;
          });
        }
      } catch (err) {
        console.error('Error handling transactions payload:', err);
      }
    };

    // Subscribe to the Redis-emitted channel name 'transactions'
    subscribe('transactions', handleTransactionsPayload);

    return () => {
      unsubscribe('transactions');
    };
  }, [subscribe, unsubscribe, autoScroll, soundEnabled]);

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Live Transactions
          </Typography>
          <Chip
            label={connected ? 'LIVE' : 'DISCONNECTED'}
            color={connected ? 'success' : 'error'}
            size="small"
            className={connected ? 'pulse' : ''}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
            }
            label={<Typography variant="caption">Auto-scroll</Typography>}
          />

          <Tooltip title={soundEnabled ? 'Mute alerts' : 'Enable sound alerts'}>
            <IconButton size="small" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Transaction Count */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
        Showing {transactions.length} recent transactions
      </Typography>

      {/* Transaction List */}
      <Box
        ref={feedRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'action.hover',
            borderRadius: 1,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'action.selected',
            borderRadius: 1,
          },
        }}
      >
        {transactions.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              py: 8,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No transactions yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {connected ? 'Waiting for new transactions...' : 'Connecting to WebSocket...'}
            </Typography>
          </Box>
        ) : (
          transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onClick={() => onTransactionClick?.(transaction)}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};