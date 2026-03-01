import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendChartProps {
  title: string;
  data: number[];
  labels: string[];
  color?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  labels,
  color = '#bdbdbd',
}) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Count',
        data,
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: { color: '#cfcfcf' },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(255,255,255,0.03)',
        },
        ticks: { color: '#cfcfcf' },
      },
    },
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        {title}
      </Typography>
      <Box sx={{ height: 'calc(100% - 40px)' }}>
        <Line data={chartData} options={options} />
      </Box>
    </Paper>
  );
};