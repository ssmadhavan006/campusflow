import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  CalendarToday as DateIcon,
  Room as LocationIcon,
  People as CapacityIcon,
} from '@mui/icons-material';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  location: string;
  capacity: number;
  remainingSeats: number;
  isPaid: boolean;
  price: string;
  status: string;
  club: { id: string; name: string };
  organizer: { id: string; name: string; email: string };
  poster?: string;
}

interface Registration {
  id: string;
  eventId: string;
  status: string;
  payment?: { status: string; id: string };
}

export const EventsList: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');

  // Payment Dialog state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payingRegId, setPayingRegId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'gpay' | 'bank'>('gpay');

  // General Dialog/Alert status
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const eventsRes = await api.get('/events');
      setEvents(eventsRes.data.data.events);

      if (user?.role === 'STUDENT') {
        const regsRes = await api.get('/registrations/me');
        setRegistrations(regsRes.data.data.registrations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRegister = async (eventId: string) => {
    setMessage(null);
    try {
      const res = await api.post('/registrations', { eventId });
      const reg = res.data.data.registration;

      if (reg.status === 'PENDING') {
        // Requires payment
        setPayingRegId(reg.id);
        setPaymentOpen(true);
        fetchData();
      } else {
        setMessage({ type: 'success', text: reg.status === 'WAITLISTED' ? 'Successfully joined the waitlist!' : 'Registration successful!' });
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to register.' });
    }
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
      setMessage({ type: 'success', text: 'Payment successful! Registration active.' });
      fetchData();
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Failed to verify payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this event and all associated registrations?')) {
      return;
    }
    setMessage(null);
    try {
      await api.delete(`/events/${eventId}`);
      setMessage({ type: 'success', text: 'Event successfully deleted.' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete event.' });
    }
  };

  const isUserRegistered = (eventId: string) => {
    return registrations.find((r) => r.eventId === eventId && r.status !== 'CANCELLED');
  };

  const filteredEvents = events.filter((e) => {
    return e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" flexWrap="wrap" gap={2} mb={4} alignItems="center">
        <TextField
          label="Search Events"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
      </Box>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {filteredEvents.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No events found matching your criteria.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredEvents.map((event) => {
            const reg = isUserRegistered(event.id);
            const remaining = event.remainingSeats;

            return (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {event.poster ? (
                    <Box
                      component="img"
                      src={`/uploads/${event.poster}`}
                      alt={event.title}
                      sx={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: 180,
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.5, fontWeight: 'bold' }}>
                        Department of CSE Event
                      </Typography>
                    </Box>
                  )}
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1.5}>
                      <Chip label={event.club.name} color="primary" size="small" variant="outlined" />
                      <Chip
                        label={event.isPaid ? `$${event.price}` : 'Free'}
                        color={event.isPaid ? 'secondary' : 'success'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.description}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <DateIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.date).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CapacityIcon fontSize="small" color="action" />
                      <Typography variant="caption" color={remaining === 0 ? 'error.main' : 'text.secondary'}>
                        {remaining} of {event.capacity} seats left
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    {user?.role === 'STUDENT' ? (
                      reg ? (
                        <Button
                          fullWidth
                          variant="contained"
                          disabled
                          sx={{
                            bgcolor: reg.status === 'WAITLISTED' ? 'warning.dark' : 'success.dark',
                            color: 'white !important',
                          }}
                        >
                          {reg.status === 'PENDING'
                            ? 'Pending Payment'
                            : reg.status === 'WAITLISTED'
                            ? 'Waitlisted'
                            : 'Registered'}
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          color={remaining === 0 ? 'warning' : 'primary'}
                          onClick={() => handleRegister(event.id)}
                        >
                          {remaining === 0 ? 'Join Waitlist' : 'Register Now'}
                        </Button>
                      )
                    ) : (
                      <Button fullWidth variant="outlined" disabled>
                        Event Status: {event.status}
                      </Button>
                    )}

                    {user?.role === 'ADMIN' && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteEvent(event.id)}
                        sx={{ mt: 1 }}
                      >
                        Delete Event
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Payment Dialog */}
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
