import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

export const VolunteerScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const primaryColor = theme.palette.primary.main;
  const scannerStyles = React.useMemo(() => ({
    readerBorder: 'none !important',
    readerBg: 'transparent !important',
    readerColor: isDarkMode ? '#ffffff' : '#1d1d1f',
    buttonBg: primaryColor,
    buttonText: '#ffffff',
    selectBg: isDarkMode ? '#1e293b' : '#ffffff',
    selectColor: isDarkMode ? '#ffffff' : '#1d1d1f',
    scanRegionBorder: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#e0e0e0',
    scanRegionBg: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f7',
  }), [isDarkMode, primaryColor]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scannerActive) {
      scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        },
        false
      );

      const onScanSuccess = async (decodedText: string) => {
        setScannerActive(false);
        setLoading(true);
        setScanError(null);
        setScanResult(null);

        try {
          const res = await api.post('/attendance/scan', { qrToken: decodedText });
          setScanResult(res.data.data.attendance);
          setScanCount((prev) => prev + 1);
        } catch (err: any) {
          setScanError(err.response?.data?.message || 'Attendance verification failed.');
        } finally {
          setLoading(false);
        }
      };

      const onScanFailure = () => {
        // Ignore normal scanning failed ticks
      };

      scanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((err) => console.error('Failed to clear scanner:', err));
      }
    };
  }, [scannerActive]);

  const handleScanNext = () => {
    setScanResult(null);
    setScanError(null);
    setScannerActive(true);
  };

  return (
    <Box maxWidth={480} mx="auto" textAlign="center" sx={{ py: 4, px: 2 }}>
      {/* Title */}
      <Typography variant="h4" sx={{
        fontFamily: '"SF Pro Display", "Inter", sans-serif',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: 'text.primary',
        mb: 1
      }}>
        Attendance Scanner
      </Typography>
      <Typography variant="body2" sx={{
        fontFamily: '"SF Pro Text", "Inter", sans-serif',
        color: 'text.secondary',
        mb: 4
      }}>
        Session scans: <strong>{scanCount}</strong>
      </Typography>

      {loading && (
        <Box py={8} display="flex" flexDirection="column" alignItems="center">
          <CircularProgress size={44} thickness={4} sx={{ color: '#0066cc' }} />
          <Typography variant="body2" sx={{ mt: 2, fontFamily: '"SF Pro Text", "Inter", sans-serif', color: 'text.primary', fontWeight: 500 }}>
            Verifying token signature...
          </Typography>
        </Box>
      )}

      {scanResult && !loading && (
        <Card sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '18px',
          boxShadow: 'none',
          bgcolor: 'background.paper',
          mb: 3,
          overflow: 'hidden'
        }}>
          <CardContent sx={{ py: 4, px: 3 }}>
            <SuccessIcon sx={{ color: '#0066cc', fontSize: 64, mb: 2 }} />
            <Typography variant="h6" sx={{ fontFamily: '"SF Pro Display", "Inter", sans-serif', fontWeight: 600, color: 'text.primary', mb: 2 }}>
              Attendance Verified
            </Typography>
            
            <Box sx={{ textAlign: 'left', mb: 3, bgcolor: 'background.default', p: 2, borderRadius: '11px' }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                <strong>Name:</strong> {scanResult.registration.student.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                <strong>Roll Number:</strong> {scanResult.registration.student.rollNumber || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                <strong>Department:</strong> {scanResult.registration.student.department || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
                Verified at {new Date(scanResult.scannedAt).toLocaleTimeString()}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleScanNext}
              fullWidth
              sx={{
                bgcolor: '#0066cc',
                color: '#ffffff',
                fontFamily: '"SF Pro Text", "Inter", sans-serif',
                fontWeight: 500,
                borderRadius: '9999px',
                py: 1.5,
                boxShadow: 'none',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#0071e3',
                  boxShadow: 'none',
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              Scan Next
            </Button>
          </CardContent>
        </Card>
      )}

      {scanError && !loading && (
        <Card sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '18px',
          boxShadow: 'none',
          bgcolor: 'background.paper',
          mb: 3
        }}>
          <CardContent sx={{ py: 4, px: 3 }}>
            <ErrorIcon sx={{ color: '#ff3366', fontSize: 64, mb: 2 }} />
            <Typography variant="h6" sx={{ fontFamily: '"SF Pro Display", "Inter", sans-serif', fontWeight: 600, color: 'text.primary', mb: 2 }}>
              Verification Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3, borderRadius: '11px', textAlign: 'left' }}>
              {scanError}
            </Alert>
            <Button
              variant="contained"
              onClick={handleScanNext}
              fullWidth
              sx={{
                bgcolor: '#ff3366',
                color: '#ffffff',
                fontFamily: '"SF Pro Text", "Inter", sans-serif',
                fontWeight: 500,
                borderRadius: '9999px',
                py: 1.5,
                boxShadow: 'none',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#e02454',
                  boxShadow: 'none',
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              Retry Scan
            </Button>
          </CardContent>
        </Card>
      )}

      {scannerActive && !loading && (
        <Box sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: '18px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 2
        }}>
          <style>{`
            #reader {
              border: ${scannerStyles.readerBorder};
              background-color: ${scannerStyles.readerBg};
              color: ${scannerStyles.readerColor} !important;
            }
            #reader__dashboard_section_csr button, 
            #reader__dashboard_section_csr a {
              background-color: ${scannerStyles.buttonBg} !important;
              color: ${scannerStyles.buttonText} !important;
              border: none !important;
              padding: 10px 22px !important;
              border-radius: 9999px !important;
              cursor: pointer !important;
              font-weight: 500 !important;
              font-family: "SF Pro Text", "Inter", sans-serif !important;
              margin: 6px !important;
              transition: all 0.2s ease !important;
              box-shadow: none !important;
              text-transform: none !important;
              text-decoration: none !important;
              display: inline-block !important;
            }
            #reader__dashboard_section_csr button:hover,
            #reader__dashboard_section_csr a:hover {
              background-color: ${scannerStyles.buttonBg} !important;
              transform: scale(0.98) !important;
            }
            #reader__dashboard_section_csr select {
              padding: 10px 14px !important;
              border-radius: 9999px !important;
              border: 1px solid ${scannerStyles.scanRegionBorder} !important;
              background-color: ${scannerStyles.selectBg} !important;
              color: ${scannerStyles.selectColor} !important;
              font-family: "SF Pro Text", "Inter", sans-serif !important;
              outline: none !important;
              cursor: pointer !important;
            }
            #reader__scan_region img {
              display: none !important;
            }
            #reader__scan_region {
              border: 1px dashed ${scannerStyles.scanRegionBorder} !important;
              border-radius: 11px !important;
              background-color: ${scannerStyles.scanRegionBg} !important;
              padding: 10px !important;
            }
            #reader a {
              color: ${scannerStyles.buttonBg} !important;
              font-family: "SF Pro Text", "Inter", sans-serif !important;
              font-size: 14px !important;
              text-decoration: none !important;
              cursor: pointer !important;
            }
            #reader a:hover {
              text-decoration: underline !important;
            }
            #reader__status_span {
              color: ${scannerStyles.readerColor} !important;
            }
          `}</style>
          
          <Box sx={{ position: 'relative', width: '100%', borderRadius: '11px', overflow: 'hidden' }}>
            <div id="reader" style={{ width: '100%' }}></div>
            
            <Box
              sx={{
                position: 'absolute',
                left: '10%',
                right: '10%',
                height: '2px',
                bgcolor: '#0066cc',
                boxShadow: '0 0 6px #0066cc',
                pointerEvents: 'none',
                zIndex: 5,
                animation: 'scanLine 3s infinite linear',
                '@keyframes scanLine': {
                  '0%': { top: '15%' },
                  '50%': { top: '85%' },
                  '100%': { top: '15%' }
                }
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
