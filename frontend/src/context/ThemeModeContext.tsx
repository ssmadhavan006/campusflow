import React, { createContext, useContext, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

type ThemeMode = 'light' | 'dark';

interface ThemeModeContextProps {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextProps | undefined>(undefined);

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  const theme = React.useMemo(() => {
    const isDark = mode === 'dark';
    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#0066cc', // Apple Action Blue
          light: '#2997ff', // Sky Link Blue
          dark: '#0055b3',
          contrastText: '#ffffff',
        },
        secondary: {
          main: isDark ? '#cccccc' : '#7a7a7a', // Apple muted colors
          light: isDark ? '#ffffff' : '#fafafc',
          dark: isDark ? '#7a7a7a' : '#333333',
          contrastText: isDark ? '#1d1d1f' : '#ffffff',
        },
        background: {
          default: isDark ? '#1d1d1f' : '#f5f5f7', // near-black vs Apple off-white parchment
          paper: isDark ? '#272729' : '#ffffff', // near-black tile vs pure white
        },
        text: {
          primary: isDark ? '#ffffff' : '#1d1d1f', // body-on-dark vs near-black ink
          secondary: isDark ? '#cccccc' : '#7a7a7a', // body-muted vs ink-muted-48
        },
        divider: isDark ? '#333333' : '#e0e0e0', // ink-muted-80 vs hairline
      },
      typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        h1: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
          letterSpacing: '-0.02em',
        },
        h2: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
          letterSpacing: '-0.015em',
        },
        h3: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
          letterSpacing: '-0.01em',
        },
        h4: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
        },
        h5: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
        },
        h6: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
        },
        subtitle1: { fontWeight: 500 },
        button: { textTransform: 'none', fontWeight: 500 },
      },
      shape: {
        borderRadius: 18, // Apple rounded.lg (18px)
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 9999, // Signature Apple pill shape for primary actions
              textTransform: 'none',
              padding: '8px 20px',
              fontWeight: 500,
              boxShadow: 'none',
              transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)',
              '&:hover': {
                boxShadow: 'none',
                opacity: 0.9,
              },
              '&:active': {
                transform: 'scale(0.96)', // Apple micro-interaction
              },
            },
            containedSecondary: {
              backgroundColor: isDark ? '#333333' : '#fafafc',
              color: isDark ? '#ffffff' : '#1d1d1f',
              border: `1px solid ${isDark ? '#444444' : '#e0e0e0'}`,
              '&:hover': {
                backgroundColor: isDark ? '#444444' : '#f5f5f7',
              },
            },
            outlined: {
              borderRadius: 9999, // Also pills for secondary outline buttons
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#272729' : '#ffffff',
              border: `1px solid ${isDark ? '#333333' : '#e0e0e0'}`,
              borderRadius: 18, // signature rounded.lg (18px)
              boxShadow: 'none', // Apple layout uses flat surfaces
              transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDark ? 'rgba(0, 0, 0, 0.4) 0px 8px 24px' : 'rgba(0, 0, 0, 0.04) 0px 8px 24px',
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? 'rgba(29, 29, 31, 0.8)' : 'rgba(245, 245, 247, 0.8)',
              backdropFilter: 'blur(20px)', // frosted glass sub-nav effect
              borderBottom: `1px solid ${isDark ? '#333333' : '#e0e0e0'}`,
              backgroundImage: 'none',
              boxShadow: 'none',
              color: isDark ? '#ffffff' : '#1d1d1f',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: isDark ? '#1d1d1f' : '#f5f5f7', // parchment off-white sidebar
              borderRight: `1px solid ${isDark ? '#333333' : '#e0e0e0'}`,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 11, // rounded.md (11px)
              backgroundColor: isDark ? '#272729' : '#ffffff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? '#333333' : '#e0e0e0',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0066cc',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0066cc',
                borderWidth: 2,
              },
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 18,
              backgroundColor: isDark ? '#1d1d1f' : '#ffffff',
              backgroundImage: 'none',
              boxShadow: isDark ? 'rgba(0, 0, 0, 0.5) 0px 10px 40px' : 'rgba(0, 0, 0, 0.15) 0px 10px 40px',
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 9999, // Pill shape
              fontWeight: 600,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return context;
};
