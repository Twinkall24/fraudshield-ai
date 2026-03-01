import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import { Shield as ShieldIcon, LockOutlined, EmailOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Small particle background (lighter weight for login page)
const LoginParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: `
          radial-gradient(ellipse 700px 500px at 15% 50%, rgba(0, 212, 255, 0.07) 0%, transparent 70%),
          radial-gradient(ellipse 500px 400px at 85% 20%, rgba(124, 58, 237, 0.08) 0%, transparent 70%),
          #060611
        `,
      }}
    >
      <LoginParticles />

      {/* Cyber grid */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Card */}
        <Box
          className="fade-in-scale"
          sx={{
            p: { xs: 3.5, md: 5 },
            borderRadius: 3,
            background: 'rgba(13, 13, 26, 0.85)',
            border: '1px solid rgba(0, 212, 255, 0.12)',
            backdropFilter: 'blur(24px)',
            boxShadow: `
              0 25px 60px rgba(0, 0, 0, 0.7),
              0 0 0 1px rgba(0, 212, 255, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.03)
            `,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), rgba(124,58,237,0.5), transparent)',
            },
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'inline-flex', position: 'relative', mb: 2 }}>
              {/* Rotating ring */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: -8,
                  borderRadius: '50%',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  borderTop: '1px solid #00d4ff',
                  animation: 'rotate 4s linear infinite',
                }}
              />
              {/* Outer ring */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: -16,
                  borderRadius: '50%',
                  border: '1px solid rgba(0, 212, 255, 0.08)',
                  borderBottom: '1px solid rgba(124, 58, 237, 0.3)',
                  animation: 'rotate 8s linear infinite reverse',
                }}
              />
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(0, 212, 255, 0.2)',
                }}
              >
                <ShieldIcon sx={{ fontSize: 32, color: '#00d4ff' }} />
              </Box>
            </Box>

            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.75, mt: 1 }}>
              {isSignUp ? 'Create your account' : 'FraudShield'}
              {!isSignUp && (
                <Box component="span" sx={{ color: '#00d4ff' }}>AI</Box>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSignUp
                ? 'Sign up for a viewer account to explore the dashboard.'
                : 'Real-Time AI Transaction Monitoring Platform'}
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{
                mb: 2.5,
                bgcolor: 'rgba(255, 71, 87, 0.1)',
                border: '1px solid rgba(255, 71, 87, 0.25)',
                color: '#ff6b7a',
                '& .MuiAlert-icon': { color: '#ff4757' },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email address"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <EmailOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <LockOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2.5, py: 1.5, fontSize: '1rem', borderRadius: 2 }}
              disabled={loading}
            >
              {loading ? (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <CircularProgress size={18} sx={{ color: 'inherit' }} />
                  <span>{isSignUp ? 'Creating account...' : 'Authenticating...'}</span>
                </Stack>
              ) : (
                (isSignUp ? 'Create Account' : 'Sign In to Dashboard')
              )}
            </Button>

            {/* Toggle between sign in and sign up */}
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
              >
                {isSignUp
                  ? 'Already have an account?'
                  : "Don't have an account yet?"}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (loading) return;
                  setError('');
                  setIsSignUp(prev => !prev);
                }}
                sx={{ borderRadius: 999, textTransform: 'none', fontSize: '0.8rem' }}
              >
                {isSignUp ? 'Switch to Sign In' : 'Create a free viewer account'}
              </Button>
            </Stack>

          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 3 }}>
          Built with React · Node.js · Python ML · PostgreSQL · Docker
        </Typography>
      </Container>
    </Box>
  );
};

export default Login;