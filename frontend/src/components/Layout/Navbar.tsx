import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Shield as ShieldIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const getRoleColor = (role: string): 'error' | 'primary' | 'default' => {
    if (role === 'admin') return 'error';
    if (role === 'analyst') return 'primary';
    return 'default';
  };

  const initials = user?.email
    ? user.email[0].toUpperCase() + (user.email.split('@')[0][1] || '').toUpperCase()
    : '?';

  return (
    <AppBar position="fixed" elevation={0}>
      <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
        {/* ── Logo ── */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            cursor: 'pointer',
            mr: 4,
            '&:hover .logo-icon': {
              boxShadow: '0 0 30px rgba(0,212,255,0.6)',
            },
          }}
        >
          <Box
            className="logo-icon"
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0,212,255,0.35)',
              transition: 'box-shadow 0.3s ease',
              flexShrink: 0,
            }}
          >
            <ShieldIcon sx={{ fontSize: 18, color: '#060611' }} />
          </Box>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              letterSpacing: '-0.01em',
              fontSize: '1.05rem',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            FraudShield
            <Box component="span" sx={{ color: '#00d4ff' }}>AI</Box>
          </Typography>
        </Box>

        {/* ── Nav Links ── */}
        <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
          {[
            { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 16 }} /> },
            { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon sx={{ fontSize: 16 }} /> },
          ].map(({ label, path, icon }) => (
            <Button
              key={path}
              onClick={() => navigate(path)}
              startIcon={icon}
              sx={{
                color: isActive(path) ? '#00d4ff' : 'text.secondary',
                fontWeight: isActive(path) ? 700 : 500,
                px: 2,
                py: 0.75,
                borderRadius: 1.5,
                fontSize: '0.875rem',
                position: 'relative',
                background: isActive(path) ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                border: isActive(path) ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid transparent',
                transition: 'all 0.25s ease',
                '&:hover': {
                  color: '#00d4ff',
                  background: 'rgba(0, 212, 255, 0.08)',
                  border: '1px solid rgba(0, 212, 255, 0.15)',
                },
              }}
            >
              {label}
            </Button>
          ))}
        </Box>

        {/* ── Right Controls ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Notifications */}
          <Tooltip title="Notifications (3 alerts)">
            <IconButton
              sx={{
                color: 'text.secondary',
                '&:hover': { color: '#00d4ff', bgcolor: 'rgba(0,212,255,0.08)' },
              }}
            >
              <Badge
                badgeContent={3}
                color="error"
                sx={{ '& .MuiBadge-badge': { boxShadow: '0 0 8px #ff4757' } }}
              >
                <NotificationsIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Dark mode toggle */}
          <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              onClick={toggleDarkMode}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: '#ffc107', bgcolor: 'rgba(255,193,7,0.08)' },
              }}
            >
              {darkMode ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {/* User avatar */}
          {user && (
            <Box sx={{ ml: 0.5 }}>
              <Tooltip title={`${user.email} · ${user.role}`}>
                <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5 }}>
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                      boxShadow: '0 0 16px rgba(0,212,255,0.3)',
                      border: '2px solid rgba(0,212,255,0.2)',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        boxShadow: '0 0 25px rgba(0,212,255,0.5)',
                        border: '2px solid rgba(0,212,255,0.4)',
                      },
                    }}
                  >
                    {initials}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ sx: { mt: 0.75, minWidth: 220 } }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="body2" fontWeight={700}>{user.email}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75 }}>
                    <Chip
                      label={user.role.toUpperCase()}
                      size="small"
                      color={getRoleColor(user.role)}
                      sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                    />
                    {user.role === 'admin' && (
                      <Chip
                        label="FULL ACCESS"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,71,87,0.15)',
                          color: '#ff4757',
                          border: '1px solid rgba(255,71,87,0.3)',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Divider sx={{ borderColor: 'rgba(0,212,255,0.08)' }} />

                <MenuItem
                  onClick={() => { handleMenuClose(); navigate('/settings'); }}
                  sx={{ gap: 1.5, py: 1.25 }}
                >
                  <SettingsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">Settings</Typography>
                </MenuItem>

                <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.25, color: '#ff4757' }}>
                  <LogoutIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={600}>Sign Out</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};