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
  TextField,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Cached as RefreshIcon,
} from '@mui/icons-material';

export const VolunteerScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [manualToken, setManualToken] = useState('');

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
    <Box maxWidth={500} mx="auto" textAlign="center">
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, fontFamily: '"Outfit", sans-serif' }}>
        QR Attendance Scanner
      </Typography>

      {loading && (
        <Box py={6}>
          <CircularProgress size={50} />
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            Verifying token signature...
          </Typography>
        </Box>
      )}

      {scanResult && !loading && (
        <Card sx={{ border: '2px solid', borderColor: 'success.main', mb: 3 }}>
          <CardContent sx={{ py: 4 }}>
            <SuccessIcon color="success" sx={{ fontSize: 70, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
              Attendance Verified!
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              Name: {scanResult.registration.student.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Roll Number: {scanResult.registration.student.rollNumber || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Dept: {scanResult.registration.student.department || 'N/A'}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Scanned At: {new Date(scanResult.scannedAt).toLocaleTimeString()}
            </Typography>
            <Button
              variant="contained"
              color="success"
              fullWidth
              startIcon={<RefreshIcon />}
              onClick={handleScanNext}
              sx={{ mt: 3 }}
            >
              Scan Next
            </Button>
          </CardContent>
        </Card>
      )}

      {scanError && !loading && (
        <Card sx={{ border: '2px solid', borderColor: 'error.main', mb: 3 }}>
          <CardContent sx={{ py: 4 }}>
            <ErrorIcon color="error" sx={{ fontSize: 70, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main', mb: 2 }}>
              Verification Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {scanError}
            </Alert>
            <Button
              variant="contained"
              color="error"
              fullWidth
              startIcon={<RefreshIcon />}
              onClick={handleScanNext}
            >
              Retry Scan
            </Button>
          </CardContent>
        </Card>
      )}

      {scannerActive && !loading && (
        <Box sx={{ width: '100%', overflow: 'hidden', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', p: 1 }}>
          <div id="reader" style={{ width: '100%' }}></div>
        </Box>
      )}

      {/* Manual Token Entry for Testing */}
      <Box sx={{ mt: 3, p: 2.5, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, fontFamily: '"Outfit", sans-serif', color: 'text.secondary' }}>
          Developer Token Input (Testing Bypass)
        </Typography>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            size="small"
            label="Paste QR Token"
            variant="outlined"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste your signed QR token here"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (!manualToken) return;
              setScannerActive(false);
              setLoading(true);
              setScanError(null);
              setScanResult(null);
              try {
                const res = await api.post('/attendance/scan', { qrToken: manualToken });
                setScanResult(res.data.data.attendance);
                setManualToken('');
              } catch (err: any) {
                setScanError(err.response?.data?.message || 'Attendance verification failed.');
              } finally {
                setLoading(false);
              }
            }}
          >
            Verify
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
