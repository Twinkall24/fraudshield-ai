import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CreditCard as CardIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { Transaction } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onClick }) => {
  const getFraudScoreColor = (score: number) => {
    if (score < 0.3) return 'success';
    if (score < 0.7) return 'warning';
    return 'error';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'flagged':
        return 'error';
      case 'declined':
        return 'error';
      default:
        return 'default';
    }
  };

  const amount = parseFloat(String(transaction.amount));
  const fraudScore = parseFloat(String(transaction.fraud_score));
  const fraudScorePercent = fraudScore * 100;

  return (
    <Card
      sx={{
        mb: 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: transaction.is_fraud ? '2px solid' : '1px solid',
        borderColor: transaction.is_fraud ? 'error.main' : 'divider',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateX(4px)',
        },
        animation: 'fadeIn 0.3s ease',
      }}
      onClick={onClick}
    >
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Left side - Amount and Merchant */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} color="primary">
              ${amount.toFixed(2)}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <StoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600}>
                {transaction.merchant_name}
              </Typography>
              <Chip
                label={transaction.merchant_category}
                size="small"
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CardIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  •••• {transaction.card_number_last4}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {transaction.location_city}, {transaction.location_country}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right side - Status and Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Chip
              label={transaction.status.toUpperCase()}
              color={getStatusColor(transaction.status)}
              size="small"
              sx={{ fontWeight: 600 }}
            />

            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
            </Typography>

            <Tooltip title="View Details">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                <OpenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Fraud Score Bar */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Fraud Score
            </Typography>
            <Typography variant="caption" fontWeight={600} color={`${getFraudScoreColor(fraudScore)}.main`}>
              {fraudScorePercent.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={fraudScorePercent}
            color={getFraudScoreColor(fraudScore)}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          />
        </Box>

        {/* Fraud Type Badge */}
        {transaction.is_fraud && transaction.fraud_type && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`⚠️ ${transaction.fraud_type.replace(/_/g, ' ').toUpperCase()}`}
              color="error"
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};