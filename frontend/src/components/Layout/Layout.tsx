import React from 'react';
import { Box, Container, Toolbar } from '@mui/material';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleDarkMode }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Toolbar /> {/* Spacer */}

      {/* Subtle animated background */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.022) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient top-left glow */}
      <Box
        sx={{
          position: 'fixed',
          top: -200,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Ambient bottom-right glow */}
      <Box
        sx={{
          position: 'fixed',
          bottom: -200,
          right: -200,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          position: 'relative',
          zIndex: 1,
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Container maxWidth="xl">{children}</Container>
      </Box>
    </Box>
  );
};