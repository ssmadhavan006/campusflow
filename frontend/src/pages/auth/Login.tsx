import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

declare global {
  interface Window {
    google: any;
  }
}

export const Login: React.FC = () => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleCallback = async (response: any) => {
    setError(null);
    setLoading(true);
    try {
      const { isNewUser } = await googleLogin(response.credential);
      if (isNewUser) {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Sign-In is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment.');
      return;
    }

    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: '100%', shape: 'pill' }
        );
      }
    };

    if (window.google) {
      initializeGoogleSignIn();
    } else {
      let attempts = 0;
      const maxAttempts = 100;
      const timer = setInterval(() => {
        attempts++;
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(timer);
        } else if (attempts >= maxAttempts) {
          clearInterval(timer);
          setError('Google Sign-In failed to load. Please check your internet connection or disable ad-blocker.');
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, []);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={2}
    >
      <Card sx={{ width: '100%', maxWidth: 420, p: 2 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                color: (theme) => theme.palette.text.primary,
                letterSpacing: '-0.02em',
              }}
            >
              CampusFlow
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sign in to manage your college events
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Sign in with your Google account to access CampusFlow.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={50}>
            {loading ? (
              <CircularProgress size={30} />
            ) : (
              <Box id="google-signin-button" sx={{ width: '100%' }} />
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
