import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Box, Typography, Chip, Paper, Divider } from '@mui/material';
import {
  AccountBalance as MoneyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Speed as SpeedIcon,
  Circle as CircleIcon,
  AutoGraph as AutoGraphIcon,
} from '@mui/icons-material';
import { useRole } from '../hooks/useRole';
import { KPICard } from '../components/Dashboard/KPICard';
import { TransactionFeed } from '../components/Dashboard/TransactionFeed';
import { TransactionDetailModal } from '../components/Dashboard/TransactionDetailModal';
import { DemoGenerator } from '../components/Dashboard/DemoGenerator';
import { TrendChart } from '../components/Charts/TrendChart';
import { FraudPieChart } from '../components/Charts/FraudPie';
import { transactionsAPI } from '../services/api';
import { Transaction, TransactionStats } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
  const { role, isAdmin, canUseDemoMode } = useRole();
  const [stats, setStats] = useState<TransactionStats>({
    total_transactions: 0,
    fraud_count: 0,
    fraud_rate: 0,
    last_24h_count: 0,
    avg_amount: 0,
    fraud_amount: 0,
    avg_fraud_score: 0,
    approved_count: 0,
    declined_count: 0,
    flagged_count: 0,
    total_amount: 0,
    last_24h_fraud_count: 0,
  } as TransactionStats);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { connected, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, transactionsData] = await Promise.all([
          transactionsAPI.getStats(),
          transactionsAPI.getAll({ limit: 20 }),
        ]);
        // merge with default to ensure all fields exist
        setStats(prev => ({ ...prev, ...statsData } as TransactionStats));
        setRecentTransactions(transactionsData.transactions || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    /**
     * Keep dashboard KPIs in sync with the live transaction stream.
     * The backend publishes WebSocket events on the `transactions` channel
     * (see `backend/api-gateway/src/websocket/index.ts`), so we subscribe to
     * that same event name here instead of a non‑existent `transaction:new`.
     */
    const handleStatsUpdate = async () => {
      try {
        const statsData = await transactionsAPI.getStats();
        setStats(prev => ({ ...prev, ...statsData } as TransactionStats));
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    };

    // Subscribe to the live `transactions` channel for KPI refresh
    subscribe('transactions', handleStatsUpdate);

    return () => {
      unsubscribe('transactions');
    };
  }, [subscribe, unsubscribe]);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedTransaction(null), 300);
  };

  const handleDemoTransactionGenerated = async () => {
    try {
      const statsData = await transactionsAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  const trendData = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => `${i}h`);
    const data = Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 10);
    return { labels: hours, data };
  }, []);

  return (
    <Box sx={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* ── Header ── */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: 'rgba(13, 13, 26, 0.7)',
          border: '1px solid rgba(0, 212, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), rgba(124,58,237,0.3), transparent)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                background: 'linear-gradient(135deg, #f0f4ff 0%, #8892b0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 0.5,
              }}
            >
              Operations Dashboard
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span className="live-dot" style={{ width: 7, height: 7, display: 'inline-block', borderRadius: '50%', background: '#00ff88' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Real-time fraud detection monitoring
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Chip
              icon={<AutoGraphIcon sx={{ fontSize: '14px !important' }} />}
              label={`${role?.toUpperCase()} MODE`}
              color={isAdmin ? 'error' : 'primary'}
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: 0.5,
                '& .MuiChip-icon': { ml: 1 },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── KPI Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          {
            title: 'Total Transactions',
            value: (stats.total_transactions ?? 0).toLocaleString(),
            subtitle: `${stats.last_24h_count ?? 0} in last 24h`,
            icon: <MoneyIcon />,
            color: 'primary' as const,
          },
          {
            title: 'Fraud Detected',
            value: stats.fraud_count ?? 0,
            subtitle: `$${(stats.fraud_amount ?? 0).toFixed(0)} prevented`,
            icon: <WarningIcon />,
            color: 'error' as const,
          },
          {
            title: 'Fraud Rate',
            value: `${(stats.fraud_rate ?? 0).toFixed(2)}%`,
            subtitle: 'Current detection rate',
            icon: <TrendingIcon />,
            color: ((stats.fraud_rate ?? 0) > 5 ? 'error' : 'success') as 'error' | 'success',
          },
          {
            title: 'Avg Fraud Score',
            value: `${((stats.avg_fraud_score ?? 0) * 100).toFixed(1)}%`,
            subtitle: 'Model confidence',
            icon: <SpeedIcon />,
            color: 'info' as const,
          },
        ].map((kpi, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <KPICard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* ── Charts + Feed ── */}
      <Grid container spacing={2.5}>
        {/* Left: Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 8 }} sx={{ height: 300 }}>
              <TrendChart
                title="Transaction Trend (Last 12 Hours)"
                data={trendData.data}
                labels={trendData.labels}
                color="#00d4ff"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ height: 300 }}>
              <FraudPieChart
                fraudCount={stats.fraud_count ?? 0}
                legitimateCount={(stats.total_transactions ?? 0) - (stats.fraud_count ?? 0)}
              />
            </Grid>
            <Grid size={12} sx={{ height: 600 }}>
              <TransactionFeed
                initialTransactions={recentTransactions}
                onTransactionClick={handleTransactionClick}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Right: Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Connection Status */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                backdropFilter: 'blur(12px)',
                background: connected
                  ? 'rgba(0, 255, 136, 0.06)'
                  : 'rgba(255, 71, 87, 0.06)',
                border: connected
                  ? '1px solid rgba(0, 255, 136, 0.2)'
                  : '1px solid rgba(255, 71, 87, 0.2)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                <Box
                  sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: connected ? '#00ff88' : '#ff4757',
                    boxShadow: connected
                      ? '0 0 10px rgba(0, 255, 136, 0.7)'
                      : '0 0 10px rgba(255, 71, 87, 0.7)',
                    animation: connected ? 'glowPulseGreen 2s ease-in-out infinite' : 'glowPulseRed 2s ease-in-out infinite',
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ color: connected ? '#00ff88' : '#ff4757' }}
                >
                  {connected ? 'WebSocket Live' : 'Disconnected'}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {connected
                  ? 'Receiving real-time transaction events'
                  : 'Attempting to reconnect...'}
              </Typography>
            </Box>

            {/* Quick Stats */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                background: 'rgba(13, 13, 26, 0.7)',
                border: '1px solid rgba(0, 212, 255, 0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  mb: 2,
                  pb: 1.5,
                  borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
                  color: 'text.primary',
                }}
              >
                System Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Avg Transaction', value: `$${((stats.avg_amount ?? 0).toFixed(2))}` },
                  { label: 'Detection Engine', value: 'XGBoost v2' },
                  { label: 'Model Version', value: 'v1.0.0' },
                  { label: 'Latency (avg)', value: '< 10ms' },
                  { label: 'Data Pipeline', value: 'WebSocket + REST' },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ color: '#00d4ff', fontFamily: 'monospace', fontSize: '0.78rem' }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Alert Summary */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                background: 'rgba(13, 13, 26, 0.7)',
                border: '1px solid rgba(255, 71, 87, 0.1)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Alert Summary
              </Typography>
              {[
                { label: 'High Risk (≥80%)', count: Math.floor((stats.fraud_count ?? 0) * 0.4), color: '#ff4757' },
                { label: 'Medium Risk (40–79%)', count: Math.floor((stats.fraud_count ?? 0) * 0.35), color: '#ffc107' },
                { label: 'Low Risk (<40%)', count: Math.floor((stats.fraud_count ?? 0) * 0.25), color: '#00ff88' },
              ].map(({ label, count, color }) => (
                <Box key={label} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ color }}>{count}</Typography>
                  </Box>
                  <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: (stats.fraud_count ?? 0) > 0 ? `${(count / (stats.fraud_count ?? 0)) * 100}%` : '0%',
                        borderRadius: 2,
                        bgcolor: color,
                        boxShadow: `0 0 6px ${color}`,
                        transition: 'width 1s ease',
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        open={modalOpen}
        transaction={selectedTransaction}
        onClose={handleModalClose}
      />
      {canUseDemoMode && (
        <DemoGenerator onTransactionGenerated={handleDemoTransactionGenerated} />
      )}
    </Box>
  );
};