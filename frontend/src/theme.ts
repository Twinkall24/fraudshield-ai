import { createTheme } from '@mui/material/styles';

// ═══════════════════════════════════════════════
//  CYBER DARK THEME — Primary theme
// ═══════════════════════════════════════════════
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#33ddff',
      dark: '#0099bb',
    },
    secondary: {
      main: '#7c3aed',
      light: '#9d5cf5',
      dark: '#5b21b6',
    },
    success: {
      main: '#00ff88',
      light: '#33ff99',
      dark: '#00cc66',
    },
    warning: {
      main: '#ffc107',
      light: '#ffd54f',
      dark: '#ff8f00',
    },
    error: {
      main: '#ff4757',
      light: '#ff6b7a',
      dark: '#c0392b',
    },
    info: {
      main: '#7c3aed',
      light: '#9d5cf5',
      dark: '#5b21b6',
    },
    background: {
      default: '#060611',
      paper: '#0d0d1a',
    },
    text: {
      primary: '#f0f4ff',
      secondary: '#8892b0',
    },
    divider: 'rgba(0, 212, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0, 212, 255, 0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124, 58, 237, 0.05) 0%, transparent 60%)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(6, 6, 17, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 20px',
          transition: 'all 0.25s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00d4ff 0%, #0099bb 100%)',
          color: '#060611',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #33ddff 0%, #00d4ff 100%)',
            boxShadow: '0 0 35px rgba(0, 212, 255, 0.5)',
            transform: 'translateY(-1px)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          color: '#fff',
          boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #9d5cf5 0%, #7c3aed 100%)',
            boxShadow: '0 0 35px rgba(124, 58, 237, 0.5)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 212, 255, 0.4)',
          color: '#00d4ff',
          '&:hover': {
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.08)',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)',
          },
        },
        outlinedSecondary: {
          borderColor: 'rgba(124, 58, 237, 0.4)',
          color: '#9d5cf5',
          '&:hover': {
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(13, 13, 26, 0.8)',
          border: '1px solid rgba(0, 212, 255, 0.08)',
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(13, 13, 26, 0.8)',
          border: '1px solid rgba(0, 212, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.3s ease',
          '&:hover': {
            border: '1px solid rgba(0, 212, 255, 0.2)',
            boxShadow: '0 8px 40px rgba(0, 212, 255, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00d4ff',
              boxShadow: '0 0 0 3px rgba(0, 212, 255, 0.1)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: 'rgba(0, 212, 255, 0.04)',
            borderBottomColor: 'rgba(0, 212, 255, 0.1)',
            fontWeight: 700,
            color: '#00d4ff',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 212, 255, 0.04) !important',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: 'rgba(0, 212, 255, 0.05)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          borderRadius: 4,
        },
        bar: {
          background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
          borderRadius: 4,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(13, 13, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 212, 255, 0.08)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(13, 13, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(13, 13, 26, 0.95)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
          fontWeight: 700,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        dot: {
          boxShadow: '0 0 6px currentColor',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#00d4ff',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          borderRadius: 10,
        },
      },
    },
  },
});

// ═══════════════════════════════════════════════
//  LIGHT THEME
// ═══════════════════════════════════════════════
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0066cc',
      light: '#3385d6',
      dark: '#004499',
    },
    secondary: {
      main: '#7c3aed',
      light: '#9d5cf5',
      dark: '#5b21b6',
    },
    success: {
      main: '#00aa55',
      light: '#00cc66',
      dark: '#007733',
    },
    warning: {
      main: '#e67e00',
      light: '#ff9500',
      dark: '#cc6600',
    },
    error: {
      main: '#cc2233',
      light: '#e63344',
      dark: '#991122',
    },
    background: {
      default: '#f0f4ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#0a0a1a',
      secondary: '#4a5568',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 102, 204, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          color: '#0a0a1a',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          transition: 'all 0.25s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
          color: '#fff',
          boxShadow: '0 4px 15px rgba(0, 102, 204, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3385d6 0%, #0066cc 100%)',
            boxShadow: '0 6px 25px rgba(0, 102, 204, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 102, 204, 0.4)',
          '&:hover': {
            backgroundColor: 'rgba(0, 102, 204, 0.06)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 102, 204, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 102, 204, 0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#0066cc',
            },
          },
        },
      },
    },
  },
});