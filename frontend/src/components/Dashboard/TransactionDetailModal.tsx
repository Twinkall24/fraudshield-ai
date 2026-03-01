import { useRole } from '../../hooks/useRole';      
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  Paper,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as ApprovedIcon,
  Cancel as DeclinedIcon,
  Warning as FlaggedIcon,
  CreditCard as CardIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  DevicesOther as DeviceIcon,
  AccessTime as TimeIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';
import { Transaction } from '../../types';
import { format } from 'date-fns';
import { transactionsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

interface TransactionDetailModalProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  open,
  transaction,
  onClose,
}) => {
  const { canApproveTransactions } = useRole(); 
  const { enqueueSnackbar } = useSnackbar();
  const [status, setStatus] = useState<string>(transaction?.status || 'pending');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setStatus(transaction?.status || 'pending');
  }, [transaction]);

  if (!transaction) return null;

  const getFraudScoreColor = (score: number) => {
    if (score < 0.3) return 'success';
    if (score < 0.7) return 'warning';
    return 'error';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <ApprovedIcon color="success" />;
      case 'declined':
        return <DeclinedIcon color="error" />;
      case 'flagged':
        return <FlaggedIcon color="error" />;
      default:
        return <TimeIcon color="action" />;
    }
  };

  const fraudScorePercent = Number(transaction.fraud_score) * 100;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          bgcolor: transaction.is_fraud ? 'error.light' : 'primary.light',
          color: transaction.is_fraud ? 'error.dark' : 'primary.dark',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Transaction Details
          </Typography>
          <Chip
            label={transaction.status.toUpperCase()}
            size="small"
            color={transaction.is_fraud ? 'error' : 'success'}
            icon={getStatusIcon(transaction.status)}
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Transaction ID and Amount */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Transaction ID
          </Typography>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {transaction.transaction_id}
          </Typography>
          <Typography variant="h3" fontWeight={700} color="primary.main" sx={{ my: 2 }}>
            ${Number(transaction.amount).toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {transaction.currency} • {format(new Date(transaction.timestamp), 'PPpp')}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Fraud Analysis Section */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AIIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              AI Fraud Analysis
            </Typography>
          </Box>

          {/* Fraud Score */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Fraud Score
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                color={`${getFraudScoreColor(transaction.fraud_score)}.main`}
              >
                {fraudScorePercent.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={fraudScorePercent}
              color={getFraudScoreColor(transaction.fraud_score)}
              sx={{ height: 12, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {transaction.is_fraud
                ? '⚠️ High probability of fraudulent activity'
                : '✅ Transaction appears legitimate'}
            </Typography>
          </Box>

          {/* Fraud Type */}
          {transaction.fraud_type && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Fraud Type Detected
              </Typography>
              <Chip
                label={transaction.fraud_type.replace(/_/g, ' ').toUpperCase()}
                color="error"
                size="small"
              />
            </Box>
          )}

          {/* Model Info */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Model Version: <strong>{transaction.model_version}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Engine: <strong>XGBoost ML</strong>
            </Typography>
          </Box>
        </Paper>

        {/* Transaction Details Grid */}
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Transaction Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Merchant */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StoreIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Merchant
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={600}>
                {transaction.merchant_name}
              </Typography>
              <Chip label={transaction.merchant_category} size="small" sx={{ mt: 1 }} />
            </Paper>
          </Grid>

          {/* User */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  User
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={600}>
                {transaction.user_id}
              </Typography>
            </Paper>
          </Grid>

          {/* Card */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CardIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Payment Method
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={600}>
                {transaction.card_type.toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                •••• •••• •••• {transaction.card_number_last4}
              </Typography>
            </Paper>
          </Grid>

          {/* Location */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={600}>
                {transaction.location_city}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {transaction.location_country}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Number(transaction.location_lat).toFixed(4)}, {Number(transaction.location_lng).toFixed(4)}
              </Typography>
            </Paper>
          </Grid>

          {/* Device */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DeviceIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Device
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {transaction.device_id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                IP: {transaction.ip_address}
              </Typography>
            </Paper>
          </Grid>

          {/* Transaction Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Transaction Type
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={600}>
                {transaction.transaction_type.toUpperCase()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(transaction.created_at), 'PPpp')}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Risk Indicators (if available) */}
        {transaction.is_fraud && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom color="error.main">
              ⚠️ Risk Indicators
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Unusual Location" color="error" size="small" variant="outlined" />
              <Chip label="High Amount" color="error" size="small" variant="outlined" />
              <Chip label="Velocity Pattern" color="error" size="small" variant="outlined" />
              <Chip label="New Device" color="warning" size="small" variant="outlined" />
            </Box>
          </>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {canApproveTransactions && status === 'flagged' && (
          <>
            <Button
              variant="contained"
              color="error"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  await transactionsAPI.updateStatus(transaction.id, 'declined');
                  setStatus('declined');
                  enqueueSnackbar('Transaction declined', { variant: 'success' });
                  onClose();
                } catch (err: any) {
                  enqueueSnackbar(err?.response?.data?.error || 'Failed to decline', { variant: 'error' });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Decline Transaction
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  await transactionsAPI.updateStatus(transaction.id, 'approved');
                  setStatus('approved');
                  enqueueSnackbar('Transaction approved', { variant: 'success' });
                  onClose();
                } catch (err: any) {
                  enqueueSnackbar(err?.response?.data?.error || 'Failed to approve', { variant: 'error' });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Approve Transaction
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};