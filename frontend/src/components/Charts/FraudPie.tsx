import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface FraudPieChartProps {
  fraudCount: number;
  legitimateCount: number;
}

export const FraudPieChart: React.FC<FraudPieChartProps> = ({
  fraudCount,
  legitimateCount,
}) => {
  const data = {
    labels: ['Legitimate', 'Fraud'],
    datasets: [
      {
        data: [legitimateCount, fraudCount],
        backgroundColor: ['#bdbdbd', '#ef9a9a'],
        borderColor: ['#0f0f10', '#0f0f10'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Fraud Distribution
      </Typography>
      <Box sx={{ height: 'calc(100% - 40px)' }}>
        <Pie data={data} options={options} />
      </Box>
    </Paper>
  );
};