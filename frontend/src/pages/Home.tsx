import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  TrendingUp,
  Speed,
  Security,
  Analytics,
  ArrowForward,
  CheckCircle,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// ─── Static Grid Background ───────────────────────────────────────────────────
const GridBackground: React.FC = () => (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}
  >
    {/* Base gradient */}
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse 900px 700px at 15% 25%, rgba(0,212,255,0.055) 0%, transparent 65%),
          radial-gradient(ellipse 700px 600px at 88% 12%, rgba(124,58,237,0.065) 0%, transparent 65%),
          radial-gradient(ellipse 600px 500px at 55% 85%, rgba(0,255,136,0.03) 0%, transparent 65%)
        `,
      }}
    />
    {/* Dot-grid */}
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(0,212,255,0.18) 1px, transparent 1px)`,
        backgroundSize: '36px 36px',
        maskImage: `radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)`,
        opacity: 0.35,
      }}
    />
    {/* Horizontal line accents */}
    <Box
      sx={{
        position: 'absolute',
        top: '38%',
        left: 0,
        right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.12) 30%, rgba(124,58,237,0.12) 70%, transparent 100%)',
      }}
    />
  </Box>
);

// ─── Animated Counter ─────────────────────────────────────────────────────────
const AnimatedCounter: React.FC<{ target: string; label: string }> = ({ target, label }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <Box ref={ref} sx={{ textAlign: 'center' }}>
      <Typography
        variant="h3"
        fontWeight={800}
        sx={{
          background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
          lineHeight: 1.1,
        }}
      >
        {target}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontWeight: 500, fontSize: '0.8rem', letterSpacing: 0.3 }}>
        {label}
      </Typography>
    </Box>
  );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
  index: number;
}> = ({ icon, title, description, accentColor, index }) => (
  <Box
    sx={{
      p: 3,
      height: '100%',
      borderRadius: 2.5,
      background: 'rgba(10, 10, 22, 0.6)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderLeft: `3px solid ${accentColor}`,
      backdropFilter: 'blur(12px)',
      position: 'relative',
      cursor: 'default',
      transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
      opacity: 0,
      animation: `fadeSlideIn 0.5s ease-out ${index * 80}ms both`,
      '&:hover': {
        background: 'rgba(16, 16, 32, 0.85)',
        borderColor: `${accentColor}55`,
        borderLeftColor: accentColor,
        transform: 'translateY(-4px)',
        boxShadow: `0 16px 48px rgba(0,0,0,0.35), 4px 0 24px ${accentColor}14`,
      },
    }}
  >
    {/* Icon row */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          background: `${accentColor}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#eef2ff', lineHeight: 1.2 }}>
        {title}
      </Typography>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, fontSize: '0.845rem' }}>
      {description}
    </Typography>
  </Box>
);

// ─── Live Transaction Card ────────────────────────────────────────────────────
const transactions = [
  { amount: '$1,273.19', category: 'Hotel Booking', location: 'Singapore', score: 78, flagged: true },
  { amount: '$4,891.00', category: 'Wire Transfer', location: 'Lagos, NG', score: 94, flagged: true },
  { amount: '$23.50', category: 'Coffee Shop', location: 'New York, US', score: 4, flagged: false },
  { amount: '$8,200.00', category: 'Online Purchase', location: 'Amsterdam, NL', score: 67, flagged: true },
];

const LiveTransactionCard: React.FC = () => {
  const [txIndex, setTxIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setTxIndex(i => (i + 1) % transactions.length);
        setFading(false);
      }, 300);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const tx = transactions[txIndex];
  const isHighRisk = tx.score > 70;
  const isMedRisk = tx.score > 40;
  const scoreColor = isHighRisk ? '#ff4757' : isMedRisk ? '#ffc107' : '#00d97e';
  const scoreLabel = isHighRisk ? 'HIGH RISK' : isMedRisk ? 'MEDIUM' : 'LOW RISK';

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        background: 'rgba(8, 8, 20, 0.92)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        minWidth: { xs: '100%', sm: 340 },
        maxWidth: 380,
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          background: 'rgba(0,212,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 7, height: 7, borderRadius: '50%',
              bgcolor: '#00d97e',
              boxShadow: '0 0 8px #00d97e',
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
          <Typography variant="caption" fontWeight={700} letterSpacing={1.5} sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>
            LIVE MONITOR
          </Typography>
        </Box>
        <Box
          sx={{
            px: 1.2,
            py: 0.25,
            borderRadius: 1,
            bgcolor: `${scoreColor}18`,
            border: `1px solid ${scoreColor}30`,
          }}
        >
          <Typography variant="caption" fontWeight={700} sx={{ color: scoreColor, fontSize: '0.62rem', letterSpacing: 0.8 }}>
            {tx.flagged ? '⚠ FLAGGED' : '✓ CLEAR'}
          </Typography>
        </Box>
      </Box>

      {/* Transaction Body */}
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          opacity: fading ? 0 : 1,
          transform: fading ? 'translateY(6px)' : 'translateY(0)',
          transition: 'all 0.28s ease',
        }}
      >
        {/* Amount */}
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          {tx.amount}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5, display: 'block', fontSize: '0.78rem' }}>
          {tx.category}&nbsp;·&nbsp;{tx.location}
        </Typography>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

        {/* Risk Score */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" fontWeight={600} letterSpacing={1} sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}>
              FRAUD SCORE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" fontWeight={800} sx={{ color: scoreColor, fontSize: '0.85rem' }}>
                {tx.score}%
              </Typography>
              <Typography variant="caption" sx={{ color: scoreColor, fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.5, opacity: 0.75 }}>
                {scoreLabel}
              </Typography>
            </Box>
          </Box>
          {/* Progress bar */}
          <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${tx.score}%`,
                borderRadius: 2,
                background: isHighRisk
                  ? 'linear-gradient(90deg, #ff6b7a, #ff4757)'
                  : isMedRisk
                    ? 'linear-gradient(90deg, #ffd54f, #ffc107)'
                    : 'linear-gradient(90deg, #33ff99, #00d97e)',
                transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1), background 0.5s ease',
                boxShadow: `0 0 8px ${scoreColor}80`,
              }}
            />
          </Box>
        </Box>

        {/* ML Tags */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {['Velocity', 'Geo-anomaly', 'Device Risk'].map(tag => (
            <Box
              key={tag}
              sx={{
                px: 1,
                py: 0.3,
                borderRadius: 1,
                bgcolor: 'rgba(0,212,255,0.06)',
                border: '1px solid rgba(0,212,255,0.12)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(0,212,255,0.65)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: 0.4 }}>
                {tag}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Mini ticker / activity strip */}
      <Box
        sx={{
          px: 2.5,
          py: 1.25,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem' }}>
          Processed in 7ms
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 3,
                height: 8 + Math.sin(i * 1.2 + txIndex) * 5,
                borderRadius: 1,
                bgcolor: i < 3 ? '#00d4ff40' : '#ff475740',
                transition: 'height 0.4s ease',
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Speed sx={{ fontSize: 20 }} />,
      title: 'Real-time Monitoring',
      description: 'Stream millions of transactions per second and detect suspicious activity with sub-10ms latency.',
      accentColor: '#00d4ff',
    },
    {
      icon: <Analytics sx={{ fontSize: 20 }} />,
      title: 'Explainable AI',
      description: 'XGBoost models surface risk factors with confidence scores, so analysts understand every flag.',
      accentColor: '#7c3aed',
    },
    {
      icon: <Security sx={{ fontSize: 20 }} />,
      title: 'Actionable Workflow',
      description: 'Approve, decline, and investigate transactions end-to-end — all from one unified dashboard.',
      accentColor: '#00d97e',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 20 }} />,
      title: 'Advanced Analytics',
      description: 'Heatmaps, geo-maps, and score distributions reveal fraud patterns across time and geography.',
      accentColor: '#ffc107',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        position: 'relative',
        overflowX: 'hidden',
        '@keyframes fadeSlideIn': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 8px #00d97e' },
          '50%': { opacity: 0.5, boxShadow: '0 0 3px #00d97e' },
        },
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      }}
    >
      {/* Static elegant background */}
      <GridBackground />

      {/* ─── NAV ─── */}
      <Box
        sx={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 100,
          background: 'rgba(6, 6, 17, 0.75)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          px: { xs: 2, md: 6 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 34, height: 34,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ShieldIcon sx={{ fontSize: 18, color: '#060611' }} />
          </Box>
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em', fontSize: '1rem' }}>
            FraudShield<Box component="span" sx={{ color: '#00d4ff' }}>AI</Box>
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" size="small" onClick={() => navigate('/analytics')}>
            Analytics
          </Button>
          <Button variant="contained" size="small" onClick={() => navigate('/login')} sx={{ px: 2.5 }}>
            Sign In →
          </Button>
        </Stack>
      </Box>

      {/* ─── HERO ─── */}
      <Box
        sx={{
          pt: { xs: 16, md: 22 },
          pb: { xs: 10, md: 16 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
            {/* Left */}
            <Grid size={{ xs: 12, md: 6 }}>
              {/* Live badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.6,
                  borderRadius: 5,
                  border: '1px solid rgba(0,212,255,0.2)',
                  bgcolor: 'rgba(0,212,255,0.06)',
                  mb: 3,
                  animation: 'fadeIn 0.5s ease-out both',
                }}
              >
                <Box
                  sx={{
                    width: 6, height: 6, borderRadius: '50%', bgcolor: '#ff4757',
                    boxShadow: '0 0 6px #ff4757',
                    animation: 'pulse 1.6s ease-in-out infinite',
                  }}
                />
                <Typography variant="caption" fontWeight={700} sx={{ color: '#00d4ff', letterSpacing: 0.5, fontSize: '0.73rem' }}>
                  LIVE: Monitoring 2.3M transactions/day
                </Typography>
              </Box>

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.75rem' },
                  fontWeight: 900,
                  lineHeight: 1.05,
                  mb: 2.5,
                  animation: 'fadeSlideIn 0.5s ease-out 0.08s both',
                }}
              >
                Stop Fraud{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 55%, #00d97e 100%)',
                    backgroundSize: '200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'gradientShift 5s ease infinite',
                  }}
                >
                  Before It Happens
                </Box>
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mb: 4,
                  lineHeight: 1.8,
                  maxWidth: 480,
                  fontSize: '1.05rem',
                  animation: 'fadeSlideIn 0.5s ease-out 0.16s both',
                }}
              >
                AI-powered real-time fraud detection for banks and fintechs.
                Monitor every transaction, catch anomalies instantly, and protect your customers — at any scale.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ animation: 'fadeSlideIn 0.5s ease-out 0.24s both' }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward />}
                  sx={{ py: 1.5, px: 3.5, fontSize: '0.95rem' }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/analytics')}
                  sx={{ py: 1.5, px: 3.5, fontSize: '0.95rem' }}
                >
                  View Live Analytics
                </Button>
              </Stack>

              {/* Trust badges */}
              <Stack
                direction="row"
                spacing={3}
                sx={{ mt: 4, animation: 'fadeSlideIn 0.5s ease-out 0.32s both' }}
              >
                {['99.8% Accuracy', '< 10ms Latency', 'SOC 2 Ready'].map(item => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <CheckCircle sx={{ fontSize: 14, color: '#00d97e' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>

            {/* Right: Live Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', md: 'flex-end' },
                  animation: 'fadeSlideIn 0.65s ease-out 0.2s both',
                }}
              >
                <LiveTransactionCard />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── STATS BAR ─── */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 6, md: 8 },
          borderTop: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(8,8,20,0.55)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {[
              { target: '10M+', label: 'Transactions Monitored Daily' },
              { target: '$2.8B', label: 'Fraud Prevented Annually' },
              { target: '99.8%', label: 'Detection Accuracy' },
              { target: '8ms', label: 'Average Response Time' },
            ].map((stat, i) => (
              <Grid key={i} size={{ xs: 6, md: 3 }}>
                <AnimatedCounter target={stat.target} label={stat.label} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── FEATURES ─── */}
      <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 7 }}>
            <Typography
              variant="overline"
              sx={{ color: '#00d4ff', fontWeight: 700, letterSpacing: 3, mb: 1.5, display: 'block', fontSize: '0.72rem' }}
            >
              Capabilities
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5, maxWidth: 480 }}>
              Everything you need to fight fraud
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 440 }}>
              A complete platform from ingestion to investigation —{' '}
              built for the speed of modern finance.
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {features.map((feature, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <FeatureCard {...feature} index={i} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── CTA ─── */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 8, md: 12 },
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              p: { xs: 4, md: 7 },
              borderRadius: 3.5,
              textAlign: 'center',
              background: 'rgba(8, 8, 20, 0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0, left: '10%', right: '10%', height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), rgba(124,58,237,0.4), transparent)',
              },
            }}
          >
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{ mb: 1.5, color: '#f0f4ff' }}
            >
              Ready to secure your platform?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto', lineHeight: 1.8 }}>
              Join hundreds of financial institutions using FraudShield AI to protect their customers.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ py: 1.5, px: 4, fontSize: '0.95rem' }}
              >
                Start Monitoring Now
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/analytics')}
                sx={{ py: 1.5, px: 4, fontSize: '0.95rem' }}
              >
                Explore Analytics
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          py: 3.5,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.5 }}>
          Built with React · Node.js · Python ML · PostgreSQL · Docker · WebSockets
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;
