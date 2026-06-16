import React, { createContext, useContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

type ThemeMode = 'light' | 'dark';

interface ThemeModeContextProps {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextProps | undefined>(undefined);

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode: ThemeMode = 'dark';

  const toggleTheme = () => {
    // Permanent dark mode - no-op
  };

  const theme = React.useMemo(() => {
    const isDark = true;
    return createTheme({
      palette: {
        mode,
        primary: {
          main: isDark ? '#fafafa' : '#18181b', // zinc-50 vs zinc-900
          light: isDark ? '#ffffff' : '#27272a',
          dark: isDark ? '#e4e4e7' : '#09090b',
          contrastText: isDark ? '#09090b' : '#ffffff',
        },
        secondary: {
          main: isDark ? '#a1a1aa' : '#71717a', // zinc-400 vs zinc-500
          light: isDark ? '#d4d4d8' : '#a1a1aa',
          dark: isDark ? '#71717a' : '#3f3f46',
          contrastText: isDark ? '#09090b' : '#ffffff',
        },
        background: {
          default: isDark ? '#09090b' : '#ffffff', // zinc-950 vs white
          paper: isDark ? '#18181b' : '#fafafa', // zinc-900 vs zinc-50
        },
        text: {
          primary: isDark ? '#fafafa' : '#09090b',
          secondary: isDark ? '#a1a1aa' : '#71717a',
        },
        divider: isDark ? '#27272a' : '#e4e4e7', // zinc-800 vs zinc-200
      },
      typography: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 800 },
        h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
        h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
        h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        button: { textTransform: 'none', fontWeight: 600 },
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 6,
              padding: '8px 16px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: isDark ? '0 4px 12px rgba(255, 255, 255, 0.05)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#18181b' : '#fafafa',
              border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
              borderRadius: 8,
              boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? '#09090b' : '#ffffff',
              borderBottom: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
              backgroundImage: 'none',
              boxShadow: 'none',
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
