import React, { useState } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Close as CloseIcon,
  Science as DemoIcon,
} from '@mui/icons-material';
import { transactionsAPI } from '../../services/api';

interface DemoGeneratorProps {
  onTransactionGenerated?: () => void;
}

export const DemoGenerator: React.FC<DemoGeneratorProps> = ({ onTransactionGenerated }) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transactionsPerSecond, setTransactionsPerSecond] = useState(2);
  const [fraudProbability, setFraudProbability] = useState(30);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [fraudGenerated, setFraudGenerated] = useState(0);
  const [autoMode, setAutoMode] = useState(false);

  // Realistic sample data
  const merchants = [
    { name: 'Amazon', category: 'retail', avgAmount: 150 },
    { name: 'Walmart', category: 'retail', avgAmount: 80 },
    { name: 'Netflix', category: 'entertainment', avgAmount: 15 },
    { name: 'Uber', category: 'transportation', avgAmount: 25 },
    { name: 'Starbucks', category: 'food', avgAmount: 12 },
    { name: 'Apple Store', category: 'electronics', avgAmount: 500 },
    { name: 'Target', category: 'retail', avgAmount: 95 },
    { name: 'Gas Station', category: 'fuel', avgAmount: 45 },
    { name: 'Restaurant', category: 'food', avgAmount: 65 },
    { name: 'Hotel Booking', category: 'travel', avgAmount: 250 },
  ];

  const cities = [
    { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.006 },
    { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
    { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
    { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
    { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 },
  ];

  const cardTypes = ['credit', 'debit', 'prepaid'];
  const transactionTypes = ['purchase', 'withdrawal', 'transfer'];

  // Generate a single transaction
  const generateTransaction = async (forceFraud = false) => {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];

    // Determine if this should be fraud
    const shouldBeFraud = forceFraud || Math.random() * 100 < fraudProbability;

    // Generate amount (fraudulent transactions tend to be higher)
    let amount = merchant.avgAmount;
    if (shouldBeFraud) {
      amount = amount * (Math.random() * 5 + 2); // 2-7x normal amount
    } else {
      amount = amount * (Math.random() * 0.6 + 0.7); // 0.7-1.3x normal amount
    }

    // For fraud, sometimes use suspicious locations
    let selectedCity = city;
    if (shouldBeFraud && Math.random() > 0.5) {
      // Use a more "suspicious" location
      selectedCity = cities[Math.floor(Math.random() * 3) + 5]; // Moscow, Dubai, etc.
    }

    const transaction = {
      transaction_id: `txn_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: `user_${Math.floor(Math.random() * 1000)}`,
      merchant_id: `merch_${merchant.name.toLowerCase().replace(/\s/g, '_')}_${Math.floor(Math.random() * 100)}`,
      merchant_name: merchant.name,
      merchant_category: merchant.category,
      amount: parseFloat(amount.toFixed(2)),
      currency: 'USD',
      card_number_last4: Math.floor(1000 + Math.random() * 9000).toString(),
      card_type: cardType,
      transaction_type: transactionType,
      ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      device_id: `device_${Math.random().toString(36).substr(2, 9)}`,
      location_lat: selectedCity.lat + (Math.random() - 0.5) * 0.1,
      location_lng: selectedCity.lng + (Math.random() - 0.5) * 0.1,
      location_country: selectedCity.country,
      location_city: selectedCity.name,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await transactionsAPI.create(transaction);
      
      setTotalGenerated((prev) => prev + 1);
      // backend returns fraud_prediction field
      const pred = response.fraud_prediction || response.prediction;
      if (pred && pred.is_fraud) {
        setFraudGenerated((prev) => prev + 1);
      }

      onTransactionGenerated?.();
      
      return response;
    } catch (error) {
      console.error('Error generating transaction:', error);
      throw error;
    }
  };

  // Start generating transactions
  const startGenerating = () => {
    setIsGenerating(true);
    setTotalGenerated(0);
    setFraudGenerated(0);

    const interval = setInterval(async () => {
      try {
        await generateTransaction();
      } catch (error) {
        console.error('Generation error:', error);
      }
    }, 1000 / transactionsPerSecond);

    // Store interval ID for cleanup
    (window as any).demoInterval = interval;
  };

  // Stop generating
  const stopGenerating = () => {
    setIsGenerating(false);
    if ((window as any).demoInterval) {
      clearInterval((window as any).demoInterval);
      (window as any).demoInterval = null;
    }
  };

  // Generate single transaction
  const generateSingle = async () => {
    try {
      await generateTransaction();
    } catch (error) {
      console.error('Error generating single transaction:', error);
    }
  };

  // Generate fraud transaction
  const generateFraud = async () => {
    try {
      await generateTransaction(true);
    } catch (error) {
      console.error('Error generating fraud transaction:', error);
    }
  };

  const handleClose = () => {
    stopGenerating();
    setOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="secondary"
        aria-label="demo mode"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => setOpen(true)}
      >
        <DemoIcon />
      </Fab>

      {/* Demo Control Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DemoIcon color="secondary" />
            <Typography variant="h6" fontWeight={600}>
              Demo Mode
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Generate realistic transactions to demonstrate the fraud detection system in action!
          </Alert>

          {/* Stats */}
          {totalGenerated > 0 && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Generated Statistics
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip label={`Total: ${totalGenerated}`} color="primary" />
                <Chip label={`Fraud: ${fraudGenerated}`} color="error" />
                <Chip 
                  label={`Rate: ${totalGenerated > 0 ? ((fraudGenerated / totalGenerated) * 100).toFixed(1) : 0}%`} 
                  color="warning" 
                />
              </Box>
            </Box>
          )}

          {/* Transactions Per Second */}
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom fontWeight={600}>
              Transactions Per Second: {transactionsPerSecond}
            </Typography>
            <Slider
              value={transactionsPerSecond}
              onChange={(_, value) => setTransactionsPerSecond(value as number)}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
              disabled={isGenerating}
            />
            <Typography variant="caption" color="text.secondary">
              Controls how fast transactions are generated
            </Typography>
          </Box>

          {/* Fraud Probability */}
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom fontWeight={600}>
              Fraud Probability: {fraudProbability}%
            </Typography>
            <Slider
              value={fraudProbability}
              onChange={(_, value) => setFraudProbability(value as number)}
              min={0}
              max={100}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' },
              ]}
              valueLabelDisplay="auto"
              disabled={isGenerating}
            />
            <Typography variant="caption" color="text.secondary">
              Percentage of generated transactions that will be fraudulent
            </Typography>
          </Box>

          {/* Auto Mode */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoMode}
                  onChange={(e) => setAutoMode(e.target.checked)}
                  disabled={isGenerating}
                />
              }
              label="Auto Mode (mix of normal and fraud)"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Automatically generates a realistic mix of transactions
            </Typography>
          </Box>

          {/* Manual Controls */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={generateSingle}
              disabled={isGenerating}
            >
              Generate 1 Normal
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={generateFraud}
              disabled={isGenerating}
            >
              Generate 1 Fraud
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
          {!isGenerating ? (
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={startGenerating}
              color="success"
            >
              Start Auto-Generate
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<StopIcon />}
              onClick={stopGenerating}
              color="error"
            >
              Stop
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};