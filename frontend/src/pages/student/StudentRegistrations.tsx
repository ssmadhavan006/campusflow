import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PaymentDialog } from '../../components/common/PaymentDialog';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
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
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

  const [qrOpen, setQrOpen] = useState(false);
  const [activeQrToken, setActiveQrToken] = useState<string | null>(null);
  const [activeEventTitle, setActiveEventTitle] = useState('');

  // Payment Dialog state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payingRegId, setPayingRegId] = useState<string | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(0);

  // Cancel Confirmation state
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancellingRegId, setCancellingRegId] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRegistrations = async (pageVal = 1) => {
    try {
      const res = await api.get(`/registrations/me?page=${pageVal}&limit=${limit}`);
      setRegistrations(res.data.data.registrations);
      setTotal(res.data.data.total || 0);
      setPage(res.data.data.page || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations(1);
  }, []);

  const handleCancel = (id: string) => {
    setCancellingRegId(id);
    setCancelConfirmOpen(true);
  };

  const executeCancel = async () => {
    if (!cancellingRegId) return;
    setCancelConfirmOpen(false);
    setAlert(null);
    try {
      await api.put(`/registrations/${cancellingRegId}/cancel`);
      setAlert({ type: 'success', text: 'Registration cancelled successfully.' });
      fetchRegistrations(page);
    } catch (err: any) {
      setAlert({ type: 'error', text: err.response?.data?.message || 'Failed to cancel registration.' });
    } finally {
      setCancellingRegId(null);
    }
  };

  const handleOpenPayment = (regId: string, price: string) => {
    setPayingRegId(regId);
    setPayingAmount(Number(price));
    setPaymentOpen(true);
  };

  // Removed handlePaymentSubmit, handled in the JSX block below

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
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
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


                    {reg.status === 'PENDING' && (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<PaymentIcon />}
                        onClick={() => handleOpenPayment(reg.id, reg.event.price)}
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

      {total > limit && (
        <Box display="flex" justifyContent="center" mt={4} mb={2} gap={1}>
          <Button
            variant="outlined"
            disabled={page <= 1}
            onClick={() => fetchRegistrations(page - 1)}
          >
            Previous
          </Button>
          <Box display="flex" alignItems="center" px={2}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Page {page} of {Math.ceil(total / limit)}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => fetchRegistrations(page + 1)}
          >
            Next
          </Button>
        </Box>
      )}

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
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
                onClick={async (e) => {
                  const input = e.target as HTMLInputElement;
                  input.select();
                  try {
                    await navigator.clipboard.writeText(activeQrToken);
                  } catch {
                    console.error('Failed to copy token to clipboard');
                  }
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

      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={payingAmount}
        onSubmit={async (reference) => {
          await api.post(`/registrations/${payingRegId}/submit-reference`, { reference });
          setAlert({ type: 'success', text: 'Payment reference submitted! Pending organizer verification.' });
          fetchRegistrations(page);
        }}
      />

      <ConfirmationDialog
        open={cancelConfirmOpen}
        title="Confirm Cancellation"
        message="Are you sure you want to cancel this registration?"
        onConfirm={executeCancel}
        onCancel={() => {
          setCancelConfirmOpen(false);
          setCancellingRegId(null);
        }}
        severity="warning"
        confirmText="Cancel Registration"
      />
    </Box>
  );
};
