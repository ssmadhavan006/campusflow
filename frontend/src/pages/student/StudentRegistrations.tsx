import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeModeContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode as QrIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';

interface Registration {
  id: string;
  eventId: string;
  status: string;
  createdAt: string;
  event: {
    title: string;
    date: string;
    location: string;
    isPaid: boolean;
    price: string;
    club: { name: string };
  };
  payment?: {
    id: string;
    status: string;
    amount: string;
  };
  attendance?: {
    scannedAt: string;
  };
  qrToken: string;
  odLetter?: {
    id: string;
    verificationId: string;
  };
}

export const StudentRegistrations: React.FC = () => {
  const { mode } = useThemeMode();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const [qrOpen, setQrOpen] = useState(false);
  const [activeQrToken, setActiveQrToken] = useState<string | null>(null);
  const [activeEventTitle, setActiveEventTitle] = useState('');

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payingRegId, setPayingRegId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'gpay' | 'bank'>('gpay');

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadOD = async (verificationId: string) => {
    setDownloading(verificationId);
    try {
      const res = await api.get(`/od/download/${verificationId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OD_Letter_${verificationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to download OD letter', err);
    } finally {
      setDownloading(null);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await api.get('/registrations/me');
      setRegistrations(res.data.data.registrations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
    setAlert(null);
    try {
      await api.put(`/registrations/${id}/cancel`);
      setAlert({ type: 'success', text: 'Registration cancelled successfully.' });
      fetchRegistrations();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.response?.data?.message || 'Failed to cancel registration.' });
    }
  };

  const handleOpenPayment = (regId: string) => {
    setPayingRegId(regId);
    setPaymentOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentRef) return setPaymentError('Transaction reference is required.');
    setPaymentError(null);
    setPaymentLoading(true);

    try {
      await api.post(`/registrations/${payingRegId}/verify-payment`, {
        reference: paymentRef,
        status: 'PAID',
      });
      setPaymentOpen(false);
      setPayingRegId(null);
      setPaymentRef('');
      setAlert({ type: 'success', text: 'Payment successfully processed! Ticket is now active.' });
      fetchRegistrations();
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Failed to verify payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOpenQr = (token: string, title: string) => {
    setActiveQrToken(token);
    setActiveEventTitle(title);
    setQrOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'WAITLISTED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
          My Event Registrations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View your registered events, access your signed QR tickets, and check payments.
        </Typography>
      </Box>

      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 3 }}>
          {alert.text}
        </Alert>
      )}

      {registrations.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">You have not registered for any events yet.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {registrations.map((reg) => (
            <Grid item xs={12} key={reg.id}>
              <Card>
                <CardContent sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {reg.event.title}
                      </Typography>
                      <Chip label={reg.status} color={getStatusColor(reg.status) as any} size="small" />
                      {reg.attendance && <Chip label="Attended" color="success" size="small" variant="outlined" />}
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                      Club: {reg.event.club.name} | Date: {new Date(reg.event.date).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Location: {reg.event.location}
                      {reg.event.isPaid && ` | Paid: $${reg.event.price} (${reg.payment?.status})`}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1.5} flexWrap="wrap">
                    {reg.odLetter && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadOD(reg.odLetter!.verificationId)}
                        disabled={downloading === reg.odLetter.verificationId}
                      >
                        {downloading === reg.odLetter.verificationId ? 'Downloading...' : 'Download OD'}
                      </Button>
                    )}

                    {reg.status === 'PENDING' && (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<PaymentIcon />}
                        onClick={() => handleOpenPayment(reg.id)}
                      >
                        Complete Payment
                      </Button>
                    )}

                    {reg.status === 'ACTIVE' && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<QrIcon />}
                        onClick={() => handleOpenQr(reg.qrToken, reg.event.title)}
                      >
                        View QR Ticket
                      </Button>
                    )}

                    {reg.status !== 'CANCELLED' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleCancel(reg.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontFamily: '"Outfit", sans-serif', fontWeight: 'bold' }}>
          Your Event Entry Ticket
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
            {activeEventTitle}
          </Typography>
          <Box p={2} sx={{ bgcolor: 'white', borderRadius: 3, display: 'flex' }}>
            {activeQrToken && <QRCodeSVG value={activeQrToken} size={200} />}
          </Box>
          {activeQrToken && (
            <Box sx={{ mt: 2.5, width: '100%' }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, textAlign: 'center' }}>
                Testing Token (click to select and copy):
              </Typography>
              <TextField
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
                value={activeQrToken}
                onClick={(e) => {
                  const input = e.target as HTMLInputElement;
                  input.select();
                  navigator.clipboard.writeText(activeQrToken);
                }}
                sx={{
                  '& input': { textAlign: 'center', fontSize: '0.75rem', fontFamily: 'monospace', cursor: 'pointer' }
                }}
              />
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2.5, textAlign: 'center' }}>
            Present this QR code to the volunteer at the event gate to verify your attendance.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button fullWidth onClick={() => setQrOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 'bold' }}>
          Simulated Payment Gateway
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please select a simulated payment method below to complete your registration.
          </Typography>

          <Box display="flex" gap={1.5} mb={2.5}>
            <Button
              variant={paymentMethod === 'gpay' ? 'contained' : 'outlined'}
              onClick={() => { setPaymentMethod('gpay'); setPaymentRef(''); }}
              fullWidth
              size="small"
            >
              GPay / UPI
            </Button>
            <Button
              variant={paymentMethod === 'bank' ? 'contained' : 'outlined'}
              onClick={() => { setPaymentMethod('bank'); setPaymentRef(''); }}
              fullWidth
              size="small"
            >
              Bank Transfer
            </Button>
          </Box>

          {paymentMethod === 'gpay' ? (
            <Box sx={{ p: 2, mb: 2.5, bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', borderRadius: 2, border: mode === 'dark' ? '1px dashed #fafafa' : '1px dashed #09090b' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: mode === 'dark' ? '#fafafa' : '#09090b' }}>
                UPI / Google Pay Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>UPI ID:</strong> pay@campusflow
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                <strong>Link:</strong> <a href="upi://pay?pa=pay@campusflow&pn=CampusFlow&am=10.00" style={{ color: mode === 'dark' ? '#fafafa' : '#09090b', textDecoration: 'underline' }}>Open GPay Link</a>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Pay using GPay and copy the transaction ID (UPI Ref No) from your app.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2, mb: 2.5, bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', borderRadius: 2, border: mode === 'dark' ? '1px dashed #a1a1aa' : '1px dashed #71717a' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: mode === 'dark' ? '#a1a1aa' : '#71717a' }}>
                Bank Transfer Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Bank Name:</strong> CampusFlow Central Bank
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Account No:</strong> 123498761234
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>IFSC Code:</strong> CFB0001234
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                <strong>Holder:</strong> CampusFlow Events Account
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Transfer via IMPS/NEFT and copy the transaction reference number.
              </Typography>
            </Box>
          )}

          {paymentError && <Alert severity="error" sx={{ mb: 2 }}>{paymentError}</Alert>}

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mb: 2 }}>
            <TextField
              fullWidth
              label="Transaction Reference"
              variant="outlined"
              size="small"
              required
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              disabled={paymentLoading}
              placeholder={paymentMethod === 'gpay' ? 'e.g. UPI Ref No' : 'e.g. Txn Ref No'}
            />
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => {
                const randomId = Math.floor(100000 + Math.random() * 900000);
                const prefix = paymentMethod === 'gpay' ? 'CF-GPAY-' : 'CF-BANK-';
                setPaymentRef(`${prefix}${randomId}`);
              }}
              sx={{ whiteSpace: 'nowrap', height: 40 }}
            >
              Simulate Reference
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentOpen(false)} disabled={paymentLoading}>
            Cancel
          </Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            color="primary"
            disabled={paymentLoading}
          >
            {paymentLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
